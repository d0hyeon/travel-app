import { useTripTransport } from '@waylog/domains/modules/trip-transport'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { uploadTransportTicketImage } from '../../photo/photo.api'
import {
  TransportFormFunnel,
  type TransportSubmitValues,
} from './transport-form-funnel/TransportFormFunnel'

const START_STEP = 'type'

export function TransportCreationScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ tripId?: string | string[] }>()
  const tripId = Array.isArray(params.tripId) ? params.tripId[0] : (params.tripId ?? '')

  const { add, addTicket } = useTripTransport(tripId)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [step, setStep] = useState(START_STEP)

  const handleSubmit = async (values: TransportSubmitValues) => {
    setIsSubmitting(true)
    try {
      const carrier =
        values.type === 'flight'
          ? { type: values.type, airline: values.airline, flightNumber: values.flightNumber }
          : { type: values.type, provider: values.provider, serviceNumber: values.serviceNumber }

      const created = await add({
        departureName: values.departureName,
        arrivalName: values.arrivalName,
        departureAt: values.departureAt,
        arrivalAt: values.arrivalAt,
        departureTimezone: values.departureTimezone,
        arrivalTimezone: values.arrivalTimezone,
        ...carrier,
      })

      // 티켓 한 장이 행 하나다. 이미지마다 소유자가 다를 수 있다.
      await Promise.all(
        values.tickets.map(async ({ uri, memberId }) => {
          const url = await uploadTransportTicketImage(created.id, uri)
          await addTicket({ transportId: created.id, memberId, image: url })
        }),
      )

      // 뒤로가기로 퍼널에 되돌아오지 않도록 이 스크린을 목록으로 교체한다.
      router.replace(`/trip/${tripId}`)
    } catch (e) {
      setError(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* 퍼널이 자체 스택을 갖는다. 두 스택에 제스처를 함께 열어두면 같은 스와이프를
          다투어 스텝 백과 퍼널 이탈이 번갈아 일어난다. 첫 스텝에서만 부모가 받는다. */}
      <Stack.Screen options={{ gestureEnabled: step === START_STEP }} />
      <TransportFormFunnel
        tripId={tripId}
        isSubmitting={isSubmitting}
        error={error}
        onStepChange={setStep}
        onSubmit={handleSubmit}
      />
    </>
  )
}
