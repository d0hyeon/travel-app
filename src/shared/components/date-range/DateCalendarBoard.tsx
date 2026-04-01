
import { Button, Paper, Stack, Typography, useTheme, type PaperProps } from '@mui/material';
import type { ReactNode } from 'react';
import { DateCalendar } from '@mui/x-date-pickers';
import { type PickerValue } from '@mui/x-date-pickers/internals';
import { differenceInDays, isBefore, isEqual, isSameDay, isToday, set, subMonths, addMonths } from 'date-fns';
import { useState } from 'react';
import { QuickDateOptions } from './constants';
import { DateCalendarDay } from './DateCalendarDay';
import { DateCalendarHeader } from './DateCalendarHeader';
import Menu from './Menu';
import { type DateRange } from './type';
import { useIsMobile } from '~shared/hooks/useIsMobile';

type Props = {
  defaultValue?: DateRange;
  onClose?: () => void;
  onChange?: (value: DateRange) => void;
  renderActions?: (params: RenderActionsParams) => ReactNode;
} & Omit<PaperProps, 'defaultValue' | 'onChange'>;

type RenderActionsParams = {
  isEmpty: boolean;
  onConfirm: () => void;
};

const today = set(Date.now(), { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
const differenceFromToday = (date: Date | string | number) => differenceInDays(today, date);
const setEndTime = (date: Date) => set(date, { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 });

export const DateCalendarBoard = ({
  defaultValue,
  onChange,
  onClose,
  renderActions,
  sx,
  ...props
}: Props) => {
  const { palette } = useTheme();
  const [defaultStartDate, defaultEndDate] = defaultValue ?? [];
  const [startDate, setStartDate] = useState<Date | null>(defaultStartDate ?? null);
  const [endDate, setEndDate] = useState<Date | null>(defaultEndDate ? new Date(defaultEndDate) : null);
  const [displayDate, setDisplayDate] = useState(defaultEndDate ?? today);

  const handleChangeQuickDateOption = (diffDays: number) => {
    const startDate = set(today, { date: today.getDate() - diffDays });
    setStartDate(startDate);
    setEndDate(today);

    setDisplayDate(today);
  };

  const handleClickUpdate = () => {
    if (startDate == null || endDate == null) return;

    onChange?.([startDate, setEndTime(endDate)]);
  };

  const handleClickPicker = (date: PickerValue) => {
    if (date == null) return;

    if (startDate != null && isSameDay(startDate, date)) {
      return setStartDate(null);
    }
    if (endDate != null && isSameDay(endDate, date)) {
      return setEndDate(null);
    }

    if (startDate == null || isBefore(date, startDate)) {
      return setStartDate(date);
    }

    return setEndDate(date);
  };

  const isEmpty = startDate == null || endDate == null;
  const isMobile = useIsMobile();

  return (
    <Paper
      sx={[{
        overflowY: 'auto',
        backgroundColor: 'white',
        boxShadow:
          '0px 3px 14px 2px rgba(0, 0, 0, 0.12), 0px 8px 10px 1px rgba(0, 0, 0, 0.14), 0px 5px 5px -3px rgba(0, 0, 0, 0.20)',
      },
      ...(Array.isArray(sx) ? sx : [sx])
      ]}
      {...props}
    >
      <Stack direction={isMobile ? 'column' : "row"}>
        <DateCalendar
          value={isMobile ? displayDate : subMonths(displayDate, 1)}
          slots={{
            day: (props) => <DateCalendarDay {...props} value={[startDate, endDate]} />,
            calendarHeader: isMobile ? undefined : DateCalendarHeader.Readonly,
          }}
          slotProps={{
            calendarHeader: { format: 'yyyy년 MM월' },
          }}

          onChange={handleClickPicker}
          onMonthChange={(date) => {
            console.log(date)
            if (isMobile) {
              setDisplayDate(date);
            }
          }}
        />

        <DateCalendar
          value={isMobile ? addMonths(displayDate, 1) : displayDate}
          slots={{
            day: (props) => <DateCalendarDay {...props} value={[startDate, endDate]} />,
            calendarHeader: isMobile ? DateCalendarHeader.Readonly : undefined
          }}
          slotProps={{
            calendarHeader: { format: 'yyyy년 MM월', },
          }}
          defaultValue={displayDate}
          onMonthChange={isMobile ? undefined : (date) => setDisplayDate(date)}
          onChange={handleClickPicker}
          sx={isMobile
            ? {}
            : { borderLeft: `1px solid ${palette.divider}` }}
        />
        {!isMobile && (
          <Menu title="빠른 선택">
            {QuickDateOptions.map(({ days, label }) => (
              <Menu.Item
                key={days}
                actived={!isEmpty && isEqual(differenceFromToday(startDate), days) && isToday(endDate)}
                onClick={() => handleChangeQuickDateOption(days)}
              >
                <Typography variant="body2">{label}</Typography>
              </Menu.Item>
            ))}
          </Menu>
        )}
      </Stack>
      {renderActions ? (
        renderActions({ isEmpty, onConfirm: handleClickUpdate })
      ) : (
        <Stack direction="row"
          position="sticky"
          bottom={0}
          alignItems="flex-end"
          justifyContent="flex-end"
          bgcolor={theme => theme.palette.background.paper}
          sx={{
            width: '100%',
            padding: '8px',
            borderTop: `1px solid ${palette.divider}`,
          }}
        >
          <Button onClick={onClose}>취소</Button>
          <Button variant="contained" onClick={handleClickUpdate} disabled={startDate == null || endDate == null}>
            확인
          </Button>
        </Stack>
      )}

    </Paper>
  );
};

