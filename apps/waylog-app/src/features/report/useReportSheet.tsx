import { useCallback } from 'react'
import { useOverlay } from '~/shared/hooks/useOverlay'
import { ReportSheet, type ReportTarget } from './ReportSheet'

export function useReportSheet() {
  const overlay = useOverlay()

  return useCallback(
    (target: ReportTarget) => {
      return new Promise<void>((resolve) => {
        overlay.open(({ isOpen, close }) => {
          const finish = () => {
            resolve()
            close()
          }

          return <ReportSheet isOpen={isOpen} target={target} onCancel={finish} onSubmitted={finish} />
        })
      })
    },
    [overlay],
  )
}
