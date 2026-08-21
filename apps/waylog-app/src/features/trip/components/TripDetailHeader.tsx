import { useTrip } from '@waylog/domains/trip'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { Button, Stack, TextField, Typography } from '../../../shared/components/mui'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { palette } from '../../../shared/config/tokens'
import { ChatIconButton } from '../trip-chat/ChatIconButton'

export function TripDetailHeader() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>()
  const router = useRouter()
  const { data: trip, update } = useTrip(tripId)
  const overlay = useOverlay()

  const openEditor = () => {
    overlay.open(({ isOpen, close }) => <TripNameEditor tripId={tripId} name={trip.name} onClose={close} onSave={update} isOpen={isOpen} />)
  }

  return (
    <Stack direction="row" alignItems="center" sx={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: palette.background }}>
      <Pressable accessibilityLabel="뒤로가기" onPress={() => router.back()} style={{ padding: 4 }}>
        <MaterialIcons name="arrow-back" size={22} color={palette.text} />
      </Pressable>
      <Pressable onPress={openEditor} style={{ flex: 1, paddingHorizontal: 8, paddingVertical: 4 }}>
        <Stack direction="row" justifyContent="flex-start" alignItems="center" gap={1}>
          <Typography variant="subtitle2" numberOfLines={1} sx={{ fontWeight: '900' }}>
            {trip.name}
          </Typography>
          <MaterialIcons name="edit" size={15} color={palette.grey} />
        </Stack>
      </Pressable>
      <ChatIconButton tripId={tripId} />
    </Stack>
  )
}

interface EditorProps {
  tripId: string
  name: string
  isOpen: boolean
  onClose: () => void
  onSave: (data: { name: string }) => Promise<unknown>
}

function TripNameEditor({ name, isOpen, onClose, onSave }: EditorProps) {
  const [draft, setDraft] = useState(name)
  const [isSaving, setIsSaving] = useState(false)

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={[0.35]} defaultSnapIndex={0}>
      <BottomSheet.Header>여행 이름 수정</BottomSheet.Header>
      <BottomSheet.Body>
        <TextField autoFocus fullWidth value={draft} onChangeText={setDraft} placeholder="여행 이름" />
      </BottomSheet.Body>
      <BottomSheet.BottomActions>
        <Stack direction="row" gap={1}>
          <Button fullWidth variant="outlined" onClick={onClose}>취소</Button>
          <Button
            fullWidth
            variant="contained"
            disabled={isSaving || draft.trim() === ''}
            onClick={async () => {
              setIsSaving(true)
              await onSave({ name: draft.trim() })
              onClose()
            }}
          >
            저장
          </Button>
        </Stack>
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}
