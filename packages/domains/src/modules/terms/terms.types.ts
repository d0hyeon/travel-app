export const TERMS_VERSION = '2026-10-12'

export const REQUIRED_AGREEMENT_KEYS = ['terms', 'privacy', 'age'] as const

export type AgreementKey = (typeof REQUIRED_AGREEMENT_KEYS)[number]
