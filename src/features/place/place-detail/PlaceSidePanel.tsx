import CloseIcon from '@mui/icons-material/Close'
import {
  Box,
  CircularProgress,
  Drawer,
  IconButton,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography
} from '@mui/material'
import { Suspense, useState } from 'react'
import { usePlace } from '~features/place/usePlace'
import { SwitchCase } from '~shared/components/SwitchCase'
import { PlaceDetailContent } from './PlaceDetailContent'

interface Props {
  placeId: string;
  isOpen?: boolean
  onClose: () => void
}

export function PlaceSidePanel({ placeId, isOpen = true, onClose }: Props) {
  const [currentTab, changeTab] = useState<'basic' | 'feed'>('basic');

  return (
    <Drawer
      className="가나다"
      anchor="right"
      open={isOpen}
      onClose={onClose}
      hideBackdrop
      sx={theme => ({ zIndex: theme.zIndex.drawer })}
      PaperProps={{
        sx: {
          width: 480,
          maxWidth: 'calc(100vw - 72px)',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* 헤더: 고정 */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}
      >
        <Suspense fallback={<Skeleton variant="text" />}>
          <Typography variant="subtitle1" fontWeight={700} noWrap flex={1}>
            <PlaceName placeId={placeId} />
          </Typography>
        </Suspense>
        <IconButton size="small" onClick={onClose} sx={{ ml: 1 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* 탭: 고정 */}
      <Tabs
        variant="fullWidth"
        value={currentTab}
        onChange={(_, value) => changeTab(value)}
        sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}
      >
        <Tab label="기본정보" value="basic" />
        <Tab label="피드" value="feed" />
      </Tabs>

      {/* 콘텐츠: 스크롤 */}
      <Box flex={1} overflow="auto">
        <Suspense fallback={<Box display="flex" justifyContent="center" pt={4}><CircularProgress size={24} /></Box>}>
          <SwitchCase
            value={currentTab}
            cases={{
              basic: <PlaceDetailContent.Info placeId={placeId} />,
              feed: () => <PlaceDetailContent.Feed placeId={placeId} />,
            }}
          />
        </Suspense>
      </Box>
    </Drawer>
  )
}

function PlaceName(props: { placeId: string }) {
  const { data: { name } } = usePlace(props.placeId)

  return <>{name}</>
}