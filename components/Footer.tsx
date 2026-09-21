import Link from 'next/link'
import NewsletterButton from './NewsletterButton'

export default function Footer() {
  return (
    <footer className="site-footer">
      {/* Same melted edge as the hero, mirrored, so the page closes on the
          gesture it opened with. */}
      <svg className="footer-wave" viewBox="0 0 1440 70" preserveAspectRatio="none" aria-hidden>
        <path
          fill="var(--paper)"
          d="M0,0 L1440,0 L1440,30 C1290,64 1130,10 970,36 C810,62 700,16 540,40 C380,64 200,22 60,44 C40,47 18,50 0,52 Z"
        />
      </svg>
      <span className="footer-blob" aria-hidden />

      <div className="inner">
        <div>
          <span className="footer-brand">Spill the News</span>
          <p className="footer-tagline">
            Média étudiant. L&apos;actu autour d&apos;une tasse de thé, en articles,
            vidéos et podcasts.
          </p>
          <NewsletterButton className="footer-cta">
            Recevoir la newsletter
          </NewsletterButton>
        </div>

        <div className="footer-col">
          <h4>Le média</h4>
          <ul>
            <li><Link href="/articles">Articles</Link></li>
            <li><Link href="/podcast">Podcast</Link></li>
            <li><Link href="/#apropos">Qui on est</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Nous suivre</h4>
          <ul>
            <li>
              <a
                href="https://instagram.com/spill.thenews"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-insta"
                aria-label="Instagram @spill.thenews"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="currentColor" strokeWidth="1.8"/>
                  <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
                </svg>
                @spill.thenews
              </a>
            </li>
            <li>
              <a href="mailto:spillthenews7@gmail.com" className="footer-insta">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M2 8l10 7 10-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                spillthenews7@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Spill the News</span>
        <Link href="/admin" className="footer-admin-link">Fait entre deux thés</Link>
      </div>
    </footer>
  )
}
