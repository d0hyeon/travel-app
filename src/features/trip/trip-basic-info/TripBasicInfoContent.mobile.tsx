import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Box, IconButton, Stack, TextField, Typography } from "@mui/material"
import { useState } from 'react'
import { useConfirmDialog } from '~shared/modules/confirm-dialog/useConfirmDialog'
import { EditableText } from '../../../shared/components/EditableText'
import { ListItem } from '../../../shared/components/ListItem'
import { formatDate } from '../../../shared/utils/formats'
import { useTripMembers } from '../trip-member/useTripMembers'
import { getRandomEmoji } from '../trip-member/tripMember.types'
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
    <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
      <Stack spacing={3}>
        {/* 여행 정보 */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" mb={1}>
            목적지
          </Typography>
          <Typography variant="h6">{trip.destination}</Typography>
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" mb={1}>
            여행 기간
          </Typography>
          <Typography variant="body1">
            {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}
          </Typography>
        </Box>

        {/* 인원 관리 */}
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Typography variant="subtitle2" color="text.secondary">
              참여 인원 ({members.length}명)
            </Typography>
            <IconButton size="small" onClick={handleStartAdd} color="primary" disabled={isAdding}>
              <AddIcon />
            </IconButton>
          </Stack>

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
                        width: 40,
                        height: 40,
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
        </Box>
      </Stack>
    </Box>
  )
}
