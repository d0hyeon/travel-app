import { Avatar, Box, Button, Stack, Typography } from '@mui/material'
import { getAuth } from '~features/auth/useAuth'
import { useUserProfile } from './useUserProfile'

interface Props {
  userId: string
}

export function ProfileHeader({ userId }: Props) {
  const { data: profile } = useUserProfile(userId)
  const auth = getAuth()
  const isOwn = auth?.id === userId

  if (!profile) {
    return (
      <Box px={2} py={2}>
        <Typography variant="body2" color="text.secondary">
          존재하지 않는 사용자에요
        </Typography>
      </Box>
    )
  }

  return (
    <Box px={2} pt={2} pb={1.5}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Avatar
          src={profile.profileUrl ?? undefined}
          sx={{
            width: 72,
            height: 72,
            fontSize: 26,
            fontWeight: 600,
            color: '#fff',
            background: 'linear-gradient(135deg, #A8C4FF, #6E8FE3)',
          }}
        >
          {profile.name?.[0] ?? '?'}
        </Avatar>
        <Typography
          sx={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '-0.4px',
            color: '#111',
          }}
        >
          {profile.name}
        </Typography>
      </Stack>

      {/* {isOwn && (
        <Button
          variant="contained"
          fullWidth
          disableElevation
          sx={{
            mt: 1.75,
            height: 36,
            borderRadius: '10px',
            bgcolor: '#f5f5f7',
            color: '#111',
            fontSize: 13.5,
            fontWeight: 600,
            '&:hover': { bgcolor: '#ebebef' },
          }}
        >
          프로필 편집
        </Button>
      )} */}
    </Box>
  )
}
