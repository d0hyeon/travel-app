import CheckIcon from '@mui/icons-material/TaskAlt'
import { Box, Button, ImageList, type BoxProps } from '@mui/material'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useTripPhotos } from '~features/trip/trip-photo/useTripPhotos'
import { BottomArea } from '~shared/components/BottomArea'
import { PhotoThunbnail } from '~shared/components/photo/PhotoThumbnail'
import { PhotoUploader } from '~shared/components/photo/PhotoUploader'
import type { DraftPostPhoto } from './postDraftPhoto'
import { useLocalPhotoStore } from './useLocalPhotoStore'
import { Swiper, type SwiperRef, SwiperSlide } from 'swiper/react'

// @ts-ignore
import 'swiper/css'

interface Props {
  tripId: string | null
  defaultValue: DraftPostPhoto[]
  onNext: (photos: DraftPostPhoto[]) => void
}

export function PhotoStep({ tripId, defaultValue, onNext }: Props) {
  const { data: localPhotos, save } = useLocalPhotoStore();
  const [selectedIds, setSelectedIds] = useState<string[]>(defaultValue.map((photo) => photo.id))
  const [savedPhotos, setSavedPhotos] = useState<DraftPostPhoto[]>([])

  const allPhotos: DraftPostPhoto[] = [...localPhotos, ...savedPhotos]

  const toggle = (id: string) => {
    setSelectedIds((curr) =>
      curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id],
    )
  }

  const swiperRef = useRef<SwiperRef>(null)

  return (
    <>
      <Box marginTop={2} px={2} pb={`${BOTTOM_AREA_HEIGHT + 16}px`}>
        <Box marginBottom={2} border={theme => `1px dashed ${theme.palette.divider}`} sx={{ aspectRatio: '1 / 1' }}>
          <Swiper ref={swiperRef}>
            {selectedIds.map(id => {
              const photo = allPhotos.find(photo => photo.id === id);
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
              const photos = await save(files)
              setSelectedIds((curr) => [...curr, ...photos.map((photo) => photo.id)])
              swiperRef.current?.swiper.slideTo(selectedIds.length + 1);
            }}
          />
          {localPhotos.map(photo => (
            <SelectablePhoto
              key={photo.id}
              src={photo.url}
              selected={selectedIds.includes(photo.id)}
              onClick={() => toggle(photo.id)}
            />
          ))}
          {tripId && (
            <Suspense fallback={null}>
              <TripSavedPhotos
                tripId={tripId}
                selectedIds={selectedIds}
                onToggle={toggle}
                onLoad={setSavedPhotos}
              />
            </Suspense>
          )}
        </ImageList>
      </Box>

      <BottomArea sx={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <Button
          variant="contained"
          fullWidth
          size="large"
          disabled={selectedIds.length === 0}
          onClick={() => onNext(allPhotos.filter((photo) => selectedIds.includes(photo.id)))}
        >
          다음 ({selectedIds.length}장)
        </Button>
      </BottomArea>
    </>
  )
}

function TripSavedPhotos({
  tripId,
  selectedIds,
  onToggle,
  onLoad,
}: {
  tripId: string
  selectedIds: string[]
  onToggle: (id: string) => void
  onLoad: (photos: DraftPostPhoto[]) => void
}) {
  const { data: photos } = useTripPhotos(tripId);
  useEffect(() => {
    onLoad(photos.map((photo) => ({ ...photo, source: 'saved' as const })))
  }, [photos])

  return (
    <>
      {photos.map((photo) => (
        <SelectablePhoto
          key={photo.id}
          src={photo.url}
          selected={selectedIds.includes(photo.id)}
          onClick={() => onToggle(photo.id)}
        />
      ))}
    </>
  )
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
