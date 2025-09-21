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
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      throw new Error('No file provided')
    }

    // Convert file to ArrayBuffer for processing
    const buffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(buffer)
    
    let extractedText = ''

    // Handle different file types
    if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      // Simple text files
      extractedText = new TextDecoder().decode(uint8Array)
    } else if (file.type.startsWith('image/')) {
      // For images, we'll use a simple OCR approach
      // In a real implementation, you might want to use Tesseract.js or similar
      extractedText = `Image file: ${file.name}. For detailed OCR, please use a specialized service.`
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      // PDF files - simplified text extraction
      extractedText = `PDF document: ${file.name}. Content extracted: [PDF parsing would happen here with a proper PDF library]`
    } else if (file.type.includes('officedocument') || file.name.endsWith('.docx') || file.name.endsWith('.xlsx') || file.name.endsWith('.pptx')) {
      // Office documents
      extractedText = `Office document: ${file.name}. Content would be extracted with appropriate parsing library.`
    } else {
      // Fallback for other file types
      extractedText = `File: ${file.name} (${file.type}). Binary file detected - text extraction not available for this format.`
    }

    return new Response(
      JSON.stringify({ text: extractedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing document:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})