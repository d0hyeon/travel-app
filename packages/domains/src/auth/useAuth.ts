import { type Session, type User } from "@supabase/supabase-js";
import {
  useSuspenseQuery,
  type UseSuspenseQueryResult,
} from "@tanstack/react-query";
import { createStore, useStoreValue } from "@waylog/react";
import { useEffect } from "react";
import { supabase } from "../api";
import type { UserProfile } from "../user-profile";
import { getUserProfileById } from "../user-profile";
import { assert } from "../utils";
import { updateProfile } from "./auth.api";
import { AuthError } from "./AuthError";

export type Auth = User & {
  profile: UserProfile;
};

type UseAuthOptions = {
  required?: boolean;
};

const sessionStore = createStore<Session | null>(async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
});

export function useAuth(options: {
  required: false;
}): UseSuspenseQueryResult<Auth | null>;
export function useAuth(options?: UseAuthOptions): UseSuspenseQueryResult<Auth>;
export function useAuth({ required }: UseAuthOptions = {}) {
  const userSession = useStoreValue(sessionStore);
  if (required) {
    assert(!!userSession, new AuthError());
  }

  return useSuspenseQuery({
    queryKey: ["user", userSession?.user.id],
    queryFn: () => {
      if (userSession == null) return null;
      return getUserProfileById(userSession.user.id);
    },
    select: (profile) => {
      if (profile == null || userSession == null) return null;
      return { ...userSession.user, profile };
    },
  });
}

export function getSession() {
  const session = sessionStore.getState();
  if (session == null) return null;

  return session.user;
}

/** @deprecated */
export const getAuth = getSession;

/** 앱 전체에서 한 번만 마운트해야 함 (root.tsx) */
export function AuthStateSync() {
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      sessionStore.setState(session);

      if (event === "USER_UPDATED" && session?.user != null) {
        const meta = session.user.user_metadata;
        const name = meta.nickname ?? meta.name ?? meta.full_name ?? "";
        const avatarUrl = meta.picture ?? meta.avatar_url ?? null;

        await updateProfile({ id: session.user.id, name, avatar: avatarUrl });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
