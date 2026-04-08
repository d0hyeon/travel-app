import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Autocomplete,
} from '@mui/material'
import { DateRangePicker } from '../../shared/components/date-range/DateRangePicker'
import { formatDate } from 'date-fns'
import { useIsMobile } from '~shared/hooks/useIsMobile'
import { isLocation } from '~features/location'
import { DestinationOptions, type DestinationOption } from './destination-options'

type Destination = DestinationOption

interface TripFormData {
  name: string
  destination: string
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
  const [destination, setDestination] = useState<Destination | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // 다이얼로그 열릴 때 초기화
  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? '')
      setDestination(
        initialData
          ? (
            isLocation(initialData.destination)
              ? DestinationOptions.find((d) => d.name === initialData.destination) ?? null
              : null
          )
          : null
      )
      setStartDate(initialData?.startDate ?? '')
      setEndDate(initialData?.endDate ?? '')
    }
  }, [open, initialData])

  const handleSubmit = () => {
    if (!name || !destination || !startDate || !endDate) return
    onSubmit({
      name,
      destination: destination.name,
      lat: destination.lat,
      lng: destination.lng,
      startDate,
      endDate,
    })
  }

  const isValid = name && destination && startDate && endDate
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
            options={DestinationOptions}
            groupBy={(option) => option.group}
            getOptionLabel={(option) => option.name}
            value={destination}
            onChange={(_, newValue) => setDestination(newValue)}
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
