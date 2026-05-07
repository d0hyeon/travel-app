import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { useMemo, useState, useTransition, type ReactNode } from 'react'
import { useTripPlaces } from '~features/trip/trip-place/useTripPlaces'
import { BottomSheet } from '~shared/components/bottom-sheet/BottomSheet'
import { BottomArea } from '~shared/components/BottomArea'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useOverlay } from '~shared/hooks/useOverlay'
import { PostVisibility, type PostScope } from '../post.types'
import { suggestScope } from '../post.utils'
import { PostDescriptionField } from './PostDescriptionField'
import { PostScopeField } from './PostScopeField'
import { PostVisibilityField } from './PostVisibilityField'
import type { DraftPostPhoto } from './postDraftPhoto'

import { Swiper, SwiperSlide } from 'swiper/react'

// @ts-ignore
import 'swiper/css'

export interface MetaStepValue {
  description: string
  scope: PostScope | null
  visibility: PostVisibility
}

interface Props {
  tripId: string
  selectedPhotos: DraftPostPhoto[]
  onNext: (value: MetaStepValue) => void
}

export function MetaStep({ tripId, selectedPhotos, onNext }: Props) {
  const { data: places } = useTripPlaces(tripId);

  const [description, setDescription] = useState('')
  const [scope, setScope] = useState<PostScope | null>(() => suggestScope(selectedPhotos))
  const [visibility, setVisibility] = useState<PostVisibility>(PostVisibility.PRIVATE)

  const placeNameById = useMemo(
    () => new Map(places.map((place) => [place.id, place.name])),
    [places],
  )

  const scopeLabel = scope == null
    ? '선택 안 함'
    : scope.kind === 'PLACE'
      ? (placeNameById.get(scope.placeId) ?? '선택한 장소')
      : scope.locationId




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
          <OverlayField label="위치" value={scopeLabel}>
            <PostScopeField tripId={tripId} defaultValue={scope ?? undefined} onChange={setScope} />
          </OverlayField>
          <OverlayField label="공개 범위" value={VISIBILITY_LABEL[visibility]} >
            <PostVisibilityField defaultValue={visibility} onChange={setVisibility} hasTripContext={tripId != null} />
          </OverlayField>
        </Stack>
      </Box>

      <BottomArea>
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={() => {
            onNext({
              description: description.trim(),
              scope,
              visibility,
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
