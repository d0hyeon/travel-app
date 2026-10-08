import { AuthGuard } from "@waylog/domains/clients";
import { AppRoute } from "@waylog/routes";
import { SignedOutRedirect } from "~features/auth/auth-redirect";
import { WaylogWebViewScreen } from "~shared/bridge/WaylogWebViewScreen";

export function AccountSettingScreen() {
  return (
    <AuthGuard fallback={<SignedOutRedirect />}>
      <WaylogWebViewScreen route={AppRoute.계정_설정} />
    </AuthGuard>
  )
}

declare module '~app/routes' {
  interface RouteParamsRegistry {
    [AppRoute.계정_설정]: undefined;
  }
}