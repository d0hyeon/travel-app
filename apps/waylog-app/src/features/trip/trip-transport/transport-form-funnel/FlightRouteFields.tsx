import { Controller, useController, type Control, type UseFormSetValue } from 'react-hook-form'
import { Pressable, View } from 'react-native'
import { TextField } from '~/shared/components/design-system'
import { FieldPair, PairSlot, RouteArrow } from './scheduleFieldParts'
import { useAirportSelectOverlay } from './useAirportSelectOverlay'
import type { TransportFormValues } from './transportFormFunnel.types'

interface Props {
  control: Control<TransportFormValues>
  setValue: UseFormSetValue<TransportFormValues>
}

// 공항을 고르는 일과 그 결과를 폼에 반영하는 일은 항공 여정의 책임이다.
// 밖에서 콜백으로 받으면 호출부마다 setValue 세 줄을 다시 적게 된다.
export function FlightRouteFields({ control, setValue }: Props) {
  const airportSelect = useAirportSelectOverlay()

  // 실시간 상태 매칭이 기대하는 값은 이름이 아니라 코드다.
  useController({ control, name: 'departureAirportCode', rules: { required: true } })
  useController({ control, name: 'arrivalAirportCode', rules: { required: true } })

  // shouldValidate 가 없으면 다 채워도 isValid 가 그대로라 버튼이 잠긴다.
  const selectDeparture = async () => {
    const airport = await airportSelect.open('출발 공항 선택')
    if (airport == null) return

    setValue('departureName', airport.nameKo, { shouldValidate: true })
    setValue('departureAirportCode', airport.code, { shouldValidate: true })
    setValue('departureTimezone', airport.timezone, { shouldValidate: true })
  }

  const selectArrival = async () => {
    const airport = await airportSelect.open('도착 공항 선택')
    if (airport == null) return

    setValue('arrivalName', airport.nameKo, { shouldValidate: true })
    setValue('arrivalAirportCode', airport.code, { shouldValidate: true })
    setValue('arrivalTimezone', airport.timezone, { shouldValidate: true })
  }

  return (
    <FieldPair label="여정">
      <Controller
        control={control}
        name="departureName"
        rules={{ required: true }}
        render={({ field, fieldState }) => (
          <PairSlot hasError={fieldState.invalid}>
            <SelectedAirport
              placeholder="출발 공항"
              value={field.value}
              onPress={selectDeparture}
            />
          </PairSlot>
        )}
      />
      <RouteArrow />
      <Controller
        control={control}
        name="arrivalName"
        rules={{ required: true }}
        render={({ field, fieldState }) => (
          <PairSlot hasError={fieldState.invalid}>
            <SelectedAirport placeholder="도착 공항" value={field.value} onPress={selectArrival} />
          </PairSlot>
        )}
      />
    </FieldPair>
  )
}

// 목록에서 고르는 필드는 키보드를 띄우지 않는다. editable 만 끄면 TextInput 이
// 탭을 삼켜 Pressable 까지 닿지 않으므로 pointerEvents 로 넘긴다.
function SelectedAirport({
  placeholder,
  value,
  onPress,
}: {
  placeholder: string
  value: string
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress}>
      <View pointerEvents="none">
        <TextField placeholder={placeholder} value={value} editable={false} />
      </View>
    </Pressable>
  )
}
