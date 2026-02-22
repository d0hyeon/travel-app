
import { Stack, TextField, Typography, type TypographyProps } from '@mui/material';
import { type InputHTMLAttributes, type ReactNode, useEffect, useRef } from 'react';
import { type ControllerFieldState, type ControllerRenderProps, type RegisterOptions, useController, useForm } from 'react-hook-form';
import { useBooleanState } from '../hooks/useBooleanState';
import { useDismissCallback } from '../hooks/useDismissCallback';
import EditIcon from '@mui/icons-material/Edit';
import { mergeProps, mergeRef } from '../utils/merges';


type FormValues = {
  value: string;
};

type Rules = Pick<
  RegisterOptions<FormValues>,
  'required' | 'minLength' | 'maxLength' | 'setValueAs' | 'validate' | 'pattern'
>;

type ActionProps<Value extends string | number> = {
  submit: () => void;
  edit: () => void;
  cancelEdit: () => void;
  reset: (value?: Value) => void;
};

export type EditableTextProps<Value extends string | number> = {
  value?: Value;
  defaultValue?: Value;
  valueAs?: (value: Value) => string;
  format?: (value: Value) => ReactNode;
  onSubmit?: (value: string) => void;
  renderEditField?: (props: EditorProps, control: ActionProps<Value>) => ReactNode;
  submitOnBlur?: boolean;
  rules?: Partial<Rules>;
  actions?: (props: ActionProps<Value>) => ReactNode;
  endIcon?: ReactNode;
} & Omit<TypographyProps, 'onSubmit'>;

export function EditableText<Value extends string | number, As extends string>({
  value: _value,
  defaultValue,
  rules,
  format = (x) => x,
  onSubmit,
  renderEditField = EditableText.Field,
  submitOnBlur = false,
  actions,
  valueAs = (value) => (typeof value === 'number' ? value.toString() : value),
  endIcon = <EditIcon fontSize="small" />,
  ...props
}: EditableTextProps<Value>) {
  const value = _value ?? defaultValue ?? ('' as Value);
  const [isReadonly, setReadonly, setEdit] = useBooleanState(true);
  const {
    handleSubmit,
    reset,
    control: formControl,
  } = useForm<FormValues>({
    values: { value: valueAs(value) },
    resetOptions: { keepErrors: false },
  });

  const isControled = _value != null
  useEffect(() => {
    if (isReadonly && isControled) reset({ value: valueAs(value) });
  }, [isReadonly, value, isControled]);

  const registerDismissibleNode = useDismissCallback(
    (reason) => {
      if (reason === 'click-external' && submitOnBlur) return;
      setReadonly();
    },
    { enabled: !isReadonly },
  );

  const formRef = useRef<HTMLFormElement>(null);
  const submit = () => formRef.current?.requestSubmit();

  const { field, fieldState } = useController({ control: formControl, name: 'value', rules });

  const displayValue = format(field.value as Value);


  if (isReadonly) {
    return (
      <Stack ref={registerDismissibleNode} direction="row" gap={0.5} alignItems="center" role="button" onClick={setEdit}>
        {typeof displayValue === 'string' ? (
          <Typography {...props}>{displayValue}</Typography>
        ) : (
          <span>{displayValue}</span>
        )}
        {endIcon}
      </Stack>
    );
  }
  const control = {
    submit,
    edit: setEdit,
    cancelEdit: setReadonly,
    reset: (resetValue: Value = value) => reset({ value: valueAs(resetValue) }),
  };

  return (
    <div ref={registerDismissibleNode}>
      <form
        ref={formRef}
        onSubmit={handleSubmit(async (data) => {
          try {
            await onSubmit?.(data.value);
          } catch {
            reset({ value: valueAs(value) });
          } finally {
            setReadonly();
          }
        })}
      >
        <Stack direction="row" gap={0.5} justifyContent="space-between" alignItems="center">
          {renderEditField(
            {
              fieldState,
              autoFocus: true,
              autoComplete: 'off',
              ...mergeProps(field, {
                onBlur: submitOnBlur ? submit : undefined,
                ref: mergeRef(registerDismissibleNode, field.ref),
              }),
            },
            control,
          )}
          {actions?.(control)}
        </Stack>
      </form>
    </div>
  );
}

type EditorProps = {
  fieldState: ControllerFieldState;
} & ControllerRenderProps<FormValues, 'value'> &
  Pick<InputProps, 'autoFocus' | 'autoComplete'>;

type InputProps = InputHTMLAttributes<HTMLInputElement>;

EditableText.Field = ({ fieldState, ...field }: EditorProps) => {
  return (
    <TextField
      {...field}
      sx={{ flex: '1 1 auto' }}
      size="small"
      variant="standard"
      error={fieldState.error != null}
    />
  );
};
