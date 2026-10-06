import { Box, type BoxProps } from '@mui/material'

export function ContentContainer(props: BoxProps) {
  return <Box width="100%" maxWidth={theme => theme.breakpoints.values.sm} marginX="auto" {...props} />
}
