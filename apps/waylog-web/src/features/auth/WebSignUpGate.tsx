import type { PropsWithChildren } from 'react'
import { useLocation } from 'react-router'
import { SignUpGate } from '@waylog/domains/clients'
import { AppRoute } from '@waylog/routes'
import { SignUpConsent } from './SignUpConsent'

const legalDocumentPaths: string[] = [AppRoute.이용약관, AppRoute.개인정보처리방침]

export function WebSignUpGate({ children }: PropsWithChildren) {
  const { pathname } = useLocation()
  const isLegalDocument = legalDocumentPaths.includes(pathname)

  if (isLegalDocument) return <>{children}</>

  return <SignUpGate fallback={<SignUpConsent />}>{children}</SignUpGate>
}
