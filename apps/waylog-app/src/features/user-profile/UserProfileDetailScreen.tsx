import { useAppRoute } from '../../shared/hooks/useAppNavigation'
import { AppRoute } from '../../app/AppRoute'
import { UserProfileScreen } from './UserProfileScreen'

export type UserProfileParams = { userId: string; tab?: string }

declare module '~app/routes' {
  interface RouteParamsRegistry {
    [AppRoute.유저_프로필]: UserProfileParams
  }
}

export function UserProfileDetailScreen() {
  const { params } = useAppRoute<typeof AppRoute.유저_프로필>()
  return <UserProfileScreen userId={params.userId} />
}
