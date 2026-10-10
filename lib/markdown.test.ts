import { describe, it, expect } from 'vitest'

import { renderMarkdown } from './markdown'

describe('section titles', () => {
  it('turns a whole bold line into a heading', () => {
    const html = renderMarkdown('Intro.\r\n\r\n**Situation géographique**\r\n\r\nTexte.')
    expect(html).toContain('<h2')
    expect(html).toContain('Situation géographique</h2>')
    expect(html).not.toContain('<strong>Situation')
  })

  it('repairs the stray space a double-click selection leaves inside the markers', () => {
    const html = renderMarkdown('**Quel bilan à l’approche du vote ? **')
    expect(html).toContain('Quel bilan à l’approche du vote ?</h2>')
    expect(html).not.toContain('**')
  })

  it('accepts a bold title with trailing spaces after the markers', () => {
    expect(renderMarkdown(' **Organisation des mobilisations** ')).toContain(
      'Organisation des mobilisations</h2>'
    )
  })

  it('keeps italics inside a title', () => {
    expect(renderMarkdown('**Une « *chasse aux sorcières* »**')).toContain(
      '<em>chasse aux sorcières</em>'
    )
  })

  it('leaves bold inside a sentence alone', () => {
    const html = renderMarkdown('Une question : **qui décide ?** Voilà.')
    expect(html).toContain('<strong>qui décide ?</strong>')
    expect(html).not.toContain('<h2')
  })

  it('leaves a line with two bold runs alone', () => {
    const html = renderMarkdown('**Avant** et **après**')
    expect(html).not.toContain('<h2')
    expect(html).toContain('<strong>Avant</strong>')
  })

  it('does not touch code blocks', () => {
    const html = renderMarkdown('```\n**pas un titre**\n```')
    expect(html).not.toContain('<h2')
  })
})

describe('photos', () => {
  it('wraps a photo in a figure with its caption underneath', () => {
    const html = renderMarkdown('Texte.\n\n![Photo de © Louie](https://x.test/a.webp)\n\nSuite.')
    expect(html).toContain(
      '<div class="photos"><figure><img src="https://x.test/a.webp" alt="Photo de © Louie" loading="lazy" /><figcaption>Photo de © Louie</figcaption></figure></div>'
    )
    expect(html).toContain('<p>Suite.</p>')
  })

  it('groups consecutive photos into one gallery, blank lines included', () => {
    const html = renderMarkdown('![Un](https://x.test/1.webp)\n\n![Deux](https://x.test/2.webp)\n![Trois](https://x.test/3.webp)')
    expect(html.match(/<div class="photos photos--grid">/g)).toHaveLength(1)
    expect(html.match(/<figure>/g)).toHaveLength(3)
  })

  it('drops the caption element when there is no caption', () => {
    const html = renderMarkdown('![](https://x.test/a.webp)')
    expect(html).toContain('alt=""')
    expect(html).not.toContain('figcaption')
  })

  it('renders markdown in captions and escapes the alt text', () => {
    const html = renderMarkdown('![Vu dans *Le Monde* "hier"](https://x.test/a.webp)')
    expect(html).toContain('<figcaption>Vu dans <em>Le Monde</em>')
    expect(html).toContain('alt="Vu dans *Le Monde* &quot;hier&quot;"')
  })

  it('leaves an image inside a sentence as a plain inline image', () => {
    const html = renderMarkdown('Voir ![icône](https://x.test/i.png) ici.')
    expect(html).not.toContain('<figure>')
    expect(html).toContain('<img src="https://x.test/i.png"')
  })
})
