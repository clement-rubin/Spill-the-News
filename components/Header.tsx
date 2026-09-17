import Link from 'next/link'

export default function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="brand">Spill the News</Link>
      <nav>
        <Link href="/articles">Articles</Link>
        <Link href="/podcast">Podcast</Link>
      </nav>
    </header>
  )
}
