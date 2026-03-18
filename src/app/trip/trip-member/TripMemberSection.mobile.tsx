import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Box, IconButton, Skeleton, Stack, TextField, Typography } from "@mui/material"
import { Suspense, useState } from 'react'
import { EditableText } from '~shared/components/EditableText'
import { ListItem } from '~shared/components/ListItem'
import { PopMenu } from '~shared/components/PopMenu'
import { useConfirmDialog } from '~shared/modules/confirm-dialog/useConfirmDialog'
import { getRandomEmoji } from '../trip-member/tripMember.types'
import { useTripMembers } from '../trip-member/useTripMembers'


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
    <Stack gap={1} width="100%">
      <Stack direction="row" justifyContent="space-between" alignItems="center" marginTop={-1}>
        <Typography variant="subtitle2" color="text.secondary">
          인원 ({members.length}명)
        </Typography>
        <IconButton size="small" onClick={handleStartAdd} color="primary" disabled={isAdding}>
          <AddIcon />
        </IconButton>
      </Stack>

      <Stack spacing={1} width="100%">
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
                    fontSize: 20,
                    width: 20,
                    height: 20,
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
                <MemberMenu
                  onChangeEmoji={() => handleChangeEmoji(member.id)}
                  onDelete={() => handleDeleteMember(member.id)}
                />
              }
            >
              <EditableText
                defaultValue={member.name}
                onSubmit={(name) => {
                  if (name.trim()) {
                    update({ memberId: member.id, data: { name: name.trim() } })
                  }
                }}
                variant="body2"
                submitOnBlur
                endIcon={null}
              />
            </ListItem>
          ))
        )}
      </Stack>
    </Stack>
  )
}

interface MemberMenuProps {
  onChangeEmoji: () => void
  onDelete: () => void
}

function MemberMenu({ onChangeEmoji, onDelete }: MemberMenuProps) {
  return (
    <PopMenu
      items={(
        <>
          <PopMenu.Item onClick={onChangeEmoji} icon={<RefreshIcon fontSize="small" sx={{ mr: 1 }} />}>
            이모지 변경
          </PopMenu.Item>
          <PopMenu.Item onClick={onDelete} icon={<DeleteIcon fontSize="small" sx={{ mr: 1 }} />} sx={{ color: 'error.main' }}>
            삭제
          </PopMenu.Item>
        </>
      )}
    />
  )
}

function Pending() {
  return (
    <Stack gap={1} width="100%">
      <Stack direction="row" justifyContent="space-between" alignItems="center" marginTop={-1}>
        <Typography variant="subtitle2" color="text.secondary">
          인원
        </Typography>
        <IconButton size="small" color="primary" disabled>
          <AddIcon />
        </IconButton>
      </Stack>

      <Stack spacing={1} width="100%">
        <ListItem
          leftAddon={<Skeleton variant="circular" sx={{ width: 20 }} />}
          rightAddon={
            <IconButton size="small" disabled>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          }
        >
          <Skeleton variant='text' />
        </ListItem>
      </Stack>
    </Stack>
  )
}