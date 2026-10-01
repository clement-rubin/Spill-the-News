import { describe, it, expect } from 'vitest'
import { mapAuthError } from './authErrors'

describe('mapAuthError', () => {
  it('maps known codes to French messages', () => {
    expect(mapAuthError({ code: 'email_not_confirmed' })).toMatch(/Confirme/)
    expect(mapAuthError({ code: 'invalid_credentials' })).toBe('Email ou mot de passe incorrect.')
    expect(mapAuthError({ code: 'over_email_send_rate_limit' })).toMatch(/emails/)
    expect(mapAuthError({ code: 'over_request_rate_limit' })).toMatch(/tentatives/)
    expect(mapAuthError({ code: 'weak_password' })).toMatch(/faible/)
    expect(mapAuthError({ code: 'same_password' })).toMatch(/différent/)
    expect(mapAuthError({ code: 'user_already_exists' })).toBe('Cet email est déjà utilisé.')
  })

  it('falls back to a generic message for an unknown code', () => {
    expect(mapAuthError({ code: 'some_future_code' })).toBe('Une erreur est survenue, réessaie.')
  })

  it('falls back to a generic message when there is no code at all', () => {
    expect(mapAuthError({ message: 'boom' })).toBe('Une erreur est survenue, réessaie.')
  })

  it('falls back to a generic message for null/undefined', () => {
    expect(mapAuthError(null)).toBe('Une erreur est survenue, réessaie.')
    expect(mapAuthError(undefined)).toBe('Une erreur est survenue, réessaie.')
  })
})
