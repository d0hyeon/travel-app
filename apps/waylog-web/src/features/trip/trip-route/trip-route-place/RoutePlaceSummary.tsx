import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import { Stack, Typography, type TypographyProps } from '@mui/material'
import { EMPTY_ROUTE_PLACE_TIME, formatRoutePlaceTime, type RoutePlaceTime } from '@waylog/domains/modules/route'

interface TimeLabelProps extends TypographyProps {
  time?: RoutePlaceTime
}

export function RoutePlaceTimeLabel({ time = EMPTY_ROUTE_PLACE_TIME, ...props }: TimeLabelProps) {
  const label = formatRoutePlaceTime(time)
  if (label == null) return null

  return (
    <Typography variant="body2" fontSize={12} fontWeight={700} color="primary" flexShrink={0} {...props}>
      {label}
    </Typography>
  )
}

interface NotesProps {
  notes: string[]
}

export function RoutePlaceNotes({ notes }: NotesProps) {
  if (notes.length === 0) return null

  return (
    <Stack
      direction="row"
      alignItems="flex-start"
      spacing={0.75}
      marginTop={1}
      paddingTop={1}
      sx={{ borderTop: '1px dashed', borderColor: 'divider' }}
    >
      <DirectionsCarIcon color="primary" sx={{ fontSize: 14, marginTop: '2px' }} />
      <Typography variant="body2" fontSize={12} color="primary" whiteSpace="pre-line">
        {notes.join('\n')}
      </Typography>
    </Stack>
  )
}
