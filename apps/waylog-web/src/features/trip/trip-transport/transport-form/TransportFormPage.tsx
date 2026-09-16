import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import {
  Alert,
  AlertTitle,
  Box,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { useLoading } from '@waylog/react'
import { useTripTransport, type TripTransportType } from '@waylog/domains/modules/trip-transport'
import { Suspense, useState, type PropsWithChildren } from 'react'
import { useNavigate, useParams } from 'react-router'
import { uploadTransportTicketImage } from '~features/photo/photo.api'
import { SwitchCase } from '~shared/components/SwitchCase'
import { useQueryParamState } from '~shared/hooks/urls/useQueryParamState'
import { TransportStep } from './TransportStep'
import { TransportTicketStep } from './TransportTicketStep'
import { TransportTypeStep } from './TransportTypeStep'
import {
  TRANSPORT_FORM_STEPS,
  type TransportFormStep,
  type TransportFormValues,
  type TransportTicketDraft,
} from './transportForm.types'

const STEP_TITLE: Record<TransportFormStep, string> = {
  type: '종류 선택',
  detail: '교통편 정보',
  ticket: '탑승권 등록',
}

export default function TransportFormPage() {
  const { tripId = '' } = useParams()
  const navigate = useNavigate()
  const { add, addTicket } = useTripTransport(tripId)
  const [isSubmitting, startSubmit] = useLoading()
  const [error, setError] = useState<unknown>(null)

  const [step, setStep] = useQueryParamState<TransportFormStep>('step', { defaultValue: 'type' })
  const [type, setType] = useState<TripTransportType>()
  const [detail, setDetail] = useState<Partial<TransportFormValues>>()

  const stepIndex = TRANSPORT_FORM_STEPS.indexOf(step)

  const goBack = () => {
    if (stepIndex <= 0) return navigate(-1)
    setStep(TRANSPORT_FORM_STEPS[stepIndex - 1])
  }

  const submit = (tickets: TransportTicketDraft[] = []) => {
    if (type == null || detail == null) return

    startSubmit(async () => {
      try {
        const carrier =
          type === 'flight'
            ? { type, airline: detail.airline, flightNumber: detail.flightNumber }
            : { type, provider: detail.provider, serviceNumber: detail.serviceNumber }

        const created = await add({
          departureName: detail.departureName!,
          arrivalName: detail.arrivalName!,
          departureAt: detail.departureAt!,
          arrivalAt: detail.arrivalAt,
          departureTimezone: detail.departureTimezone,
          arrivalTimezone: detail.arrivalTimezone,
          ...carrier,
        })

        // 티켓 한 장이 행 하나다. 이미지마다 소유자가 다를 수 있다.
        await Promise.all(
          tickets.map(async ({ file, memberId }) => {
            const url = await uploadTransportTicketImage(created.id, file)
            await addTicket({ transportId: created.id, memberId, images: [url] })
          }),
        )

        // 뒤로가기로 퍼널에 되돌아오지 않도록 스텝 히스토리를 덮는다.
        await navigate(`/trip/${tripId}?content=Info&info-tab=transport`, { replace: true })
      } catch (e) {
        setError(e)
      }
    })
  }

  return (
    <Box height="100dvh" display="flex" flexDirection="column" overflow="auto">
      <Container
        maxWidth="sm"
        disableGutters
        sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}
      >
        <TopNavigation>
          <IconButton sx={{ width: 36, height: 36 }} aria-label="뒤로" onClick={goBack}>
            <ChevronLeftIcon />
          </IconButton>
          <Box flex={1} minWidth={0}>
            <Typography variant="caption" color="text.secondary">
              교통편 · {stepIndex + 1}/{TRANSPORT_FORM_STEPS.length}
            </Typography>
            <Typography fontSize={17} fontWeight={700} letterSpacing="-0.3px">
              {STEP_TITLE[step]}
            </Typography>
          </Box>

          <Stack direction="row" gap="4px" alignItems="center">
            {TRANSPORT_FORM_STEPS.map((s, index) => (
              <Box
                key={s}
                sx={{
                  width: index === stepIndex ? 16 : 6,
                  height: 6,
                  borderRadius: '3px',
                  bgcolor: index <= stepIndex ? 'primary.main' : 'action.disabledBackground',
                  transition: 'all .2s',
                }}
              />
            ))}
          </Stack>
        </TopNavigation>

        {!!error && (
          <Alert severity="error">
            <AlertTitle>교통편을 등록하지 못했어요</AlertTitle>
            <Typography variant="caption">{error instanceof Error ? error.message : ''}</Typography>
          </Alert>
        )}

        <Suspense
          fallback={
            <Box display="flex" justifyContent="center" pt={4}>
              <CircularProgress />
            </Box>
          }
        >
          <SwitchCase
            value={step}
            cases={{
              type: () => (
                <TransportTypeStep
                  defaultValue={type}
                  onNext={(next) => {
                    setType(next)
                    setStep('detail')
                  }}
                />
              ),
              detail: () =>
                type != null && (
                  <TransportStep
                    type={type}
                    defaultValues={detail}
                    onNext={(value) => {
                      setDetail(value)
                      setStep('ticket')
                    }}
                  />
                ),
              ticket: () => (
                <TransportTicketStep
                  tripId={tripId}
                  type={type}
                  isSubmitting={isSubmitting}
                  onSkip={() => submit()}
                  onSubmit={submit}
                />
              ),
            }}
          />
        </Suspense>
      </Container>
    </Box>
  )
}

function TopNavigation(props: PropsWithChildren) {
  return (
    <Box
      position="sticky"
      top={0}
      zIndex={20}
      sx={{
        height: 64,
        px: 2,
        py: '14px',
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" alignItems="center" gap={1} height="100%">
        {props.children}
      </Stack>
    </Box>
  )
}
