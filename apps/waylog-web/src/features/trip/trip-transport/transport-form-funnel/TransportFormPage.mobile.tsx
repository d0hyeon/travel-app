import { Alert, AlertTitle, Box, CircularProgress, Container, Paper, Typography } from '@mui/material'
import { Suspense } from 'react'
import { SwitchCase } from '~shared/components/SwitchCase'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { TransportTicketStepMobile } from '../transport-ticket/TransportTicketStep.mobile'
import { TransportFormStepIndicator } from './TransportFormStepIndicator'
import { TransportStepMobile } from './TransportStep.mobile'
import { TransportTypeStep } from './TransportTypeStep'
import { useTransportFormFunnel } from './useTransportFormFunnel'

export function TransportFormPageMobile() {
  const { currentStep, stepIndex, form, update, goNext, submit, isSubmitting, error, tripId } =
    useTransportFormFunnel()

  return (
    <Box minHeight="100dvh" display="flex" flexDirection="column" overflow="auto" bgcolor="background.default">
      <Container maxWidth="sm" disableGutters sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Paper sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <TopNavigation position="sticky" rightElement={<TransportFormStepIndicator stepIndex={stepIndex} />}>
            <Typography fontSize={16} fontWeight={700}>탑승권</Typography>
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
                    <TransportStepMobile
                      type={form.type}
                      defaultValues={form}
                      onNext={(detail) => {
                        update(detail)
                        goNext()
                      }}
                    />
                  ),
                ticket: () =>
                  form.type != null && (
                    <TransportTicketStepMobile
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
        </Paper>
      </Container>
    </Box>
  )
}

export default TransportFormPageMobile
