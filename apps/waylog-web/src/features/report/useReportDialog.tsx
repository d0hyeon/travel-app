import { useCallback } from 'react';
import { toast } from 'sonner';
import { useOverlay } from '~shared/hooks/useOverlay';
import type { ReportTarget } from '@waylog/domains/modules/report';
import { ReportDialog } from './ReportDialog';

export function useReportDialog() {
  const overlay = useOverlay();

  return useCallback((target: ReportTarget) => {
    return new Promise<void>((resolve) => {
      overlay.open(({ isOpen, close }) => (
        <ReportDialog
          isOpen={isOpen}
          target={target}
          onSubmitted={() => {
            toast.success('신고가 접수되었어요. 검토 후 조치할게요');
            resolve();
            close();
          }}
          onCancel={() => {
            resolve();
            close();
          }}
        />
      ));
    });
  }, [overlay]);
}
