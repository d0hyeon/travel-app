import { createClient } from '@supabase/supabase-js'
import type { Database } from './_database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 환경변수가 설정되지 않았습니다.')
}

export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || ''
)

type BaseOptions<Data = any> = Omit<RequestInit, 'headers' | 'signal'> & {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  signal?: AbortSignal;
  parse?: (response: Response) => Promise<Data>;
}


export const apiClient = {
  get: async <Data = any>(
    path: string,
    { params, parse = parseData, headers, ...options }: BaseOptions<Data> = {}
  ): Promise<Data> => {
    const baseURL = `${supabaseUrl}/${path}`
    const response = await fetch(
      params ? `${baseURL}${toQueryParams(params)}` : baseURL,
      // RequestInit 타입과 호환되도록 지정
      {
        headers: {
          ...headers,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        ...options
      }
    );

    if (!response.ok) {
      const error = await response.clone().json();
      throw error;
    }
    
    return await parse(response);
  }
}

// 3. Record<any, any> 대신 키 타입을 string으로 제한하여 에러 방지
function toQueryParams(value: Record<string, unknown>) {
  const stringfy = Object.entries(value).reduce((acc, [key, val]) => {
    if (val == null) return acc;
    if (typeof val === 'string' && URL.canParse(val)) {
      return `${acc}&${key}=${encodeURI(val)}`;
    }
    if (Array.isArray(val)) {
      return `${acc}&${key}=${val.join(',')}`;
    }
    return `${acc}&${key}=${String(val)}`;
  }, '');

  if (stringfy === '') return stringfy;
  return `?${stringfy.slice(1)}`;
}

async function parseData(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return await response.json();
  } 
  
  if (contentType.includes('text/')) {
    return await response.text();
  } 
  
  if (
    contentType.includes('image/') || 
    contentType.includes('application/octet-stream') ||
    contentType.includes('application/pdf')
  ) {
    return await response.blob(); 
  }

  return null; 
}