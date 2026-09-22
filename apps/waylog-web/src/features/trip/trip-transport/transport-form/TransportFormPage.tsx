import { lazy } from 'react'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'

const TransportFormPageMobile = lazy(async () => {
  const module = await import('./TransportFormPage.mobile')
  return { default: module.TransportFormPageMobile }
})

const TransportFormPageDesktop = lazy(async () => {
  const module = await import('./TransportFormPage.desktop')
  return { default: module.TransportFormPageDesktop }
})

export default function TransportFormPage() {
  const isMobile = useIsMobile()

  return isMobile ? <TransportFormPageMobile /> : <TransportFormPageDesktop />
}
