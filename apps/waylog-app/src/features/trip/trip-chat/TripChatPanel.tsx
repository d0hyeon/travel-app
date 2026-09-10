import { MaterialIcons } from '@expo/vector-icons'
import { useTripChatMessages, markAsRead, useChatActivation } from '@waylog/domains/modules/trip-chat'
import { Suspense, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import type { ChatMessage } from '@waylog/domains/modules/trip-chat'
import { StyleSheet, KeyboardAvoidingView, Platform, TextInput, View } from 'react-native'
import Animated, { FadeInDown, LinearTransition, ReduceMotion } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { IconButton, Skeleton, Stack, Typography } from '~/shared/components/design-system'
import { palette, radius } from '../../../shared/config/tokens'
import { ChatPushNoticeCard } from './ChatPushNoticeCard'
import { TripChatMessage } from './TripChatMessage'
import { useKeyboardMetrics } from '../../../shared/hooks/env/useKeyboardMetrics'

interface Props {
  tripId: string
  header?: ReactNode
}

export function TripChatPanel({ tripId, header }: Props) {
  return (
    <Stack style={styles.container}>
      {header}
      <Suspense fallback={<Pending />}>
        <Resolved key={tripId} tripId={tripId} />
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
      style={styles.header}
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
  const [messageEntry, setMessageEntry] = useState(() => ({
    messages,
    pendingIds: new Set<string>(),
  }))
  if (messageEntry.messages !== messages) {
    // 끝에 추가된 메시지만 진입시킨다. 전송 성공 시 ID 교체는 제외한다.
    setMessageEntry({
      messages,
      pendingIds: new Set(messages.slice(messageEntry.messages.length).map((message) => message.id)),
    })
  }
  const insets = useSafeAreaInsets();
  const { metrics: keyboard } = useKeyboardMetrics();
  const bottomInset = keyboard == null ? insets.bottom : keyboard.height;

  // 최신 메시지가 아래에 오도록 뒤집어 그린다. inverted 는 스크롤 위치를
  // 아래에서 시작시키므로 목록을 끝으로 밀어 주는 별도 처리가 필요 없다.
  const reversedMessages = useMemo(() => [...messages].reverse(), [messages])

  // 웹과 동일하게 열려 있는 방을 기록한다. 푸시가 붙을 때 중복 알림을 막는다.
  useChatActivation(tripId)

  const submit = () => {
    const trimmed = content.trim()
    if (trimmed === '' || sendMessage.isPending) return

    void sendMessage(trimmed)
    setContent('')
  }

  return (
    <View
      style={styles.container}

    >
      <Suspense>
        <ChatPushNoticeCard style={styles.pushNotice} />
      </Suspense>

      {/* 메시지가 수백 개가 되면 한 번에 그리는 비용이 커밋을 수백 ms 막는다.
          FlatList 는 보이는 만큼만 그려 그 비용을 화면 분량으로 묶는다. */}
      <Animated.FlatList
        inverted
        itemLayoutAnimation={messageLayoutTransition}
        data={reversedMessages}
        keyExtractor={(message) => message.id}
        renderItem={({ item }) => (
          <MessageEntry message={item} pendingIds={messageEntry.pendingIds} />
        )}
        contentContainerStyle={styles.messages}
        ListEmptyComponent={
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            style={styles.emptyMessage}
          >
            첫 메시지를 보내보세요!
          </Typography>
        }
      />

      <Stack
        direction="row"
        alignItems="flex-end"
        style={[styles.composer, { paddingBottom: bottomInset + 12 }]}
      >
        <TextInput
          multiline
          value={content}
          onChangeText={setContent}
          placeholder="메시지를 입력하세요"
          placeholderTextColor={palette.textSecondary}
          style={[styles.messageInput, { borderRadius: radius.xl }]}
        />
        <IconButton style={styles.messageSubmit} onPress={submit} disabled={sendMessage.isPending}>
          <MaterialIcons
            name="send"
            size={20}
            color={sendMessage.isPending ? palette.textSecondary : palette.primary}
          />
        </IconButton>
      </Stack>
    </View>
  )
}

const messageLayoutTransition = LinearTransition.duration(240).reduceMotion(ReduceMotion.System)

const messageEntering = FadeInDown.duration(240)
  .withInitialValues({ opacity: 0, transform: [{ translateY: 40 }] })
  .reduceMotion(ReduceMotion.System)

function MessageEntry({ message, pendingIds }: { message: ChatMessage; pendingIds: Set<string> }) {
  const [entering] = useState(() => pendingIds.has(message.id) ? messageEntering : undefined)

  useLayoutEffect(() => {
    // 가상화로 다시 마운트되는 행에는 진입 애니메이션을 반복하지 않는다.
    pendingIds.delete(message.id)
  }, [message.id, pendingIds])

  return (
    <Animated.View entering={entering}>
      <TripChatMessage message={message} />
    </Animated.View>
  )
}

function Pending() {
  return (
    <Stack style={styles.skeleton}>
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} variant="rounded" height={40} width={`${60 + index * 10}%`} />
      ))}
    </Stack>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: palette.divider },
  pushNotice: { margin: 16 },
  messages: { padding: 16, gap: 12, flexGrow: 1 },
  emptyMessage: { paddingVertical: 32 },
  composer: { padding: 12, paddingRight: 0, borderTopWidth: 1, borderTopColor: palette.divider, backgroundColor: palette.background },
  messageInput: { flex: 1, minHeight: 32, maxHeight: 96, backgroundColor: 'rgba(0,0,0,0.06)', paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: palette.text },
  messageSubmit: { width: 'auto', paddingLeft: 12, paddingRight: 20, flexShrink: 0 },
  skeleton: { flex: 1, padding: 16, gap: 12 },
})
