import { lazy } from 'react'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'

const TransportDetailPageMobile = lazy(async () => {
  const module = await import('./TransportDetailPage.mobile')
  return { default: module.TransportDetailPageMobile }
})

const TransportDetailPageDesktop = lazy(async () => {
  const module = await import('./TransportDetailPage.desktop')
  return { default: module.TransportDetailPageDesktop }
})

export default function TransportDetailPage() {
  const isMobile = useIsMobile()

  return isMobile ? <TransportDetailPageMobile /> : <TransportDetailPageDesktop />
}
