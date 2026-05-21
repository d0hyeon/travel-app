import { Box, Button, Chip, Stack, Typography, type BoxProps, type ButtonProps } from "@mui/material";
import type { FormHTMLAttributes, ReactNode } from "react";
import { FormProvider, useController, useForm, useFormContext } from "react-hook-form";
import type { Location } from "~features/location";
import { LocationGroups, LocationOptions } from "~features/location/location.constants";


type Props = {
  multiple?: false;
  defaultValue?: Location;
  onSubmit?: (value: Location) => void;
  children?: ReactNode;
};

type MultipleProps = {
  multiple: true;
  defaultValue?: Location[];
  onSubmit?: (value: Location[]) => void;
  children?: ReactNode;
};

type FormAttributes = Omit<BoxProps<'form'>, 'onSubmit' | 'defaultValue' | 'defaultValues'>

const GroupOptions = LocationGroups.map((group) => ({
  label: group,
  locations: LocationOptions.filter((location) => location.group === group).map(x => x.name),
}))

export function LocationForm(props: (Props | MultipleProps) & FormAttributes) {
  const { defaultValue, onSubmit, ...attr } = normalize(props);

  const form = useForm<{ locations: Location[] }>({
    mode: "onChange",
    defaultValues: { locations: defaultValue },
  });

  const {
    field: { value, onChange: setValue }
  } = useController({
    control: form.control,
    name: 'locations',
    rules: { validate: (value) => value.length >= 1 },
    defaultValue: []
  });

  const toggle = (curr: Location) => {
    if (props.multiple) {
      const isSelected = value.some((name) => name === curr)
      setValue(isSelected
        ? value.filter(name => curr !== name)
        : [...value, curr]
      )
    } else {
      setValue([curr]);
    }
  }

  return (
    <FormProvider {...form}>
      <Box component="form" onSubmit={form.handleSubmit(data => onSubmit?.(data.locations))} {...attr}>
        <Stack spacing={0} px={3} pb={10}>
          <Stack spacing={2.5} mb={3}>
            {GroupOptions.map((group) => (
              <Box key={group.label}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" mb={1}>
                  {group.label}
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {group.locations.map((location) => {
                    const isSelected = value.some((name) => name === location)
                    return (
                      <Chip
                        key={location}
                        label={location}
                        onClick={() => toggle(location)}
                        variant={isSelected ? 'filled' : 'outlined'}
                        color={isSelected ? 'primary' : 'default'}
                        sx={{ cursor: 'pointer' }}
                      />
                    )
                  })}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Stack>
        {props.children}
      </Box>
    </FormProvider>
  )
}

LocationForm.SubmitButton = (props: ButtonProps) => {
  const { formState: { isValid } } = useFormContext()
  return (
    <Button
      {...props}
      type="submit"
      disabled={!isValid || props.disabled}
    />
  )
}

type Normalized = {
  defaultValue?: Location[];
  onSubmit?: (value: Location[]) => void;
  children?: ReactNode;
};

function normalize(props: Props | MultipleProps): Normalized {
  if (props.multiple) {
    return {
      ...props,
      defaultValue: props.defaultValue,
      onSubmit: props.onSubmit,
    };
  }

  return {
    ...props,
    defaultValue: props.defaultValue
      ? [props.defaultValue]
      : undefined,

    onSubmit: props.onSubmit
      ? (value) => props.onSubmit?.(value[0])
      : undefined,
  };
}