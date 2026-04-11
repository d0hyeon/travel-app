import type { User } from '@supabase/supabase-js';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { supabase } from '~api/client';
import { updateProfile } from './auth.api';
import { arrayIncludes } from '~shared/utils/types';

export function useAuth() {
  const query = useSuspenseQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      const {
        data: { session },
        error
      } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }

      return session?.user ?? null;
    },
    refetchOnMount: false,
    refetchInterval: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const queryClient = useQueryClient();
  const setData = useCallback((user: User | null) => {
    queryClient.setQueryData<User | null>(['auth'], user);
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth
      .onAuthStateChange(async (event, session) => {
        setData(session?.user ?? null);
        
        if (arrayIncludes(IN_AUTH_STATUSES, event)) { 
          if (session == null) return;
          const meta = session.user.user_metadata
          const name = meta.nickname ?? meta.name ?? meta.full_name ?? '';
          const avatarUrl = meta.picture ?? meta.avatar_url ?? null

          await updateProfile({ id: session.user.id, name, avatar: avatarUrl })
        }
      })
    

    return () => subscription.unsubscribe()
  }, [])

  return query;
}

const IN_AUTH_STATUSES = ['INITIAL_SESSION', 'SIGNED_IN', 'USER_UPDATED'] as const;