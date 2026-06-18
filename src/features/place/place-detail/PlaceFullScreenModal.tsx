import CloseIcon from '@mui/icons-material/Close'
import { Box, IconButton, Skeleton, Stack, Tab, Tabs, Typography } from '@mui/material'
import { Suspense, useState } from 'react'
import { FullScreenPopup } from '~shared/components/FullScreenPopup'
import { SwitchCase } from '~shared/components/SwitchCase'
import { PlaceDetailContent } from './PlaceDetailContent'
import { usePlace } from '../usePlace'


type ContentType = keyof typeof PlaceDetailContent;

interface Props {
  placeId: string
  isOpen: boolean;
  onClose: () => void;
}

export function PlaceFullScreenModal({ isOpen, placeId, onClose }: Props) {
  const [currentTab, setCurrentTab] = useState<ContentType>('Info');

  return (
    <FullScreenPopup isOpen={isOpen} onClose={onClose}>
      <Suspense fallback={<Header.Pending onClose={onClose} />}>
        <Header placeId={placeId} onClose={onClose} />
      </Suspense>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
        <Tabs
          value={currentTab}
          onChange={(_, value) => setCurrentTab(value)}
          variant="fullWidth"
        >
          <Tab label="기본정보" value="Info" />
          <Tab label="피드" value="Feed" />
        </Tabs>
      </Box>

      <Box flex={1} overflow="auto">
        <SwitchCase
          value={currentTab}
          cases={{
            Info: (
              <Box padding={2}>
                <PlaceDetailContent.Info placeId={placeId} />
              </Box>
            ),
            Feed: (
              <Suspense fallback={<PlaceDetailContent.Feed.Pending />}>
                <PlaceDetailContent.Feed placeId={placeId} />
              </Suspense>
            )
          }}
        />
      </Box>
    </FullScreenPopup>
  )
}

function Header({ placeId, onClose }: { placeId: string; onClose: () => void }) {
  const { data: { name } } = usePlace(placeId)

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ px: 1, height: 50, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}
    >
      <Box width={40} />
      <Typography variant="subtitle1" fontWeight={700} noWrap>
        {name}
      </Typography>
      <IconButton size="small" onClick={onClose}>
        <CloseIcon />
      </IconButton>
    </Stack>
  )
}

Header.Pending = ({ onClose }: { onClose: () => void }) => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    sx={{ px: 1, height: 50, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}
  >
    <Box width={40} />
    <Skeleton variant="text" width={120} />
    <IconButton size="small" onClick={onClose}>
      <CloseIcon />
    </IconButton>
  </Stack>
)
