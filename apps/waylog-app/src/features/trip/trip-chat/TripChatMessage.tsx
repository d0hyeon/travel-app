import { useAuth } from '@waylog/domains/auth'
import type { ChatMessage } from '@waylog/domains/modules/trip-chat'
import { Avatar, Box, Stack, Typography } from '../../../shared/components/mui'
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
          sx={{ width: 28, height: 28, fontSize: 12 }}
        >
          {message.profile?.name?.[0] ?? '?'}
        </Avatar>
      )}
      <Stack sx={{ alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
        {!isMe && message.profile && (
          <Typography variant="caption" color="text.secondary" sx={{ marginBottom: 2 }}>
            {message.profile.name}
          </Typography>
        )}
        <Box
          sx={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 16,
            borderBottomRightRadius: isMe ? 4 : 16,
            borderBottomLeftRadius: isMe ? 16 : 4,
            backgroundColor: isMe ? palette.primary : 'rgba(0,0,0,0.06)',
          }}
        >
          <Typography variant="body2" sx={{ color: isMe ? '#fff' : palette.text }}>
            {renderTextWithLinks(message.content)}
          </Typography>
        </Box>
        {externalLinks.length > 0 && (
          <Box sx={{ width: '100%', marginTop: 8 }}>
            <OgPreviewCard url={externalLinks[0]} />
          </Box>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ marginTop: 2 }}>
          {new Date(message.createdAt).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Typography>
      </Stack>
    </Stack>
  )
}
