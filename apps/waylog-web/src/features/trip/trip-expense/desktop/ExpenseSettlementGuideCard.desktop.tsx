import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Box, Card, CardContent, Stack, Typography } from "@mui/material"
import { type ReactNode } from "react"
import { formatCurrency } from "@waylog/domains/expense"
import { AnimatedCountText } from "~shared/components/animation/AnimatedCountText"
import { useExpenseSummary } from "../useExpenseSummary"

interface Props {
  tripId: string;
  fallbackEmpty?: ReactNode;
}

export function ExpenseSettlementGuideCard({ tripId, fallbackEmpty }: Props) {
  const { settlements, members } = useExpenseSummary(tripId)

  if (settlements.length === 0 && fallbackEmpty != null) {
    return fallbackEmpty;
  }

  return (
    <Stack spacing={2}>
      {settlements.map((settlement, index) => {
        const from = members.find(x => x.id === settlement.from);
        const to = members.find(x => x.id === settlement.to);
        if (!from || !to) return null

        return (
          <Card
            key={index}
            variant="outlined"
            sx={{ bgcolor: 'grey.50' }}
          >
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box textAlign="center">

                    <Typography variant="caption" fontWeight="medium">
                      {from.name}
                    </Typography>
                  </Box>
                  <ArrowForwardIcon color="action" />
                  <Box textAlign="center">
                    <Typography variant="caption" fontWeight="medium">
                      {to.name}
                    </Typography>
                  </Box>
                </Stack>

                <AnimatedCountText value={settlement.amount} format={formatCurrency} variant="h6" color="primary.main" fontWeight="bold" />

              </Stack>
            </CardContent>
          </Card>
        )
      })}
    </Stack>
  )
}