import {
  useSuspenseQuery,
  type UseSuspenseQueryResult,
} from "@tanstack/react-query";
import { createStore, useStoreValue } from "@waylog/react";
import { useEffect } from "react";
import type { UserProfile } from "../../modules/user-profile";
import { getUserProfileById } from "../../modules/user-profile";
import { assert } from "../../utils";
import { getAuthService } from "./auth.service";
import type { AuthSession, AuthUser } from "./auth.types";
import { AuthError } from "./AuthError";

export type Auth = AuthUser & { profile: UserProfile };
export const userQueryKey = (userId: string | undefined) => ["user", userId];
type UseAuthOptions = { required?: boolean };
const sessionStore = createStore<AuthSession | null>(() =>
  getAuthService().readSession(),
);

export function useAuth(options: {
  required: false;
}): UseSuspenseQueryResult<Auth | null>;
export function useAuth(options?: UseAuthOptions): UseSuspenseQueryResult<Auth>;
export function useAuth({ required }: UseAuthOptions = {}) {
  const userSession = useStoreValue(sessionStore);
  if (required) assert(!!userSession, new AuthError());
  return useSuspenseQuery({
    ...sessionProfileQuery(userSession),
    select: (profile) =>
      profile == null || userSession == null
        ? null
        : { ...userSession.user, profile },
  });
}

function sessionProfileQuery(session: AuthSession | null) {
  return {
    queryKey: userQueryKey(session?.user.id),
    queryFn: () =>
      session == null ? null : getUserProfileById(session.user.id),
  };
}

/** 세션은 있으나 프로필이 없는, 아직 가입을 마치지 않은 사용자. */
export function usePendingSignUp(): AuthUser | null {
  const session = useStoreValue(sessionStore);
  const { data: profile } = useSuspenseQuery(sessionProfileQuery(session));
  if (session == null || profile != null) return null;
  return session.user;
}

export function getSession() {
  return sessionStore.getState()?.user ?? null;
}

export function prepareSession() {
  if (sessionStore.resolved) {
    return Promise.resolve();
  }

  sessionStore.preload();
  return sessionStore.promise;
}

/** @deprecated */
export const getAuth = getSession;

export function AuthStateSync() {
  useEffect(
    () =>
      getAuthService().onAuthStateChange((session) => {
        sessionStore.setState(session);
      }),
    [],
  );
  return null;
}
