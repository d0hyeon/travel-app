import { Box, Typography } from "@mui/material";
import type { PropsWithChildren } from "react";



export function IntroFullScreenBanner({ children }: PropsWithChildren) {
  return (
    <Box
      sx={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        bgcolor: 'background.default',
        px: 3,
        pt: 6,
        pb: `calc(24px + env(safe-area-inset-bottom))`,
      }}
    >
      {/* 심볼 + 앱명 */}
      <Box flex={1} display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={2}>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: 4,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          <img src="/pwa-512x512.png" alt="로고 이미지" />

        </Box>
        <Box textAlign="center">
          <Typography variant="h5" fontWeight={700} mb={0.5}>
            여행 플래너
          </Typography>
          <Typography variant="body2" color="text.secondary">
            여행을 계획하고 함께 기록해요
          </Typography>
        </Box>
      </Box>

      {children}
    </Box>
  )
}