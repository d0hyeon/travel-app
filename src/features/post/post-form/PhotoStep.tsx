import CheckIcon from '@mui/icons-material/TaskAlt'
import { Box, Button, ImageList, type BoxProps } from '@mui/material'
import { useState } from 'react'
import { useTripPhotos } from '~features/trip/trip-photo/useTripPhotos'
import { BottomArea } from '~shared/components/BottomArea'
import { PhotoThunbnail } from '~shared/components/photo/PhotoThumbnail'
import { PhotoUploader } from '~shared/components/photo/PhotoUploader'
import type { DraftPostPhoto } from './postDraftPhoto'
import { useLocalPhotoStore } from './useLocalPhotoStore'
import { Swiper, SwiperSlide } from 'swiper/react'

// @ts-ignore
import 'swiper/css'

interface Props {
  tripId: string
  defaultValue: DraftPostPhoto[]
  onNext: (photos: DraftPostPhoto[]) => void
}

export function PhotoStep({ tripId, defaultValue, onNext }: Props) {
  const { data: photos } = useTripPhotos(tripId);
  const { data: localPhotos, save } = useLocalPhotoStore();
  const [selectedIds, setSelectedIds] = useState<string[]>(defaultValue.map((photo) => photo.id))


  const allPhotos: DraftPostPhoto[] = [
    ...localPhotos,
    ...photos.map((photo) => ({ ...photo, source: 'saved' as const })),
  ]

  const toggle = (id: string) => {
    setSelectedIds((curr) =>
      curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id],
    )
  }

  return (
    <>
      <Box marginTop={2} px={2} pb={`${BOTTOM_AREA_HEIGHT + 16}px`}>
        <Box marginBottom={2} border={theme => `1px dashed ${theme.palette.divider}`} sx={{ aspectRatio: '1 / 1' }}>
          <Swiper>
            {selectedIds.map(id => {
              const photo = allPhotos.find(photo => photo.id === id);

              return (
                <SwiperSlide key={photo!.id} >
                  <Box overflow="hidden" sx={{ aspectRatio: '1 / 1' }}>
                    <img src={photo!.url} />
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
            }}
          />
          {localPhotos.map(photo => {
            const isSelected = selectedIds.includes(photo.id);

            return (
              <Box
                key={photo.id}
                position="relative"
                onClick={() => toggle(photo.id)}
                sx={{ cursor: 'pointer' }}
              >
                {isSelected && (
                  <Overlay>
                    <CheckIcon sx={{ color: '#fff' }} />
                  </Overlay>
                )}
                <PhotoThunbnail src={photo.url} />
              </Box>
            )
          })}
          {photos.map((photo) => {
            const isSelected = selectedIds.includes(photo.id);

            return (
              <Box
                key={photo.id}
                position="relative"
                onClick={() => toggle(photo.id)}
                sx={{ cursor: 'pointer' }}
              >
                {isSelected && (
                  <Overlay>
                    <CheckIcon sx={{ color: '#fff' }} />
                  </Overlay>
                )}
                <PhotoThunbnail src={photo.url} />
              </Box>
            )
          })}

        </ImageList>
      </Box>

      <BottomArea>
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
