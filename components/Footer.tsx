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
              >
                Instagram @spill.thenews
              </a>
            </li>
            <li>
              <a href="mailto:spillthenews7@gmail.com">spillthenews7@gmail.com</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Spill the News</span>
        <span>Fait entre deux thés</span>
      </div>
    </footer>
  )
}
