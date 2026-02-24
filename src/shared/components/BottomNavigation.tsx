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
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: '#fff',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,

          // '.bottom-navigation-menu ~ .bottom-navigation-menu::after': {
          //   position: 'absolute',
          //   left: 0,
          //   top: 'calc(50% - (env(safe-area-inset-bottom) / 2))',
          //   transform: 'translateY(-50%)',
          //   width: '1px',
          //   height: 20,
          //   backgroundColor: theme.palette.divider,
          //   content: '""',
          // }
        }),

        ...(Array.isArray(sx) ? sx : [sx])
      ]}
      {...props}
    />
  )
}
BottomNavigation.HEIGHT = 62;

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
      paddingTop={1}
      sx={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      {...props}
    >
      {icon}
      {typeof children === 'string'
        ? <Typography variant='caption' fontWeight={700} color={isActived ? 'primary' : 'textDisabled'}>{children}</Typography>
        : children
      }
    </Stack>
  )
}