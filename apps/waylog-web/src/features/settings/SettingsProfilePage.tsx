import { Avatar, Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useRef, useState } from 'react'
import { useAuth } from '@waylog/domains/clients'
import { uploadUserAvatarImage } from '~features/photo/photo.api'
import { useUpdateUserProfile } from './useUpdateUserProfile'

export default function SettingsProfilePage() {
  const { data: auth } = useAuth()
  const updateUserProfile = useUpdateUserProfile(auth.id)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(auth.profile.name)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(auth.profile.profileUrl)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setIsUploadingAvatar(true)
    try {
      const profileUrl = await uploadUserAvatarImage(auth.id, file)
      setAvatarPreviewUrl(profileUrl)
      await updateUserProfile({ profileUrl })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleNameBlur = async () => {
    const trimmedName = name.trim()
    if (!trimmedName || trimmedName === auth.profile.name) return
    await updateUserProfile({ name: trimmedName })
  }

  return (
    <Stack px={2} py={2} spacing={3}>
      <Typography variant="h6">내 정보 변경</Typography>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box position="relative">
          <Avatar
            src={avatarPreviewUrl ?? undefined}
            onClick={() => fileInputRef.current?.click()}
            sx={{ width: 72, height: 72, cursor: 'pointer', opacity: isUploadingAvatar ? 0.5 : 1 }}
          >
            {name?.[0] ?? '?'}
          </Avatar>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleAvatarChange}
          />
        </Box>
        <TextField
          fullWidth
          label="이름"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={handleNameBlur}
        />
      </Stack>
    </Stack>
  )
}
