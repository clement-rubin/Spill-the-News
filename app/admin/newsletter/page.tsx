import Link from 'next/link'
import NewsletterForm from '@/components/admin/NewsletterForm'
import { sendNewsletterAction, deleteIssueAction } from './actions'
import { getNewsletterIssues } from '@/lib/newsletterIssues'

export const metadata = { title: 'Newsletter — Spill the News' }

// Same reasoning as the dashboard: Supabase reads are plain fetch calls,
// which Next.js would otherwise cache indefinitely.
export const dynamic = 'force-dynamic'

const RECURRENCE_LABEL = { weekly: 'hebdomadaire', monthly: 'mensuelle' } as const

export default async function AdminNewsletterPage() {
  const { issues, tableMissing } = await getNewsletterIssues()

  return (
    <div className="admin-shell">
      <div className="admin-head">
        <div>
          <span className="kicker">Espace contributeurs</span>
          <h1>Newsletter</h1>
        </div>
        <Link href="/admin" className="btn btn--ghost btn--sm">
          ← Tableau de bord
        </Link>
      </div>

      {tableMissing && (
        <section className="admin-section">
          <div className="empty">
            <strong>Newsletter pas encore activée</strong>
            Exécute ce SQL une fois dans l&apos;éditeur SQL de Supabase, puis recharge cette page :
            <pre className="admin-sql">{`CREATE TABLE newsletter_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  recurrence text,
  last_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);`}</pre>
          </div>
        </section>
      )}

      {!tableMissing && (
        <section className="admin-section">
          <div className="section-head">
            <div>
              <h2>Nouvel envoi</h2>
              <p className="section-count">Immédiat, programmé, ou récurrent</p>
            </div>
          </div>
          <NewsletterForm action={sendNewsletterAction} />
        </section>
      )}

      {!tableMissing && (
        <section className="admin-section">
          <div className="section-head">
            <div>
              <h2>Historique</h2>
            </div>
          </div>

          {issues.length > 0 ? (
            <div className="admin-list">
              {issues.map((issue) => (
                <div className="admin-row" key={issue.id}>
                  <div>
                    <strong>{issue.subject}</strong>
                    <div className="meta">
                      {issue.status === 'sent'
                        ? 'Envoyée'
                        : issue.status === 'scheduled'
                          ? 'Programmée'
                          : 'Brouillon'}
                      {issue.recurrence !== 'none' && ` · récurrente (${RECURRENCE_LABEL[issue.recurrence]})`}
                      {issue.lastSentAt && ` · dernier envoi ${issue.lastSentAt.toLocaleString('fr-FR')}`}
                      {issue.status === 'scheduled' &&
                        issue.scheduledAt &&
                        ` · prévue ${issue.scheduledAt.toLocaleString('fr-FR')}`}
                    </div>
                  </div>
                  {(issue.status === 'scheduled' || issue.recurrence !== 'none') && (
                    <form action={deleteIssueAction}>
                      <input type="hidden" name="id" value={issue.id} />
                      <button type="submit" className="btn btn--ghost btn--sm">
                        {issue.status === 'scheduled' ? 'Annuler' : 'Arrêter la récurrence'}
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">
              <strong>Aucun envoi</strong>
              Compose ta première newsletter ci-dessus.
            </div>
          )}
        </section>
      )}
    </div>
  )
}
