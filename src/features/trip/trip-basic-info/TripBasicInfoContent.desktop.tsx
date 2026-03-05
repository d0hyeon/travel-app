import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Box, Card, CardContent, CardHeader, IconButton, Stack, TextField, Typography } from "@mui/material"
import { Suspense, useState } from 'react'
import { useConfirmDialog } from '~shared/modules/confirm-dialog/useConfirmDialog'
import { EditableText } from '../../../shared/components/EditableText'
import { ListItem } from '../../../shared/components/ListItem'
import { formatDate } from '../../../shared/utils/formats'
import { TripChecklist } from '../trip-checklist/TripChecklist'
import { TripChecklistAddButton } from '../trip-checklist/TripChecklistAddButton'
import { getRandomEmoji } from '../trip-member/tripMember.types'
import { useTripMembers } from '../trip-member/useTripMembers'
import { useTrip } from '../useTrip'

interface Props {
  tripId: string
}

export function TripBasicInfoContent({ tripId }: Props) {
  const { data: trip } = useTrip(tripId)
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
    <Box paddingTop={2}>

      <Stack direction="row" gap={3} sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Stack flex="1" spacing={3} >
          {/* 여행 정보 */}
          <Card variant="outlined">
            <CardHeader title="여행 정보" />
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    목적지
                  </Typography>
                  <Typography variant="body1">{trip.destination}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    여행 기간
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* 인원 관리 */}
          <Card variant="outlined">
            <CardHeader
              title={`참여 인원 (${members.length}명)`}
              action={
                <IconButton onClick={handleStartAdd} color="primary" disabled={isAdding}>
                  <AddIcon />
                </IconButton>
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
                )}

                {members.length === 0 && !isAdding ? (
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
                )}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
        <Stack flex="1" spacing={3} >
          <Card variant="outlined">
            <Stack direction="row" paddingY={1} marginTop={0.5} paddingX={2} alignItems="center" justifyContent="space-between">
              <Typography variant="h6">체크리스트</Typography>
              <TripChecklistAddButton tripId={tripId} size="small" />
            </Stack>

            <Suspense>
              <CardContent>
                <TripChecklist tripId={tripId} />
              </CardContent>
            </Suspense>
          </Card>
        </Stack>
      </Stack>
    </Box>
  )
}
