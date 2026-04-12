import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import { formatDate } from 'date-fns'
import { useEffect, useState } from 'react'
import { getCoordinateByLocation, isLocation, Locations } from '~features/location'
import { useIsMobile } from '~shared/hooks/useIsMobile'
import { DateRangePicker } from '../../../shared/components/date-range/DateRangePicker'
import { LocationGroup } from '../trip.constants'

type Destination = {
  name: string;
  lat: number;
  lng: number;
  group: string;
}

const DestinationOptions = Locations.map((location) => {
  const coordinate = getCoordinateByLocation(location)
  return {
    name: location,
    lat: coordinate.lat,
    lng: coordinate.lng,
    group: LocationGroup[location],
  }
})

interface TripFormData {
  name: string
  destinations: string[]
  lat: number
  lng: number
  startDate: string
  endDate: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (data: TripFormData) => void
  initialData?: TripFormData
}

export function TripFormDialog({ open, onClose, onSubmit, initialData }: Props) {
  const [name, setName] = useState('')
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? '')
      setDestinations(
        initialData?.destinations
          .filter(isLocation)
          .map(d => DestinationOptions.find(o => o.name === d)!)
          .filter(Boolean) ?? []
      )
      setStartDate(initialData?.startDate ?? '')
      setEndDate(initialData?.endDate ?? '')
    }
  }, [open, initialData])

  const handleSubmit = () => {
    if (!name || destinations.length === 0 || !startDate || !endDate) return
    const primary = destinations[0]
    onSubmit({
      name,
      destinations: destinations.map(d => d.name),
      lat: primary.lat,
      lng: primary.lng,
      startDate,
      endDate,
    })
  }

  const isValid = name && destinations.length > 0 && startDate && endDate
  const isMobile = useIsMobile()

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{initialData ? '여행 수정' : '새 여행'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label="여행 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />

          <Autocomplete
            multiple
            options={DestinationOptions}
            groupBy={(option) => option.group}
            getOptionLabel={(option) => option.name}
            value={destinations}
            onChange={(_, newValue) => setDestinations(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="목적지" placeholder="검색 또는 선택" />
            )}
            isOptionEqualToValue={(option, value) => option.name === value.name}
            slotProps={{
              popper: {
                placement: isMobile ? 'top' : 'auto'
              }
            }}
          />

          <DateRangePicker
            label="여행 기간"
            onChange={([start, end]) => {
              setStartDate(formatDate(start, 'yyyy-MM-dd'))
              setEndDate(formatDate(end, 'yyyy-MM-dd'))
            }}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!isValid}>
          완료
        </Button>
      </DialogActions>
    </Dialog>
  )
}
