import { LocationOptions, type LocationOption } from '@waylog/domains/modules/location'
import { BottomArea } from '../../../shared/components/BottomArea'
import { LocationForm } from '../../location/LocationForm'

export type Destination = LocationOption

interface Props {
  defaultValue: LocationOption[]
  onNext: (destinations: LocationOption[]) => void
}

export function DestinationStep({ defaultValue, onNext }: Props) {
  return (
    <LocationForm
      multiple
      defaultValue={defaultValue.map((x) => x.name)}
      onSubmit={(locations) => {
        onNext(LocationOptions.filter((options) => locations.includes(options.name)))
      }}
      renderActions={(params) => (
        <BottomArea>
          <LocationForm.SubmitButton {...params}>다음</LocationForm.SubmitButton>
        </BottomArea>
      )}
    />
  )
}
