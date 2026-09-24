import { useTripTransports } from '@waylog/domains/modules/trip-transport'
import { useEffect, useState } from 'react'
import { useAppNavigation, useAppRoute } from '../../../shared/hooks/useAppNavigation'
import {
  TransportFormFunnel,
  type TransportSubmitValues,
} from './transport-form-funnel/TransportFormFunnel'
import { useTransportTicketUpload } from './transport-ticket/useTransportTicketUpload'

const START_STEP = 'type'

export function TransportCreationScreen() {
  const navigation = useAppNavigation()
  const { params } = useAppRoute<'TransportNew'>()
  const { tripId } = params

  const { add } = useTripTransports(tripId)
  const { upload } = useTransportTicketUpload(tripId)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [step, setStep] = useState(START_STEP)

  // 퍼널이 자체 스택을 갖는다. 두 스택에 제스처를 함께 열어두면 같은 스와이프를
  // 다투어 스텝 백과 퍼널 이탈이 번갈아 일어난다. 첫 스텝에서만 부모가 받는다.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: step === START_STEP })
  }, [navigation, step])

  const handleSubmit = async (values: TransportSubmitValues) => {
    setIsSubmitting(true)
    try {
      const carrier =
        values.type === 'flight'
          ? {
            type: values.type,
            airline: values.airline,
            airlineCode: values.airlineCode,
            flightNumber: values.flightNumber,
          }
          : { type: values.type }

      const created = await add({
        departureName: values.departureName,
        arrivalName: values.arrivalName,
        departureAirportCode: values.departureAirportCode,
        arrivalAirportCode: values.arrivalAirportCode,
        departureAt: values.departureAt,
        arrivalAt: values.arrivalAt,
        departureTimezone: values.departureTimezone,
        arrivalTimezone: values.arrivalTimezone,
        ...carrier,
      })

      await upload({ transportId: created.id, tickets: values.tickets })

      // 뒤로가기로 퍼널에 되돌아오지 않도록 이 스크린을 목록으로 교체한다.
      navigation.replace('TransportDetail', { tripId, transportId: created.id })
    } catch (e) {
      setError(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <TransportFormFunnel
      tripId={tripId}
      isSubmitting={isSubmitting}
      error={error}
      onStepChange={setStep}
      onSubmit={handleSubmit}
    />
  )
}
