import { Suspense, type ComponentProps } from "react";
import { EditableText } from "~shared/components/EditableText";
import { useTrip } from "../useTrip";

interface Props extends ComponentProps<typeof EditableText> {
  tripId: string;
}

export function TripNameEditableText(props: Props) {
  return (
    <Suspense fallback={<EditableText renderEditField={props => <EditableText.Field disabled {...props} />} />}>
      <Resolved {...props} />
    </Suspense>
  )
}

function Resolved({ tripId, ...props }: Props) {
  const { data: trip, update } = useTrip(tripId);

  return (
    <EditableText
      defaultValue={trip.name}

      onSubmit={(name) => update.mutate({ name })}
      {...props}
    />
  )
}