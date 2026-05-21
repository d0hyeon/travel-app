import { Box, type BoxProps } from '@mui/material'

export function FilterNavigation(props: BoxProps) {
  return (
    <Box
      width="100%"
      height={FilterNavigation.height}
      paddingX={2}
      borderBottom={1}
      borderColor="divider"
      bgcolor="#fff"
      {...props}
    />
  )
}
FilterNavigation.height = 35
