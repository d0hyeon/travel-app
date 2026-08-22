import { useEffect, useState, type ReactNode } from 'react'
import { Pressable, View, type TextInputProps } from 'react-native'
import { TextOverlayField } from './mui/TextOverlayField'
import { Typography, type TypographyProps } from './mui/Typography'
import type { ControllerFieldState, ControllerRenderProps } from 'react-hook-form'

type FormValues = { value: string }

export type EditableTextActionProps<Value extends string | number> = {
  submit: () => void
  edit: () => void
  cancelEdit: () => void
  reset: (value?: Value) => void
}

export type EditableTextFieldProps = {
  fieldState: ControllerFieldState
} & ControllerRenderProps<FormValues, 'value'> &
  Pick<TextInputProps, 'autoFocus' | 'autoComplete'>

export type EditableTextProps<Value extends string | number> = {
  value?: Value
  defaultValue?: Value
  format?: (value: Value) => ReactNode
  valueAs?: (value: Value) => string
  onSubmit?: (value: string) => void | Promise<void>
  renderEditField?: (
    props: EditableTextFieldProps,
    actions: EditableTextActionProps<Value>,
  ) => ReactNode
  endIcon?: ReactNode
} & Omit<TypographyProps, 'onSubmit'>

export function EditableText<Value extends string | number>({
  value: controlledValue,
  defaultValue,
  format = (value) => value,
  valueAs = (value) => String(value),
  onSubmit,
  renderEditField = (field, actions) => (
    <TextOverlayField
      isOpen
      onClose={actions.cancelEdit}
      value={field.value}
      onChangeText={field.onChange}
      autoFocus={field.autoFocus}
      autoComplete={field.autoComplete}
      onSubmitEditing={actions.submit}
    />
  ),
  endIcon,
  ...typographyProps
}: EditableTextProps<Value>) {
  const value = controlledValue ?? defaultValue ?? ('' as Value)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(valueAs(value))

  useEffect(() => {
    if (!isEditing) setDraft(valueAs(value))
  }, [isEditing, value, valueAs])

  const submit = async () => {
    await onSubmit?.(draft)
    setIsEditing(false)
  }

  const actions: EditableTextActionProps<Value> = {
    submit: () => void submit(),
    edit: () => setIsEditing(true),
    cancelEdit: () => {
      setDraft(valueAs(value))
      setIsEditing(false)
    },
    reset: (nextValue = value) => setDraft(valueAs(nextValue)),
  }

  if (!isEditing) {
    return (
      <Pressable accessibilityRole="button" onPress={actions.edit}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Typography numberOfLines={1} {...typographyProps}>
            {format(value)}
          </Typography>
          {endIcon}
        </View>
      </Pressable>
    )
  }

  return renderEditField(
    {
      fieldState: { invalid: false, isTouched: false, isDirty: false, isValidating: false },
      value: draft,
      onChange: setDraft,
      onBlur: () => undefined,
      name: 'value',
      ref: () => undefined,
      autoFocus: true,
      autoComplete: 'off',
    },
    actions,
  )
}
