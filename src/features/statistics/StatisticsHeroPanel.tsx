import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import { Box, type BoxProps, Stack, Typography } from '@mui/material'

interface StatisticsHeroPanelProps extends BoxProps {
  totalAmount: string
}

export function StatisticsHeroPanel({
  totalAmount,
  sx,
  ...boxProps
}: StatisticsHeroPanelProps) {
  return (
    <Box
      sx={{
        p: { xs: 2.5, md: 3.5 },
        borderRadius: 5,
        border: '1px solid',
        borderColor: '#e6e6e6',
        backgroundColor: '#fff',
        ...sx,
      }}
      {...boxProps}
    >
      <Stack gap={0.75}>
        <Stack direction="row" alignItems="center" gap={1}>
          <ReceiptLongIcon color="primary" sx={{ fontSize: 18 }} />
          <Typography variant="subtitle2" fontWeight={800}>
            전체 지출
          </Typography>
        </Stack>
        <Typography fontSize={{ xs: 28, md: 36 }} lineHeight={1.02} fontWeight={800}>
          {totalAmount}
        </Typography>
      </Stack>
    </Box>
  )
}
