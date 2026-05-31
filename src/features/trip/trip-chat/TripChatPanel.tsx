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
import { Suspense, useEffect, useRef } from 'react'
import { useAuth } from '~features/auth/useAuth'
import { useVariation } from '~shared/hooks/extends/useVariation'
import type { TripMember } from '../trip-member/tripMember.types'
import type { ChatMessage } from './tripChat.types'
import { useTripChat } from './useTripChat'
import { markAsRead } from './useUnreadChatCount'

interface Props {
  tripId: string
  isOpen: boolean
  onClose: () => void
}

export function TripChatPanel(props: Props) {
  return (
    <Suspense fallback={<TripChatPanelSkeleton onClose={props.onClose} />}>
      <Resolved {...props} />
    </Suspense>
  )
}

function Resolved({ tripId, onClose }: Props) {
  const { data: messages, send: sendMessage } = useTripChat(tripId, {
    onLoad: (messages) => {
      const last = messages[messages.length - 1]
      markAsRead(tripId, last?.createdAt)
    }
  })

  const bottomRef = useRef<HTMLDivElement>(null);
  const [getIsMounted, setIsMounted] = useVariation(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: getIsMounted() ? 'smooth' : 'instant'
    })
    setIsMounted(true);
  }, [messages.length])

  const inputRef = useRef<HTMLInputElement>(null);
  const handleSendMessage = () => {
    if (!inputRef.current?.value.trim()) return;

    sendMessage(inputRef.current.value.trim());
    inputRef.current.value = '';
  }

  const { data: currentUser } = useAuth();

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
          <MessageCard
            key={msg.id}
            message={msg}
            isMe={msg.userId === currentUser.id}
            member={msg.user}
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
            ref={inputRef}
            multiline
            maxRows={4}
            placeholder="메시지를 입력하세요"
            onKeyDown={(event) => {
              if (isSendSignal(event) && !sendMessage.isPending) {
                event.preventDefault()
                handleSendMessage()
              }
            }}
            sx={{ flex: 1, bgcolor: 'grey.100', borderRadius: 2, px: 1.5, py: 1 }}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={sendMessage.isPending}
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Paper>
    </Stack>
  )
}

interface MessageCardProps {
  message: ChatMessage
  isMe: boolean
  member?: TripMember
}

function MessageCard({ message, isMe, member }: MessageCardProps) {
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

function isSendSignal(event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
  return event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing;
}