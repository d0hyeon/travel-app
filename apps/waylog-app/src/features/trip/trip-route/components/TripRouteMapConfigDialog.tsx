import type { ReactNode } from 'react'
import { Modal, ModalProps, Pressable } from 'react-native'
import { Box, Button, Stack, Switch, Typography } from '../../../../shared/components/mui'
import { palette, radius } from '../../../../shared/config/tokens'
import { useOverlay } from '../../../../shared/hooks/useOverlay'
import { useTripViewConfig } from '../useTripViewConfig'

interface Props extends Omit<ModalProps, 'visible'> {
  isOpen?: boolean
}

export function TripRouteMapConfigDialog({ isOpen, ...props }: Props) {
  const [viewConfig, setViewConfig] = useTripViewConfig()


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
            <Typography variant="h6">지도 설정</Typography>

            <Stack gap={1}>
              <Typography variant="caption" color="text.secondary">
                마커
              </Typography>
              <Row label="접어 보기" description="거리가 가까운 마커끼리 합쳐서 보여져요">
                <Switch
                  checked={viewConfig.isCluasterlingView}
                  onChange={(_, checked) => setViewConfig({ isCluasterlingView: checked })}
                />
              </Row>
              <Row label="계획된 장소만 보기">
                <Switch
                  checked={!viewConfig.isVisibleAllMarkers}
                  onChange={(_, checked) => setViewConfig({ isVisibleAllMarkers: !checked })}
                />
              </Row>
            </Stack>

            <Stack gap={1}>
              <Typography variant="caption" color="text.secondary">
                경로
              </Typography>
              <Row label="이동 시간 보기">
                <Switch
                  checked={viewConfig.isVisibleRouteLegs}
                  onChange={(_, checked) => setViewConfig({ isVisibleRouteLegs: checked })}
                />
              </Row>
            </Stack>

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

function Row(props: RowProps) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Box sx={{ flex: 1 }}>
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
