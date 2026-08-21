import { useTripPlaces } from '@waylog/domains/trip'
import { useState } from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { ListItem } from '../../../shared/components/ListItem'
import { Button, Stack, Typography } from '../../../shared/components/mui'

interface PlaceSelectSheetProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
  selectedPlaceIds: string[]
  onConfirm: (placeIds: string[]) => void
}

// 웹 PlaceSelectSheet 와 같은 계약을 유지한다.
// 이미 경로에 든 장소는 목록에서 뺀다.
export function PlaceSelectSheet({
  isOpen,
  onClose,
  tripId,
  selectedPlaceIds,
  onConfirm,
}: PlaceSelectSheetProps) {
  const { data: places } = useTripPlaces(tripId)
  const [picked, setPicked] = useState<string[]>([])

  const candidates = places.filter((place) => !selectedPlaceIds.includes(place.id))

  const toggle = (id: string) =>
    setPicked((curr) => (curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]))

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={[0.7]} defaultSnapIndex={0}>
      <BottomSheet.Header>경로에 장소 추가</BottomSheet.Header>
      <BottomSheet.Body sx={{ paddingHorizontal: 16 }}>
        {candidates.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ paddingVertical: 24 }}>
            추가할 수 있는 장소가 없어요
          </Typography>
        ) : (
          <Stack gap={0.5}>
            {candidates.map((place) => (
              <ListItem.Button
                key={place.id}
                focused={picked.includes(place.id)}
                onClick={() => toggle(place.id)}
                rightAddon={
                  picked.includes(place.id) ? (
                    <MaterialIcons name="check-circle" size={20} color="#4C84FF" />
                  ) : undefined
                }
              >
                <ListItem.Title>{place.name}</ListItem.Title>
                {place.address !== '' && <ListItem.Text>{place.address}</ListItem.Text>}
              </ListItem.Button>
            ))}
          </Stack>
        )}
      </BottomSheet.Body>
      <BottomSheet.BottomActions>
        <Button variant="outlined" fullWidth onClick={onClose}>
          취소
        </Button>
        <Button
          variant="contained"
          fullWidth
          disabled={picked.length === 0}
          onClick={() => {
            onConfirm(picked)
            onClose()
          }}
        >
          추가 ({picked.length})
        </Button>
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}
