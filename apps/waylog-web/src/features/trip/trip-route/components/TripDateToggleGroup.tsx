import { ToggleButton, ToggleButtonGroup, type ToggleButtonGroupProps } from '@mui/material';
import { formatShortDate } from '@waylog/domains/utils';
import { useTripRoutes } from '../useTripRoutes';

interface TripDateToggleGroupProps extends Omit<ToggleButtonGroupProps, 'value' | 'onChange'> {
  tripId: string;
  value: string;
  onChange: (date: string) => void;
}

// 여행 일자를 토글 그룹으로 선택한다. 일자 목록은 내부에서 조회한다.
export function TripDateToggleGroup({ tripId, value, onChange, ...props }: TripDateToggleGroupProps) {
  const { data: { tripDates } } = useTripRoutes(tripId);

  if (tripDates.length <= 1) return null;

  return (
    <ToggleButtonGroup color="primary" value={value} exclusive sx={{ overflowX: 'auto' }} {...props}>
      {tripDates.map((date) => (
        <ToggleButton
          key={date}
          value={date}
          onClick={() => onChange(date)}
          size="small"
          sx={{ paddingInline: 2 }}
          autoFocus={value === date}
        >
          {formatShortDate(date)}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
