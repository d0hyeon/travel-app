import SendIcon from '@mui/icons-material/Send'
import {
  Box,
  IconButton,
  InputBase,
  Paper,
  Skeleton,
  Stack,
  Typography,
  type StackProps
} from '@mui/material'
import { Suspense, useRef, type ReactNode } from 'react'

import { useForm } from 'react-hook-form'
import { useChatActivation } from '~features/trip/trip-chat/notification/useChatActivation'
import { ResizeObserverArea } from '~shared/components/ResizeObserverArea'
import { useIsMounted } from '~shared/hooks/useIsMounted'
import { ChatPushNoticeCard } from '../ChatPushNoticeCard'
import { useTripChatMessages } from '../useTripChatMessages'
import { markAsRead } from '../useUnreadChatCount'
import { TripChatMessage } from './TripChatMessage'

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
  const isMounted = useIsMounted();
  const form = useForm<{ content: string }>();
  const formRef = useRef<HTMLFormElement>(null);

  useChatActivation(tripId);

  return (
    <>
      <Suspense>
        <ChatPushNoticeCard margin={2} />
      </Suspense>
      <Box flex={1} overflow="auto">
        <ScrollIntoView block="end" behavior={isMounted ? 'smooth' : 'instant'}>
          <Stack gap={1.5} padding={2}>
            {messages.map((msg) => (
              <TripChatMessage key={msg.id} message={msg} />
            ))}
            {messages.length === 0 && (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                첫 메시지를 보내보세요!
              </Typography>
            )}
          </Stack>
        </ScrollIntoView>
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
            disabled={sendMessage.isPending}
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Paper>
    </>
  )
}

interface ScrollIntiViewProps extends ScrollIntoViewOptions {
  children?: ReactNode;
  enabled?: boolean;
}

function ScrollIntoView({ children, enabled, ...options }: ScrollIntiViewProps) {
  return (
    <ResizeObserverArea
      onResize={(entry) => {
        entry.target.scrollIntoView(options)
      }}
      enabled={enabled}
    >
      {children}
    </ResizeObserverArea>
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
