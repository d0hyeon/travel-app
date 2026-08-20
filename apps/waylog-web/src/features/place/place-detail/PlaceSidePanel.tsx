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
import { Suspense, useEffect, useState } from 'react'
import { usePlace } from '@waylog/domains/place'
import { SwitchCase } from '~shared/components/SwitchCase'
import { PlaceDetailContent } from './PlaceDetailContent'
import { APP_ROOT_NODE_CLASS } from '~app/constants'

interface Props {
  placeId: string;
  isOpen?: boolean
  onClose: () => void
  /** 다른 오버레이 위에 띄울 때 z-index를 높인다 (미제공 시 drawer 기본값) */
  zIndex?: number
}

export function PlaceSidePanel({ placeId, isOpen: _isOpen = true, onClose, zIndex }: Props) {
  const [currentTab, changeTab] = useState<'basic' | 'feed'>('basic');
  const [isOpen, setIsOpen] = useState(_isOpen);

  const close = () => {
    setIsOpen(false);
    setTimeout(onClose, 300)
  }
  useEffect(() => setIsOpen(_isOpen), [_isOpen])


  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={close}
      hideBackdrop
      sx={theme => ({ zIndex: zIndex ?? theme.zIndex.drawer })}
      container={() => document.querySelector(`.${APP_ROOT_NODE_CLASS}`)}

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
        <IconButton size="small" onClick={close} sx={{ ml: 1 }}>
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