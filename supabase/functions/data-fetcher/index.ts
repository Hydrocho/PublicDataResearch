// supabase/functions/data-fetcher/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    if (!url || !url.includes('data.go.kr')) {
      throw new Error('올바른 공공데이터포털 URL이 아닙니다.')
    }

    // 2. Fetch the page from the server (No CORS issue here!)
    const response = await fetch(url)
    const html = await response.text()

    // 3. Extract Metadata via Regex
    const titleMatch = html.match(/<th[^>]*>파일데이터명<\/th>\s*<td[^>]*>(.*?)<\/td>/i) || 
                       html.match(/<title>(.*?) \|/i);
    const providerMatch = html.match(/<th[^>]*>제공기관<\/th>\s*<td[^>]*>(.*?)<\/td>/i);
    const cycleMatch = html.match(/<th[^>]*>업데이트 주기<\/th>\s*<td[^>]*>(.*?)<\/td>/i);

    const result = {
      name: titleMatch ? titleMatch[1].trim() : '알 수 없음',
      provider: providerMatch ? providerMatch[1].replace(/<[^>]*>/g, '').trim() : '알 수 없음',
      cycle: cycleMatch ? cycleMatch[1].trim() : '확인 필요'
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
