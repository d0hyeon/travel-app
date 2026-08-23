import { ComponentProps, useEffect, type ReactNode } from 'react'
import { KeyboardAvoidingView, Modal, Pressable, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { TextField, type TextFieldProps } from './TextField'
import styled from '@emotion/native';

export type TextOverlayFieldProps = TextFieldProps & {
  isOpen: boolean
  onClose: () => void
  slotProps?: { body?: ComponentProps<typeof Body> }
}

const Body = styled.View({ padding: 16 })

// 어두운 전체 화면 위에 TextField 하나만 띄운다.
export function TextOverlayField({ isOpen, onClose, slotProps, sx, ...textFieldProps }: TextOverlayFieldProps) {

  return (
    <Modal transparent visible={isOpen} animationType="fade" onDismiss={onClose}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <TextOverlayBackdrop onPress={onClose}>
          <Body {...slotProps?.body}>
            <TextField
              fullWidth
              variant="standard"
              returnKeyType="done"
              {...textFieldProps}
              sx={{
                backgroundColor: 'transparent',
                color: '#fff',
                borderBottomColor: '#fff',
                ...sx,
              }}
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
    <Animated.View
      style={[
        { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.88)', justifyContent: 'center', padding: 24 },
        animatedStyle,
      ]}
    >
      <Pressable onPress={onPress} style={{ position: 'absolute', inset: 0 }} />
      {children}
    </Animated.View>
  )
}
