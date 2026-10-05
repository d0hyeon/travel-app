import { AuthGuard } from "@waylog/domains/clients";
import { SignedOutRedirect } from "~features/auth/auth-redirect";
import { SettingsWebViewScreen } from "./SettingsWebViewScreen";
import { AppRoute } from "@waylog/routes";

export function AccountSettingScreen() {
  return (
    <AuthGuard fallback={<SignedOutRedirect />}>
      <SettingsWebViewScreen path={AppRoute.계정_설정} />
    </AuthGuard>
  )
}

declare module '~app/routes' {
  interface RouteParamsRegistry {
    [AppRoute.계정_설정]: undefined;
  }
}