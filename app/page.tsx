import Link from 'next/link'
import { getArticles } from '@/lib/articles'
import { getEpisodes } from '@/lib/episodes'

const TITLE = 'Spill the News'

/* Modak's i/l/j/t are thin verticals with almost no side bearing — packed
   tight like the rest of the wordmark, a repeat like "ll" collapses into
   one stroke. They get a touch more room in the CSS below. */
const NARROW_LETTERS = new Set(['i', 'l', 'j', 't'])

/** The domains we cover, stated once under the Articles rule. */
const DOMAINS = ['Société', 'Politique', 'Culture', 'Environnement', 'Économie']

const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** Cards carry no summary field, so the opening of the body stands in for one. */
function excerpt(body: string, max = 150) {
  const text = body
    .replace(/<[^>]*>/g, ' ')
    .replace(/[#*_`>[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= max) return text
  return `${text.slice(0, max).replace(/\s+\S*$/, '')}…`
}

function num(index: number) {
  return String(index + 1).padStart(2, '0')
}

export default async function HomePage() {
  const [articles, episodes] = await Promise.all([getArticles(), getEpisodes()])
  const featured = articles[0]
  const archive = articles.slice(1, 5)
  const latestEpisode = episodes[0]
  const olderEpisodes = episodes.slice(1, 4)

  return (
    <>
      <section className="hero" data-hero>
        <div className="hero-glow" data-hero-glow aria-hidden />
        <div className="inner">
          <span className="kicker" data-hero-item>Média étudiant</span>
          <h1 data-split>
            {TITLE.split(' ').map((word) => (
              <span className="word" key={word}>
                {Array.from(word).map((letter, index) => (
                  <span
                    className="letter"
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    data-narrow={NARROW_LETTERS.has(letter.toLowerCase()) || undefined}
                  >
                    {letter}
                  </span>
                ))}
              </span>
            ))}
          </h1>
          <p className="hero-lede" data-hero-item>
            Avec Spill the news venez partager l&apos;actu autour d&apos;une tasse de
            thé, pour retenir, analyser et comprendre l&apos;info à travers des
            articles, vidéos et podcasts !
          </p>
          <div className="hero-actions" data-hero-item>
            <Link href="/articles" className="btn btn--invert">Lire les articles</Link>
            <Link href="/podcast" className="link-arrow" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.5)' }}>
              Écouter le podcast <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

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

      <section className="section" id="articles">
        <div className="section-head section-head--tight" data-reveal>
          <h2>Articles</h2>
          <Link href="/articles" className="section-count">Tout voir →</Link>
        </div>

        <div className="chips" data-reveal>
          {DOMAINS.map((domain) => (
            <span
              key={domain}
              className={
                featured && featured.category.toLowerCase() === domain.toLowerCase()
                  ? 'chip chip--on'
                  : 'chip'
              }
            >
              {domain}
            </span>
          ))}
        </div>

        {featured ? (
          <>
            <Link href={`/articles/${featured.slug}`} className="feature" data-reveal>
              <div
                className={`feature-media${featured.coverImage ? ' feature-media--image' : ''}`}
              >
                {featured.coverImage ? (
                  <img src={featured.coverImage} alt="" />
                ) : (
                  <span className="feature-num" aria-hidden>{num(0)}</span>
                )}
              </div>
              <div className="feature-body">
                <span className="badge">À la une</span>
                <span className="feature-meta">
                  {featured.category} · {dateFormat.format(featured.publishedAt)}
                </span>
                <h3>{featured.title}</h3>
                <p className="feature-excerpt">{excerpt(featured.body)}</p>
                <span className="feature-go">Lire l&apos;article <span aria-hidden>→</span></span>
              </div>
            </Link>

            {archive.length > 0 && (
              <div data-reveal>
                <span className="rows-label">Toutes les publications</span>
                <div className="rows">
                  {archive.map((article, index) => (
                    <Link key={article.id} href={`/articles/${article.slug}`} className="row">
                      <span className="row-num" aria-hidden>{num(index + 1)}</span>
                      <span className="row-text">
                        <span className="row-title">{article.title}</span>
                        <span className="row-meta">
                          {article.category} · {dateFormat.format(article.publishedAt)}
                        </span>
                      </span>
                      <span className="row-go" aria-hidden>→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty" data-reveal>
            <strong>Rien encore ici</strong>
            Le premier article arrive bientôt.
          </div>
        )}
      </section>

      <section className="section" id="podcast">
        <div className="section-head" data-reveal>
          <h2>Spill Radio</h2>
          <span className="on-air">
            <i aria-hidden />
            On air
          </span>
        </div>

        <p className="radio-lede" data-reveal>
          Un épisode chaque mercredi, à écouter dans le bus, en cuisinant ou la
          tasse à la main.
        </p>

        {latestEpisode ? (
          <>
            <div className="radio-panel" data-reveal>
              <a
                href={latestEpisode.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="radio-play"
                aria-label="Écouter le dernier épisode"
              >
                <span className="eq" aria-hidden><i /><i /><i /><i /></span>
              </a>
              <div className="radio-panel-body">
                <span className="radio-kicker">Dernier épisode</span>
                <span className="radio-title">{latestEpisode.title}</span>
                <span className="radio-date">{dateFormat.format(latestEpisode.publishedAt)}</span>
              </div>
              <Link href={`/podcast/${latestEpisode.id}`} className="radio-link">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden style={{ flex: 'none' }}>
                  <circle cx="12" cy="12" r="11" fill="currentColor" />
                  <g stroke="#fffdf6" strokeWidth="1.8" strokeLinecap="round" fill="none">
                    <path d="M6.4 9.1c3.5-1 7.6-.7 10.9 1" />
                    <path d="M7.3 12.4c2.8-.8 6.1-.5 8.8.9" />
                    <path d="M8.2 15.6c2.2-.6 4.7-.4 6.8.7" />
                  </g>
                </svg>
                Voir l&apos;épisode
              </Link>
            </div>

            {olderEpisodes.length > 0 && (
              <div className="ep-rows" data-reveal>
                {olderEpisodes.map((episode, index) => (
                  <Link key={episode.id} href={`/podcast/${episode.id}`} className="ep-row">
                    <span className="eq eq--sm" aria-hidden><i /><i /><i /><i /></span>
                    <span className="ep-main">
                      <span className="ep-kicker">Ép. {num(olderEpisodes.length - index)}</span>
                      <span className="ep-title">{episode.title}</span>
                    </span>
                    <span className="ep-side">
                      <em>Écouter</em>
                      <span>{dateFormat.format(episode.publishedAt)}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="empty" data-reveal>
            <strong>Le micro chauffe</strong>
            Premier épisode en préparation.
          </div>
        )}
      </section>

      <section className="section" id="apropos">
        <div className="about" data-reveal>
          <div>
            <h2>Qui on est</h2>
            <p className="about-lede">
              Un média étudiant né d&apos;une envie simple : comprendre l&apos;actu
              sans y passer la journée. On choisit quelques sujets, on les creuse,
              et on les raconte — société, politique, culture, environnement,
              économie.
            </p>
          </div>
          <div className="about-list">
            <div className="about-item">
              <h3>Rédaction</h3>
              <p>Enquêtes, décryptages et formats courts.</p>
            </div>
            <div className="about-item">
              <h3>Podcast</h3>
              <p>Spill Radio, un épisode chaque mercredi.</p>
            </div>
            <div className="about-item">
              <h3>Réseaux</h3>
              <p>L&apos;actu en post, les coulisses en story.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
