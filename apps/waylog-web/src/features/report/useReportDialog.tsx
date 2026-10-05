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
            toast.success('신고가 접수되었습니다. 내용을 검토한 후 필요한 조치를 진행할 예정입니다');
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
