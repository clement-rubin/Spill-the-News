import Link from 'next/link'
import { getArticles } from '@/lib/articles'
import { getEpisodes } from '@/lib/episodes'
import ArticleCard from '@/components/ArticleCard'
import EpisodeCard from '@/components/EpisodeCard'

const TICKER_WORDS = ['Culture', 'Arts', 'Société', 'Musique', 'Cinéma', 'Campus']

const TITLE = 'Spill the News'

export default async function HomePage() {
  const [articles, episodes] = await Promise.all([getArticles(), getEpisodes()])
  const featured = articles[0]
  const latestArticles = articles.slice(0, 3)
  const latestEpisodes = episodes.slice(0, 3)

  return (
    <>
      <section className="hero" data-hero>
        <div className="hero-glow" data-hero-glow aria-hidden />
        <div className="inner">
          <span className="kicker" data-hero-item>Média étudiant</span>
          <h1 data-split>
            {TITLE.split(' ').map((word) => (
              <span className="word" key={word}>
                <span>{word}</span>
              </span>
            ))}
          </h1>
          <p className="hero-lede" data-hero-item>
            Culture, arts et société, racontés par des étudiants. À lire entre deux
            cours, à écouter partout ailleurs.
          </p>
          <div className="hero-actions" data-hero-item>
            <Link href="/articles" className="btn btn--invert">Lire les articles</Link>
            <Link href="/podcast" className="link-arrow" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.5)' }}>
              Écouter le podcast <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        {featured && (
          <div className="hero-foot" data-hero-item>
            <span className="kicker">À l&apos;affiche</span>
            <Link href={`/articles/${featured.slug}`}>{featured.title}</Link>
          </div>
        )}

        <svg
          className="hero-drip"
          viewBox="0 0 1440 90"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            data-drip-back
            fill="var(--yellow)"
            d="M0,40 C160,4 280,72 440,40 C600,8 700,74 860,42 C1020,10 1140,70 1290,40 C1360,26 1400,34 1440,44 L1440,90 L0,90 Z"
          />
          <path
            data-drip-front
            fill="var(--paper)"
            d="M0,52 C140,20 300,80 450,52 C610,22 720,84 880,54 C1040,24 1160,80 1300,52 C1365,39 1405,45 1440,54 L1440,90 L0,90 Z"
          />
        </svg>
      </section>

      <div className="ticker" aria-hidden>
        <div className="ticker-track" data-ticker>
          {[0, 1].map((copy) => (
            <div className="ticker-group" key={copy}>
              {TICKER_WORDS.map((word) => (
                <span key={word}>{word}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section className="section">
        <div className="section-head" data-reveal>
          <h2>Articles</h2>
          <Link href="/articles" className="section-count">Tout voir →</Link>
        </div>

        {latestArticles.length > 0 ? (
          <div className="grid" data-reveal data-reveal-stagger>
            {latestArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="empty" data-reveal>
            <strong>Rien encore ici</strong>
            Le premier article arrive bientôt.
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-head" data-reveal>
          <h2>Podcast</h2>
          <Link href="/podcast" className="section-count">Tout écouter →</Link>
        </div>

        {latestEpisodes.length > 0 ? (
          <div className="grid" data-reveal data-reveal-stagger>
            {latestEpisodes.map((episode) => (
              <EpisodeCard key={episode.id} episode={episode} />
            ))}
          </div>
        ) : (
          <div className="empty" data-reveal>
            <strong>Le micro chauffe</strong>
            Premier épisode en préparation.
          </div>
        )}
      </section>
    </>
  )
}
