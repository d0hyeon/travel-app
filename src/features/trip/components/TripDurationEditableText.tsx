import ClearIcon from '@mui/icons-material/Clear';
import { InputAdornment, Skeleton } from "@mui/material";
import { Suspense, type ComponentProps } from "react";
import { DateRangePicker } from "~shared/components/date-range/DateRangePicker";
import { EditableText } from "~shared/components/EditableText";
import { formatShortDate, formatDisplayDate } from "~shared/utils/formats";
import { useTrip } from "../useTrip";

type Props = {
  tripId: string;
} & ComponentProps<typeof EditableText>;

export function TripDurationEditableText(props: Props) {
  return (
    <Suspense fallback={<Pending />}>
      <Resolved {...props} />
    </Suspense>
  )
}
function Pending() {
  return <Skeleton variant="text" />
}
function Resolved({ tripId, ...props }: Props) {
  const { data: trip, update } = useTrip(tripId);

  return (
    <EditableText
      {...props}
      variant="body1"
      value={`${formatShortDate(trip.startDate)} ~ ${formatShortDate(trip.endDate)}`}
      dismissible={false}
      renderEditField={(props, control) => {
        return (
          <DateRangePicker
            {...props}
            value={[new Date(trip.startDate), new Date(trip.endDate)]}
            onChange={([start, end]) => {
              update.mutateAsync({
                startDate: formatDisplayDate(start),
                endDate: formatDisplayDate(end)
              })
              control.cancelEdit();
            }}
            onClosePicker={control.cancelEdit}
            endAdornment={(
              <InputAdornment position="end" onClick={control.cancelEdit}>
                <ClearIcon sx={{ width: 16 }} />
              </InputAdornment>
            )}
            defaultOpen
          />
        )
      }}
    />
  )
}