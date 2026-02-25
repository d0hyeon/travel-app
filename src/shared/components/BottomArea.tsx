import { Stack, type StackProps } from "@mui/material";

export function BottomArea(props: StackProps) {
  return (
    <Stack
      direction="row"
      gap={1}
      padding={1}
      position="fixed"
      bottom={0}
      width="100%"
      bgcolor="#fff"
      zIndex={10}
      {...props}
    />
  )
}