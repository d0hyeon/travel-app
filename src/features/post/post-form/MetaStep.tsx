import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import { useState, type ReactNode } from 'react'
import { BottomSheet } from '~shared/components/bottom-sheet/BottomSheet'
import { BottomArea } from '~shared/components/BottomArea'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useOverlay } from '~shared/hooks/useOverlay'
import { PostVisibility } from '../post.types'
import { PostDescriptionField } from './PostDescriptionField'
import { PostPlacesField, type PostPlaceSelection } from './PostPlacesField'
import { PostVisibilityField } from './PostVisibilityField'
import type { DraftPostPhoto } from './postDraftPhoto'

import { Swiper, SwiperSlide } from 'swiper/react'

// @ts-ignore
import 'swiper/css'
import { useLoading } from '~shared/hooks/useLoading'

export interface MetaStepValue {
  description: string
  places: PostPlaceSelection[]
  visibility: PostVisibility
}

interface Props {
  tripId?: string | null
  selectedPhotos: DraftPostPhoto[]
  onNext: (value: MetaStepValue) => (void | Promise<void>)
}

export function MetaStep({ tripId, selectedPhotos, onNext }: Props) {
  const [description, setDescription] = useState('')
  const [places, setPlaces] = useState<PostPlaceSelection[]>([])
  const [visibility, setVisibility] = useState<PostVisibility>(PostVisibility.PRIVATE)

  const placesLabel = places.length === 0
    ? '선택 안 함'
    : places.length === 1
      ? places[0].name
      : `${places[0].name} 외 ${places.length - 1}`

  const [isPending, startTransition] = useLoading();

  return (
    <>
      <Box marginTop={2} px={2} pb={`${BOTTOM_AREA_HEIGHT + 16}px`}>
        <Swiper>
          {selectedPhotos.map(photo => (
            <SwiperSlide key={photo.id}>
              <Box sx={{ overflow: 'hidden', aspectRatio: '1 / 1' }}>
                <img src={photo.url} />
              </Box>
            </SwiperSlide>
          ))}
        </Swiper>
        <Stack spacing={1} marginTop={2}>
          <PostDescriptionField value={description} onChange={setDescription} />
          <OverlayField label="위치" value={placesLabel}>
            <PostPlacesField tripId={tripId} defaultValue={places} onChange={setPlaces} />
          </OverlayField>
          <OverlayField label="공개 범위" value={VISIBILITY_LABEL[visibility]} >
            <PostVisibilityField defaultValue={visibility} onChange={setVisibility} hasTripContext={tripId != null} />
          </OverlayField>
        </Stack>
      </Box>

      <BottomArea sx={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <Button
          variant="contained"
          fullWidth
          size="large"
          loading={isPending}
          disabled={isPending}
          loadingIndicator={<CircularProgress />}
          loadingPosition="start"
          onClick={() => {
            startTransition(async () => {
              await onNext({
                description: description.trim(),
                places,
                visibility,
              })
            })

          }}
        >
          확인
        </Button>
      </BottomArea>
    </>
  )
}

const BOTTOM_AREA_HEIGHT = 64

const VISIBILITY_LABEL: Record<PostVisibility, string> = {
  [PostVisibility.PRIVATE]: '나만 보기',
  [PostVisibility.MEMBERS]: '여행 멤버',
  [PostVisibility.PUBLIC]: '전체 공개',
}

type OverlayFieldProps = {
  label: string;
  value: string;
  children: ReactNode;
}
function OverlayField({ label, value, children }: OverlayFieldProps) {
  const overlay = useOverlay();
  const isMobile = useIsMobile();

  const handleClick = () => {
    overlay.open(({ isOpen, close }) => {
      if (isMobile) {
        return (
          <BottomSheet isOpen={isOpen} onClose={close}>
            <BottomSheet.Header>{label}</BottomSheet.Header>
            <BottomSheet.Body>
              {children}
            </BottomSheet.Body>
            <BottomSheet.BottomActions>
              <Button variant="contained" onClick={close} fullWidth>확인</Button>
            </BottomSheet.BottomActions>
          </BottomSheet>
        )
      }
      return (
        <Dialog open={isOpen} onClose={close} fullWidth maxWidth="sm">
          <DialogTitle>{label}</DialogTitle>
          <DialogContent>
            {children}
          </DialogContent>
          <DialogActions>
            <Button variant="contained" onClick={close}>확인</Button>
          </DialogActions>
        </Dialog>
      )
    })
  }

  return (
    <Stack direction="row" component="button" alignItems="center" justifyContent="space-between" onClick={handleClick}>
      <Typography variant="subtitle2">{label}</Typography>
      <Stack direction="row" alignItems="center" gap={0.5}>
        <Typography variant="caption" color="text.secondary">{value}</Typography>
        <ChevronRightIcon color="action" />
      </Stack>
    </Stack>

  )
}
