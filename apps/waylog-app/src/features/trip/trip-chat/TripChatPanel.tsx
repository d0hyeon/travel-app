import { MaterialIcons } from '@expo/vector-icons'
import { useTripChatMessages, markAsRead, useChatActivation } from '@waylog/domains/trip-chat'
import { Suspense, useRef, useState, type ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { IconButton, Skeleton, Stack, Typography } from '../../../shared/components/mui'
import { palette, radius } from '../../../shared/config/tokens'
import { TripChatMessage } from './TripChatMessage'

interface Props {
  tripId: string
  header?: ReactNode
}

export function TripChatPanel({ tripId, header }: Props) {
  return (
    <Stack sx={{ flex: 1 }}>
      {header}
      <Suspense fallback={<Pending />}>
        <Resolved tripId={tripId} />
      </Suspense>
    </Stack>
  )
}

interface HeaderProps {
  rightElement?: ReactNode
  children?: ReactNode
}

TripChatPanel.Header = function Header({ rightElement, children }: HeaderProps) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: palette.divider,
      }}
    >
      {children ?? <Typography variant="subtitle1">채팅</Typography>}
      {rightElement}
    </Stack>
  )
}

function Resolved({ tripId }: Props) {
  const { data: messages, send: sendMessage } = useTripChatMessages(tripId, {
    onLoad: (messages) => {
      const last = messages[messages.length - 1]
      markAsRead(tripId, last?.createdAt)
    },
  })
  const [content, setContent] = useState('')
  const scrollRef = useRef<ScrollView>(null)
  const insets = useSafeAreaInsets()

  // 웹과 동일하게 열려 있는 방을 기록한다. 푸시가 붙을 때 중복 알림을 막는다.
  useChatActivation(tripId)

  const submit = () => {
    const trimmed = content.trim()
    if (trimmed === '' || sendMessage.isPending) return

    void sendMessage(trimmed)
    setContent('')
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.map((message) => (
          <TripChatMessage key={message.id} message={message} />
        ))}

        {messages.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            sx={{ paddingVertical: 32 }}
          >
            첫 메시지를 보내보세요!
          </Typography>
        )}
      </ScrollView>

      <Stack
        direction="row"
        alignItems="flex-end"
        gap={1}
        sx={{
          padding: 12,
          paddingBottom: insets.bottom + 12,
          borderTopWidth: 1,
          borderTopColor: palette.divider,
          backgroundColor: palette.background,
        }}
      >
        <TextInput
          multiline
          value={content}
          onChangeText={setContent}
          placeholder="메시지를 입력하세요"
          placeholderTextColor={palette.textSecondary}
          style={{
            flex: 1,
            maxHeight: 96,
            backgroundColor: 'rgba(0,0,0,0.06)',
            borderRadius: radius.xl,
            paddingHorizontal: 12,
            paddingVertical: 8,
            fontSize: 14,
            color: palette.text,
          }}
        />
        <IconButton onClick={submit} disabled={sendMessage.isPending}>
          <MaterialIcons
            name="send"
            size={20}
            color={sendMessage.isPending ? palette.textSecondary : palette.primary}
          />
        </IconButton>
      </Stack>
    </KeyboardAvoidingView>
  )
}

function Pending() {
  return (
    <Stack sx={{ flex: 1, padding: 16, gap: 12 }}>
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} variant="rounded" height={40} width={`${60 + index * 10}%`} />
      ))}
    </Stack>
  )
}
