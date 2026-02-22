import { Box, Stack, Typography, type BoxProps, type StackProps, type TypographyProps } from "@mui/material";
import type { ReactNode } from "react";
import { useIsMobile } from "../hooks/useIsMobile";

interface Props extends Omit<StackProps, 'title'> {
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
  contents?: ReactNode | ReactNode[];
}

export function ListItem({ leftAddon, rightAddon, children, ...props }: Props) {
  const isMobile = useIsMobile();
  return (
    <Stack
      gap={0.5}
      alignItems="center"
      paddingX={isMobile ? 1.5 : 2}
      paddingY={isMobile ? 1 : 1.5}
      border={1}
      borderColor="divider"
      borderRadius={2}
      justifyContent="space-between"
      direction="row"
      {...props}
    >
      <Stack direction="row" gap={1} alignItems="center">
        {leftAddon}
        <Stack gap={0.5} flex={1} minWidth={0}>
          {children}
        </Stack>
      </Stack>

      {rightAddon}
    </Stack>
  )
}

ListItem.Title = (props: TypographyProps) => {
  return <Typography fontWeight="medium" fontSize={13} noWrap {...props} />
}
ListItem.Text = (props: TypographyProps) => {
  return <Typography variant="caption" color="textSecondary" fontSize={12} {...props} />
}

ListItem.Ordering = (props: BoxProps) => {
  return (
    <Box
      {...props}
      sx={[
        {
          width: 20,
          height: 20,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 'bold',
          flexShrink: 0,
        },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx])
      ]}

    />
  )
}

