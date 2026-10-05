import PublicIcon from '@mui/icons-material/Public';
import { Box, type BoxProps } from '@mui/material';

/** 공개 상태 사진에 표시하는 작은 아이콘 뱃지. 좌측 상단 등에 배치해서 사용한다. */
export function PhotoVisibilityBadge({ sx, ...props }: BoxProps) {
  return (
    <Box
      sx={[
        {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 0.375,
          borderRadius: '50%',
          bgcolor: 'rgba(0, 0, 0, 0.55)',
          color: '#fff',
          backdropFilter: 'blur(2px)',
          pointerEvents: 'none',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      <PublicIcon sx={{ fontSize: 14 }} />
    </Box>
  );
}
