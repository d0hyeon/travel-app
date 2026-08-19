import SendIcon from '@mui/icons-material/Send'
import {
  Box,
  Collapse,
  IconButton,
  InputBase,
  Paper,
  Skeleton,
  Stack,
  Typography,
  type StackProps
} from '@mui/material'
import { Suspense, useCallback, useRef, type ReactNode } from 'react'

import { useForm } from 'react-hook-form'
import { useChatActivation } from '~features/trip/trip-chat/notification/useChatActivation'
import { ChatPushNoticeCard } from '../ChatPushNoticeCard'
import { useTripChatMessages } from '../useTripChatMessages'
import { markAsRead } from '../useUnreadChatCount'
import { TripChatMessage } from './TripChatMessage'
import { useWebPushSubscription } from '~features/auth/useWebPushSubscription'
import { arrayIncludes } from '@waylog/domains/utils'
import { TransitionGroup } from 'react-transition-group';

interface Props {
  tripId: string;
  header?: ReactNode;
}

export function TripChatPanel(props: Props) {
  return (
    <Stack height="100%">
      {props.header}
      <Suspense fallback={<Pending />}>
        <Resolved {...props} />
      </Suspense>
    </Stack>
  )
}

interface HeaderProps extends StackProps {
  rightElement?: ReactNode;
}
TripChatPanel.Header = ({
  rightElement,
  children = <Typography variant="subtitle1" fontWeight={600}>채팅</Typography>,
  ...props
}: HeaderProps) => {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      px={2}
      py={1}
      borderBottom="1px solid"
      borderColor="divider"
      flexShrink={0}
      {...props}
    >
      {children}
      {rightElement}
    </Stack>
  )
}

function Resolved({ tripId }: Props) {
  const { data: messages, send: sendMessage } = useTripChatMessages(tripId, {
    onLoad: (messages) => {
      const last = messages[messages.length - 1]
      markAsRead(tripId, last?.createdAt)
    }
  })
  const form = useForm<{ content: string }>();
  const formRef = useRef<HTMLFormElement>(null);

  useChatActivation(tripId);

  return (
    <Box flex={1} minHeight={0} display="flex" flexDirection="column">
      <Suspense>
        <ChatPushNoticeCard margin={2} flex={0} />
      </Suspense>
      <Box flex={1} overflow="auto" display="flex" flexDirection="column-reverse">
        <Stack padding={2}>
          <TransitionGroup style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((msg) => (
              <Collapse key={msg.id}>
                <TripChatMessage message={msg} />
              </Collapse>
            ))}
          </TransitionGroup>

          {messages.length === 0 && (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
              첫 메시지를 보내보세요!
            </Typography>
          )}
        </Stack>
      </Box>

      <Paper elevation={2} sx={{ p: 1.5, paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)', borderRadius: 0, flexShrink: 0 }}>
        <Stack
          ref={formRef}
          component="form"
          direction="row"
          alignItems="flex-end"
          gap={1}
          onSubmit={form.handleSubmit(({ content }) => {
            sendMessage(content)
            form.reset();
          })}
        >
          <InputBase
            multiline
            maxRows={4}
            placeholder="메시지를 입력하세요"
            sx={{ flex: 1, bgcolor: 'grey.100', borderRadius: 2, px: 1.5, py: 1 }}
            onKeyDown={(e) => {
              if (e.metaKey && e.key === 'Enter') {
                formRef.current?.requestSubmit();
              }
            }}
            {...form.register('content', { required: true, validate: (value) => value.trim() !== '' })}
          />
          <IconButton
            color="primary"
            type="submit"
            aria-label="메시지 전송"
            disabled={sendMessage.isPending}
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Paper>
    </Box>
  )
}


function Pending() {
  return (
    <Stack flex={1} p={2} gap={1.5}>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} variant="rounded" height={40} width={`${60 + i * 10}%`} />
      ))}
    </Stack>
  )
}

const COMMANDS = ['알람끄기', '알람켜기'] as const;