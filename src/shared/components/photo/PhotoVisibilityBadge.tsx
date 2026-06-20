import PublicIcon from '@mui/icons-material/Public';
import { Stack, Typography, type StackProps } from '@mui/material';

/** 공개 상태 사진에 표시하는 작은 뱃지. 좌측 상단 등에 배치해서 사용한다. */
export function PhotoVisibilityBadge({ sx, ...props }: StackProps) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.25}
      sx={[
        {
          px: 0.5,
          py: 0.125,
          borderRadius: 1,
          bgcolor: 'rgba(0, 0, 0, 0.55)',
          color: '#fff',
          backdropFilter: 'blur(2px)',
          pointerEvents: 'none',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      <PublicIcon sx={{ fontSize: 12 }} />
      <Typography component="span" sx={{ fontSize: 10, fontWeight: 700, lineHeight: 1.4 }}>
        공개
      </Typography>
    </Stack>
  );
}
