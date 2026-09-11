import { useAsyncEffect } from '@waylog/react'
import { ComponentProps, useEffect, useRef, useState, type ReactNode } from 'react'
import type { ControllerFieldState, ControllerRenderProps } from 'react-hook-form'
import { StyleSheet, Pressable, Text, useWindowDimensions, View, type TextInputProps } from 'react-native'
import { TextInput } from 'react-native-gesture-handler'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useKeyboardMetrics } from '../hooks/env/useKeyboardMetrics'
import { useMeasureInWindow } from './EditableText.motion'
import { TextOverlayField } from '~/shared/components/design-system/TextOverlayField'
import { getTypographyStyle, Typography, type TypographyProps } from '~/shared/components/design-system/Typography'
import { useSharedElementTransition } from './animation/SharedElementTransition'
import { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils'

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

interface SlotProps {
  field?: Partial<ComponentProps<typeof Field>>;
  textLayout?: ViewProps;
}

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
  endIcon?: ReactNode;
  slotProps?: SlotProps;
} & Omit<TypographyProps, 'onSubmit'>

export function EditableText<Value extends string | number>({
  value: controlledValue,
  defaultValue,
  slotProps,
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
      style={{
        ...getTypographyStyle(typographyProps.variant ?? 'body1')
      }}
      format={format}
      endIcon={endIcon}
      typographyProps={typographyProps}
      {...slotProps?.field}
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
        <View {...slotProps?.textLayout} style={[styles.displayRow, slotProps?.textLayout?.style]}>
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



interface FieldProps extends ComponentProps<typeof TextOverlayField> {
  typographyProps?: TypographyProps;
  format?: (value: any) => ReactNode;
  endIcon?: ReactNode;
}

function Field(props: FieldProps) {
  const { metrics: keyboardPosition, isActive: isActivedKeyboard } = useKeyboardMetrics();
  const { width: screenWidth } = useWindowDimensions();

  const textRef = useRef<Text>(null);
  const overlayInputRef = useRef(null);
  const scale = useSharedValue(1);
  const { play, translateX, translateY } = useSharedElementTransition();

  const transformStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.get() },
      { translateY: translateY.get() },
      { scale: scale.get() },
    ],
  }));

  const opacity = useSharedValue(0);
  const opacityStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  useEffect(() => {
    if (!isActivedKeyboard || !props.isOpen) return;

    play({ from: textRef.current, to: overlayInputRef.current, ...TRANSITION_CONFIG });
    opacity.set(withTiming(1, { duration: 200 }));
    scale.set(withTiming(OVERLAY_SCALE, TRANSITION_CONFIG));
  }, [props.isOpen, isActivedKeyboard]);

  return (
    <>
      <View style={styles.displayRow}>
        <Typography ref={textRef} style={props.style} numberOfLines={1} {...props.typographyProps}>
          {(props.format && props.value != null) ? props.format(props.value) : props.value}
        </Typography>
        {props.endIcon}
      </View>


      <View
        pointerEvents="box-none"
        style={[styles.overlay, { height: keyboardPosition?.screenY }]}
      >
        <TextOverlayField
          {...props}
          isOpen
          style={[styles.input, { maxWidth: (screenWidth - 24 * 2) / OVERLAY_SCALE }]}
          slotProps={{
            body: {
              as: Animated.View,
              ref: overlayInputRef,
              style: [
                { alignSelf: 'center' },
                transformStyle, opacityStyle
              ],
            },
          }}
        />
      </View>
    </>
  );
}
const styles = StyleSheet.create({
  displayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    minHeight: 14,
  },
})
