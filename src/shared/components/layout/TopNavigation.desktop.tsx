
import { Box, IconButton, Stack, type IconButtonProps, type StackProps } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useNavigate } from "react-router";
import type { ReactNode } from "react";


type Props = {
  leftElement?: ReactNode;
  rightElement?: ReactNode
} & StackProps;

export function TopNavigation({
  leftElement = <TopNavigation.BackButton />,
  rightElement,
  children,
  sx,
  ...props
}: Props) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      position="sticky"
      top={0}
      zIndex={10}
      sx={[
        { p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' },
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
      {...props}
    >
      <Box display="flex" alignItems="center" gap={1}>
        {leftElement}
        {children}
      </Box>
      <Stack direction="row" alignItems="center">
        {rightElement}
      </Stack>
    </Stack>
  )
}

TopNavigation.BackButton = (props: IconButtonProps) => {
  const navigate = useNavigate();

  return (
    <IconButton {...props} onClick={() => navigate('/')}>
      <ArrowBackIcon />
    </IconButton>
  )
}