import type { Location } from '@waylog/domains/modules/location'
import { LocationGroups, LocationOptions } from '@waylog/domains/modules/location'
import { useState, type ReactNode } from 'react'
import { ScrollView } from 'react-native'
import { Box, Chip, Stack, Typography } from '../../shared/components/mui'
import { Button } from '../../shared/components/mui'

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

interface RenderActionsParams {
  isValid: boolean
  onSubmit: () => void
}

export function LocationForm(
  props: (Props | MultipleProps) & { renderActions?: (params: RenderActionsParams) => ReactNode },
) {
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
    <>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <Stack gap={2.5}>
          {GroupOptions.map((group) => (
            <Box key={group.label}>
              <Typography variant="caption" color="text.secondary" sx={{ marginBottom: 8 }}>
                {group.label}
              </Typography>
              <Stack direction="row" gap={1} sx={{ flexWrap: 'wrap' }}>
                {group.locations.map((location) => {
                  const isSelected = value.some((name) => name === location)

                  return (
                    <Chip
                      key={location}
                      label={location}
                      onClick={() => toggle(location)}
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
      {props.renderActions?.({ isValid: value.length >= 1, onSubmit: submit })}
      {props.children}
    </>
  )
}

LocationForm.SubmitButton = function SubmitButton({
  isValid,
  onSubmit,
  children,
}: RenderActionsParams & { children?: ReactNode }) {
  return (
    <Button fullWidth variant="contained" size="large" disabled={!isValid} onClick={onSubmit}>
      {children}
    </Button>
  )
}

function toInitialValue(props: Props | MultipleProps): Location[] {
  if (props.multiple) return props.defaultValue ?? []
  return props.defaultValue ? [props.defaultValue] : []
}
