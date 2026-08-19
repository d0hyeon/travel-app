import { Box, InputAdornment, Stack, TextField, Typography } from "@mui/material"
import { AnimatedCountText } from "~shared/components/animation/AnimatedCountText"
import { EditableText } from "~shared/components/EditableText"
import {
  getDefaultExchangeRate,
  getExchangeRate,
  getUsedCurrencies,
  setExchangeRate,
  type CurrencyCode
} from "@waylog/domains/expense"
import { formatCurrency } from "@waylog/domains/expense"
import { useTrip } from "@waylog/domains/trip"
import { useExpenseSummary } from "../useExpenseSummary"

interface Props {
  tripId: string
}

export function ExpenseHeader({ tripId }: Props) {
  const { data: trip, update: updateTrip } = useTrip(tripId)
  const { totalInKRW, expenses } = useExpenseSummary(tripId)

  const { exchangeRates } = trip
  const usedCurrencies = getUsedCurrencies(expenses)

  return (
    <Stack
      direction="row"
      gap={1}
      justifyContent="space-between"
      alignItems="end"
      flex="0 0 auto"
      sx={{ px: 2, py: 1.5, bgcolor: 'primary.main', color: 'white' }}
    >
      <Stack direction="column" alignItems="start" flex="1">
        <Typography variant="caption">총 지출</Typography>
        <AnimatedCountText
          value={totalInKRW}
          format={formatCurrency}
          variant="h5"
          delay={100}
          duration={1000}
          fontWeight="bold"
        />
      </Stack>

      {trip.isOverseas && usedCurrencies.length > 0 && (
        <Stack direction="row" spacing={1} alignItems="end" justifyContent="end">
          {usedCurrencies.map(code => {
            const currentRate = getExchangeRate(code, exchangeRates)
            const defaultRate = getDefaultExchangeRate(code)

            return (
              <EditableText
                key={code}
                variant="caption"
                fontWeight="medium"
                value={currentRate ?? defaultRate}
                format={value => `${code} ${value.toLocaleString()}원`}
                dismissible={false}
                sx={{
                  fontSize: 11,
                  '.editable-text': { fontSize: 'inherit', textDecoration: 'underline' },
                  '.editable-text-field': { fontSize: 'inherit' }
                }}
                endIcon={null}
                renderEditField={props => (
                  <Box>
                    <TextField
                      variant='standard'
                      size="small"
                      slotProps={{
                        htmlInput: { sx: { color: '#fff', textAlign: 'right', marginBottom: -0.5 } },
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <Typography variant="caption" color="#fff">원</Typography>
                            </InputAdornment>
                          ),
                          sx: { '&::before': { borderColor: '#fff', zIndex: 999 } }
                        },
                      }}
                      sx={{ width: 60 }}
                      {...props}
                    />
                  </Box>
                )}
                onSubmit={(value) => {
                  const rate = Number(value.replace(/[^0-9.]/g, ''))
                  if (rate > 0) {
                    const newRates = setExchangeRate(exchangeRates, code as CurrencyCode, rate)
                    updateTrip.mutateAsync({ exchangeRates: newRates })
                  }
                }}
                submitOnBlur
              />
            )
          })}
        </Stack>
      )}
    </Stack>
  )
}
