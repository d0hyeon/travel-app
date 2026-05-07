import { Box, Chip, ImageList, ImageListItem, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { PhotoThunbnail } from '~shared/components/photo/PhotoThumbnail'
import { useUserPhotos } from './useUserPhotos'
import { useUserTrips } from './useUserTrips'

const ALL = 'all'

interface Props {
  userId: string
}

export function ProfileFeedTab({ userId }: Props) {
  const { data: photos } = useUserPhotos(userId)
  const { data: trips } = useUserTrips(userId)
  const navigate = useNavigate()

  const [filter, setFilter] = useState<string>(ALL)

  const visible = filter === ALL ? photos : photos.filter(p => p.tripId === filter)

  if (photos.length === 0) {
    return (
      <Stack alignItems="center" justifyContent="center" py={6}>
        <Typography variant="body2" color="text.secondary">
          아직 사진이 없어요
        </Typography>
      </Stack>
    )
  }

  return (
    <Box>
      <Box
        py={1.5}
        px={2}
        sx={{
          overflowX: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <Stack direction="row" gap={0.75} sx={{ width: 'max-content' }}>
          <FilterChip
            label="전체"
            active={filter === ALL}
            onClick={() => setFilter(ALL)}
          />
          {trips.map((trip) => (
            <FilterChip
              key={trip.id}
              label={trip.name}
              active={filter === trip.id}
              onClick={() => setFilter(trip.id)}
            />
          ))}
        </Stack>
      </Box>

      <ImageList cols={3} gap={2} sx={{ m: 0 }}>
        {visible.map((photo) => (
          <ImageListItem
            key={photo.id}
            sx={{ aspectRatio: '1 / 1', cursor: 'pointer' }}
            onClick={() => navigate(`/post/new?tripId=${photo.tripId}`)}
          >
            <PhotoThunbnail src={photo.url} />
          </ImageListItem>
        ))}
      </ImageList>
    </Box>
  )
}

interface FilterChipProps {
  label: string
  active: boolean
  onClick: () => void
}

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <Chip
      label={label}
      onClick={onClick}
      sx={{
        height: 30,
        px: 0.5,
        borderRadius: '15px',
        fontSize: 12.5,
        fontWeight: 600,
        bgcolor: active ? '#111' : '#fff',
        color: active ? '#fff' : '#6b6b73',
        border: active ? 'none' : '1px solid rgba(0,0,0,0.08)',
        '&:hover': { bgcolor: active ? '#111' : '#fafafa' },
        '& .MuiChip-label': { px: 1.5 },
      }}
    />
  )
}
