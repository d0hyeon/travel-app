import { styled } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useEffect, useEffectEvent, type ReactNode } from 'react';

export type ConfirmDialogProps = {
  title: string;
  description?: ReactNode;
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  isOpen: boolean;
};

export function ConfirmDialog({ title, description, isOpen, confirmLabel = '확인', cancelLabel = '취소', onCancel, onConfirm }: ConfirmDialogProps) {
  const handleKeyInput = useEffectEvent((event: KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
        return onConfirm?.();
      case 'Esc':
        return onCancel?.()
    }
  })

  useEffect(() => {
    document.addEventListener('keyup', handleKeyInput);
    return () => document.removeEventListener('keyup', handleKeyInput)
  }, [])

  return (
    <CustomDialog
      open={isOpen}
      onClose={() => onCancel?.()}
      aria-labelledby="custom-dialog-title"
      aria-describedby="custom-dialog-description"
    >
      <DialogTitle id="custom-dialog-title" sx={{ whiteSpace: 'pre-wrap' }}>
        {title}
      </DialogTitle>
      {description && (
        <DialogContent>
          {typeof description === 'string' ? (
            <DialogContentText id="custom-dialog-description" sx={{ whiteSpace: 'pre-line' }}>
              {description}
            </DialogContentText>
          ) : (
            description
          )}
        </DialogContent>
      )}
      <DialogActions>
        {typeof cancelLabel === 'string' && (
          <Button
            onClick={onCancel}
            sx={{
              color: 'black',
            }}
          >
            {cancelLabel}
          </Button>
        )}
        <Button
          onClick={onConfirm}
          sx={{
            color: 'primary'
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </CustomDialog>
  );
}

export default ConfirmDialog;

const CustomDialog = styled(Dialog)({
  '& .MuiPaper-root': {
    borderRadius: '24px',
    padding: '4px 2px',
    maxWidth: '500px',
  },
});

