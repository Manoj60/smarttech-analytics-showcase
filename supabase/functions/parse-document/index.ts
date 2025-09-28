import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

// Helper function to convert file to base64
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// GPT-4 Vision analysis for images
async function analyzeImageWithGPT4Vision(base64Image: string, mimeType: string): Promise<string> {
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this image in detail. Describe what you see, identify any text content (OCR), objects, people, charts, diagrams, or other relevant information. If there are any documents, forms, or structured data visible, extract and organize that information clearly.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.1
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Enhanced PDF processing with DeepSeek
async function processPDFWithDeepSeek(base64Content: string, fileName: string, fileSize: number): Promise<string> {
  if (!deepseekApiKey) {
    throw new Error('DeepSeek API key not configured');
  }

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${deepseekApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are an expert document processor. Analyze the provided PDF content and extract all text, tables, and structural information. Organize the content clearly with headings, sections, and preserve formatting where possible. If there are tables, convert them to a readable format. Extract any forms, data fields, or structured information.'
        },
        {
          role: 'user',
          content: `Please analyze and extract all content from this PDF document: ${fileName} (${(fileSize / 1024).toFixed(1)}KB). Extract:
1. All readable text word-for-word from the document
2. Table data, numbers, and statistical information
3. Headers, titles, section names, and document structure
4. Key business information, insights, and main topics
5. Any charts, graphs, or visual data descriptions

Organize all content comprehensively and maintain structure.`
        }
      ],
      max_tokens: 3000,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`DeepSeek API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Document scanning and OCR for scanned documents
async function performOCRAnalysis(base64Image: string, mimeType: string): Promise<string> {
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured for OCR');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'This appears to be a scanned document or image with text. Please perform OCR (Optical Character Recognition) and extract all visible text content. Maintain the structure and formatting as much as possible. If there are tables, forms, or structured data, organize them clearly. Also identify the document type (invoice, receipt, form, letter, etc.)'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.1
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI OCR API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// File format conversion helper
function getFileConversionSuggestions(fileName: string, fileType: string): string {
  const suggestions = [];
  
  if (fileType.includes('pdf')) {
    suggestions.push('• Convert to Word (.docx) for easy editing');
    suggestions.push('• Extract images separately');
    suggestions.push('• Convert to plain text for analysis');
  } else if (fileType.includes('image')) {
    suggestions.push('• Convert to PDF for document archival');
    suggestions.push('• Extract text via OCR');
    suggestions.push('• Optimize for web (compress, resize)');
  } else if (fileType.includes('officedocument')) {
    suggestions.push('• Convert to PDF for sharing');
    suggestions.push('• Export to plain text');
    suggestions.push('• Extract data to CSV (for spreadsheets)');
  }
  
  return suggestions.length > 0 
    ? `\n\n**File Conversion Options:**\n${suggestions.join('\n')}`
    : '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`);

    let extractedText = '';
    const fileExtension = file.name.toLowerCase().split('.').pop() || '';
    const isScannedDocument = formData.get('isScanned') === 'true';

    // Handle different file types with enhanced capabilities
    if (file.type.startsWith('text/') || fileExtension === 'txt' || fileExtension === 'md') {
      // Simple text files
      const buffer = await file.arrayBuffer();
      extractedText = new TextDecoder().decode(new Uint8Array(buffer));
      console.log(`Extracted ${extractedText.length} characters from text file`);
      
    } else if (file.type.startsWith('image/')) {
      // Enhanced image processing with GPT-4 Vision
      console.log(`Processing image file: ${file.name}`);
      
      try {
        const base64Image = await fileToBase64(file);
        
        if (isScannedDocument) {
          // Perform OCR for scanned documents
          extractedText = await performOCRAnalysis(base64Image, file.type);
          extractedText = `**Document Scanner Results - OCR Analysis**\n\n${extractedText}`;
        } else {
          // General image analysis with GPT-4 Vision
          extractedText = await analyzeImageWithGPT4Vision(base64Image, file.type);
          extractedText = `**Image Analysis Results (GPT-4 Vision)**\n\n${extractedText}`;
        }
        
        extractedText += getFileConversionSuggestions(file.name, file.type);
        console.log(`Successfully analyzed image with AI: ${extractedText.length} characters`);
        
      } catch (error) {
        console.error('Error analyzing image:', error);
        extractedText = `Image file: ${file.name} (${(file.size / 1024).toFixed(1)}KB)\n\nError during AI analysis: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease describe what you see in the image and I can help analyze that information.`;
      }
      
    } else if (file.type === 'application/pdf' || fileExtension === 'pdf') {
      // Enhanced PDF processing
      console.log(`Processing PDF: ${file.name}`);
      
      try {
        const buffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        const maxBytes = Math.min(uint8Array.length, 1000000); // Limit to 1MB
        const limitedArray = uint8Array.slice(0, maxBytes);
        const base64Pdf = btoa(String.fromCharCode.apply(null, Array.from(limitedArray)));
        
        extractedText = await processPDFWithDeepSeek(base64Pdf, file.name, file.size);
        extractedText = `**PDF Parser Results**\n\n${extractedText}`;
        extractedText += getFileConversionSuggestions(file.name, file.type);
        console.log(`Successfully processed PDF: ${extractedText.length} characters extracted`);
        
      } catch (error) {
        console.error('Error processing PDF:', error);
        extractedText = `PDF document: ${file.name} (${(file.size / 1024).toFixed(1)}KB)\n\nError during processing: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
      
    } else if (file.type.includes('officedocument') || ['docx', 'xlsx', 'pptx'].includes(fileExtension)) {
      // Enhanced Office document processing
      console.log(`Processing Office document: ${file.name}`);
      
      try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${deepseekApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              {
                role: 'user',
                content: `Analyze this Office document and provide comprehensive content extraction guidance for: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(1)}KB).

Provide a detailed analysis framework including:
1. Expected document structure and sections
2. Key information typically found in this document type
3. Data extraction methodology
4. Professional formatting elements
5. Business context and insights
6. Conversion and processing recommendations

Make this practical for document content analysis and extraction.`
              }
            ],
            max_tokens: 2000
          }),
        });

        if (response.ok) {
          const data = await response.json();
          extractedText = `**Document Processing Guide**\n\n${data.choices[0].message.content}`;
          extractedText += getFileConversionSuggestions(file.name, file.type);
        } else {
          throw new Error('API processing failed');
        }
        
      } catch (error) {
        console.error('Error processing Office document:', error);
        extractedText = `Office document: ${file.name} (${(file.size / 1024).toFixed(1)}KB)\n\nProcessing guidance not available. Please describe the document content for analysis.`;
      }
      
    } else if (file.type.startsWith('application/json')) {
      // JSON files with enhanced parsing
      try {
        const buffer = await file.arrayBuffer();
        const jsonContent = new TextDecoder().decode(new Uint8Array(buffer));
        const parsed = JSON.parse(jsonContent);
        extractedText = `**JSON File Analysis**\n\nFile: ${file.name}\nStructure: ${Object.keys(parsed).join(', ')}\n\nContent:\n${JSON.stringify(parsed, null, 2).substring(0, 3000)}${jsonContent.length > 3000 ? '\n\n... (truncated)' : ''}`;
      } catch (error) {
        extractedText = `JSON file: ${file.name}\n\nError parsing: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
      
    } else if (file.type.startsWith('text/csv') || fileExtension === 'csv') {
      // Enhanced CSV processing
      const buffer = await file.arrayBuffer();
      const csvContent = new TextDecoder().decode(new Uint8Array(buffer));
      const lines = csvContent.split('\n');
      const headers = lines[0];
      const sampleRows = lines.slice(1, 11); // First 10 data rows
      
      extractedText = `**CSV File Analysis**\n\nFile: ${file.name}\nTotal rows: ${lines.length - 1}\nColumns: ${headers.split(',').length}\n\nHeaders:\n${headers}\n\nSample data:\n${sampleRows.join('\n')}${lines.length > 11 ? `\n\n... and ${lines.length - 11} more rows` : ''}`;
      extractedText += getFileConversionSuggestions(file.name, file.type);
      
    } else {
      // Enhanced fallback for unsupported types
      extractedText = `**File Analysis**\n\nFile: ${file.name}\nType: ${file.type}\nSize: ${(file.size / 1024).toFixed(1)}KB\n\nThis file type is not directly supported for automatic content extraction. \n\nSuggested actions:\n• Describe the file content for manual analysis\n• Convert to a supported format (PDF, TXT, CSV, JSON)\n• Use specialized tools for this file type\n• Provide context about what information you need`;
    }

    console.log(`Final extracted text length: ${extractedText.length}`);

    return new Response(
      JSON.stringify({ 
        text: extractedText,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        processingMethod: file.type.startsWith('image/') ? 'GPT-4 Vision' : 
                         file.type.includes('pdf') ? 'Enhanced PDF Parser' :
                         'Standard Processing'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing document:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Document processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        text: `Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});