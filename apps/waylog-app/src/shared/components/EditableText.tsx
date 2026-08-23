import { useAsyncEffect } from '@waylog/react'
import { ComponentProps, useEffect, useState, type ReactNode } from 'react'
import type { ControllerFieldState, ControllerRenderProps } from 'react-hook-form'
import { Pressable, useWindowDimensions, View, type TextInputProps } from 'react-native'
import { TextInput } from 'react-native-gesture-handler'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useKeyboardMetrics } from '../hooks/env/useKeyboardMetrics'
import { useFlipAnimation, useMeasureInWindow } from './EditableText.motion'
import { TextField } from './mui'
import { TextOverlayField } from './mui/TextOverlayField'
import { Typography, type TypographyProps } from './mui/Typography'

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
    <Field
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

const TRANSITION_CONFIG = {
  duration: 400,
  easing: Easing.inOut(Easing.cubic),
};
const OVERLAY_SCALE = 2;

type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

function Field(props: ComponentProps<typeof TextOverlayField>) {
  const { metrics: keyboardPosition } = useKeyboardMetrics();
  const { width: screenWidth } = useWindowDimensions();

  const [sourceRect, setSourceRect] = useState<Rect | null>(null);
  const source = useMeasureInWindow<TextInput>(setSourceRect);

  const flip = useFlipAnimation(TRANSITION_CONFIG);
  const scale = useSharedValue(1);
  const transformStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: flip.translateX.get() },
      { translateY: flip.translateY.get() },
      { scale: scale.get() },
    ],
  }));


  const overlay = useMeasureInWindow<View>();
  const opacity = useSharedValue(0);
  const opacityStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  useAsyncEffect(async () => {
    if (sourceRect == null || keyboardPosition == null) {
      return;
    }

    const last = await overlay.getCurrentRect();
    flip.play({ first: sourceRect, last });
    opacity.set(withTiming(1, { duration: 200 }))
    scale.set(withTiming(OVERLAY_SCALE, TRANSITION_CONFIG));
  }, [sourceRect, keyboardPosition]);


  return (
    <>
      <TextField
        {...props}
        sx={{ minHeight: 14 }}
        ref={source.ref}
        variant="standard"
        readOnly
      />

      {sourceRect != null && (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: keyboardPosition?.screenY,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TextOverlayField
            {...props}
            isOpen
            sx={{
              minHeight: 14,
              maxWidth: (screenWidth - 24 * 2) / OVERLAY_SCALE
            }}
            slotProps={{
              body: {
                as: Animated.View,
                ref: overlay.ref,
                style: [
                  { alignSelf: 'center' },
                  transformStyle, opacityStyle,
                ],
              },
            }}
          />
        </View>
      )}
    </>
  );
}