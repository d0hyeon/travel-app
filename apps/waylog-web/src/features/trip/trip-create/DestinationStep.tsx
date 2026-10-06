import { BottomActions } from '~shared/components/bottom-sheet/compounds';
import { LocationForm } from '~features/location/LocationForm';
import { LocationOptions, type LocationOption } from '@waylog/domains/modules/location'

export type Destination = LocationOption;


interface Props {
  defaultValue: LocationOption[]
  onNext: (destinations: LocationOption[]) => void
}

export function DestinationStep({ defaultValue, onNext }: Props) {

  return (
    <LocationForm
      defaultValue={defaultValue.map(x => x.name)}
      onSubmit={(locations) => {
        onNext(
          LocationOptions.filter(options => locations.includes(options.name))
        )
      }}
      multiple
    >
      <BottomActions position="fixed" bottom={0} bgcolor="background.paper">
        <LocationForm.SubmitButton size="large" variant="contained" fullWidth>
          다음
        </LocationForm.SubmitButton>
      </BottomActions>
    </LocationForm>
  )
}
