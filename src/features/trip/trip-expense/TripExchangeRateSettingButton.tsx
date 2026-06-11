import { Button, Dialog, DialogActions, DialogContent, Stack, Typography, type ButtonProps } from "@mui/material";
import SettingsIcon from '@mui/icons-material/Settings'
import { useOverlay } from "~shared/hooks/useOverlay";
import { DialogTitle } from "~shared/components/confirm-dialog/DialogTitle";
import { useTrip } from "../useTrip";
import { useExpenses } from "~features/expense/useExpenses";
import { useMemo } from "react";
import { getCurrencyName, getDefaultExchangeRate, getExchangeRate, getUsedCurrencies, setExchangeRate } from "~features/expense/currency";
import { ListItem } from "~shared/components/ListItem";
import { EditableText } from "~shared/components/EditableText";

interface Props extends ButtonProps {
  tripId: string;
}
export function TripExchangeRageSettingButton({ tripId, ...props }: Props) {
  const overlay = useOverlay();
  const { data: { exchangeRates }, update } = useTrip(tripId);

  const { data: expenses } = useExpenses(tripId);
  const usedCurrencies = useMemo(() => getUsedCurrencies(expenses), [expenses])

  return (
    <Button
      size="small"
      color="info"
      endIcon={<SettingsIcon />}
      onClick={() => {
        overlay.open(({ isOpen, close }) => (
          <Dialog open={isOpen} onClose={close}>
            <DialogTitle>환율 설정</DialogTitle>
            <DialogContent>
              {usedCurrencies.map(code => {
                const currentRate = getExchangeRate(code, exchangeRates);
                const defaultRate = getDefaultExchangeRate(code);

                return (
                  <ListItem key={code}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        {getCurrencyName(code)}
                      </Typography>
                      <EditableText
                        variant="body2"
                        fontWeight="medium"
                        value={currentRate ? `${currentRate.toLocaleString()}원` : `${defaultRate.toLocaleString()}원 (기본)`}
                        sx={{ width: 200, textAlign: 'right', 'input': { textAlign: 'right' } }}
                        onSubmit={(value) => {
                          const rate = Number(value.replace(/[^0-9.]/g, ''))
                          if (rate > 0) {
                            const newRates = setExchangeRate(exchangeRates, code, rate);
                            update.mutateAsync({ exchangeRates: newRates })
                          }
                        }}
                        submitOnBlur
                      />
                    </Stack>
                  </ListItem>
                );
              })}
            </DialogContent>
            <DialogActions>
              <Button variant="contained" onClick={close}>확인</Button>
            </DialogActions>
          </Dialog>
        ))
      }}
      {...props}
    >
      환율 설정
    </Button>
  )
}