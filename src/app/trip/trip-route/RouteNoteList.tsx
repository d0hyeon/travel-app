import { Button, Stack, TextField, Typography, type StackProps } from "@mui/material"
import { useCallback, useState } from "react"
import { EditableText } from "~shared/components/EditableText"
import CloseIcon from '@mui/icons-material/Close';
import { usePromptDialog } from "~shared/components/confirm-dialog/usePromptDialog";
import { DialogTitle } from "~shared/components/confirm-dialog/DialogTitle";

type Action = 'immediately' | 'dialog'

interface Props extends Omit<StackProps, 'onChange'> {
  notes: string[]
  onChange: (notes: string[]) => void;
  action?: Action;
}

export function NoteEditor({ notes, onChange, action, ...props }: Props) {
  const [isAdding, setIsAdding] = useState(false)

  const handleUpdate = (index: number, value: string) => {
    if (!value.trim()) {
      onChange(notes.filter((_, i) => i !== index))
    } else {
      const newNotes = [...notes]
      newNotes[index] = value.trim()
      onChange(newNotes)
    }
  }

  const handleDelete = (index: number) => {
    onChange(notes.filter((_, i) => i !== index))
  }

  const { writeNote, updateNote } = useNoteDialog();
  if (action === 'dialog') {
    return (
      <Stack gap={0.5} justifyContent="start" alignItems="start" {...props}>
        {notes.map((note, idx) => (
          <Typography
            key={note}
            variant="body2"
            fontSize={12}
            color="primary"
            sx={theme => ({
              cursor: 'pointer',
              borderBottom: `1px dashed ${theme.palette.primary.main}`,
            })}
            onClick={async (event) => {
              event.stopPropagation();
              updateNote(note, {
                onConfirm: (updated) => handleUpdate(idx, updated),
                onDelete: () => handleDelete(idx),
              });
            }}
          >
            {note}
          </Typography>
        ))}
        <Typography
          variant="body2"
          fontSize={12}
          color="text.secondary"
          onClick={async (event) => {
            event.stopPropagation();
            const value = await writeNote();
            if (value == null) return;
            onChange([...notes, value])
          }}
          sx={{
            cursor: 'pointer',
            borderBottom: '1px solid primary',
            '&:hover': { color: 'primary.main' }
          }}
        >
          + 경로 메모
        </Typography>
      </Stack>
    )
  }

  return (
    <Stack gap={0.5} {...props}>
      {notes.map((memo, index) => (
        <EditableText
          key={index}
          value={memo}
          onSubmit={(value) => handleUpdate(index, value)}
          submitOnBlur
          variant="body2"
          fontSize={12}
          color="primary"
          sx={{ cursor: 'pointer' }}
          renderEditField={(props) => (
            <TextField
              {...props}
              autoFocus
              size="small"
              variant="standard"
              fullWidth
              slotProps={{ input: { sx: { fontSize: 12 } } }}
            />
          )}
          endIcon={
            <CloseIcon
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(index)
              }}
              sx={{ fontSize: 14, color: 'text.secondary', cursor: 'pointer', '&:hover': { color: 'error.main' } }}
            />
          }
        />
      ))}
      {isAdding ? (
        <TextField
          autoFocus
          size="small"
          variant="standard"
          onBlur={(e) => {
            const value = e.target.value.trim()
            if (value) onChange([...notes, value])
            setIsAdding(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const value = (e.target as HTMLInputElement).value.trim()
              if (value) onChange([...notes, value])
              setIsAdding(false)
            }
            if (e.key === 'Escape') setIsAdding(false)
          }}
          placeholder="경로 메모 입력..."
          fullWidth
          slotProps={{ input: { sx: { fontSize: 12 } } }}
        />
      ) : (
        <Typography
          variant="body2"
          fontSize={12}
          color="text.secondary"
          onClick={() => setIsAdding(true)}
          sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
        >
          + 경로 메모
        </Typography>
      )}
    </Stack>
  )
}

type UpdateNoteHooks = {
  onConfirm?: (value: string) => void;
  onCancel?: () => void;
  onDelete?: () => void;
}

function useNoteDialog() {
  const prompt = usePromptDialog();

  const writeNote = useCallback(() => prompt({ title: '메모' }), []);

  const updateNote = (value: string, options: UpdateNoteHooks = {}) => {
    return new Promise<string | null>((resolve) => {
      prompt({
        title: (
          <Stack direction="row" alignItems="center" justifyContent="space-between" paddingRight={2}>
            <DialogTitle>메모</DialogTitle>
            {!!value && (
              <Button
                type="button"
                size="small"
                variant="outlined"
                color="error"
                onClick={() => {
                  prompt.close();
                  resolve(null);
                  options?.onDelete?.();
                }}
              >
                삭제
              </Button>
            )}
          </Stack>
        ),
        defaultValue: value,
        onConfirm: (value) => {
          resolve(value);
          options.onConfirm?.(value);
        },
        onCancel: () => {
          resolve(null)
          options.onCancel?.();
        }
      })
    })
  }

  return { writeNote, updateNote }
}