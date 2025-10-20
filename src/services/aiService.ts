import { GoogleGenAI } from "@google/genai"
import { supabase } from "@/lib/supabase"

interface AdGenerationRequest {
  image: File
  format: 'square' | 'story' | 'landscape'
  tone: 'professional' | 'casual' | 'luxury' | 'playful'
  template: string
  productDescription?: string
  includeVideoEffects?: boolean
  selectedStyle?: string
  skipVariations?: boolean
}

interface AdGenerationResponse {
  id: string
  status: 'pending' | 'completed' | 'failed'
  generatedContent?: {
    imageAnalysis?: {
      productType: string
      colors: string[]
      style: string
      mood: string
      keyFeatures: string[]
      description?: string
      rawAnalysis?: string
    }
    videoUrl?: string
    videoPrompt?: string
    generatedImages?: Array<{
      url: string
      style: string
      description: string
    }>
  }
  error?: string
}

class AIService {
  private openaiApiKey: string
  private googleApiKey: string
  private openaiBaseUrl: string
  private googleGenAI: GoogleGenAI | null = null

  constructor() {
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || ''
    this.googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY || ''
    this.openaiBaseUrl = 'https://api.openai.com/v1'
    
    console.log('🔑 Environment check:')
    console.log('  - OpenAI API Key:', this.openaiApiKey ? '✅ Available' : '❌ Missing')
    console.log('  - Google API Key:', this.googleApiKey ? '✅ Available' : '❌ Missing')
    console.log('  - Google API Key length:', this.googleApiKey.length)
    console.log('  - Google API Key starts with:', this.googleApiKey.substring(0, 10) + '...')
    
    if (this.googleApiKey) {
      console.log('🔑 Initializing Google GenAI')
      try {
        this.googleGenAI = new GoogleGenAI({
          apiKey: this.googleApiKey
        })
        console.log('✅ Google GenAI initialized successfully')
        console.log('✅ Google GenAI object:', !!this.googleGenAI)
        
      } catch (error) {
        console.error('❌ Failed to initialize Google GenAI:', error)
        this.googleGenAI = null
      }
    } else {
      console.warn('⚠️ No Google API key found')
      this.googleGenAI = null
    }
  }


  // Simple wrapper: analyze image then generate video using Veo
  async generateVideoSimple(
    imageFile: File,
    selectedStyle?: string
  ): Promise<{ videoUrl?: string; videoPrompt: string }> {
    // Ensure Google GenAI is available (will throw inside generateVideoWithVeo otherwise)
    const imageBase64 = await this.fileToBase64(imageFile)
    const imageAnalysis = await this.analyzeImageWithGPT4oMini(imageBase64)
    return this.generateVideoWithVeo(imageFile, imageAnalysis, selectedStyle)
  }

  async generateAd(request: AdGenerationRequest): Promise<AdGenerationResponse> {
    try {
      console.log('🚀 Starting AI generation process...')
      
      // Convert image to base64
      const imageBase64 = await this.fileToBase64(request.image)
      
      // Step 1: Analyze image with GPT-4o-mini
      console.log('🔍 Analyzing image...')
      const imageAnalysis = await this.analyzeImageWithGPT4oMini(imageBase64)
      
      // Step 2: Generate style variations with Gemini Flash 2.5 (optional)
      let generatedImages: Array<{url: string, style: string, description: string}> | undefined = undefined
      if (!request.skipVariations) {
        console.log('🎨 Generating image variations...')
        generatedImages = await this.generateImageVariations(request.image, imageAnalysis, request.selectedStyle)
      }
      
      // Step 3: Generate video with Google Veo 3.1
      let videoUrl = undefined
      let videoPrompt = undefined
      
      if (request.includeVideoEffects && this.googleGenAI) {
        console.log('🎬 Generating video...')
        const videoResult = await this.generateVideoWithVeo(request.image, imageAnalysis, request.selectedStyle)
        videoUrl = videoResult.videoUrl
        videoPrompt = videoResult.videoPrompt
        console.log('✅ Video URL:', videoUrl)
      }
      
      return {
        id: `gen_${Date.now()}`,
        status: 'completed',
        generatedContent: {
          imageAnalysis,
          videoUrl,
          videoPrompt,
          generatedImages
        }
      }
    } catch (error) {
      console.error('❌ AI generation error:', error)
      return {
        id: `gen_${Date.now()}`,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1])
      }
      reader.onerror = error => reject(error)
    })
  }

  private async analyzeImageWithGPT4oMini(imageBase64: string): Promise<any> {
    if (!this.openaiApiKey) {
      console.warn('⚠️ No OpenAI API key, using mock analysis')
      return {
        productType: 'Product',
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
        style: 'Modern',
        mood: 'Professional',
        keyFeatures: ['High quality', 'Contemporary design'],
        description: 'Mock analysis - Add OpenAI API key for real analysis'
      }
    }

    try {
      const response = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert product analyst. Analyze images and provide detailed product insights.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze this product image. Describe the product type, main colors, style, mood, and key features. Be specific and detailed.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          max_tokens: 500,
          temperature: 0.3,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      const analysisText = data.choices[0]?.message?.content || ''
      
      return {
        productType: 'Product',
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
        style: 'Modern',
        mood: 'Professional',
        keyFeatures: ['High quality', 'Contemporary design'],
        description: analysisText,
        rawAnalysis: analysisText
      }
    } catch (error) {
      console.error('❌ Image analysis error:', error)
      throw error
    }
  }

  private async generateVariationPromptsWithOpenAI(
    imageFile: File, 
    imageAnalysis: any
  ): Promise<Array<{name: string, prompt: string, description: string}>> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not available')
    }

    try {
      const imageBase64 = await this.fileToBase64(imageFile)
      
      const response = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a creative AI assistant that generates image variation prompts for product photography. 
              Analyze the uploaded product image and create 3 distinct, creative prompts for generating different visual styles of the same product.
              
              Return your response as a JSON array with this exact format:
              [
                {
                  "name": "Style Name",
                  "prompt": "Detailed prompt for image generation",
                  "description": "Brief description of the style"
                }
              ]
              
              Make the prompts creative, specific, and focused on different visual approaches like lighting, composition, colors, mood, or artistic style.`
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this product image and create 3 creative variation prompts. The product appears to be: ${imageAnalysis.productType || 'a product'}. 
                  Current style: ${imageAnalysis.style || 'unknown'}, Mood: ${imageAnalysis.mood || 'unknown'}.
                  
                  Create 3 distinct visual styles that would showcase this product in different ways. Focus on:
                  1. Different lighting setups
                  2. Various color schemes
                  3. Different compositions or angles
                  4. Various moods or atmospheres
                  
                  Make each prompt detailed and specific for image generation.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
          temperature: 0.8,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      const responseText = data.choices[0]?.message?.content || ''
      
      // Parse JSON response
      let cleanResponse = responseText.trim()
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      const prompts = JSON.parse(cleanResponse)
      
      // Validate and ensure we have exactly 3 prompts
      if (Array.isArray(prompts) && prompts.length >= 3) {
        return prompts.slice(0, 3).map((p: any) => ({
          name: p.name || 'Generated Style',
          prompt: p.prompt || 'Transform this product with creative styling',
          description: p.description || 'AI-generated variation'
        }))
      } else {
        throw new Error('Invalid response format from OpenAI')
      }
    } catch (error) {
      console.error('❌ OpenAI prompt generation error:', error)
      throw error
    }
  }

  async generateImageVariations(
    imageFile: File, 
    imageAnalysis: any, 
    selectedStyle?: string,
    userId?: string
  ): Promise<Array<{url: string, style: string, description: string}>> {
    console.log('🎨 Starting image variation generation...')
    console.log('🔑 Google API Key available:', !!this.googleApiKey)
    console.log('🔑 OpenAI API Key available:', !!this.openaiApiKey)
    console.log('🤖 Google GenAI initialized:', !!this.googleGenAI)
    
    // First, try to generate creative prompts using OpenAI
    let variationPrompts: Array<{name: string, prompt: string, description: string}> = []
    
    if (this.openaiApiKey) {
      try {
        console.log('🎨 Generating creative prompts with OpenAI...')
        variationPrompts = await this.generateVariationPromptsWithOpenAI(imageFile, imageAnalysis)
        console.log('🎨 Generated prompts:', variationPrompts)
      } catch (error) {
        console.warn('⚠️ Failed to generate prompts with OpenAI:', error)
      }
    }
    
    // Fallback to default prompts if OpenAI fails
    if (variationPrompts.length === 0) {
      console.log('🎨 Using default variation prompts')
      variationPrompts = [
        {
          name: 'Modern Minimal',
          prompt: 'Transform this product into a modern minimal style with clean lines, soft colors, and contemporary design. Keep the product recognizable but apply minimalist aesthetics.',
          description: 'Clean and contemporary design'
        },
        {
          name: 'Bold Dynamic',
          prompt: 'Transform this product into a bold dynamic style with vibrant colors, strong contrast, and energetic composition. Keep the product recognizable but apply dynamic visual impact.',
          description: 'Strong visual impact'
        },
        {
          name: 'Luxury Premium',
          prompt: 'Transform this product into a luxury premium style with elegant lighting, rich tones, and sophisticated composition. Keep the product recognizable but apply high-end aesthetics.',
          description: 'High-end aesthetic'
        }
      ]
    }
    
    // Don't include the original image - only show AI-generated variations
    const originalUrl = URL.createObjectURL(imageFile)
    const generatedImages: Array<{url: string, style: string, description: string}> = []
    
    // Only proceed if Google API is available
    if (!this.googleGenAI || !this.googleApiKey) {
      console.error('❌ Google GenAI not available - cannot generate images')
      console.error('❌ Google API Key available:', !!this.googleApiKey)
      console.error('❌ Google GenAI initialized:', !!this.googleGenAI)
      throw new Error('Google API is required for image generation. Please add VITE_GOOGLE_API_KEY to your environment variables.')
    }
    
    console.log('✅ Google API is available, proceeding with real image generation')
    console.log('🔑 Google API Key available:', !!this.googleApiKey)
    console.log('🤖 Google GenAI initialized:', !!this.googleGenAI)

    try {
      console.log('🎨 Generating image variations with Google Gemini...')
      
      // Generate images using the prompts from OpenAI (or default prompts)
      for (const promptData of variationPrompts) {
        try {
          console.log(`🎨 Generating ${promptData.name} variation...`)
          console.log(`🎨 Using prompt: ${promptData.prompt}`)
          
          // Use the exact structure from your working example
          const config = {
            responseModalities: ['IMAGE', 'TEXT'],
          };
          
          const contents = [
            {
              role: 'user',
              parts: [
                {
                  text: promptData.prompt,
                },
              ],
            },
          ];

          console.log('🎨 Calling Google Gemini API with config:', config)
          console.log('🎨 Contents:', JSON.stringify(contents, null, 2))
          
          const response = await this.googleGenAI.models.generateContentStream({
            model: 'gemini-2.5-flash-image',
            config,
            contents,
          });
          
          console.log('🎨 Got response from Google Gemini')

          let imageGenerated = false;
          let fileIndex = 0;
          for await (const chunk of response) {
            console.log('🎨 Processing chunk:', JSON.stringify(chunk, null, 2));
            
            if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
              console.log('🎨 Skipping chunk - no candidates/content/parts');
              continue;
            }
            
            if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
              console.log('🎨 Found inline data in chunk!');
              const fileName = `variation_${promptData.name}_${Date.now()}_${fileIndex++}.png`;
              const inlineData = chunk.candidates[0].content.parts[0].inlineData;
              
              console.log('🎨 Inline data details:', {
                mimeType: inlineData.mimeType,
                dataLength: inlineData.data?.length,
                hasData: !!inlineData.data
              });
              
              if (!inlineData.data) {
                console.warn('⚠️ No data in inlineData');
                continue;
              }
              
              // Convert base64 to Uint8Array (browser compatible)
              const binaryString = atob(inlineData.data);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              console.log('🎨 Bytes created, size:', bytes.length);
              
              // Create blob
              const imageBlob = new Blob([bytes], { type: inlineData.mimeType || 'image/png' });
              console.log('🎨 Blob created, size:', imageBlob.size, 'type:', imageBlob.type);
              
              let imageUrl: string;
              
              // Try to save to Supabase if userId is provided
              if (userId) {
                try {
                  console.log('💾 Attempting to save to Supabase...');
                  imageUrl = await this.saveImageToSupabase(imageBlob, fileName, userId);
                  console.log('✅ Saved to Supabase:', imageUrl);
                } catch (error) {
                  console.warn('⚠️ Failed to save to Supabase, using blob URL:', error);
                  imageUrl = URL.createObjectURL(imageBlob);
                }
              } else {
                imageUrl = URL.createObjectURL(imageBlob);
                console.log('🎨 Created blob URL:', imageUrl);
              }
            
            generatedImages.push({
              url: imageUrl,
                style: promptData.name,
                description: promptData.description
              });
              console.log(`✅ Generated ${promptData.name} variation with URL: ${imageUrl}`);
              
              // Save metadata to database if userId is provided
              if (userId) {
                await this.saveImageVariationToDatabase(
                  userId,
                  promptData.name,
                  promptData.description,
                  imageUrl,
                  promptData.prompt,
                  originalUrl
                );
              }
              
              imageGenerated = true;
              break; // We got an image, move to next style
            } else if (chunk.candidates?.[0]?.content?.parts?.[0]?.text) {
              console.log('🎨 Got text response:', chunk.candidates[0].content.parts[0].text);
            }
          }
          
          if (!imageGenerated) {
            console.error(`❌ No image generated for ${promptData.name}`)
            throw new Error(`Failed to generate image for ${promptData.name}`)
          }
        } catch (styleError) {
          console.error(`❌ Failed to generate ${promptData.name}:`, styleError)
          throw new Error(`Failed to generate image for ${promptData.name}: ${styleError}`)
        }
      }

      console.log('🎨 Final generated images:', generatedImages)
      return generatedImages
      
    } catch (error) {
      console.error('❌ Image generation error:', error)
      throw error
    }
  }


  private async saveImageToSupabase(
    imageBlob: Blob, 
    fileName: string, 
    userId: string
  ): Promise<string> {
    try {
      console.log('💾 Saving image to Supabase storage:', fileName)
      
      const { data, error } = await supabase.storage
        .from('generated-images')
        .upload(`${userId}/${fileName}`, imageBlob, {
          contentType: imageBlob.type,
          upsert: false
        })
      
      if (error) {
        console.error('❌ Error uploading to Supabase:', error)
        throw error
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('generated-images')
        .getPublicUrl(`${userId}/${fileName}`)
      
      console.log('✅ Image saved to Supabase:', urlData.publicUrl)
      return urlData.publicUrl
    } catch (error) {
      console.error('❌ Failed to save image to Supabase:', error)
      throw error
    }
  }

  private async saveImageVariationToDatabase(
    userId: string,
    variationName: string,
    variationDescription: string,
    generatedImageUrl: string,
    promptUsed: string,
    originalImageUrl?: string
  ): Promise<void> {
    try {
      console.log('💾 Saving image variation metadata to database')
      console.log('💾 User ID:', userId)
      console.log('💾 Variation name:', variationName)
      console.log('💾 Generated URL:', generatedImageUrl)
      
      // First, test if the table exists
      const { data: testData, error: testError } = await supabase
        .from('image_variations')
        .select('id')
        .limit(1)
      
      if (testError) {
        console.error('❌ Table does not exist or access denied:', testError)
        console.error('❌ Please run the supabase-setup.sql script first')
        return
      }
      
      const { error } = await supabase
        .from('image_variations')
        .insert({
          user_id: userId,
          original_image_url: originalImageUrl,
          variation_name: variationName,
          variation_description: variationDescription,
          generated_image_url: generatedImageUrl,
          prompt_used: promptUsed
        })
      
      if (error) {
        console.error('❌ Error saving to database:', error)
        throw error
      }
      
      console.log('✅ Image variation metadata saved to database')
    } catch (error) {
      console.error('❌ Failed to save metadata to database:', error)
      // Don't throw - this is not critical for the main flow
    }
  }

  private async generateVideoWithVeo(
    imageFile: File, 
    imageAnalysis: any, 
    selectedStyle?: string
  ): Promise<{videoUrl?: string, videoPrompt: string}> {
    if (!this.googleGenAI) {
      throw new Error('Google GenAI not initialized')
    }

    try {
      const videoPrompt = this.createVideoPrompt(imageAnalysis, selectedStyle)
      console.log('🎬 Video prompt:', videoPrompt)

      const imageBase64 = await this.fileToBase64(imageFile)
      
      console.log('🎬 Starting Veo 3.1 video generation...')
      let operation = await this.googleGenAI.models.generateVideos({
        model: "veo-3.1-generate-preview",
        prompt: videoPrompt,
        image: {
          imageBytes: imageBase64,
          mimeType: imageFile.type,
        },
      })

      console.log('🎬 Polling for video completion...')
      
      // Poll until complete (max 2 minutes)
      const maxAttempts = 12
      let attempts = 0
      
      while (!operation.done && attempts < maxAttempts) {
        console.log(`⏳ Attempt ${attempts + 1}/${maxAttempts}...`)
        await new Promise(resolve => setTimeout(resolve, 10000)) // 10 seconds
        
        operation = await this.googleGenAI.operations.getVideosOperation({
          operation: operation,
        })
        
        attempts++
      }

      if (!operation.done) {
        throw new Error('Video generation timeout')
      }

      console.log('✅ Video generation completed!')
      
      // Extract video URL
      if (operation.response?.generatedVideos?.[0]?.video?.uri) {
        const videoUri = operation.response.generatedVideos[0].video.uri
        console.log('📹 Video URI:', videoUri)

        // Download video and create blob URL
        try {
          // Add API key to URL for authentication (handle existing query string)
          const separator = videoUri.includes('?') ? '&' : '?'
          const videoUrl = `${videoUri}${separator}key=${this.googleApiKey}`
          console.log('📹 Fetching video from:', videoUrl)
          
          const response = await fetch(videoUrl)
          
          if (!response.ok) {
            throw new Error(`Video fetch failed: ${response.status}`)
          }

          const videoBlob = await response.blob()
          const blobUrl = URL.createObjectURL(videoBlob)
          
          console.log('✅ Video blob URL created:', blobUrl)
          
          return {
            videoUrl: blobUrl,
            videoPrompt: videoPrompt
          }
        } catch (fetchError) {
          console.error('❌ Video fetch error:', fetchError)
          throw fetchError
        }
      }
      
      throw new Error('No video generated')
      
    } catch (error) {
      console.error('❌ Video generation error:', error)
      // Return fallback video
      return {
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        videoPrompt: 'Fallback video due to generation error'
      }
    }
  }

  private createVideoPrompt(imageAnalysis: any, selectedStyle?: string): string {
    const { productType, style, mood } = imageAnalysis
    
    const basePrompts = [
      `Elegant showcase of ${productType} with smooth camera movement and professional lighting`,
      `Dynamic 360° rotation of ${productType} with cinematic aesthetics`,
      `Creative reveal of ${productType} with artistic transitions and modern style`
    ]
    
    const selectedPrompt = basePrompts[Math.floor(Math.random() * basePrompts.length)]
    
    let finalPrompt = selectedPrompt
    if (selectedStyle) {
      finalPrompt = `${selectedStyle}: ${selectedPrompt}`
    }
    if (mood) {
      finalPrompt += ` with ${mood} atmosphere`
    }
    
    return finalPrompt
  }

  async generateImageStyles(imageFile: File): Promise<{styles: Array<{name: string, description: string, prompt: string}>}> {
    console.log('🎨 Generating image styles...')
    
    if (!this.googleGenAI) {
      console.warn('⚠️ Google GenAI not available')
      return {
        styles: [
          { name: 'Modern Minimal', description: 'Clean contemporary', prompt: 'modern minimal style' },
          { name: 'Bold Typography', description: 'Strong impact', prompt: 'bold typography style' },
          { name: 'Luxury Premium', description: 'High-end aesthetic', prompt: 'luxury premium style' },
          { name: 'Vibrant Colors', description: 'Eye-catching', prompt: 'vibrant colors style' },
          { name: 'Product Focus', description: 'Feature highlight', prompt: 'product focus style' },
          { name: 'Artistic Creative', description: 'Unique approach', prompt: 'artistic creative style' }
        ]
      }
    }

    try {
      const imageBase64 = await this.fileToBase64(imageFile)
      
      const prompt = `Analyze this product and suggest 6 creative video styles. Return as JSON:
[{"name": "Style Name", "description": "Brief description", "prompt": "video style prompt"}]

Focus on different visual approaches: lighting, angles, colors, mood. Make them diverse and creative.`

      const result = await this.googleGenAI.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [{
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: imageFile.type,
                data: imageBase64
              }
            }
          ]
        }]
      })

      const responseText = result.candidates[0].content.parts[0].text
      
      // Parse JSON response
      let cleanResponse = responseText.trim()
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      const styles = JSON.parse(cleanResponse)
      return { styles }
    } catch (error) {
      console.error('❌ Style generation error:', error)
      return {
        styles: [
          { name: 'Modern Minimal', description: 'Clean contemporary', prompt: 'modern minimal style' },
          { name: 'Bold Typography', description: 'Strong impact', prompt: 'bold typography style' },
          { name: 'Luxury Premium', description: 'High-end aesthetic', prompt: 'luxury premium style' }
        ]
      }
    }
  }
}

export const aiService = new AIService()
export type { AdGenerationRequest, AdGenerationResponse }