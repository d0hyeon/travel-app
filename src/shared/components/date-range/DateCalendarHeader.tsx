
import { Stack, Typography } from '@mui/material';
import { type PickersCalendarHeaderProps } from '@mui/x-date-pickers';
import { formatDate } from 'date-fns';

export function ReadonlyDateCalendarHeader({ currentMonth, format = 'MMMM yyyy' }: PickersCalendarHeaderProps) {
  return (
    <Stack
      direction="row"
      height="40px"
      marginLeft="24px"
      marginRight="12px"
      marginTop="12px"
      marginBottom="4px"
      alignItems="center"
      justifyContent="space-between"
    >
      <Typography>{formatDate(currentMonth, format)}</Typography>
    </Stack>
  );
}

export const DateCalendarHeader = {
  Readonly: ReadonlyDateCalendarHeader,
};