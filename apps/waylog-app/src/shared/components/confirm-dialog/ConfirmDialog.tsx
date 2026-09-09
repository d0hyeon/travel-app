import { Modal, Pressable } from 'react-native'
import { palette, radius } from '../../config/tokens'
import { Box, Stack, Typography } from '~/shared/components/design-system'
import { Button } from '~/shared/components/design-system/Button'

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
  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Pressable onPress={(event) => event.stopPropagation()} style={{ width: '100%' }}>
          <Box
            sx={{
              backgroundColor: palette.background,
              borderRadius: radius.xxl,
              padding: 20,
              gap: 16,
            }}
          >
            <Stack gap={1}>
              <Typography variant="h6">{title}</Typography>
              {description != null && (
                <Typography variant="body2" color="text.secondary">
                  {description}
                </Typography>
              )}
            </Stack>

            <Stack direction="row" gap={1} justifyContent="flex-end">
              <Button size="large" onPress={onCancel}>
                {cancelText}
              </Button>
              <Button size="large" variant="contained" onPress={onConfirm}>
                {confirmText}
              </Button>
            </Stack>
          </Box>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
