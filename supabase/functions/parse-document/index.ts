import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const openAIApiKey = Deno.env.get('OPENAI_API_KEY')

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

    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`)

    // Convert file to ArrayBuffer for processing
    const buffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(buffer)
    
    let extractedText = ''

    // Handle different file types
    if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      // Simple text files
      extractedText = new TextDecoder().decode(uint8Array)
      console.log(`Extracted ${extractedText.length} characters from text file`)
    } else if (file.type.startsWith('image/')) {
      // For images, use GPT-4o-mini for vision analysis
      if (!openAIApiKey) {
        extractedText = `Image file: ${file.name}. Unable to analyze - OpenAI API key not configured.`
      } else {
        try {
          // Convert to base64 safely
          const base64Image = btoa(
            uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '')
          )
          const mimeType = file.type || 'image/jpeg'
          
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: 'Extract and analyze this image content with maximum accuracy. Please provide: 1) All visible text word-for-word, 2) Detailed description of visual elements, charts, graphs, tables, 3) Key data points, numbers, statistics, 4) Business insights or important information, 5) Document structure and format details. Be comprehensive and precise in your extraction.'
                    },
                    {
                      type: 'image_url',
                      image_url: {
                        url: `data:${mimeType};base64,${base64Image}`
                      }
                    }
                  ]
                }
              ],
              max_tokens: 1500
            }),
          })

          if (response.ok) {
            const data = await response.json()
            extractedText = data.choices[0].message.content
            console.log(`Successfully analyzed image with AI: ${extractedText.length} characters`)
          } else {
            const error = await response.text()
            console.error('OpenAI API error:', error)
            extractedText = `Image file: ${file.name}. Analysis failed: ${error}`
          }
        } catch (error) {
          console.error('Error analyzing image:', error)
          extractedText = `Image file: ${file.name}. Error during analysis: ${error.message}`
        }
      }
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      // For PDFs, use OpenAI to analyze and extract content
      if (!openAIApiKey) {
        extractedText = `PDF document: ${file.name}. Unable to analyze - OpenAI API key not configured.`
      } else {
        try {
          // Convert first portion of PDF to base64 for AI analysis (limit to prevent memory issues)
          const maxBytes = Math.min(uint8Array.length, 1000000); // Limit to 1MB for processing
          const limitedArray = uint8Array.slice(0, maxBytes);
          const base64Pdf = btoa(String.fromCharCode.apply(null, Array.from(limitedArray)));
          
          console.log(`Processing PDF ${file.name}: ${maxBytes} bytes for AI analysis`);
          
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'user',
                  content: `Analyze this PDF document and extract all textual content with maximum accuracy. Please provide:
                  1. All readable text word-for-word from the document
                  2. Table data, numbers, and statistical information
                  3. Headers, titles, section names, and document structure
                  4. Key business information, insights, and main topics
                  5. Any charts, graphs, or visual data descriptions
                  
                  Document: ${file.name} (${(file.size / 1024).toFixed(1)}KB)
                  
                  Extract and organize all content comprehensively.`
                }
              ],
              max_tokens: 2000
            }),
          });

          if (response.ok) {
            const data = await response.json();
            extractedText = data.choices[0].message.content;
            console.log(`Successfully analyzed PDF with AI: ${extractedText.length} characters extracted`);
          } else {
            const error = await response.text();
            console.error('OpenAI API error for PDF:', error);
            extractedText = `PDF document: ${file.name} (${(file.size / 1024).toFixed(1)}KB). Analysis failed: ${error}`;
          }
        } catch (error) {
          console.error('Error analyzing PDF:', error);
          extractedText = `PDF document: ${file.name}. Error during analysis: ${error.message}`;
        }
      }
    } else if (file.type.includes('officedocument') || file.name.endsWith('.docx') || file.name.endsWith('.xlsx') || file.name.endsWith('.pptx')) {
      // Office documents
      extractedText = `Office document: ${file.name} (${(file.size / 1024).toFixed(1)}KB). Document type: ${file.type}. For detailed analysis, please describe the content or share key sections as text.`
    } else if (file.type.startsWith('application/json')) {
      // JSON files
      try {
        const jsonContent = new TextDecoder().decode(uint8Array)
        const parsed = JSON.parse(jsonContent)
        extractedText = `JSON file: ${file.name}\nStructured data containing: ${Object.keys(parsed).join(', ')}\nContent: ${jsonContent.substring(0, 2000)}${jsonContent.length > 2000 ? '...' : ''}`
      } catch (error) {
        extractedText = `JSON file: ${file.name}. Error parsing: ${error.message}`
      }
    } else if (file.type.startsWith('text/csv') || file.name.endsWith('.csv')) {
      // CSV files
      const csvContent = new TextDecoder().decode(uint8Array)
      const lines = csvContent.split('\n').slice(0, 10) // First 10 lines
      extractedText = `CSV file: ${file.name}\nHeaders and sample data:\n${lines.join('\n')}\n${csvContent.split('\n').length > 10 ? `... and ${csvContent.split('\n').length - 10} more rows` : ''}`
    } else {
      // Fallback for other file types
      extractedText = `File: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(1)}KB). This file type is not directly supported for content extraction. Please describe what information you'd like me to help you with regarding this file.`
    }

    console.log(`Final extracted text length: ${extractedText.length}`)

    return new Response(
      JSON.stringify({ 
        text: extractedText,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      }),
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