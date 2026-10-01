interface CodedError {
  code?: string
  message?: string
}

const MESSAGES: Record<string, string> = {
  email_not_confirmed: "Confirme d'abord ton email avant de te connecter.",
  invalid_credentials: 'Email ou mot de passe incorrect.',
  over_email_send_rate_limit: "Trop d'emails envoyés, réessaie dans quelques minutes.",
  over_request_rate_limit: 'Trop de tentatives, réessaie dans quelques minutes.',
  weak_password: 'Mot de passe trop faible (6 caractères minimum).',
  same_password: "Le nouveau mot de passe doit être différent de l'actuel.",
  user_already_exists: 'Cet email est déjà utilisé.',
}

export function mapAuthError(error: CodedError | null | undefined): string {
  if (!error) return 'Une erreur est survenue, réessaie.'
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code]
  return 'Une erreur est survenue, réessaie.'
}
