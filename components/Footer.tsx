import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="inner">
        <div>
          <span className="brand">Spill the News</span>
          <p className="footer-tagline">
            Média étudiant. Culture, arts et société, racontés par celles et ceux
            qui les vivent.
          </p>
        </div>

        <div className="footer-col">
          <h4>Le média</h4>
          <ul>
            <li><Link href="/articles">Articles</Link></li>
            <li><Link href="/podcast">Podcast</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Nous parler</h4>
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
        © {new Date().getFullYear()} Spill the News
      </div>
    </footer>
  )
}
