import type { Location } from '@waylog/domains/modules/location'
import { LocationGroups, LocationOptions } from '@waylog/domains/modules/location'
import { createContext, useContext, useState, type ReactNode } from 'react'
import { ScrollView } from 'react-native'
import { Box, Chip, Stack, Typography } from '~/shared/components/design-system'
import { Button } from '~/shared/components/design-system'

// 웹 LocationForm 과 같은 공개 인터페이스를 유지한다.
// 웹은 react-hook-form 으로 유효성을 다루지만 값이 배열 하나뿐이라
// 앱은 상태 하나로 같은 동작을 낸다.
type Props = {
  multiple?: false
  defaultValue?: Location
  onSubmit?: (value: Location) => void
  children?: ReactNode
}

type MultipleProps = {
  multiple: true
  defaultValue?: Location[]
  onSubmit?: (value: Location[]) => void
  children?: ReactNode
}

const GroupOptions = LocationGroups.map((group) => ({
  label: group,
  locations: LocationOptions.filter((location) => location.group === group).map((x) => x.name),
}))

// 웹의 useFormContext 와 같은 역할 — SubmitButton 이 폼 상태를 스스로 읽는다.
interface LocationFormContextValue {
  isValid: boolean
  submit: () => void
}

const LocationFormContext = createContext<LocationFormContextValue | null>(null)

export function LocationForm(props: Props | MultipleProps) {
  const [value, setValue] = useState<Location[]>(() => toInitialValue(props))

  const toggle = (current: Location) => {
    if (props.multiple) {
      const isSelected = value.some((name) => name === current)
      setValue(isSelected ? value.filter((name) => current !== name) : [...value, current])
      return
    }
    setValue([current])
  }

  const submit = () => {
    if (props.multiple) {
      props.onSubmit?.(value)
      return
    }
    props.onSubmit?.(value[0])
  }

  return (
    <LocationFormContext value={{ isValid: value.length >= 1, submit }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <Stack gap={2.5}>
          {GroupOptions.map((group) => (
            <Box key={group.label}>
              <Typography variant="caption" color="text.secondary" style={{ marginBottom: 8 }}>
                {group.label}
              </Typography>
              <Stack direction="row" gap={1} style={{ flexWrap: 'wrap' }}>
                {group.locations.map((location) => {
                  const isSelected = value.some((name) => name === location)

                  return (
                    <Chip
                      key={location}
                      label={location}
                      onPress={() => toggle(location)}
                      variant={isSelected ? 'filled' : 'outlined'}
                      color={isSelected ? 'primary' : 'default'}
                    />
                  )
                })}
              </Stack>
            </Box>
          ))}
        </Stack>
      </ScrollView>
      {props.children}
    </LocationFormContext>
  )
}

LocationForm.SubmitButton = function SubmitButton({ children }: { children?: ReactNode }) {
  const context = useContext(LocationFormContext)
  if (context == null) throw new Error('LocationForm.SubmitButton 은 LocationForm 안에서만 쓸 수 있습니다.')

  return (
    <Button fullWidth variant="contained" size="large" disabled={!context.isValid} onPress={context.submit}>
      {children}
    </Button>
  )
}

function toInitialValue(props: Props | MultipleProps): Location[] {
  if (props.multiple) return props.defaultValue ?? []
  return props.defaultValue ? [props.defaultValue] : []
}
