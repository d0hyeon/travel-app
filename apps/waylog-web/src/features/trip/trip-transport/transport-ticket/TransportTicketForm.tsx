import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import CheckIcon from '@mui/icons-material/Check'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CloseIcon from '@mui/icons-material/Close'
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Box,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import type { TripMember } from '@waylog/domains/modules/trip-member'
import { useTripMembers } from '@waylog/domains/modules/trip-member'
import type { TripTransportType } from '@waylog/domains/modules/trip-transport'
import { useRef, useState } from 'react'
import { TransportTypeIcon } from '~features/transport/TransportTypeIcon'
import { useTicketViewerOverlay } from './useTicketViewerOverlay'
import type { TransportTicketDraft } from '../transport-form-funnel/transportForm.types'

interface Props {
  tripId: string
  type?: TripTransportType
  showIntro?: boolean
  onChange: (tickets: TransportTicketDraft[]) => void
}

// 탑승권 입력을 소유한다. 이미지 한 장이 티켓 한 행이고, 행마다 탑승자를 고른다.
// 제출 버튼은 화면마다 위치가 달라 밖에 둔다.
export function TransportTicketForm({ tripId, type, showIntro = true, onChange }: Props) {
  const { data: members } = useTripMembers(tripId)
  const ticketViewer = useTicketViewerOverlay()
  const [tickets, setTickets] = useState<TransportTicketDraft[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const replaceTickets = (next: TransportTicketDraft[]) => {
    setTickets(next)
    onChange(next)
  }

  const addFiles = (files: FileList | null) => {
    if (files == null) return
    replaceTickets([...tickets, ...Array.from(files).map((file) => ({ file }))])
  }

  const updateMember = (index: number, memberId?: string) => {
    replaceTickets(tickets.map((ticket, i) => (i === index ? { ...ticket, memberId } : ticket)))
  }

  const removeTicket = (index: number) => {
    replaceTickets(tickets.filter((_, i) => i !== index))
  }

  return (
    <Stack gap={3}>
      {showIntro && (
        <Stack gap={0.5}>
          <Typography variant="h6" fontWeight={700}>
            탑승권을 올려둘까요?
          </Typography>
          <Typography variant="caption" color="text.secondary">
            선택사항이에요. 나중에 상세 화면에서 추가할 수 있어요.
          </Typography>
        </Stack>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {

          addFiles(event.target.files)
          event.target.value = ''
        }}
      />

      <Box
        component="button"
        type="button"
        onClick={() => inputRef.current?.click()}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.75,
          width: '100%',
          py: 4.5,
          borderRadius: 2,
          border: '2px dashed',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          cursor: 'pointer',
          '&:hover': { borderColor: 'primary.light' },
        }}
      >
        <AddPhotoAlternateIcon color="disabled" />
        <Typography variant="body2" color="text.secondary">
          탑승권 이미지를 올려주세요
        </Typography>
      </Box>

      {tickets.length > 0 && (
        <Box ml={0.5}>
          {tickets.map((ticket, index) => {
            const owner = members.find((member) => member.id === ticket.memberId)
            const isLast = index === tickets.length - 1

            return (
              <Stack
                key={`${ticket.file.name}-${index}`}
                direction="row"
                alignItems="stretch"
                gap={1}
              >
                {/* 업로드 영역에 딸린 목록임을 선으로 드러낸다.
                    선을 absolute 로 그리면 행 높이가 자식에 의해 정해지는 동안
                    bottom 이 기준점을 못 잡는다. 레이아웃 요소로 둔다. */}
                <Box position="relative" width={16} flexShrink={0}>
                  <Box sx={{ height: 34, width: '1px', bgcolor: 'divider' }} />
                  {!isLast && <Box sx={{ flex: 1, width: '1px', bgcolor: 'divider' }} />}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 34,
                      width: 16,
                      height: '1px',
                      bgcolor: 'divider',
                    }}
                  />
                </Box>

                <Stack
                  direction="row"
                  alignItems="center"
                  flex={1}
                  sx={{ mb: isLast ? 0 : '10px' }}
                >
                  {/* 이미지를 그대로 늘어놓지 않는다. 탑승권은 열어서 보는 것이고
                      목록에서는 누구 것인지만 알면 된다. */}
                  <Stack
                    component="button"
                    type="button"
                    direction="row"
                    alignItems="center"
                    gap={1.5}
                    flex={1}
                    onClick={() => {
                      const previewUrl = URL.createObjectURL(ticket.file)
                      ticketViewer.openDraft(previewUrl, () => URL.revokeObjectURL(previewUrl))
                    }}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 36,
                        height: 36,
                        borderRadius: 1.5,
                        bgcolor: 'action.hover',
                        flexShrink: 0,
                      }}
                    >
                      {type == null ? (
                        <ConfirmationNumberIcon color="primary" sx={{ fontSize: 20 }} />
                      ) : (
                        <TransportTypeIcon type={type} color="primary" sx={{ fontSize: 20 }} />
                      )}
                    </Box>

                    <Stack flex={1} gap={0.25}>
                      <Typography variant="caption" color="text.secondary">
                        탑승권 {index + 1}
                      </Typography>
                      <Box>
                        <TicketOwnerMenu
                          members={members}
                          memberId={ticket.memberId}
                          ownerName={owner?.name}
                          onChange={(memberId) => updateMember(index, memberId)}
                        />
                      </Box>
                    </Stack>

                    <ChevronRightIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  </Stack>

                  <IconButton
                    aria-label="탑승권 삭제"
                    size="small"
                    onClick={() => removeTicket(index)}
                    sx={{ width: 40, height: 32, flexShrink: 0 }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            )
          })}
        </Box>
      )}

    </Stack>
  )
}

interface OwnerMenuProps {
  members: TripMember[]
  memberId?: string
  ownerName?: string
  onChange: (memberId?: string) => void
}

function TicketOwnerMenu({ members, memberId, ownerName, onChange }: OwnerMenuProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const ownerCandidates = members.filter((member) => !member.hasLeft || member.id === memberId)

  const select = (next?: string) => {
    onChange(next)
    setAnchor(null)
  }

  return (
    <>
      <Stack
        component="span"
        direction="row"
        alignItems="center"
        gap={0.25}
        onClick={(event) => {
          event.stopPropagation()
          setAnchor(event.currentTarget)
        }}
        sx={{ display: 'inline-flex', cursor: 'pointer' }}
      >
        {/* 고르기 전에는 무엇을 고르는 자리인지 라벨이 대신한다. */}
        <Typography variant="body2" fontWeight={700}>
          {ownerName ?? '탑승자'}
        </Typography>
        <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
      </Stack>

      <Menu anchorEl={anchor} open={anchor != null} onClose={() => setAnchor(null)}>
        <MenuItem
          selected={memberId == null}
          onClick={(event) => {
            event.stopPropagation();
            select(undefined)
          }}
        >
          <SelectedMark isSelected={memberId == null} />
          공용
        </MenuItem>
        {ownerCandidates.map((member) => (
          <MenuItem
            key={member.id}
            selected={memberId === member.id}
            onClick={(event) => {
              event.stopPropagation();
              select(member.id);
            }}
          >
            <SelectedMark isSelected={memberId === member.id} />
            {member.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

// 고른 항목을 아이콘으로 표시한다. 자리를 늘 차지해야 목록이 흔들리지 않는다.
function SelectedMark({ isSelected }: { isSelected: boolean }) {
  return (
    <ListItemIcon sx={{ minWidth: 28 }}>
      <CheckIcon
        sx={{ fontSize: 18, visibility: isSelected ? 'visible' : 'hidden' }}
        color="primary"
      />
    </ListItemIcon>
  )
}
