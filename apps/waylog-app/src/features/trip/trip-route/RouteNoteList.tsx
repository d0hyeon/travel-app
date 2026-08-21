import { useState } from 'react'
import { Pressable } from 'react-native'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { Button, Stack, TextField, Typography } from '../../../shared/components/mui'
import { palette } from '../../../shared/config/tokens'
import { useOverlay } from '../../../shared/hooks/useOverlay'

interface Props {
  notes: string[]
  onChange: (notes: string[]) => void
  /** 웹과 시그니처를 맞추기 위해 받는다. 앱은 항상 시트로 연다. */
  action?: 'dialog' | 'inline'
}

// 웹 NoteEditor 와 같은 notes/onChange 계약을 유지한다.
export function NoteEditor({ notes, onChange }: Props) {
  const overlay = useOverlay()

  const handleUpdate = (index: number, value: string) => {
    if (!value.trim()) {
      onChange(notes.filter((_, i) => i !== index))
      return
    }
    const next = [...notes]
    next[index] = value.trim()
    onChange(next)
  }

  const openEditor = (initial: string, onConfirm: (value: string) => void, onDelete?: () => void) => {
    overlay.open(({ isOpen, close }) => (
      <NoteSheet
        isOpen={isOpen}
        initial={initial}
        onClose={close}
        onConfirm={(value) => {
          onConfirm(value)
          close()
        }}
        onDelete={
          onDelete == null
            ? undefined
            : () => {
                onDelete()
                close()
              }
        }
      />
    ))
  }

  return (
    <Stack gap={0.5} alignItems="flex-start" sx={{ marginTop: 8 }}>
      {notes.map((note, idx) => (
        <Pressable
          key={note}
          onPress={() =>
            openEditor(
              note,
              (updated) => handleUpdate(idx, updated),
              () => onChange(notes.filter((_, i) => i !== idx)),
            )
          }
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: 12,
              color: palette.primary,
              borderBottomWidth: 1,
              borderColor: palette.primary,
            }}
          >
            {note}
          </Typography>
        </Pressable>
      ))}

      <Pressable onPress={() => openEditor('', (value) => onChange([...notes, value.trim()]))}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
          + 메모 추가
        </Typography>
      </Pressable>
    </Stack>
  )
}

interface NoteSheetProps {
  isOpen: boolean
  initial: string
  onClose: () => void
  onConfirm: (value: string) => void
  onDelete?: () => void
}

function NoteSheet({ isOpen, initial, onClose, onConfirm, onDelete }: NoteSheetProps) {
  const [value, setValue] = useState(initial)

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={[0.4]} defaultSnapIndex={0}>
      <BottomSheet.Header>메모</BottomSheet.Header>
      <BottomSheet.Body sx={{ paddingHorizontal: 16 }}>
        <TextField
          autoFocus
          placeholder="메모를 입력하세요"
          fullWidth
          multiline
          minRows={3}
          value={value}
          onChangeText={setValue}
        />
      </BottomSheet.Body>
      <BottomSheet.BottomActions>
        {onDelete != null && (
          <Button variant="outlined" color="error" fullWidth onClick={onDelete}>
            삭제
          </Button>
        )}
        <Button variant="contained" fullWidth onClick={() => onConfirm(value)}>
          저장
        </Button>
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}
