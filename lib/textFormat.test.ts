import { describe, it, expect } from 'vitest'

import { alignBlock, toggleEmphasis, type TextEdit } from './textFormat'
import { renderMarkdown } from './markdown'

/** Runs an edit on the text between the brackets: `Un [mot] ici`. */
function apply(marked: string, edit: (value: string, start: number, end: number) => TextEdit) {
  const start = marked.indexOf('[')
  const end = marked.indexOf(']') - 1
  const value = marked.replace('[', '').replace(']', '')
  const result = edit(value, start, end)
  return {
    value: result.value,
    selected: result.value.slice(result.selectionStart, result.selectionEnd),
    again: (next: typeof edit) => next(result.value, result.selectionStart, result.selectionEnd),
  }
}

const bold = (value: string, start: number, end: number) =>
  toggleEmphasis(value, start, end, 'bold', 'texte en gras')
const italic = (value: string, start: number, end: number) =>
  toggleEmphasis(value, start, end, 'italic', 'texte en italique')

describe('bold and italic', () => {
  it('wraps the selected words and keeps them selected', () => {
    const result = apply('Un [mot] ici', bold)
    expect(result.value).toBe('Un **mot** ici')
    expect(result.selected).toBe('mot')
  })

  it('italicises with a single asterisk', () => {
    expect(apply('Un [mot] ici', italic).value).toBe('Un *mot* ici')
  })

  it('leaves the space of a double-click outside the markers', () => {
    expect(apply('Un [mot ]ici', bold).value).toBe('Un **mot** ici')
  })

  it('removes the bold when pressed a second time', () => {
    const first = apply('Un [mot] ici', bold)
    const second = first.again(bold)
    expect(second.value).toBe('Un mot ici')
  })

  it('removes the bold from a word selected with its markers', () => {
    expect(apply('Un [**mot**] ici', bold).value).toBe('Un mot ici')
  })

  it('adds italics to bold text, then takes them away again', () => {
    const both = apply('Un **[mot]** ici', italic)
    expect(both.value).toBe('Un ***mot*** ici')
    expect(both.again(italic).value).toBe('Un **mot** ici')
  })

  it('removes only the bold from bold italic text', () => {
    expect(apply('Un ***[mot]*** ici', bold).value).toBe('Un *mot* ici')
  })

  it('does not mistake italics for bold', () => {
    expect(apply('Un *[mot]* ici', bold).value).toBe('Un ***mot*** ici')
  })

  it('inserts selected placeholder text when nothing is selected', () => {
    const result = apply('Un []ici', bold)
    expect(result.value).toBe('Un **texte en gras**ici')
    expect(result.selected).toBe('texte en gras')
  })

  it('bolds each paragraph of a multi-paragraph selection', () => {
    const result = apply('[Premier.\n\nSecond.]', bold)
    expect(result.value).toBe('**Premier.**\n\n**Second.**')
    expect(result.again(bold).value).toBe('Premier.\n\nSecond.')
  })

  it('keeps a paragraph spread over several lines in one pair of markers', () => {
    expect(apply('[ligne un\nligne deux]', italic).value).toBe('*ligne un\nligne deux*')
  })

  it('bolds list items after their bullet', () => {
    expect(apply('[- un\n- deux]', bold).value).toBe('- **un**\n- **deux**')
  })

  it('leaves alignment tags alone', () => {
    const result = apply('[<div style="text-align: justify">\n\nTexte.\n\n</div>]', bold)
    expect(result.value).toBe('<div style="text-align: justify">\n\n**Texte.**\n\n</div>')
  })

  it('finishes the multi-paragraph bold on the ones still missing it', () => {
    expect(apply('[**Premier.**\n\nSecond.]', bold).value).toBe('**Premier.**\n\n**Second.**')
  })
})

describe('alignment', () => {
  const justify = (value: string, start: number, end: number) =>
    alignBlock(value, start, end, 'justify', 'texte aligné')
  const center = (value: string, start: number, end: number) =>
    alignBlock(value, start, end, 'center', 'texte aligné')
  const left = (value: string, start: number, end: number) =>
    alignBlock(value, start, end, 'left', 'texte aligné')

  it('wraps the selection in a justified block', () => {
    const result = apply('Avant.\n\n[Un long paragraphe.]\n\nAprès.', justify)
    expect(result.value).toBe(
      'Avant.\n\n<div style="text-align: justify">\n\nUn long paragraphe.\n\n</div>\n\nAprès.'
    )
    expect(result.selected).toBe('Un long paragraphe.')
  })

  it('changes the alignment of text already aligned instead of nesting', () => {
    const justified = apply('[Texte.]', justify)
    const centred = justified.again(center)
    expect(centred.value).toBe('<div style="text-align: center">\n\nTexte.\n\n</div>')
  })

  it('removes the alignment when going back to the left', () => {
    const justified = apply('Avant.\n\n[Texte.]\n\nAprès.', justify)
    expect(justified.again(left).value).toBe('Avant.\n\nTexte.\n\nAprès.')
  })

  it('accepts a selection that includes the alignment tags', () => {
    const result = apply('[<div style="text-align: justify">\n\nTexte.\n\n</div>]', center)
    expect(result.value).toBe('<div style="text-align: center">\n\nTexte.\n\n</div>')
  })
})

describe('what the reader sees', () => {
  it('shows bold, italic and justified text on the article page', () => {
    const withBold = apply('Un [mot] fort et un autre doux.', bold).value
    const withItalic = apply(withBold.replace('doux', '[doux]'), italic).value
    const body = alignBlock(withItalic, 0, withItalic.length, 'justify', '').value
    const html = renderMarkdown(body)
    expect(html).toContain('<div style="text-align: justify">')
    expect(html).toContain('<p>Un <strong>mot</strong> fort et un autre <em>doux</em>.</p>')
    expect(html).toContain('</div>')
  })

  it('keeps a whole bolded sentence as bold text, not a section title', () => {
    const body = apply('[Une phrase importante pour la suite.]', bold).value
    const html = renderMarkdown(body)
    expect(html).toContain('<strong>Une phrase importante pour la suite.</strong>')
    expect(html).not.toContain('<h2')
  })
})
