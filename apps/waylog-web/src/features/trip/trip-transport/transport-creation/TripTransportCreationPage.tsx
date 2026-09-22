import { lazy } from 'react'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'

const TransportFormPageMobile = lazy(async () => {
  const module = await import('./TripTransportCreationPage.mobile')
  return { default: module.TripTransportCreationPage }
})

const TransportFormPageDesktop = lazy(async () => {
  const module = await import('./TripTransportCreationPage.desktop')
  return { default: module.TripTransportCreationPage }
})

export default function TransportFormPage() {
  const isMobile = useIsMobile()

  return isMobile ? <TransportFormPageMobile /> : <TransportFormPageDesktop />
}
