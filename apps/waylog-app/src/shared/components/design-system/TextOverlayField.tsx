import { useEffect, type ElementType, type ReactNode } from 'react'
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { TextField, type TextFieldProps } from './TextField'
import { toComponent, type PropsWithAs } from './typings'

export type TextOverlayFieldProps = TextFieldProps & {
  isOpen: boolean
  onClose: () => void
  slotProps?: {
    body?: PropsWithAs<{ children?: ReactNode }, ElementType>
    input?: Pick<TextFieldProps, 'ref'>
  }
}

// 어두운 전체 화면 위에 TextField 하나만 띄운다.
export function TextOverlayField({ isOpen, onClose, slotProps, style, ...textFieldProps }: TextOverlayFieldProps) {
  const { as, style: bodyStyle, ...bodyProps } = slotProps?.body ?? {}
  const Body = toComponent(as, View)

  return (
    <Modal transparent visible={isOpen} animationType="fade" onDismiss={onClose}>
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <TextOverlayBackdrop onPress={onClose}>
          <Body style={[styles.body, bodyStyle]} {...bodyProps}>
            <TextField
              fullWidth
              variant="standard"
              returnKeyType="done"
              {...textFieldProps}
              {...slotProps?.input}
              style={[styles.input, style]}
            />
          </Body>
        </TextOverlayBackdrop>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function TextOverlayBackdrop({ onPress, children }: { onPress: () => void; children: ReactNode }) {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.set(withTiming(1, { duration: 220 }))
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({ opacity: progress.get() }))

  return (
    <Animated.View style={[styles.backdrop, animatedStyle]}>
      <Pressable onPress={onPress} style={styles.backdropPressable} />
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { padding: 16 },
  input: {
    backgroundColor: 'transparent',
    color: '#fff',
    borderBottomColor: '#fff',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    padding: 24,
  },
  backdropPressable: { position: 'absolute', inset: 0 },
})
