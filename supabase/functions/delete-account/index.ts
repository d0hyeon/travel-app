import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { DeleteObjectsCommand, S3Client } from 'https://esm.sh/@aws-sdk/client-s3'
import { revokeAppleAuthorization } from '../_shared/apple.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MAX_KEYS_PER_DELETE = 1000

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID')!,
    secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY')!,
  },
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function deleteStoredFiles(storagePaths: string[]) {
  for (let start = 0; start < storagePaths.length; start += MAX_KEYS_PER_DELETE) {
    const keys = storagePaths.slice(start, start + MAX_KEYS_PER_DELETE)
    await r2.send(new DeleteObjectsCommand({
      Bucket: Deno.env.get('R2_BUCKET_NAME')!,
      Delete: { Objects: keys.map((Key) => ({ Key })) },
    }))
  }
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

  const { appleAuthorizationCode } = await req.json().catch(() => ({}))

  const { data: storagePaths, error: prepareError } = await admin.rpc('prepare_account_deletion', { target_user: user.id })
  if (prepareError) return json({ error: 'Internal Server Error' }, 500)

  if (typeof appleAuthorizationCode === 'string') {
    await revokeAppleAuthorization(appleAuthorizationCode).catch(() => false)
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
  if (deleteError) return json({ error: 'Internal Server Error' }, 500)

  await deleteStoredFiles(storagePaths ?? []).catch(() => undefined)

  return json({ success: true })
})
