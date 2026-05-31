import CloseIcon from '@mui/icons-material/Close'
import SendIcon from '@mui/icons-material/Send'
import {
  Avatar,
  Box,
  IconButton,
  InputBase,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useAuth } from '~features/auth/useAuth'
import { useTripMembers } from '../trip-member/useTripMembers'
import { markAsRead } from './useUnreadChatCount'
import { useTripChat } from './useTripChat'
import { useSendChatMessage } from './useSendChatMessage'
import type { ChatMessage } from './tripChat.types'
import type { TripMember } from '../trip-member/tripMember.types'

interface Props {
  tripId: string
  isOpen: boolean
  onClose: () => void
}

export function TripChatPanel(props: Props) {
  return (
    <Suspense fallback={<TripChatPanelSkeleton onClose={props.onClose} />}>
      <TripChatPanelResolved {...props} />
    </Suspense>
  )
}

function TripChatPanelResolved({ tripId, onClose }: Props) {
  const { data: currentUser } = useAuth()
  const { messages } = useTripChat(tripId)
  const { data: members } = useTripMembers(tripId)
  const { send, isPending } = useSendChatMessage(tripId)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const memberMap = Object.fromEntries(members.map((m) => [m.userId, m]))

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    markAsRead(tripId)
  }, [tripId, messages.length])

  const handleSend = () => {
    const content = input.trim()
    if (!content || isPending) return
    send(content)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Stack height="100%">
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        px={2}
        py={1}
        borderBottom="1px solid"
        borderColor="divider"
        flexShrink={0}
      >
        <Typography variant="subtitle1" fontWeight={600}>채팅</Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Stack flex={1} overflow="auto" p={2} gap={1.5}>
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isMe={msg.userId === currentUser.id}
            member={memberMap[msg.userId]}
          />
        ))}
        {messages.length === 0 && (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
            첫 메시지를 보내보세요!
          </Typography>
        )}
        <div ref={bottomRef} />
      </Stack>

      <Paper elevation={2} sx={{ p: 1.5, borderRadius: 0, flexShrink: 0 }}>
        <Stack direction="row" alignItems="flex-end" gap={1}>
          <InputBase
            multiline
            maxRows={4}
            placeholder="메시지를 입력하세요"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            sx={{ flex: 1, bgcolor: 'grey.100', borderRadius: 2, px: 1.5, py: 1 }}
          />
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={isPending || !input.trim()}
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Paper>
    </Stack>
  )
}

interface BubbleProps {
  message: ChatMessage
  isMe: boolean
  member?: TripMember
}

function MessageBubble({ message, isMe, member }: BubbleProps) {
  return (
    <Stack direction={isMe ? 'row-reverse' : 'row'} alignItems="flex-end" gap={1}>
      {!isMe && (
        <Avatar
          src={member?.profileUrl ?? undefined}
          sx={{ width: 28, height: 28, fontSize: 12 }}
        >
          {member?.name?.[0] ?? '?'}
        </Avatar>
      )}
      <Stack alignItems={isMe ? 'flex-end' : 'flex-start'} maxWidth="70%">
        {!isMe && member && (
          <Typography variant="caption" color="text.secondary" mb={0.25}>
            {member.name}
          </Typography>
        )}
        <Box
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            bgcolor: isMe ? 'primary.main' : 'grey.100',
            color: isMe ? 'primary.contrastText' : 'text.primary',
          }}
        >
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {message.content}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.disabled" mt={0.25}>
          {new Date(message.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Stack>
    </Stack>
  )
}

function TripChatPanelSkeleton({ onClose }: { onClose: () => void }) {
  return (
    <Stack height="100%">
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        px={2}
        py={1}
        borderBottom="1px solid"
        borderColor="divider"
        flexShrink={0}
      >
        <Typography variant="subtitle1" fontWeight={600}>채팅</Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
      <Stack flex={1} p={2} gap={1.5}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" height={40} width={`${60 + i * 10}%`} />
        ))}
      </Stack>
    </Stack>
  )
}
