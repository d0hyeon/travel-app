import ClearIcon from '@mui/icons-material/Clear';
import DateRangeIcon from '@mui/icons-material/DateRange';
import { Box, Dialog, InputAdornment, TextField, useTheme, type TextFieldProps } from '@mui/material';
import { formatDate } from 'date-fns';
import { useEffect, useState, type ReactNode } from 'react';
import { useIsMobile } from '~shared/hooks/useIsMobile';
import { DateCalendarBoard } from './DateCalendarBoard';
import { Popover } from './Popover';
import { type DateRange } from './type';

type Props = Omit<TextFieldProps, 'onChange' | 'value' | 'defaultValue'> & {
  value?: DateRange;
  defaultValue?: DateRange;
  onChange?: (value: DateRange) => void;
  onClear?: () => void;
  format?: (date: Date) => string;
  width?: string | number;
  endAdornment?: ReactNode;
};

export const DateRangePicker = ({
  value: _value,
  defaultValue,
  format = (date: Date) => formatDate(date, 'yyyy/MM/dd'),
  onChange,
  onClear,
  fullWidth,
  width,
  endAdornment,
  ...props
}: Props) => {
  const { palette } = useTheme();
  const [innerValue, setInnerValue] = useState<DateRange | null>(_value ?? defaultValue ?? null);
  const [datePickerAnchorEl, setDatePickerAnchorEl] = useState<HTMLDivElement | null>(null);

  const handleChange = (value: DateRange) => {
    setInnerValue(value);
    onChange?.(value);
    setDatePickerAnchorEl(null);
  };

  const value = _value == null ? innerValue : _value;
  const formattedValue = value ? `${format(value[0])} - ${format(value[1])}` : '';

  useEffect(() => {
    setInnerValue(_value ?? defaultValue ?? null);
  }, [_value]);
  const isMobile = useIsMobile();

  return (
    <>
      <TextField
        {...props}
        value={formattedValue}
        sx={fullWidth ? {} : { width }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <DateRangeIcon sx={{ color: palette.action.active }} />
            </InputAdornment>
          ),
          endAdornment: endAdornment ??
            (value != null ? (
              <InputAdornment
                position="end"
                onClick={(event) => {
                  event.stopPropagation();
                  setInnerValue(null);
                  onClear?.();
                }}
              >
                <ClearIcon fontSize="small" />
              </InputAdornment>
            ) : (
              <Box width={28} />

            )),

          sx: { ':hover': { cursor: 'pointer' } },
          readOnly: true,
        }}
        fullWidth={fullWidth}
        onClick={(event) => setDatePickerAnchorEl(event.currentTarget)}
      />
      {isMobile ? (
        <Dialog
          open={!!datePickerAnchorEl}
          onClose={() => setDatePickerAnchorEl(null)}
          fullWidth
          slotProps={{
            paper: {
              sx: {
                width: '90vw !important',
                height: '90dvh'
              }
            }
          }}
        >
          <DateCalendarBoard
            defaultValue={value ?? defaultValue}
            onClose={() => setDatePickerAnchorEl(null)}
            onChange={handleChange}
          />
        </Dialog>
      ) : (
        <Popover
          open={!!datePickerAnchorEl}
          anchorEl={datePickerAnchorEl}
          onClose={() => setDatePickerAnchorEl(null)}
        >
          <DateCalendarBoard
            defaultValue={value ?? defaultValue}
            onClose={() => setDatePickerAnchorEl(null)}
            onChange={handleChange}
          />
        </Popover>
      )}

    </>
  );
};

