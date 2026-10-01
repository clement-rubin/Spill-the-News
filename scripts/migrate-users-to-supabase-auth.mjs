// One-off migration: creates a Supabase Auth (auth.users) account for every
// row in public.users, preserving id (so articles.author_id stays valid)
// and importing the existing bcrypt password_hash so current passwords keep
// working. Safe to re-run — already-migrated users are skipped.
//
// Run with the project's .env in place:
//   node scripts/migrate-users-to-supabase-auth.mjs
//   node scripts/migrate-users-to-supabase-auth.mjs --verify-hash-import

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnv() {
  const env = {}
  for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '')
  }
  return env
}

const env = loadEnv()
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// A bcrypt hash of the literal password "throwaway-probe-password-1",
// generated once and hardcoded here — used only by --verify-hash-import to
// prove hash import works, never touches real user credentials.
const PROBE_HASH = '$2b$10$m6ln1/n.QpsROYxHPbDY.e2hrdarnWnKTMHhGr3M8ZeVc7Wt1T0ji'
const PROBE_PASSWORD = 'throwaway-probe-password-1'

async function verifyHashImport() {
  const email = `hash-import-probe-${Date.now()}@example.com`
  console.log(`Creating throwaway user ${email} with a hardcoded bcrypt hash...`)

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password_hash: PROBE_HASH,
    email_confirm: true,
  })
  if (createError) {
    console.error('FAIL: could not create probe user:', createError.message)
    process.exitCode = 1
    return
  }

  const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  })
  const { error: signInError } = await anon.auth.signInWithPassword({ email, password: PROBE_PASSWORD })

  await supabase.auth.admin.deleteUser(created.user.id)
  await supabase.from('users').delete().eq('id', created.user.id)

  if (signInError) {
    console.error('FAIL: hash import did not work —', signInError.message)
    process.exitCode = 1
  } else {
    console.log('PASS: bcrypt hash import works, probe user cleaned up.')
  }
}

async function migrateUsers() {
  const { data: users, error } = await supabase.from('users').select('id, email, name, password_hash')
  if (error) throw error

  for (const row of users ?? []) {
    const { data: existing } = await supabase.auth.admin.getUserById(row.id)
    if (existing?.user) {
      console.log(`skip  ${row.email} — already migrated`)
      continue
    }

    const { error: createError } = await supabase.auth.admin.createUser({
      id: row.id,
      email: row.email,
      password_hash: row.password_hash,
      email_confirm: true,
      user_metadata: { name: row.name },
    })

    if (!createError) {
      console.log(`done  ${row.email} — hash imported, password unchanged`)
      continue
    }

    console.warn(`retry ${row.email} — hash import rejected (${createError.message}), creating without a password`)
    const { error: fallbackError } = await supabase.auth.admin.createUser({
      id: row.id,
      email: row.email,
      email_confirm: true,
      user_metadata: { name: row.name },
    })
    if (fallbackError) {
      console.error(`FAIL  ${row.email} — ${fallbackError.message}`)
      continue
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(row.email)
    console.log(
      resetError
        ? `done  ${row.email} — created without a password, reset email FAILED (${resetError.message}) — send manually`
        : `done  ${row.email} — created without a password, reset email sent`
    )
  }
}

if (process.argv.includes('--verify-hash-import')) {
  await verifyHashImport()
} else {
  await migrateUsers()
}
