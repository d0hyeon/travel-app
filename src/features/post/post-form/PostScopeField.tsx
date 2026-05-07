import Check from '@mui/icons-material/Check'
import SearchIcon from '@mui/icons-material/Search'
import {
  InputAdornment,
  Stack,
  TextField
} from '@mui/material'
import { useEffect, useState } from 'react'
import { usePlaceSearchBottomSheet } from '~features/place/place-search/usePlaceSearchBottomSheet'
import { usePlaceSearchDialog } from '~features/place/place-search/usePlaceSearchDialog'
import { useTripPlaces } from '~features/trip/trip-place/useTripPlaces'
import { ListItem } from '~shared/components/ListItem'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import type { PostScope } from '../post.types'


interface Props {
  tripId: string
  defaultValue?: PostScope;
  onChange?: (value: PostScope | null) => void
}

export function PostScopeField({ tripId, defaultValue, onChange }: Props) {
  const [value, setValue] = useState<PostScope | null>(defaultValue || null);
  const { data: places } = useTripPlaces(tripId);
  const isMobile = useIsMobile()
  const { searchPlace: searchPlaceDialog } = usePlaceSearchDialog()
  const { searchPlace: searchPlaceBottomSheet } = usePlaceSearchBottomSheet()

  const searchPlace = isMobile ? searchPlaceBottomSheet : searchPlaceDialog

  const handleCustomLocation = async () => {
    const result = await searchPlace()
    if (!result) return

    setValue({ kind: 'LOCATION', locationId: result.name })
  }

  useEffect(() => {
    onChange?.(value);
  }, [value])

  return (
    <Stack spacing={2} py={1}>

      <TextField
        slotProps={{
          input: { endAdornment: <InputAdornment position="end"><SearchIcon /></InputAdornment> }
        }}
        value={value?.kind === 'LOCATION' ? value.locationId : ''}
        onClick={handleCustomLocation}
        size="small"
      />



      <ListItem.Button
        rightAddon={value == null ? <Check color="primary" fontSize='small' /> : undefined}
        onClick={() => setValue(null)}
      >
        <ListItem.Title>선택안함</ListItem.Title>

      </ListItem.Button>
      {places.map((place) => (
        <ListItem.Button
          rightAddon={value?.kind === 'PLACE' && value.placeId === place.id
            ? <Check color="primary" fontSize='small' />
            : undefined
          }
          onClick={() => setValue({ kind: 'PLACE', placeId: place.id })}
        >
          <ListItem.Title>{place.name}</ListItem.Title>
          <ListItem.Text>{place.address}</ListItem.Text>
        </ListItem.Button>
      ))}


    </Stack>
  )
}
