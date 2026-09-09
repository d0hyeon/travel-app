import { StyleSheet } from 'react-native'
import { useAuth } from '@waylog/domains/clients'
import type { ChatMessage } from '@waylog/domains/modules/trip-chat'
import type { TextStyle, ViewStyle } from 'react-native'
import { Avatar, Box, Stack, Typography } from '~/shared/components/design-system'
import { extractUrls, renderTextWithLinks } from '../../../shared/utils/urls'
import { OgPreviewCard } from '../../open-graph/OgPreviewCard'
import { palette } from '../../../shared/config/tokens'

interface Props {
  message: ChatMessage
}

export function TripChatMessage({ message }: Props) {
  const {
    data: { id },
  } = useAuth()
  const isMe = message.userId === id
  const externalLinks = extractUrls(message.content)

  return (
    <Stack
      direction={isMe ? 'row-reverse' : 'row'}
      alignItems="flex-end"
      gap={1}
    >
      {!isMe && (
        <Avatar
          src={message.profile?.profileUrl ?? undefined}
          style={styles.avatar}
        >
          {message.profile?.name?.[0] ?? '?'}
        </Avatar>
      )}
      <Stack style={[styles.messageContent, { alignItems: isMe ? 'flex-end' : 'flex-start' }]}>
        {!isMe && message.profile && (
          <Typography variant="caption" color="text.secondary" style={styles.senderName}>
            {message.profile.name}
          </Typography>
        )}
        <Box
          style={[styles.bubble, { borderBottomRightRadius: isMe ? 4 : 16, borderBottomLeftRadius: isMe ? 16 : 4, backgroundColor: isMe ? palette.primary : 'rgba(0,0,0,0.06)' }]}
        >
          <Typography variant="body2" style={{ color: isMe ? '#fff' : palette.text }}>
            {renderTextWithLinks(message.content)}
          </Typography>
        </Box>
        {externalLinks.length > 0 && (
          <Box style={styles.placePreview}>
            <OgPreviewCard url={externalLinks[0]} />
          </Box>
        )}
        <Typography variant="caption" color="text.secondary" style={styles.timestamp}>
          {new Date(message.createdAt).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Typography>
      </Stack>
    </Stack>
  )
}

const styles = StyleSheet.create({
  avatar: { width: 28, height: 28, fontSize: 12 },
  messageContent: { maxWidth: '70%' },
  senderName: { marginBottom: 2 },
  bubble: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  placePreview: { width: '100%', marginTop: 8 },
  timestamp: { marginTop: 2 },
})
