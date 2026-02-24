import { Stack, Typography, type StackProps } from "@mui/material";
import type { ReactNode } from "react";

export function BottomNavigation({ sx, ...props }: StackProps) {
  return (
    <Stack
      position="fixed"
      bottom={0}
      width="100%"
      direction="row"
      alignItems="center"
      justifyContent="space-evenly"
      minHeight={50}
      zIndex={5}

      sx={[
        theme => ({
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: '#fff',
          '.bottom-navigation-menu ~ .bottom-navigation-menu::after': {
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '1px',
            height: 20,
            backgroundColor: theme.palette.divider,
            content: '""',
          }
        }),

        ...(Array.isArray(sx) ? sx : [sx])
      ]}
      {...props}
    />
  )
}

interface MenuProps extends StackProps<'button'> {
  icon?: ReactNode;
  isActived?: boolean
}

BottomNavigation.Menu = function Menu({ icon, isActived, children, ...props }: MenuProps) {
  return (
    <Stack
      position="relative"
      className="bottom-navigation-menu"
      component="button"
      justifyContent="center"
      alignItems="center"
      flex={1}
      paddingTop={0.9}
      paddingBottom={0.3}
      {...props}
    >
      {icon}
      {typeof children === 'string'
        ? <Typography variant='caption' fontWeight="bold" color={isActived ? 'primary' : 'textDisabled'}>{children}</Typography>
        : children
      }
    </Stack>
  )
}