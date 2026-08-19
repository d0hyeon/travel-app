import { type User } from '@supabase/supabase-js';
import { useQueryClient, useSuspenseQuery, type UseQueryOptions, type UseSuspenseQueryResult } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../api';
import { queryClient } from '../query';
import { updateProfile } from './auth.api';
import { assert } from '../utils';
import { AuthError } from './AuthError';
import { getUserProfileById } from '../user-profile';
import type { UserProfile } from '../user-profile';

export type Auth = User & {
  profile: UserProfile;
}

type UseAuthOptions = {
  required?: boolean;
}

export function useAuth(options: { required: false }): UseSuspenseQueryResult<Auth | null>
export function useAuth(options?: UseAuthOptions): UseSuspenseQueryResult<Auth>
export function useAuth({ required }: UseAuthOptions = {}) {
  const { data, ...queries } = useSuspenseQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user == null) return null;

      const profile = await getUserProfileById(session.user.id);
      if (profile == null) return null;

      return { ...session.user, profile };
    },
    ...REFETCH_LOCK_OPTIONS
  });
  if (required) {
    assert(!!data, new AuthError());
  }

  return { data, ...queries }
}
export function getAuth() {
  const auth = queryClient.getQueryData<Auth | null>(['auth']);

  return auth ?? null;
}


/** 앱 전체에서 한 번만 마운트해야 함 (root.tsx) */
export function AuthStateSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth
      .onAuthStateChange(async (event, session) => {
        if (session?.user == null) {
          queryClient.setQueryData<User | null>(['auth'], null);
          return;
        }
        
        queryClient.setQueryData<User | null>(['auth'], (curr) => {
          if (curr == null) return session.user;
          return { ...curr, ...session.user }
        });
        
        if (event === 'USER_UPDATED' && session?.user != null) {
          const meta = session.user.user_metadata;
          const name = meta.nickname ?? meta.name ?? meta.full_name ?? '';
          const avatarUrl = meta.picture ?? meta.avatar_url ?? null;

          await updateProfile({ id: session.user.id, name, avatar: avatarUrl });
        }
      });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}

const REFETCH_LOCK_OPTIONS = {
  refetchOnMount: false,
  refetchInterval: false,
  refetchIntervalInBackground: false,
  refetchOnReconnect: false,
  refetchOnWindowFocus: false,
  staleTime: Infinity,
  gcTime: Infinity,
} satisfies Partial<UseQueryOptions>;