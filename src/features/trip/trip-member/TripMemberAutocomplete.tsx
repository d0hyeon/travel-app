import { Autocomplete, TextField, type AutocompleteProps } from "@mui/material";
import type { PickPartial } from "~shared/utils/types";
import type { TripMember } from "./tripMember.types";
import { useTripMembers } from "./useTripMembers";

type TripMemberAutocompleteProps<
  Multiple extends boolean,
> = Omit<AutocompleteProps<string, Multiple, false, false>, 'options' | 'value' | 'onChange'> & {
  tripId: string;
  value?: Multiple extends true ? string[] : string;
  onChange?: Multiple extends true ? (value: string[]) => void : (value: string) => void;
}

export function TripMemberAutocomplete<Multiple extends boolean = false>({
  tripId,
  multiple,
  value: _value,
  onChange,
  ...props
}: PickPartial<TripMemberAutocompleteProps<Multiple>, 'renderInput'>) {
  const { data: members } = useTripMembers(tripId);

  if (multiple) {
    const value = members.filter((member) => _value?.includes(member.id));

    return (
      <Autocomplete<TripMember, true, false, false>
        value={value}
        options={members}
        multiple={true}
        renderInput={(props) => <TextField {...props} />}
        // @ts-ignore
        getOptionLabel={option => `${option.emoji} ${option.name}`}
        onChange={(_, value) => {
          const ids = value.map(x => x.id);
          // @ts-ignore
          onChange?.(ids);
        }}
        {...props}
      />
    )
  }
  const value = members.find(member => member.id === _value);

  return (
    <Autocomplete<TripMember, false, false, false>
      // @ts-ignore
      getOptionLabel={option => `${option.emoji} ${option.name}`}
      value={value}
      options={members}
      multiple={multiple}
      renderInput={props => <TextField {...props} />}
      onChange={(_, value, __) => {
        // @ts-ignore
        onChange?.(value.id)
      }}
      {...props}
    />
  )
}