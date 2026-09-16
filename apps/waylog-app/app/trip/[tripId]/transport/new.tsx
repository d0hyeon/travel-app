import { AuthGuard } from '@waylog/domains/clients'
import { LoginRedirect } from '../../../../src/features/auth/auth-redirect'
import { TransportCreationScreen } from '../../../../src/features/trip/trip-transport/TransportCreationScreen'

export default function NewTransportRoute() {
  return (
    <AuthGuard fallback={<LoginRedirect />}>
      <TransportCreationScreen />
    </AuthGuard>
  )
}
