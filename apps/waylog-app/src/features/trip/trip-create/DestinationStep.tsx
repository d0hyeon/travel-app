import { LocationOptions, type LocationOption } from '@waylog/domains/modules/location'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomArea } from '../../../shared/components/BottomArea'
import { LocationForm } from '../../location/LocationForm'

export type Destination = LocationOption

// BottomArea 의 상하 패딩 8 + large Button 높이 40
const SUBMIT_AREA_HEIGHT = 56

interface Props {
  defaultValue: LocationOption[]
  onNext: (destinations: LocationOption[]) => void
}

export function DestinationStep({ defaultValue, onNext }: Props) {
  const insets = useSafeAreaInsets()

  return (
    <LocationForm
      multiple
      defaultValue={defaultValue.map((x) => x.name)}
      contentBottomInset={SUBMIT_AREA_HEIGHT + insets.bottom}
      onSubmit={(locations) => {
        onNext(LocationOptions.filter((options) => locations.includes(options.name)))
      }}
    >
      <BottomArea position="fixed" bottom={0}>
        <LocationForm.SubmitButton>다음</LocationForm.SubmitButton>
      </BottomArea>
    </LocationForm>
  )
}
