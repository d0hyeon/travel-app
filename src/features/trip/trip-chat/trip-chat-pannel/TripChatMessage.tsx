import { useAuth } from "~features/auth/useAuth"
import type { ChatMessage } from "../tripChat.types"
import { Avatar, Box, Stack, Typography } from "@mui/material";

interface Props {
  message: ChatMessage
}

export function TripChatMessage({ message }: Props) {
  const { data: { id } } = useAuth();
  const isMe = message.userId === id;

  return (
    <Stack direction={isMe ? 'row-reverse' : 'row'} alignItems="flex-end" gap={1}>
      {!isMe && (
        <Avatar
          src={message.profile?.profileUrl ?? undefined}
          sx={{ width: 28, height: 28, fontSize: 12 }}
        >
          {message.profile?.name?.[0] ?? '?'}
        </Avatar>
      )}
      <Stack alignItems={isMe ? 'flex-end' : 'flex-start'} maxWidth="70%">
        {!isMe && message.profile && (
          <Typography variant="caption" color="text.secondary" mb={0.25}>
            {message.profile.name}
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
