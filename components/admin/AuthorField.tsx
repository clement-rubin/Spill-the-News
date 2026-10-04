import type { AuthorOption } from '@/lib/users'

interface Props {
  authors: AuthorOption[]
  defaultValue: string
  hint: string
}

export default function AuthorField({ authors, defaultValue, hint }: Props) {
  return (
    <div className="field">
      <label htmlFor="authorId">Auteur</label>
      <select id="authorId" name="authorId" className="input" defaultValue={defaultValue} required>
        {authors.map((author) => (
          <option key={author.id} value={author.id}>
            {author.name}
          </option>
        ))}
      </select>
      <p className="field-hint">{hint}</p>
    </div>
  )
}
