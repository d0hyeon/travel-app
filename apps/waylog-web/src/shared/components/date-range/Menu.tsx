import { Check } from '@mui/icons-material';
import { useTheme, Typography, Stack } from '@mui/material';
import { type ComponentProps } from 'react';

type Props = {
  title: string;
} & ComponentProps<typeof Stack>;

function Menu({ title, children, onChange, ...wrapperProps }: Props) {
  const { palette } = useTheme();

  return (
    <Stack
      {...wrapperProps}
      sx={{
        borderLeft: `1px solid ${palette.divider}`,
        minWidth: '150px',
        padding: '20px 0',
        ...wrapperProps.sx,
      }}
    >
      <Typography variant="subtitle2" sx={{ marginBottom: '16px', padding: '0 16px' }}>
        {title}
      </Typography>
      {children}
    </Stack>
  );
}

Menu.Item = ({ sx, children, actived, ...props }: ComponentProps<typeof Stack> & { actived?: boolean }) => {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={[
        {
          padding: '6px 16px',
          cursor: 'pointer',
          backgroundColor: actived ? 'rgba(33, 150, 243, 0.12)' : 'white',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {children}
      {actived && (
        <Check
          sx={(theme) => ({
            width: '18px',
            height: '18px',
            color: theme.palette.action.active,
          })}
        />
      )}
    </Stack>
  );
};

export default Menu;