import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const RECENT_SIGN_UP_WINDOW_MS = 60 * 60 * 1000

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405)

  const accessToken = req.headers.get('Authorization')?.replace(/^Bearer /, '')
  if (accessToken == null) return json({ error: 'Unauthorized' }, 401)

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: { user }, error: authError } = await admin.auth.getUser(accessToken)
  if (authError || !user) return json({ error: 'Unauthorized' }, 401)

  const isRecentSignUp = Date.now() - new Date(user.created_at).getTime() < RECENT_SIGN_UP_WINDOW_MS
  if (!isRecentSignUp) return json({ error: 'Forbidden' }, 403)

  const { data: profile, error: profileError } = await admin
    .from('user_profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()
  if (profileError) return json({ error: 'Internal Server Error' }, 500)
  if (profile != null) return json({ error: 'Conflict' }, 409)

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
  if (deleteError) return json({ error: 'Internal Server Error' }, 500)

  return json({ success: true })
})
