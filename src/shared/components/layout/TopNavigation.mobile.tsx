
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
      height={TopNavigation.HEIGHT}
      position="fixed"
      top={0}
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      width="100%"
      sx={[
        {
          p: 1,
          bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider',
          zIndex: 20,
        },
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
      {...props}
    >
      <Box display="flex" alignItems="center" gap={0.5}>
        {leftElement}
        <Box flex={1} minWidth={0}>
          {children}
        </Box>
      </Box>
      <Stack direction="row" alignItems="center">
        {rightElement}
      </Stack>

    </Stack>
  )
}
TopNavigation.HEIGHT = 50
TopNavigation.BackButton = (props: IconButtonProps) => {
  const navigate = useNavigate();


  return (
    <IconButton
      onClick={() => {
        if (window.history.length === 0) {
          return navigate('/');
        }
        navigate(-1);
      }}
      {...props}
    >
      <ArrowBackIcon />
    </IconButton>
  )
}
