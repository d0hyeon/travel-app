import { Box, Button, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { BottomArea } from '~shared/components/BottomArea'
import { useTrips } from '~features/trip/useTrips'
import type { Trip } from '@waylog/domains/trip'

interface Props {
  defaultValue: string | null
  onNext: (tripId: string | null) => void
}

type Selection = null | 'none' | string

export function TripStep({ defaultValue, onNext }: Props) {
  const { data: trips } = useTrips()
  const [selection, setSelection] = useState<Selection>(defaultValue)

  const isNextEnabled = selection !== null

  const orderedTrips = [...trips].toSorted((a, b) => b.startDate.localeCompare(a.startDate))

  return (
    <>
      <Box px={2} pt="20px" pb={`${BOTTOM_AREA_HEIGHT + 24}px`} role="radiogroup" aria-label="포스트를 묶을 여행">
        <Box mb="22px">
          <NoTripCard selected={selection === 'none'} onSelect={() => setSelection('none')} />
        </Box>

        {orderedTrips.length > 0 && (
          <>
            <DividerLabel count={orderedTrips.length} />
            <Stack gap={1}>
              {orderedTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  selected={selection === trip.id}
                  onSelect={() => setSelection(trip.id)}
                />
              ))}
            </Stack>
          </>
        )}
      </Box>

      <BottomArea sx={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <Button
          size="large"
          variant="contained"

          disabled={!isNextEnabled}
          onClick={() => {
            if (!isNextEnabled) return
            onNext(selection === 'none' ? null : (selection as string))
          }}
          fullWidth
        >
          다음
        </Button>
      </BottomArea>
    </>
  )
}

function DividerLabel({ count }: { count: number }) {
  return (
    <Stack direction="row" alignItems="center" gap={1} mx="4px" mb="10px">
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#6b6b73', letterSpacing: '0.2px' }}>
        여행에 묶기
      </Typography>
      <Box flex={1} sx={{ height: '1px', bgcolor: 'rgba(0,0,0,0.05)' }} />
      <Typography sx={{ fontSize: 11.5, color: '#9b9ba3' }}>{count}개</Typography>
    </Stack>
  )
}

function NoTripCard({ selected, onSelect }: { selected: boolean; onSelect: () => void }) {
  return (
    <SelectableCard selected={selected} onSelect={onSelect}>
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: '10px',
          bgcolor: '#f5f5f7',
          border: '1.5px dashed rgba(0,0,0,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <SparkleIcon />
      </Box>
      <Stack flex={1} minWidth={0}>
        <Typography sx={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px', color: '#111' }}>
          일상 포스트
        </Typography>
        <Typography sx={{ fontSize: 12.5, fontWeight: 500, color: '#6b6b73', mt: '3px' }}>
          여행 없이 피드에만 올려요
        </Typography>
      </Stack>
      <RadioIndicator selected={selected} />
    </SelectableCard>
  )
}

function TripCard({ trip, selected, onSelect }: { trip: Trip; selected: boolean; onSelect: () => void }) {
  return (
    <SelectableCard selected={selected} onSelect={onSelect}>
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: '10px',
          background: gradientFor(trip.id),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Typography sx={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>
          {trip.name?.[0] ?? '?'}
        </Typography>
      </Box>
      <Stack flex={1} minWidth={0}>
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '-0.3px',
            color: '#111',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {trip.name}
        </Typography>
        <Typography sx={{ fontSize: 12.5, fontWeight: 500, color: '#6b6b73', mt: '3px' }}>
          {formatTripMeta(trip.startDate, trip.endDate)}
        </Typography>
      </Stack>
      <RadioIndicator selected={selected} />
    </SelectableCard>
  )
}

function SelectableCard({
  selected,
  onSelect,
  children,
}: {
  selected: boolean
  onSelect: () => void
  children: React.ReactNode
}) {
  return (
    <Box
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          onSelect()
        }
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        width: '100%',
        py: '12px',
        pl: '12px',
        pr: '16px',
        borderRadius: '14px',
        cursor: 'pointer',
        border: selected ? '1.5px solid #4A7AFF' : '1.5px solid rgba(0,0,0,0.08)',
        bgcolor: selected ? '#EEF2FF' : '#fff',
        transition: 'all .15s',
        '&:focus-visible': { outline: '2px solid rgba(74,122,255,0.4)', outlineOffset: 2 },
      }}
    >
      {children}
    </Box>
  )
}

function RadioIndicator({ selected }: { selected: boolean }) {
  return (
    <Box
      sx={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: selected ? 'primary.main' : '#fff',
        border: selected ? 'none' : '1.8px solid rgba(0,0,0,0.18)',
        transition: 'all .15s',
      }}
    >
      {selected && (
        <Box
          component="svg"
          viewBox="0 0 11 11"
          sx={{ width: 11, height: 11, stroke: '#fff', strokeWidth: 2, fill: 'none' }}
        >
          <polyline points="2,6 4.5,8.5 9,3" strokeLinecap="round" strokeLinejoin="round" />
        </Box>
      )}
    </Box>
  )
}

function SparkleIcon() {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      sx={{ width: 22, height: 22, stroke: '#6b6b73', strokeWidth: 1.6, fill: 'none', strokeLinecap: 'round' }}
    >
      <circle cx="12" cy="12" r="2" />
      <line x1="12" y1="3" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="21" />
      <line x1="3" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="21" y2="12" />
      <line x1="5.6" y1="5.6" x2="7.7" y2="7.7" />
      <line x1="16.3" y1="16.3" x2="18.4" y2="18.4" />
    </Box>
  )
}

function formatTripMeta(start: string, end: string): string {
  const compress = (iso: string) => iso.slice(2).replace(/-/g, '.')
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  const days = Math.max(0, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)))
  const duration = days === 0 ? '당일' : `${days}박 ${days + 1}일`
  return `${compress(start)} – ${compress(end)} · ${duration}`
}

function gradientFor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  const a = Math.abs(h) % 360
  const b = (a + 40) % 360
  return `linear-gradient(135deg, hsl(${a} 60% 65%), hsl(${b} 60% 50%))`
}

const BOTTOM_AREA_HEIGHT = 84
