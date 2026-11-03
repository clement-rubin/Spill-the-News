# Newsletter setup (Gmail SMTP + Supabase)

Free stack, no custom domain needed:

- **Supabase** stores subscribers and issues, and runs the hourly scheduler
  (`pg_cron` + `pg_net`).
- **Gmail** sends the emails over SMTP (about 500 emails/day on a regular
  Gmail account). Google signs them, so they reach the inbox.

## 1. Gmail app password

Use a dedicated Gmail account for the newsletter rather than a personal one:
if Google ever suspends sending, only that account is affected.

1. https://myaccount.google.com/security → turn on **2-Step Verification**
   (app passwords don't exist without it).
2. https://myaccount.google.com/apppasswords → create one named
   "Spill the News". Copy the 16-character password.

> The app password is not the Gmail password. It only allows sending mail
> and can be revoked from the same page at any time.

## 2. Environment variables on Netlify

Site configuration → Environment variables:

- `GMAIL_USER` — the Gmail address, e.g. `spillthenews@gmail.com`
- `GMAIL_APP_PASSWORD` — the app password from step 1.2
- `EMAIL_FROM_NAME` — optional, the sender name shown in inboxes
  (default: `Spill the News`)
- `CRON_SECRET` — any long random string
- `SITE_URL` — the Netlify URL, e.g. `https://spill-the-news.netlify.app`
  (used for unsubscribe links)

Remove `RESEND_API_KEY` and `RESEND_FROM_EMAIL` if they exist. Redeploy.

## 3. Supabase tables

Dashboard → **SQL Editor**, run once (skip if the tables already exist):

```sql
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS newsletter_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  recurrence text,
  last_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

## 4. Hourly scheduler (scheduled + recurring issues)

Dashboard → **Database → Extensions**: enable `pg_cron` and `pg_net`.

Then in the **SQL Editor**, replace the two placeholders and run:

```sql
-- Store the cron secret encrypted instead of in the job's text
SELECT vault.create_secret('<CRON_SECRET>', 'newsletter_cron_secret');

SELECT cron.schedule(
  'newsletter-send-due',
  '0 * * * *',  -- every hour, on the hour
  $$
  SELECT net.http_post(
    url := 'https://<your-site>.netlify.app/api/newsletter/send-due',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'newsletter_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
```

Check it ran (after the next full hour):

```sql
SELECT status_code, content, created FROM net._http_response ORDER BY created DESC LIMIT 5;
```

A `200` with `{"ok":true,...}` means it works. A `401` means `CRON_SECRET`
differs between Netlify and the vault.

To change the secret: `SELECT vault.update_secret(id, '<new>') FROM vault.secrets WHERE name = 'newsletter_cron_secret';`
To stop the job: `SELECT cron.unschedule('newsletter-send-due');`

## 5. Test

1. Subscribe with your own address from the site footer → you should get the
   "C'est confirmé ☕" email.
2. Admin → Newsletter → send an issue now → check it arrives.
3. The sending Gmail account's **Sent** folder shows every email that left.
   Netlify → Logs → Functions shows `sendEmail failed:` with the reason when
   one didn't (`Invalid login` = wrong `GMAIL_USER` / `GMAIL_APP_PASSWORD`).

## Limits

- About 500 emails/day per Gmail account. Past that, Google refuses sends for
  up to 24 hours, and repeated overruns can suspend the account. Beyond
  roughly 300 subscribers, move to a dedicated email service with your own
  domain.
- Issues are sent one email at a time inside a single Netlify function, which
  has a time limit. The SMTP connection is reused, but past a few dozen
  subscribers a send can still be cut off midway.
