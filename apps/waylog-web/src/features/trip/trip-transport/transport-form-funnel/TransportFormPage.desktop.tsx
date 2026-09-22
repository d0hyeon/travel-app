import { Alert, AlertTitle, Box, CircularProgress, Typography } from '@mui/material'
import { Suspense } from 'react'
import { SwitchCase } from '~shared/components/SwitchCase'
import { TopNavigation } from '~shared/components/layout/TopNavigation.desktop'
import { TransportTicketStepDesktop } from '../transport-ticket/TransportTicketStep.desktop'
import { TransportFormStepIndicator } from './TransportFormStepIndicator'
import { TransportStepDesktop } from './TransportStep.desktop'
import { TransportTypeStep } from './TransportTypeStep.desktop'
import { useTransportFormFunnel } from './useTransportFormFunnel'

// 시안 규격: 전체 페이지 퍼널이다. 다이얼로그로 띄우지 않는다.
// 헤더 아래 남는 높이를 각 단계가 본문·푸터로 나눠 쓴다.
export function TransportFormPageDesktop() {
  const { currentStep, stepIndex, form, update, goNext, goBack, submit, isSubmitting, error, tripId } =
    useTransportFormFunnel()

  return (
    <Box height="100dvh" display="flex" flexDirection="column" bgcolor="background.paper">
      <TopNavigation
        leftElement={<TopNavigation.BackButton onClick={goBack} />}
        rightElement={<TransportFormStepIndicator stepIndex={stepIndex} />}
      >
        <Typography variant="h6">교통편 등록</Typography>
      </TopNavigation>

      {!!error && (
        <Alert severity="error">
          <AlertTitle>교통편을 등록하지 못했어요</AlertTitle>
          <Typography variant="caption">{error instanceof Error ? error.message : ''}</Typography>
        </Alert>
      )}

      <Suspense
        fallback={
          <Box flex={1} display="flex" justifyContent="center" pt={4}>
            <CircularProgress />
          </Box>
        }
      >
        <SwitchCase
          value={currentStep}
          cases={{
            type: () => (
              <TransportTypeStep
                defaultValue={form.type}
                onNext={(type) => {
                  update({ type })
                  goNext()
                }}
              />
            ),
            detail: () =>
              form.type != null && (
                <TransportStepDesktop
                  type={form.type}
                  defaultValues={form}
                  onNext={(detail) => {
                    update(detail)
                    goNext()
                  }}
                  onBack={goBack}
                />
              ),
            ticket: () =>
              form.type != null && (
                <TransportTicketStepDesktop
                  tripId={tripId}
                  type={form.type}
                  isSubmitting={isSubmitting}
                  onSkip={() => submit()}
                  onSubmit={(tickets) => submit({ tickets })}
                />
              ),
          }}
        />
      </Suspense>
    </Box>
  )
}

export default TransportFormPageDesktop
