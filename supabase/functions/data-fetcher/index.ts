import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { url } = await req.json()
    console.log('Fetching URL:', url);
    
    // 서버에서 직접 호출 (브라우저인 것처럼 헤더 추가)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) throw new Error(`포털 사이트 응답 오류: ${response.status}`)
    
    const html = await response.text()

    // 추출 로직 (더 유연하게 수정)
    const titleMatch = html.match(/파일데이터명<\/th>\s*<td[^>]*>(.*?)<\/td>/i) || html.match(/<title>(.*?) \|/i);
    const providerMatch = html.match(/제공기관<\/th>\s*<td[^>]*>(.*?)<\/td>/i);
    const cycleMatch = html.match(/업데이트 주기<\/th>\s*<td[^>]*>(.*?)<\/td>/i);

    const result = {
      name: titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : '추출 실패',
      provider: providerMatch ? providerMatch[1].replace(/<[^>]*>/g, '').trim() : '추출 실패',
      cycle: cycleMatch ? cycleMatch[1].replace(/<[^>]*>/g, '').trim() : '추출 실패'
    }

    console.log('Extraction Result:', result);

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('Fetcher Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 200, // 에러 메시지를 안전하게 전달하기 위해 200으로 변경
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
