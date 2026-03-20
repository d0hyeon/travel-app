import { alpha, Box, Stack, Typography, type BoxProps, type StackProps, type TypographyProps } from "@mui/material";
import { useEffect, useRef, type ReactNode } from "react";
import { useIsMobile } from "../hooks/useIsMobile";

interface Props extends Omit<StackProps, 'title'> {
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
  contents?: ReactNode | ReactNode[];
}

export function ListItem({
  leftAddon,
  rightAddon,
  children,
  alignItems = 'center',
  gap,
  ...props
}: Props) {
  const isMobile = useIsMobile();
  return (
    <Stack
      gap={gap ?? (isMobile ? 0.5 : 1)}
      alignItems={alignItems}
      paddingX={1.5}
      paddingY={isMobile ? 1 : 1.5}
      border={1}
      borderColor="divider"
      borderRadius={3}
      justifyContent="space-between"
      direction="row"
      {...props}
    >
      <Stack direction="row" gap={gap ?? 1} alignItems={alignItems} width="100%">
        {leftAddon}
        <Stack gap={0.5} flex={1} minWidth={0} width="100%">
          {children}
        </Stack>
      </Stack>

      {rightAddon}
    </Stack>
  )
}

interface ButtonProps extends Props {
  focused?: boolean;
}

ListItem.Button = ({ focused, sx, ...props }: ButtonProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focused) {
      return ref.current?.focus();
    }
    if (document.activeElement === ref.current) {
      ref.current?.blur();
    }
  }, [focused])

  return (
    <ListItem
      ref={ref}
      component="button"
      textAlign="left"
      width="100%"
      sx={[
        theme => ({
          '&:focus': {
            background: alpha(theme.palette.primary.main, 0.2),
            outline: 'none'
          }
        }),
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
      {...props}
    />
  )
}

ListItem.Title = ({ leftAddon, rightAddon, ...props }: TypographyProps & { leftAddon?: ReactNode; rightAddon?: ReactNode }) => {
  return (
    <Stack gap={1} direction="row" alignItems="center" >
      {leftAddon}
      <Typography fontSize={13} whiteSpace="pre-line" {...props} />
      {rightAddon}
    </Stack>
  )
}
ListItem.Text = ({ leftAddon, rightAddon, ...props }: TypographyProps & { leftAddon?: ReactNode; rightAddon?: ReactNode }) => {
  return (
    <Stack gap={0.25} direction="row" alignItems="center" >
      {leftAddon}
      <Typography
        variant="caption"
        fontWeight={500}
        color="textSecondary"
        fontSize={12}
        whiteSpace="pre-line"
        sx={{ wordBreak: 'break-word' }}
        {...props}
      />
      {rightAddon}
    </Stack>
  )
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

