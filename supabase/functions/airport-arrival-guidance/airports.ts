import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'

/**
 * 공항 이름·도시는 DB airports 테이블이 단일 소스다. Deno 는 workspace 를
 * 못 읽어 packages/domains 의 findAirport 를 직접 쓸 수 없어 여기서
 * 같은 테이블을 조회한다.
 */
export async function getAirportCityName(
  supabase: SupabaseClient,
  code: string,
): Promise<string | null> {
  const { data } = await supabase.from('airports').select('city_ko').eq('code', code).maybeSingle()
  return data?.city_ko ?? null
}
