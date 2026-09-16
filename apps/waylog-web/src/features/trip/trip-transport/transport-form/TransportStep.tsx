import { TransportType } from '@waylog/domains/modules/transport'
import type { TripTransportType } from '@waylog/domains/modules/trip-transport'
import { FlightTransportForm } from './FlightTransportForm'
import { TransportForm } from './TransportForm'
import type { TransportFormValues } from './transportForm.types'

interface Props {
  type: TripTransportType
  defaultValues?: Partial<TransportFormValues>
  onNext: (value: TransportFormValues) => void
}

// 종류마다 입력 필드가 다르다. 항공은 편명 조회가 붙고, 기차·버스는
// 사업자 정보가 선택 입력으로 갈린다. 분기는 여기서만 한다.
export function TransportStep({ type, defaultValues, onNext }: Props) {
  if (type === TransportType.항공) {
    return (
      <FlightTransportForm defaultValues={defaultValues} onNext={onNext} />
    )
  }

  return <TransportForm defaultValues={defaultValues} onNext={onNext} />
}
