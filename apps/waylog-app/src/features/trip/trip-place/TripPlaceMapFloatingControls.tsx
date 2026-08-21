import { MaterialIcons } from '@expo/vector-icons'
import type { ReactNode } from 'react'
import { Modal, Pressable } from 'react-native'
import { Box, Stack, Typography } from '../../../shared/components/mui'
import { Button } from '../../../shared/components/mui/Button'
import { IconButton } from '../../../shared/components/mui/IconButton'
import { Switch } from '../../../shared/components/mui/Switch'
import { palette, radius } from '../../../shared/config/tokens'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { useTripCluastering } from '../hooks/useTripCluastering'
import { FloatingControl } from '../trip-route/components/FloatingControl'

export function TripPlaceMapFloatingControls() {
  const [isClusteringView, setCluastering] = useTripCluastering()
  const overlay = useOverlay()

  const openSettingDialog = () => {
    overlay.open(({ isOpen, close }) => (
      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={close}>
        <Pressable
          onPress={close}
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
                gap: 12,
              }}
            >
              <Typography variant="h6">지도 설정</Typography>

              <Typography variant="caption" color="text.secondary">
                마커
              </Typography>
              <Row label="접어 보기" description="거리가 가까운 마커끼리 합쳐서 보여져요">
                <Switch
                  defaultChecked={isClusteringView}
                  onChange={(_, checked) => setCluastering(checked)}
                />
              </Row>

              <Stack direction="row" justifyContent="flex-end">
                <Button variant="contained" size="large" onClick={close}>
                  확인
                </Button>
              </Stack>
            </Box>
          </Pressable>
        </Pressable>
      </Modal>
    ))
  }

  return (
    <FloatingControl corner="top-right" zIndex={8}>
      <IconButton onClick={openSettingDialog}>
        <MaterialIcons name="settings" size={22} color={palette.info} />
      </IconButton>
    </FloatingControl>
  )
}

interface RowProps {
  label: ReactNode
  description?: string
  children?: ReactNode
}

function Row(props: RowProps) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Box>
        <Typography variant="body2">{props.label}</Typography>
        {props.description != null && (
          <Typography variant="caption" color="text.secondary">
            {props.description}
          </Typography>
        )}
      </Box>
      {props.children}
    </Stack>
  )
}
