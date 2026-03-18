import DeleteIcon from '@mui/icons-material/Delete'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Box, Button, Card, CardContent, CardHeader, IconButton, Skeleton, Stack, TextField, Typography } from "@mui/material"
import { Suspense, useState } from 'react'
import { useConfirmDialog } from '~shared/modules/confirm-dialog/useConfirmDialog'
import { EditableText } from '../../../shared/components/EditableText'
import { ListItem } from '../../../shared/components/ListItem'
import { getRandomEmoji } from './tripMember.types'
import { useTripMembers } from './useTripMembers'

interface Props {
  tripId: string
}

export function TripMemberSection(props: Props) {
  return (
    <Suspense fallback={<Pending />}>
      <Resolved {...props} />
    </Suspense>
  )
}

function Resolved({ tripId }: Props) {
  const { data: members, create, update, remove } = useTripMembers(tripId)
  const confirm = useConfirmDialog()

  const [isAdding, setIsAdding] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')

  const handleStartAdd = () => {
    setIsAdding(true)
    setNewMemberName('')
  }

  const handleAddMember = () => {
    const name = newMemberName.trim()
    if (name) {
      create({ name, emoji: getRandomEmoji() })
    }
    setIsAdding(false)
    setNewMemberName('')
  }

  const handleCancelAdd = () => {
    setIsAdding(false)
    setNewMemberName('')
  }

  const handleDeleteMember = async (memberId: string) => {
    if (await confirm('이 인원을 삭제하시겠습니까?')) {
      remove(memberId)
    }
  }

  const handleChangeEmoji = (memberId: string) => {
    update({ memberId, data: { emoji: getRandomEmoji() } })
  }

  return (
    <Card variant="outlined">
      <CardHeader
        title={`참여 인원 (${members.length}명)`}
        action={
          <Button size="small" onClick={handleStartAdd} variant="contained" disabled={isAdding}>
            추가
          </Button>
        }
      />
      <CardContent>
        <Stack spacing={1}>
          {/* 새 인원 추가 입력 필드 */}
          {isAdding && (
            <ListItem>
              <TextField
                autoFocus
                size="small"
                variant="standard"
                placeholder="이름 입력"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddMember()
                  } else if (e.key === 'Escape') {
                    handleCancelAdd()
                  }
                }}
                onBlur={() => {
                  if (newMemberName.trim()) {
                    handleAddMember()
                  } else {
                    handleCancelAdd()
                  }
                }}
                fullWidth
              />
            </ListItem>
          )
          }

          {
            members.length === 0 && !isAdding ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                인원을 추가해주세요
              </Typography>
            ) : (
              members.map((member) => (
                <ListItem
                  key={member.id}
                  leftAddon={
                    <Box
                      onClick={() => handleChangeEmoji(member.id)}
                      sx={{
                        cursor: 'pointer',
                        fontSize: 28,
                        width: 44,
                        height: 44,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        bgcolor: 'grey.100',
                        '&:hover': { bgcolor: 'grey.200' }
                      }}
                    >
                      {member.emoji}
                    </Box>
                  }
                  rightAddon={
                    <Stack direction="row">
                      <IconButton
                        size="small"
                        onClick={() => handleChangeEmoji(member.id)}
                        title="이모지 변경"
                      >
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteMember(member.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  }
                >
                  <EditableText
                    defaultValue={member.name}
                    onSubmit={(name) => {
                      if (name.trim()) {
                        update({ memberId: member.id, data: { name: name.trim() } })
                      }
                    }}
                    submitOnBlur
                    endIcon={null}
                  />
                </ListItem>
              ))
            )
          }
        </Stack >
      </CardContent >
    </Card >
  )
}

function Pending() {
  return (
    <Card variant="outlined">
      <CardHeader
        title={`참여 인원`}
        action={
          <Button size="small" color="primary" variant="contained" disabled>
            추가
          </Button>
        }
      />
      <CardContent>
        <Stack spacing={1}>
          {Array.from({ length: 2 }).fill(0).map((_, key) => (
            <ListItem
              key={key}
              leftAddon={<Skeleton variant='circular' width={44} />}
              rightAddon={
                <Stack direction="row">
                  <IconButton size="small" title="이모지 변경" disabled>
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" disabled>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              }
            >
              <Skeleton variant="text"></Skeleton>
            </ListItem>
          ))}

        </Stack>
      </CardContent>
    </Card>
  )
}
