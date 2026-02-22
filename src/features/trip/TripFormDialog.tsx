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

interface Destination {
  name: string
  lat: number
  lng: number
}

// 인기 여행지 목록
const DESTINATIONS: Destination[] = [
  // 국내
  { name: '서울', lat: 37.5665, lng: 126.978 },
  { name: '부산', lat: 35.1796, lng: 129.0756 },
  { name: '제주', lat: 33.4996, lng: 126.5312 },
  { name: '강릉', lat: 37.7519, lng: 128.8761 },
  { name: '경주', lat: 35.8562, lng: 129.2247 },
  { name: '여수', lat: 34.7604, lng: 127.6622 },
  { name: '전주', lat: 35.8242, lng: 127.148 },
  { name: '속초', lat: 38.207, lng: 128.5918 },
  { name: '인천', lat: 37.4563, lng: 126.7052 },
  { name: '대구', lat: 35.8714, lng: 128.6014 },
  { name: '대전', lat: 36.3504, lng: 127.3845 },
  { name: '광주', lat: 35.1595, lng: 126.8526 },
  // 해외
  { name: '도쿄', lat: 35.6762, lng: 139.6503 },
  { name: '오사카', lat: 34.6937, lng: 135.5023 },
  { name: '후쿠오카', lat: 33.5904, lng: 130.4017 },
  { name: '방콕', lat: 13.7563, lng: 100.5018 },
  { name: '싱가포르', lat: 1.3521, lng: 103.8198 },
  { name: '홍콩', lat: 22.3193, lng: 114.1694 },
  { name: '타이베이', lat: 25.033, lng: 121.5654 },
  { name: '파리', lat: 48.8566, lng: 2.3522 },
  { name: '런던', lat: 51.5074, lng: -0.1278 },
  { name: '뉴욕', lat: 40.7128, lng: -74.006 },
  { name: '로스앤젤레스', lat: 34.0522, lng: -118.2437 },
  { name: '하와이', lat: 21.3069, lng: -157.8583 },
]

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
          ? DESTINATIONS.find((d) => d.name === initialData.destination) ??
            { name: initialData.destination, lat: initialData.lat, lng: initialData.lng }
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
            options={DESTINATIONS}
            getOptionLabel={(option) => option.name}
            value={destination}
            onChange={(_, newValue) => setDestination(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="목적지" placeholder="검색 또는 선택" />
            )}
            isOptionEqualToValue={(option, value) => option.name === value.name}
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
