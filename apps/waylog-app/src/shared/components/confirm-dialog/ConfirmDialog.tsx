import { StyleSheet, Modal, Pressable } from 'react-native'
import { Text, useTheme, View } from 'tamagui'
import { Button } from '../design-system/Button'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const theme = useTheme()

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        onPress={onCancel}
        style={styles.backdrop}
      >
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.dialogTarget}>
          <View
            style={[styles.dialog, { backgroundColor: theme.surface.val }]}
          >
            <View style={styles.content}>
              <Text style={[styles.title, { color: theme.onSurface.val }]}>
                {title}
              </Text>
              {description != null && (
                <Text style={[styles.description, { color: theme.onSurfaceMuted.val }]}>
                  {description}
                </Text>
              )}
            </View>

            <View style={styles.actions}>
              <Button color="inherit" onPress={onCancel}>{cancelText}</Button>
              <Button variant="contained" onPress={onConfirm}>{confirmText}</Button>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialogTarget: {
    width: '100%',
  },
  dialog: {
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  content: { gap: 8 },
  actions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  title: { fontSize: 16, fontWeight: '700' },
  description: { fontSize: 13 },
})
