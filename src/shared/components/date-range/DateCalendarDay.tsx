import { Box, Typography, useTheme } from '@mui/material';
import { type PickersDayProps } from '@mui/x-date-pickers';
import { addMonths, formatDate, isSameDay, set, subDays } from 'date-fns';
import { Days } from './constants';

function getLastDateOfMonth(date: Date) {
  return subDays(addMonths(set(date, { date: 1 }), 1), 1).getDate();
}

type DayProps = Omit<PickersDayProps, 'value' | 'onClick'> & {
  value: [Date | null, Date | null];
};

export function DateCalendarDay({ day, value, onDaySelect, outsideCurrentMonth, ...props }: DayProps) {
  const [startDate, endDate] = value ?? [];

  const isStartDate = startDate ? isSameDay(startDate, day) : false;
  const isEndDate = endDate ? isSameDay(endDate, day) : false;

  const isRangeTargetDate = isStartDate || isEndDate;
  const isInRanageDate = (startDate ? day > startDate : false) && (endDate ? day < endDate : false);
  const isRange = isRangeTargetDate || isInRanageDate;

  const { palette } = useTheme();

  if (outsideCurrentMonth) {
    return <Box width={40} height={36} paddingX="2px" />;
  }

  const [dayOfWeek, date] = [day.getDay(), day.getDate()];
  const [isFirstColumn, isLastColumn] = [
    dayOfWeek === Days.Monday || date === 1,
    dayOfWeek === Days.Sunday || date === getLastDateOfMonth(day),
  ];

  return (
    <Box
      component="button"
      width={40}
      height={36}
      position="relative"
      alignItems="center"
      justifyContent="center"
      paddingX="2px"
      sx={{
        backgroundColor: isRange ? palette.primary.light : palette.background.paper,
        border: 'none',
        cursor: 'pointer',
        borderTopLeftRadius: isStartDate || (isRange && isFirstColumn) ? '50%' : 0,
        borderBottomLeftRadius: isStartDate || (isRange && isFirstColumn) ? '50%' : 0,
        borderTopRightRadius: isEndDate || (isRange && isLastColumn) ? '50%' : 0,
        borderBottomRightRadius: isEndDate || (isRange && isLastColumn) ? '50%' : 0,
      }}
      onClick={() => onDaySelect(day)}
      {...props}
    >
      <Typography variant="caption" color={isRange || isInRanageDate ? 'white' : 'black'}>
        {formatDate(day, 'd')}
      </Typography>
    </Box>
  );
}