import { createClient } from '@supabase/supabase-js';
import { createHttpClient } from '~shared/libs/createHttpClient';
import type { Database } from './_database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 환경변수가 설정되지 않았습니다.')
}

export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || ''
)

export const apiClient = createHttpClient({
  baseUrl: supabaseUrl,
  beforeRequest: (request) => {
    request.headers.set('Authorization', `Bearer ${supabaseAnonKey}`);
    return request;
  }
})