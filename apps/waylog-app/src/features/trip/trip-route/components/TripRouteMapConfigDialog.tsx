import type { ModalProps } from 'react-native'
import { Switch } from '~/shared/components/design-system'
import { MapConfigDialog } from '../../../../shared/components/MapConfigDialog'
import { useTripViewConfig } from '../useTripViewConfig'

interface Props extends Omit<ModalProps, 'visible'> {
  isOpen?: boolean
}

export function TripRouteMapConfigDialog({ isOpen, ...props }: Props) {
  const [viewConfig, setViewConfig] = useTripViewConfig()

  return (
    <MapConfigDialog isOpen={isOpen} {...props}>
      <MapConfigDialog.Section label="마커">
        <MapConfigDialog.Row label="접어 보기" description="거리가 가까운 마커끼리 합쳐서 보여져요">
          <Switch
            checked={viewConfig.isCluasterlingView}
            onChange={(_, checked) => setViewConfig({ isCluasterlingView: checked })}
          />
        </MapConfigDialog.Row>
        <MapConfigDialog.Row label="계획된 장소만 보기">
          <Switch
            checked={!viewConfig.isVisibleAllMarkers}
            onChange={(_, checked) => setViewConfig({ isVisibleAllMarkers: !checked })}
          />
        </MapConfigDialog.Row>
      </MapConfigDialog.Section>

      <MapConfigDialog.Section label="경로">
        <MapConfigDialog.Row label="이동 시간 보기">
          <Switch
            checked={viewConfig.isVisibleRouteLegs}
            onChange={(_, checked) => setViewConfig({ isVisibleRouteLegs: checked })}
          />
        </MapConfigDialog.Row>
      </MapConfigDialog.Section>
    </MapConfigDialog>
  )
}
