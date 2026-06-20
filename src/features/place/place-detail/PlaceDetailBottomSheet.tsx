import CloseIcon from '@mui/icons-material/Close'
import { Box, CircularProgress, IconButton, Skeleton, Tab, Tabs, Typography } from '@mui/material'
import { Suspense, useState } from 'react'
import { usePlace } from '~features/place/usePlace'
import { BottomSheet } from '~shared/components/bottom-sheet/BottomSheet'
import { SwitchCase } from '~shared/components/SwitchCase'
import { PlaceDetailContent } from './PlaceDetailContent'

interface Props {
  placeId: string
  isOpen: boolean
  onClose: () => void
}

export function PlaceDetailBottomSheet({ placeId, isOpen, onClose }: Props) {
  const [currentTab, changeTab] = useState<'basic' | 'feed'>('basic')

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[0.92]}
      sx={{ zIndex: theme => theme.zIndex.modal + 1 }}
    >
      <BottomSheet.Header
        rightElement={
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        <Suspense fallback={<Skeleton variant="text" width={120} />}>
          <Typography variant="subtitle1" fontWeight={700} noWrap>
            <PlaceName placeId={placeId} />
          </Typography>
        </Suspense>
      </BottomSheet.Header>

      <Tabs
        variant="fullWidth"
        value={currentTab}
        onChange={(_, value) => changeTab(value)}
        sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}
      >
        <Tab label="기본정보" value="basic" />
        <Tab label="피드" value="feed" />
      </Tabs>

      <BottomSheet.Body sx={{ px: 0 }}>
        <Suspense fallback={<Box display="flex" justifyContent="center" pt={4}><CircularProgress size={24} /></Box>}>
          <SwitchCase
            value={currentTab}
            cases={{
              basic: <Box py={2}><PlaceDetailContent.Info placeId={placeId} /></Box>,
              feed: () => <PlaceDetailContent.Feed placeId={placeId} />,
            }}
          />
        </Suspense>
      </BottomSheet.Body>
    </BottomSheet>
  )
}

function PlaceName({ placeId }: { placeId: string }) {
  const { data: { name } } = usePlace(placeId)

  return <>{name}</>
}
