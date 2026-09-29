import { Avatar, Box, Button, Stack, TextField, Typography, type BoxProps } from '@mui/material'
import { useId, useRef, useState, useTransition, type ReactNode, type SubmitEvent } from 'react'
import { useAuth, } from '@waylog/domains/clients'
import { uploadUserAvatarImage } from '~features/photo/photo.api'
import { useUpdateUserProfile } from './useUpdateUserProfile'
import { BottomActions } from '~shared/components/bottom-sheet/compounds'
import { getWebViewBridge } from '~shared/bridge/bridgeClient'
import { toast } from 'sonner'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { useNavigate } from 'react-router'

const { isInWebView, client: bridgeClient } = getWebViewBridge()

export default function SettingsProfilePage() {
  const { data: auth } = useAuth()
  const updateUserProfile = useUpdateUserProfile(auth.id);

  const [nameInput, setNameInput] = useState(auth.profile.name)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(auth.profile.profileUrl)

  const name = nameInput.trim();
  const isInvalid = name === '' || name === auth.profile.name;

  const [isPending, startTransition] = useTransition();

  const handleUpload = (fileList: FileList) => {
    startTransition(async () => {
      const profileUrl = await uploadUserAvatarImage(auth.id, fileList[0])
      setAvatarPreviewUrl(profileUrl)
      await updateUserProfile({ profileUrl })
    })
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      await updateUserProfile({ name });
      toast.success('변경되었습니다.');
    })
  }

  const navigate = useNavigate();
  const navigateBack = () => {
    if (isInWebView) bridgeClient.closeWebView();
    else navigate(-1);
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <TopNavigation
        position="sticky"
        leftElement={<TopNavigation.BackButton onClick={navigateBack} />}
        sx={{ borderBottomWidth: 0 }}
      >
        내 정보 변경
      </TopNavigation>

      <Stack px={2} py={2} spacing={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <FileSelector onChange={handleUpload}>
            <Box position="relative">
              <Avatar
                src={avatarPreviewUrl?.replace('http', 'https') ?? undefined}
                sx={{ width: 72, height: 72, cursor: 'pointer', opacity: isPending ? 0.5 : 1 }}
              >

              </Avatar>
            </Box>
          </FileSelector>
          <TextField
            fullWidth
            label="이름"
            value={nameInput}
            onChange={(event) => setNameInput(event.target.value)}
          />
        </Stack>
      </Stack>
      <BottomActions position="fixed" bottom={0}>
        <Button type="submit" variant="contained" color="primary" size="large" disabled={isInvalid} loading={isPending} fullWidth>
          저장
        </Button>
      </BottomActions>
    </Box>
  )
}

interface FileSelectorProps {
  onChange?: (files: FileList) => void;
  children: ReactNode;
}

type Override<Base, Target> = Omit<Base, keyof Target> & Target;

function FileSelector({ children, onChange, ...boxProps }: Override<BoxProps, FileSelectorProps>) {
  const ref = useRef<HTMLInputElement>(null);
  const id = useId();

  return (
    <>
      <Box component="label" htmlFor={id} {...boxProps}>
        {children}
      </Box>
      <input
        ref={ref}
        id={id}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          if (event.target.files == null) return;
          onChange?.(event.target.files);
          if (ref.current) ref.current.value = '';
        }}
      />
    </>
  )
}