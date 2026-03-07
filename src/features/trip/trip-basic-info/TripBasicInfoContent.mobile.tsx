import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Box, IconButton, InputAdornment, Stack, Tab, Tabs, TextField, Typography } from "@mui/material"
import { useState } from 'react'
import { BottomArea } from '~shared/components/BottomArea'
import { BottomNavigation } from '~shared/components/BottomNavigation'
import { useQueryParamState } from '~shared/hooks/useQueryParamState'
import { useConfirmDialog } from '~shared/modules/confirm-dialog/useConfirmDialog'
import { EditableText } from '../../../shared/components/EditableText'
import { ListItem } from '../../../shared/components/ListItem'
import { formatDate, formatDateISO } from '../../../shared/utils/formats'
import { TripChecklist } from '../trip-checklist/TripChecklist'
import { TripChecklistAddButton } from '../trip-checklist/TripChecklistAddButton'
import { getRandomEmoji } from '../trip-member/tripMember.types'
import { useTripMembers } from '../trip-member/useTripMembers'
import { useTrip } from '../useTrip'
import { TripDeadlineChecklist } from '../trip-checklist/TripDeadlineChecklist'
import { DateRangePicker } from '~shared/components/date-range/DateRangePicker'
import ClearIcon from '@mui/icons-material/Clear';

interface Props {
  tripId: string
}

export function TripBasicInfoContent({ tripId }: Props) {
  const { data: trip, update: updateTrip } = useTrip(tripId)
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

  const [currentTab, setCurrentTab] = useQueryParamState('info-tab', { defaultValue: 'default' })

  return (
    <Stack height="100%">
      <Tabs value={currentTab} onChange={(_, value) => setCurrentTab(value)}>
        <Tab value="default" label="기본정보" />
        <Tab value="checklist" label="체크리스트" />
      </Tabs>
      <Box position="relative" width="100%" sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {currentTab === 'default' && (
          <Stack gap={4}>
            {/* 여행 정보 */}
            <Stack gap={1} border="1px solid #ddd" padding={2} borderRadius={4}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" color="text.secondary" mb={1}>
                  목적지
                </Typography>
                <Typography variant="body1">{trip.destination}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" color="text.secondary">
                  여행 기간
                </Typography>
                <EditableText
                  variant="body1"
                  value={`${formatDate(trip.startDate)} ~ ${formatDate(trip.endDate)}`}
                  dismissible={false}
                  renderEditField={(props, control) => {
                    return (
                      <DateRangePicker
                        {...props}
                        value={[new Date(trip.startDate), new Date(trip.startDate)]}
                        onChange={([start, end]) => {
                          updateTrip.mutateAsync({
                            startDate: formatDateISO(start),
                            endDate: formatDateISO(end)
                          })
                          control.cancelEdit();
                        }}
                        endAdornment={(
                          <InputAdornment position="end" onClick={control.cancelEdit}>
                            <ClearIcon sx={{ width: 16 }} />
                          </InputAdornment>
                        )}
                      />
                    )
                  }}
                />
              </Stack>
            </Stack>
            <Stack gap={1} >
              <Typography variant='subtitle2' color="text.secondary">
                해야할 일
              </Typography>
              <TripDeadlineChecklist
                tripId={tripId}
                gap={1}
              />
            </Stack>

            {/* 인원 관리 */}
            <Stack gap={1} >
              <Stack direction="row" justifyContent="space-between" alignItems="center" marginTop={-1}>
                <Typography variant="subtitle2" color="text.secondary">
                  인원 ({members.length}명)
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
                        variant="body2"
                        submitOnBlur
                        endIcon={null}
                      />
                    </ListItem>
                  ))
                )}
              </Stack>
            </Stack>
          </Stack>
        )}

        {currentTab === 'checklist' && (
          <>
            <TripChecklist tripId={tripId} paddingBottom={`${BottomNavigation.HEIGHT}px`} />
            <BottomArea bottom={BottomNavigation.HEIGHT} left={0}>
              <TripChecklistAddButton tripId={tripId} size="large" fullWidth />
            </BottomArea>
          </>
        )}

      </Box>
    </Stack>
  )
}
