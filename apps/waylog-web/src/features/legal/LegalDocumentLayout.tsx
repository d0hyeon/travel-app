import { Box, Stack, Typography } from '@mui/material'
import type { PropsWithChildren } from 'react'
import { TERMS_VERSION } from '@waylog/domains/modules/terms'

interface LegalDocumentLayoutProps {
  title: string
}

export function LegalDocumentLayout({ title, children }: PropsWithChildren<LegalDocumentLayoutProps>) {
  return (
    <Box
      component="main"
      sx={{
        maxWidth: 720,
        mx: 'auto',
        px: 2.5,
        pt: 3,
        pb: 'calc(48px + env(safe-area-inset-bottom))',
        bgcolor: 'background.default',
        color: 'text.primary',
        wordBreak: 'keep-all',
        lineHeight: 1.75,
      }}
    >
      <Typography component="h1" variant="h5" fontWeight={700} gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        시행일: {TERMS_VERSION}
      </Typography>
      <Stack spacing={4}>{children}</Stack>
    </Box>
  )
}

interface LegalSectionProps {
  heading: string
}

export function LegalSection({ heading, children }: PropsWithChildren<LegalSectionProps>) {
  return (
    <Box component="section">
      <Typography component="h2" variant="subtitle1" fontWeight={700} mb={1}>
        {heading}
      </Typography>
      <Stack spacing={1} sx={{ typography: 'body2' }}>
        {children}
      </Stack>
    </Box>
  )
}
