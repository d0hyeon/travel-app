import type { ModalProps } from 'react-native'
import { Switch } from '../../../shared/components/mui'
import { MapConfigDialog } from '../../../shared/components/MapConfigDialog'
import { useTripCluastering } from '../hooks/useTripCluastering'

interface Props extends Omit<ModalProps, 'visible'> {
  isOpen?: boolean
}

export function TripPlaceMapConfigDialog({ isOpen, ...props }: Props) {
  const [isClusteringView, setCluastering] = useTripCluastering()

  return (
    <MapConfigDialog isOpen={isOpen} {...props}>
      <MapConfigDialog.Section label="마커">
        <MapConfigDialog.Row label="접어 보기" description="거리가 가까운 마커끼리 합쳐서 보여져요">
          <Switch
            checked={isClusteringView}
            onChange={(_, checked) => setCluastering(checked)}
          />
        </MapConfigDialog.Row>
      </MapConfigDialog.Section>
    </MapConfigDialog>
  )
}
