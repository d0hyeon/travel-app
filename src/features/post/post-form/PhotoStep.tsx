import CheckIcon from '@mui/icons-material/TaskAlt'
import { Box, Button, ImageList, Typography } from '@mui/material'
import { useState } from 'react'
import { useTripPhotos } from '~features/trip/trip-photo/useTripPhotos'
import { BottomArea } from '~shared/components/BottomArea'
import { PhotoThunbnail } from '~shared/components/photo/PhotoThumbnail'
import { PhotoUploader, type PhotoUploadValue } from '~shared/components/photo/PhotoUploader'

interface Props {
  tripId: string
  defaultValue: string[]
  onNext: (photoIds: string[]) => void
}

export function PhotoStep({ tripId, defaultValue, onNext }: Props) {
  const { data: photos, upload } = useTripPhotos(tripId)
  const [selectedIds, setSelectedIds] = useState<string[]>(defaultValue)

  const toggle = (id: string) => {
    setSelectedIds((curr) =>
      curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id],
    )
  }

  const handleUpload = async ({ items }: PhotoUploadValue) => {
    if (!items?.length) return
    const uploaded = await upload({ items })
    setSelectedIds((curr) => [...curr, ...uploaded.map((p) => p.id)])
  }

  return (
    <>
      <Box px={2} pb={`${BOTTOM_AREA_HEIGHT + 16}px`}>
        <Typography variant="body2" color="text.secondary" mb={1}>
          포스트에 담을 사진을 선택하거나 새로 올려주세요
        </Typography>
        <ImageList cols={3}>
          <PhotoUploader onUpload={handleUpload} multiple width="100%" />
          {photos.map((photo) => {
            const isSelected = selectedIds.includes(photo.id)
            return (
              <Box
                key={photo.id}
                position="relative"
                onClick={() => toggle(photo.id)}
                sx={{ cursor: 'pointer' }}
              >
                {isSelected && (
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
                    sx={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', borderRadius: 1 }}
                  >
                    <CheckIcon sx={{ color: '#fff' }} />
                  </Box>
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
          onClick={() => onNext(selectedIds)}
        >
          다음 ({selectedIds.length}장)
        </Button>
      </BottomArea>
    </>
  )
}

const BOTTOM_AREA_HEIGHT = 64
