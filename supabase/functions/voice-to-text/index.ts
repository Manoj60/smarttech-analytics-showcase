import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Since DeepSeek doesn't provide audio transcription services,
    // we'll rely on the browser's Web Speech API for transcription
    // This function can be used for other processing if needed
    
    const { text } = await req.json()
    
    if (!text) {
      throw new Error('No text data provided')
    }

    // For now, just return the text as-is since we're using browser-based transcription
    // In the future, this could be used for text post-processing with DeepSeek
    return new Response(
      JSON.stringify({ text: text.trim() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})