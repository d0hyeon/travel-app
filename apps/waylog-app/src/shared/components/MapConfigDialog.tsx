import type { ReactNode } from 'react'
import { Modal, ModalProps, Pressable } from 'react-native'
import { Box, Button, Stack, Typography } from './mui'
import { palette, radius } from '../config/tokens'

interface Props extends Omit<ModalProps, 'visible'> {
  isOpen?: boolean
  title?: string
  children?: ReactNode
}

/** 지도 설정 모달의 공용 껍데기. 설정 행 구성은 소비자가 children 으로 채운다. */
export function MapConfigDialog({ isOpen, title = '지도 설정', children, ...props }: Props) {
  return (
    <Modal visible={isOpen} transparent animationType="fade" {...props}>
      <Pressable
        onPress={props.onDismiss}
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
            <Typography variant="h6">{title}</Typography>

            {children}

            <Stack direction="row" justifyContent="flex-end">
              <Button variant="contained" size="large" onClick={props.onDismiss}>
                확인
              </Button>
            </Stack>
          </Box>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

interface RowProps {
  label: ReactNode
  description?: string
  children?: ReactNode
}

MapConfigDialog.Row = function Row({ label, description, children }: RowProps) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2">{label}</Typography>
        {description != null && (
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        )}
      </Box>
      {children}
    </Stack>
  )
}

MapConfigDialog.Section = function Section({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <Stack gap={1}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      {children}
    </Stack>
  )
}
