import { AppRoute } from '@waylog/routes'
import { AuthGuard } from '@waylog/domains/clients'
import { useAppRoute } from '../../shared/hooks/useAppNavigation'
import { RequireAuthRedirect } from '../auth/auth-redirect'
import { UserProfileScreen } from './UserProfileScreen'

export type UserProfileParams = { userId: string; tab?: string }

declare module '~app/routes' {
  interface RouteParamsRegistry {
    [AppRoute.유저_프로필]: UserProfileParams
  }
}

export function UserProfileDetailScreen() {
  const { params } = useAppRoute<typeof AppRoute.유저_프로필>()
  return (
    <AuthGuard fallback={<RequireAuthRedirect />}>
      <UserProfileScreen userId={params.userId} />
    </AuthGuard>
  )
}
