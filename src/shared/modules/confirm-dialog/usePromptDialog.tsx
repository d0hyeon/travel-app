
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  styled,
  TextareaAutosize,
  TextField
} from '@mui/material';
import { useCallback, type ReactNode } from 'react';
import { Form, useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { useIsMobile } from '~shared/hooks/useIsMobile';
import { useOverlay } from '~shared/hooks/useOverlay';
import { DialogTitle } from './DialogTitle';


type Field = { content: string };

export type PromptDialogOpenParams = {
  title?: ReactNode;
  description?: string;

  required?: boolean;
  maxLength?: number;
  defaultValue?: string;

  submitText?: string;
  cancelText?: string;
  renderField?: (props: UseFormRegisterReturn) => ReactNode;

  onCancel?: () => void;
  onConfirm?: (text: string) => void;
};

export function usePromptDialog() {
  const overlay = useOverlay();

  const prompt = useCallback(
    (props: PromptDialogOpenParams = {}) => {
      return new Promise<string | null>((resolve) => {
        overlay.open(({ isOpen, close }) => {
          return <PromptFormDialog
            {...props}
            isOpen={isOpen}
            onConfirm={(value) => {
              props.onConfirm?.(value);
              resolve(value);
              close();
            }}
            onCancel={() => {
              props.onCancel?.();
              resolve(null);
              close();
            }}
          />
        });
      });
    },
    [],
  );

  return Object.assign(prompt, {
    close: overlay.close
  })
}

function PromptFormDialog({
  isOpen,
  title,
  description,
  cancelText = '취소',
  submitText = '확인',
  required,
  maxLength,
  defaultValue,
  renderField,
  onCancel,
  onConfirm,
}: PromptDialogOpenParams & { isOpen: boolean; }) {
  const {
    formState: { isValid },
    control,
    register,
  } = useForm<Field>({
    mode: 'onChange',
    defaultValues: { content: defaultValue },
    progressive: true
  });


  return (
    <CustomDialog open={isOpen}>
      <Form
        control={control}
        onSubmit={({ data: { content } }) => {
          onConfirm?.(content);
        }}
      >
        {typeof title === 'string' ? (
          <DialogTitle sx={{ whiteSpace: 'pre-wrap' }}>{title}</DialogTitle>
        ) : title}

        <DialogContent>
          {description && <DialogContentText mb={2}>{description}</DialogContentText>}
          <Box>
            {renderField == null ? (
              <TextField
                {...register('content', { required, maxLength })}
                multiline
                minRows={2}
                fullWidth
              />
            ) : (
              renderField(register('content', { required, maxLength, }))
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            sx={{ color: '#3C3C43BA' }}
            onClick={() => {
              onCancel?.();
            }}
          >
            {cancelText}
          </Button>
          <Button type="submit" disabled={!isValid}>
            {submitText}
          </Button>
        </DialogActions>
      </Form>
    </CustomDialog>
  )
}

const CustomDialog = styled(Dialog)({
  '& .MuiPaper-root': {
    minWidth: 350,
    borderRadius: '24px',
    padding: '4px 2px',
    maxWidth: '500px',
  },
});
