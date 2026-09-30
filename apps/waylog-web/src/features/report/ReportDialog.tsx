import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  Radio,
  RadioGroup,
  styled,
  TextField,
} from '@mui/material';
import { REPORT_REASON_LABELS, useSubmitReport, type ReportReason, type ReportTarget } from '@waylog/domains/modules/report';
import { useState } from 'react';
import { toast } from 'sonner';
import { DialogTitle } from '~shared/components/confirm-dialog/DialogTitle';

const DETAIL_MAX_LENGTH = 500;

const REPORT_REASONS = ['spam', 'inappropriate', 'harassment', 'other'] satisfies ReportReason[];


interface ReportDialogProps {
  isOpen: boolean;
  target: ReportTarget;
  onSubmitted: () => void;
  onCancel: () => void;
}

export function ReportDialog({ isOpen, target, onSubmitted, onCancel }: ReportDialogProps) {
  const submitReport = useSubmitReport();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState('');
  const isOtherReason = reason === 'other';

  const handleSubmit = async () => {
    if (reason == null) return;

    try {
      await submitReport({ ...target, reason, detail: isOtherReason ? detail.trim() || undefined : undefined });
    } catch {
      toast.error('신고를 접수하지 못했어요. 잠시 후 다시 시도해 주세요');
      return;
    }
    onSubmitted();
  };

  return (
    <CustomDialog open={isOpen} onClose={onCancel}>
      <DialogTitle>신고 사유를 선택해 주세요</DialogTitle>
      <DialogContent>
        <RadioGroup value={reason}>
          {REPORT_REASONS.map((key) => (
            <FormControlLabel
              key={key}
              value={key}
              control={<Radio onChange={() => setReason(key)} />}
              label={REPORT_REASON_LABELS[key]}
            />
          ))}
        </RadioGroup>
        {isOtherReason && (
          <TextField
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            placeholder="기타 사유를 적어 주세요 (선택)"
            multiline
            minRows={3}
            fullWidth
            slotProps={{ htmlInput: { maxLength: DETAIL_MAX_LENGTH } }}
            helperText={`${detail.length}/${DETAIL_MAX_LENGTH}`}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="text" sx={{ color: '#3C3C43BA' }} disabled={submitReport.isPending} onClick={onCancel}>
          취소
        </Button>
        <Button disabled={reason == null} loading={submitReport.isPending} onClick={handleSubmit}>
          신고
        </Button>
      </DialogActions>
    </CustomDialog>
  );
}

const CustomDialog = styled(Dialog)({
  '& .MuiPaper-root': {
    minWidth: 350,
    borderRadius: '24px',
    padding: '4px 2px',
    maxWidth: '500px',
  },
});
