import { Stack, type StackProps } from "@mui/material";

export function BottomArea({ bottom, ...props }: StackProps) {
  return (
    <Stack
      direction="row"
      gap={1}
      padding={1}
      position="fixed"
      bottom={bottom ? `calc(${bottom}px + env(safe-area-inset-bottom))` : 0}
      paddingBottom={bottom ? undefined : 'calc(8px + env(safe-area-inset-bottom))'}
      width="100%"
      bgcolor="#fff"
      zIndex={10}
      maxWidth={theme => theme.breakpoints.values.sm}
      {...props}
    />
  )
}