import CheckIcon from '@mui/icons-material/TaskAlt'
import { Box, Button, ImageList, type BoxProps } from '@mui/material'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Swiper, SwiperSlide, type SwiperRef } from 'swiper/react'
import { useTripPhotos } from '~features/trip/trip-photo/useTripPhotos'
import { BottomArea } from '~shared/components/BottomArea'
import { PhotoThunbnail } from '~shared/components/photo/PhotoThumbnail'
import { PhotoUploader } from '~shared/components/photo/PhotoUploader'
import type { DraftPostPhoto } from './postDraftPhoto'
import { useLocalPhotoStore } from './useLocalPhotoStore'
import type { Photo } from '~features/photo/photo.types'

// @ts-ignore
import 'swiper/css'

interface Props {
  tripId: string | null
  defaultValue: DraftPostPhoto[]
  onNext: (photos: DraftPostPhoto[]) => void
}

const DEFAULT_TRIP_PHOTOS: { data: Photo[] } = { data: [] };
export function PhotoStep({ tripId, defaultValue, onNext }: Props) {
  const { data: photos, add: addRecord } = useRecordPhotos(tripId ?? undefined)
  const [selectedIds, setSelectedIds] = useState<string[]>(defaultValue.map((photo) => photo.id))

  const photoById = useMemo(() => (
    Object.fromEntries(
      photos.map(photo => ([photo.id, photo]))
    )
  ), [photos])


  const focusAddedFile = () => {
    requestAnimationFrame(() => {
      swiperRef.current?.swiper.slideTo(selectedIds.length);
    })
  }

  const swiperRef = useRef<SwiperRef>(null)

  return (
    <>
      <Box marginTop={2} px={2} pb={`${BOTTOM_AREA_HEIGHT + 16}px`}>
        <Box marginBottom={2} border={theme => `1px dashed ${theme.palette.divider}`} sx={{ aspectRatio: '1 / 1' }}>
          <Swiper ref={swiperRef}>
            {selectedIds.map(id => {
              const photo = photos.find(photo => photo.id === id);
              if (!photo) return null

              return (
                <SwiperSlide key={photo.id} >
                  <Box overflow="hidden" sx={{ aspectRatio: '1 / 1' }}>
                    <img src={photo.url} />
                  </Box>
                </SwiperSlide>
              )
            })}
          </Swiper>
        </Box>
        <ImageList cols={3}>
          <PhotoUploader
            multiple
            width="100%"
            onUpload={async files => {
              const photos = await addRecord(files);
              setSelectedIds((curr) => [...curr, ...photos.map((photo) => photo.url)])
              focusAddedFile();
            }}
          />
          {photos.map(photo => {
            const isSelected = selectedIds.includes(photo.id);
            return (
              <SelectablePhoto
                key={photo.id}
                src={photo.url}
                selected={selectedIds.includes(photo.id)}
                onClick={() => {
                  setSelectedIds(isSelected
                    ? selectedIds.filter(id => id !== photo.id)
                    : [...selectedIds, photo.id]
                  )
                  if (!isSelected) focusAddedFile();
                }}
              />
            )
          })}
        </ImageList>
      </Box>

      <BottomArea sx={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <Button
          variant="contained"
          fullWidth
          size="large"
          disabled={selectedIds.length === 0}
          onClick={() => {
            const selected = selectedIds.map(id => photoById[id])
            onNext(selected)
          }}
        >
          다음 ({selectedIds.length}장)
        </Button>
      </BottomArea>
    </>
  )
}

function useRecordPhotos(tripId?: string) {
  const { data: localPhotos, save } = useLocalPhotoStore();
  const { data: tripPhotos } = tripId != null ? useTripPhotos(tripId) : DEFAULT_TRIP_PHOTOS;

  const data: DraftPostPhoto[] = [
    ...localPhotos.map(x => ({ ...x, source: 'local', placeId: null, id: x.url })) satisfies DraftPostPhoto[],
    ...tripPhotos.map(x => ({ ...x, source: 'saved' })) satisfies DraftPostPhoto[]
  ]

  return { data, add: save };
}



function SelectablePhoto({ src, selected, onClick }: { src: string; selected: boolean; onClick: () => void }) {
  return (
    <Box position="relative" onClick={onClick} sx={{ cursor: 'pointer' }}>
      {selected && (
        <Overlay>
          <CheckIcon sx={{ color: '#fff' }} />
        </Overlay>
      )}
      <PhotoThunbnail src={src} />
    </Box>
  )
}

function Overlay(props: BoxProps) {
  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      width="100%"
      height="100%"
      display="flex"
      alignItems="end"
      justifyContent="end"
      p={1}
      zIndex={5}
      bgcolor="rgba(0, 0, 0, 0.4)"
      borderRadius={1}
      {...props}
    />
  )
}

const BOTTOM_AREA_HEIGHT = 64
