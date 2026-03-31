import { useState } from 'react'
import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import { BottomArea } from '~shared/components/BottomArea'

export interface Destination {
  name: string
  lat: number
  lng: number
  isOverseas: boolean
  group: '국내' | '일본' | '동남아' | '중화권' | '유럽' | '미주'
}

const DESTINATION_GROUPS: { label: Destination['group']; destinations: Destination[] }[] = [
  {
    label: '국내',
    destinations: [
      { name: '서울', lat: 37.5665, lng: 126.978, isOverseas: false, group: '국내' },
      { name: '부산', lat: 35.1796, lng: 129.0756, isOverseas: false, group: '국내' },
      { name: '제주', lat: 33.4996, lng: 126.5312, isOverseas: false, group: '국내' },
      { name: '강릉', lat: 37.7519, lng: 128.8761, isOverseas: false, group: '국내' },
      { name: '경주', lat: 35.8562, lng: 129.2247, isOverseas: false, group: '국내' },
      { name: '여수', lat: 34.7604, lng: 127.6622, isOverseas: false, group: '국내' },
      { name: '전주', lat: 35.8242, lng: 127.148, isOverseas: false, group: '국내' },
      { name: '속초', lat: 38.207, lng: 128.5918, isOverseas: false, group: '국내' },
      { name: '삼척', lat: 37.4499, lng: 129.1652, isOverseas: false, group: '국내' },
      { name: '인천', lat: 37.4563, lng: 126.7052, isOverseas: false, group: '국내' },
      { name: '대구', lat: 35.8714, lng: 128.6014, isOverseas: false, group: '국내' },
      { name: '대전', lat: 36.3504, lng: 127.3845, isOverseas: false, group: '국내' },
      { name: '광주', lat: 35.1595, lng: 126.8526, isOverseas: false, group: '국내' },
      { name: '단양', lat: 36.984657769421, lng: 128.365544218556, isOverseas: false, group: '국내' },
      { name: '평창', lat: 37.3707820404635, lng: 128.390161790138, isOverseas: false, group: '국내' },
      { name: '포천', lat: 37.8949928340102, lng: 127.200332890653, isOverseas: false, group: '국내' },
      { name: '진안', lat: 35.7917723036422, lng: 127.424865465443, isOverseas: false, group: '국내' },
    ],
  },
  {
    label: '일본',
    destinations: [
      { name: '도쿄', lat: 35.6762, lng: 139.6503, isOverseas: true, group: '일본' },
      { name: '오사카', lat: 34.6937, lng: 135.5023, isOverseas: true, group: '일본' },
      { name: '교토', lat: 35.0116, lng: 135.7681, isOverseas: true, group: '일본' },
      { name: '후쿠오카', lat: 33.5904, lng: 130.4017, isOverseas: true, group: '일본' },
      { name: '삿포로', lat: 43.0618, lng: 141.3545, isOverseas: true, group: '일본' },
      { name: '오키나와', lat: 26.2124, lng: 127.6809, isOverseas: true, group: '일본' },
    ],
  },
  {
    label: '동남아',
    destinations: [
      { name: '방콕', lat: 13.7563, lng: 100.5018, isOverseas: true, group: '동남아' },
      { name: '싱가포르', lat: 1.3521, lng: 103.8198, isOverseas: true, group: '동남아' },
      { name: '베트남 다낭', lat: 16.0544, lng: 108.2022, isOverseas: true, group: '동남아' },
      { name: '베트남 호치민', lat: 10.8231, lng: 106.6297, isOverseas: true, group: '동남아' },
      { name: '베트남 하노이', lat: 21.0285, lng: 105.8542, isOverseas: true, group: '동남아' },
      { name: '발리', lat: -8.3405, lng: 115.092, isOverseas: true, group: '동남아' },
      { name: '세부', lat: 10.3157, lng: 123.8854, isOverseas: true, group: '동남아' },
      { name: '푸켓', lat: 7.8804, lng: 98.3923, isOverseas: true, group: '동남아' },
      { name: '코타키나발루', lat: 5.9804, lng: 116.0735, isOverseas: true, group: '동남아' },
    ],
  },
  {
    label: '중화권',
    destinations: [
      { name: '홍콩', lat: 22.3193, lng: 114.1694, isOverseas: true, group: '중화권' },
      { name: '마카오', lat: 22.1987, lng: 113.5439, isOverseas: true, group: '중화권' },
      { name: '타이베이', lat: 25.033, lng: 121.5654, isOverseas: true, group: '중화권' },
      { name: '상하이', lat: 31.2304, lng: 121.4737, isOverseas: true, group: '중화권' },
    ],
  },
  {
    label: '유럽',
    destinations: [
      { name: '파리', lat: 48.8566, lng: 2.3522, isOverseas: true, group: '유럽' },
      { name: '런던', lat: 51.5074, lng: -0.1278, isOverseas: true, group: '유럽' },
      { name: '로마', lat: 41.9028, lng: 12.4964, isOverseas: true, group: '유럽' },
      { name: '바르셀로나', lat: 41.3851, lng: 2.1734, isOverseas: true, group: '유럽' },
      { name: '프라하', lat: 50.0755, lng: 14.4378, isOverseas: true, group: '유럽' },
      { name: '암스테르담', lat: 52.3676, lng: 4.9041, isOverseas: true, group: '유럽' },
      { name: '스위스 취리히', lat: 47.3769, lng: 8.5417, isOverseas: true, group: '유럽' },
    ],
  },
  {
    label: '미주',
    destinations: [
      { name: '뉴욕', lat: 40.7128, lng: -74.006, isOverseas: true, group: '미주' },
      { name: '로스앤젤레스', lat: 34.0522, lng: -118.2437, isOverseas: true, group: '미주' },
      { name: '하와이 호놀룰루', lat: 21.3069, lng: -157.8583, isOverseas: true, group: '미주' },
      { name: '샌프란시스코', lat: 37.7749, lng: -122.4194, isOverseas: true, group: '미주' },
      { name: '라스베이거스', lat: 36.1699, lng: -115.1398, isOverseas: true, group: '미주' },
      { name: '칸쿤', lat: 21.1619, lng: -86.8515, isOverseas: true, group: '미주' },
    ],
  },
]

const BOTTOM_AREA_HEIGHT = 64

interface Props {
  defaultValue: Destination | null
  onNext: (destination: Destination) => void
}

export function DestinationStep({ defaultValue, onNext }: Props) {
  const [selected, setSelected] = useState<Destination | null>(defaultValue)

  return (
    <>
      <Stack spacing={2.5} px={3} pb={`${BOTTOM_AREA_HEIGHT + 16}px`}>
        {DESTINATION_GROUPS.map((group) => (
          <Box key={group.label}>
            <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" mb={1}>
              {group.label}
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {group.destinations.map((dest) => {
                const isSelected = selected?.name === dest.name
                return (
                  <Chip
                    key={dest.name}
                    label={dest.name}
                    onClick={() => setSelected(isSelected ? null : dest)}
                    variant={isSelected ? 'filled' : 'outlined'}
                    color={isSelected ? 'primary' : 'default'}
                    sx={{ cursor: 'pointer' }}
                  />
                )
              })}
            </Stack>
          </Box>
        ))}
      </Stack>

      <BottomArea>
        <Button
          variant="contained"
          fullWidth
          size="large"
          disabled={!selected}
          onClick={() => selected && onNext(selected)}
        >
          다음
        </Button>
      </BottomArea>
    </>
  )
}
