# Supabase Auth setup checklist

One-time setup to do in your Supabase project before merging the
`supabase-auth` branch. Nothing here works until all of this is done —
confirmation and reset emails, in particular, fail silently (logged, not
delivered) until step 3.

## 1. Run the SQL

Supabase dashboard → **SQL Editor** → paste and run:

```sql
ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
```

Safe to run while the old NextAuth code is still live and deployed — the old
signup path always supplies a `password_hash`, so dropping `NOT NULL` doesn't
change its behavior.

## 2. Auth settings

Dashboard → **Authentication** → **Settings**:

- **Confirm email**: ON.
- **Site URL**: your production domain (e.g. `https://spillthenews.fr`).
- **Redirect URLs**: add `<your-domain>/auth/callback` and
  `http://localhost:3000/auth/callback`.

## 3. Custom SMTP (required — Supabase's built-in sender is rate-limited to a
few emails/hour)

Dashboard → **Authentication** → **Settings** → **SMTP Settings**:

- Host: `smtp.resend.com`
- Port: `465`
- Username: `resend`
- Password: your Resend API key
- Sender email: an address on a domain you've verified in Resend

Prerequisite: a verified sending domain in Resend (same one used for the
newsletter feature).

## 4. Email templates (optional)

Dashboard → **Authentication** → **Email Templates**: translate "Confirm your
signup" and "Reset password" to French if you want branded copy. The app
works with the English defaults too.

## 5. Run the migration script

From the repo root, with `.env` filled in:

```bash
node scripts/migrate-users-to-supabase-auth.mjs --verify-hash-import
```

Confirms your Supabase project accepts bcrypt hash import without touching
real accounts. Then:

```bash
node scripts/migrate-users-to-supabase-auth.mjs
```

Creates an `auth.users` row for each existing `public.users` row, keeping the
same `id` and (if hash import works) the same password. Re-run anytime —
already-migrated users are skipped.

## 6. Environment variables on Netlify

Site configuration → Environment variables — add/update:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase dashboard → Settings → API)
- `APP_SECRET` (replaces `NEXTAUTH_SECRET` — reuse the same value, or
  generate a new random 32-byte string)
- `SITE_URL` (replaces `NEXTAUTH_URL` — your production domain)

Remove `NEXTAUTH_SECRET` and `NEXTAUTH_URL` once the branch is merged and
confirmed working.

## 7. Verify, then merge

Log in locally with a real account using its current password. If that
works, merge `supabase-auth` to `main`.
