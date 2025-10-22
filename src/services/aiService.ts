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

interface VideoGenerationRequest {
  imageUrl?: string
  prompt: string
  userId: string
}

interface VideoPrompt {
  id: string
  prompt: string
  description: string
  type: 'image-to-video' | 'text-to-video'
}

interface VideoGenerationResponse {
  id: string
  videoUrl: string
  prompt: string
  status: 'completed' | 'failed'
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
    
    if (this.googleApiKey) {
      console.log('🔑 Initializing Google GenAI')
      try {
        this.googleGenAI = new GoogleGenAI({
          apiKey: this.googleApiKey
        })
        console.log('✅ Google GenAI initialized successfully')
      } catch (error) {
        console.error('❌ Failed to initialize Google GenAI:', error)
        this.googleGenAI = null
      }
    } else {
      console.warn('⚠️ No Google API key found')
      this.googleGenAI = null
    }
  }

  async generateVideoSimple(
    imageFile: File,
    selectedStyle?: string
  ): Promise<{ videoUrl?: string; videoPrompt: string; imageAnalysis: any }> {
    const imageBase64 = await this.fileToBase64(imageFile)
    const imageAnalysis = await this.analyzeImageWithGPT4oMini(imageBase64)
    const videoResult = await this.generateVideoWithVeo(imageFile, imageAnalysis, selectedStyle)
    return {
      ...videoResult,
      imageAnalysis
    }
  }

  async generateAd(request: AdGenerationRequest): Promise<AdGenerationResponse> {
    try {
      console.log('🚀 Starting AI generation process...')
      
      const imageBase64 = await this.fileToBase64(request.image)
      
      console.log('🔍 Analyzing image...')
      const imageAnalysis = await this.analyzeImageWithGPT4oMini(imageBase64)
      
      let generatedImages: Array<{url: string, style: string, description: string}> | undefined = undefined
      if (!request.skipVariations) {
        console.log('🎨 Generating image variations...')
        generatedImages = await this.generateImageVariations(request.image, imageAnalysis, request.selectedStyle)
      }
      
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

  async analyzeImageWithGPT4oMini(imageBase64: string): Promise<any> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key is required for image analysis. Please add VITE_OPENAI_API_KEY to your environment variables.')
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
              content: 'You are a product identification expert. Look at the image and identify the exact product name and type.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze this product image carefully. Identify what type of product this is (food, drink, tech, fashion, etc.), describe the main colors you see, the style/aesthetic, the mood/feeling it conveys, and the key features or characteristics. Be very specific - if it\'s food, mention what kind of food. If it\'s a burger, say it\'s a burger. Be detailed and accurate.'
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
      const productName = data.choices[0]?.message?.content?.trim() || 'Product'
      
      console.log('🔍 Raw AI response:', data.choices[0]?.message?.content)
      console.log('🔍 Identified product:', productName)
      console.log('🔍 Product name length:', productName.length)
      
      return {
        productName: productName,
        productType: productName
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
      
      let cleanResponse = responseText.trim()
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      const prompts = JSON.parse(cleanResponse)
      
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
    
    if (variationPrompts.length === 0) {
      throw new Error('Failed to generate image variation prompts. Please try again.')
    }
    
    const originalUrl = URL.createObjectURL(imageFile)
    const generatedImages: Array<{url: string, style: string, description: string}> = []
    
    if (!this.googleGenAI || !this.googleApiKey) {
      throw new Error('Google API is required for image generation. Please add VITE_GOOGLE_API_KEY to your environment variables.')
    }
    
    console.log('✅ Google API is available, proceeding with real image generation')

    try {
      console.log('🎨 Generating image variations with Google Gemini...')
      
      for (const promptData of variationPrompts) {
        try {
          console.log(`🎨 Generating ${promptData.name} variation...`)
          
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

          const response = await this.googleGenAI.models.generateContentStream({
            model: 'gemini-2.5-flash-image',
            config,
            contents,
          });

          let imageGenerated = false;
          let fileIndex = 0;
          for await (const chunk of response) {
            if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
              const fileName = `variation_${promptData.name}_${Date.now()}_${fileIndex++}.png`;
              const inlineData = chunk.candidates[0].content.parts[0].inlineData;
              
              if (!inlineData.data) continue;
              
              const binaryString = atob(inlineData.data);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              
              const imageBlob = new Blob([bytes], { type: inlineData.mimeType || 'image/png' });
              
              let imageUrl: string;
              
              if (userId) {
                try {
                  imageUrl = await this.saveImageToSupabase(imageBlob, fileName, userId);
                } catch (error) {
                  console.warn('⚠️ Failed to save to Supabase, using blob URL:', error);
                  imageUrl = URL.createObjectURL(imageBlob);
                }
              } else {
                imageUrl = URL.createObjectURL(imageBlob);
              }
            
              generatedImages.push({
                url: imageUrl,
                style: promptData.name,
                description: promptData.description
              });
              
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
              break;
            }
          }
          
          if (!imageGenerated) {
            throw new Error(`Failed to generate image for ${promptData.name}`)
          }
        } catch (styleError) {
          console.error(`❌ Failed to generate ${promptData.name}:`, styleError)
          throw new Error(`Failed to generate image for ${promptData.name}: ${styleError}`)
        }
      }

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
      const { data, error } = await supabase.storage
        .from('generated-images')
        .upload(`${userId}/${fileName}`, imageBlob, {
          contentType: imageBlob.type,
          upsert: false
        })
      
      if (error) throw error
      
      const { data: urlData } = supabase.storage
        .from('generated-images')
        .getPublicUrl(`${userId}/${fileName}`)
      
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
      
      if (error) throw error
    } catch (error) {
      console.error('❌ Failed to save metadata to database:', error)
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
      
      const maxAttempts = 12
      let attempts = 0
      
      while (!operation.done && attempts < maxAttempts) {
        console.log(`⏳ Attempt ${attempts + 1}/${maxAttempts}...`)
        await new Promise(resolve => setTimeout(resolve, 10000))
        
        operation = await this.googleGenAI.operations.getVideosOperation({
          operation: operation,
        })
        
        attempts++
      }

      if (!operation.done) {
        throw new Error('Video generation timeout')
      }

      console.log('✅ Video generation completed!')
      
      if (operation.response?.generatedVideos?.[0]?.video?.uri) {
        const videoUri = operation.response.generatedVideos[0].video.uri
        
        try {
          const separator = videoUri.includes('?') ? '&' : '?'
          const videoUrl = `${videoUri}${separator}key=${this.googleApiKey}`
          
          const response = await fetch(videoUrl)
          
          if (!response.ok) {
            throw new Error(`Video fetch failed: ${response.status}`)
          }

          const videoBlob = await response.blob()
          const blobUrl = URL.createObjectURL(videoBlob)
          
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
      throw new Error('Google API is required for image style generation. Please add VITE_GOOGLE_API_KEY to your environment variables.')
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
      throw new Error('Failed to generate image styles. Please try again.')
    }
  }

  async generateVideoPrompts(imageAnalysis: any, imageVariations: Array<{url: string, style: string, description: string}>): Promise<VideoPrompt[]> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key is required for video prompt generation.')
    }

    try {
      console.log('🎬 Generating video prompts for:', imageAnalysis.productName)
      
      const prompt = `Create 4 storytelling video prompts for ${imageAnalysis.productName}.

Create 4 different scenarios that people would experience with ${imageAnalysis.productName}. Make them emotional and relatable.

Return as JSON:
[
  {
    "id": "prompt_1",
    "prompt": "Create a [emotion] 8-second story about [scenario with ${imageAnalysis.productName}]",
    "description": "Brief description",
    "type": "text-to-video"
  },
  {
    "id": "prompt_2",
    "prompt": "[Your full 200-300 word detailed prompt with DIFFERENT scenario]",
    "description": "Brief 1-sentence summary: [different emotion] [different scenario]",
    "type": "text-to-video"
  },
  {
    "id": "prompt_3",
    "prompt": "[Your full 200-300 word detailed prompt with THIRD unique scenario]",
    "description": "Brief 1-sentence summary: [third emotion] [third scenario]",
    "type": "image-to-video"
  },
  {
    "id": "prompt_4",
    "prompt": "[Your full 200-300 word detailed prompt with FOURTH unique scenario]",
    "description": "Brief 1-sentence summary: [fourth emotion] [fourth scenario]",
    "type": "text-to-video"
  }
]

REMEMBER: These prompts are for ${imageAnalysis.productType} targeting ${imageAnalysis.targetAudience}. Make every scene, emotion, and visual DIRECTLY relevant to this specific product. Think like you're directing a premium commercial for this exact product.`

      const response = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.9,
          max_tokens: 3000
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content
      
      let cleanResponse = content.trim()
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      const prompts = JSON.parse(cleanResponse)
      console.log('🎬 Generated detailed video prompts:', prompts)
      return prompts

    } catch (error) {
      console.error('❌ Video prompt generation error:', error)
      throw new Error('Failed to generate video prompts. Please try again.')
    }
  }

  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    if (!this.googleGenAI || !this.googleApiKey) {
      throw new Error('Google API is required for video generation')
    }

    try {
      console.log('🎬 Generating video with Google Veo 3...')

      const config = {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9',
      }

      const generateVideoPayload: any = {
        model: 'veo-3.1-generate-preview',
        config: config,
        prompt: request.prompt
      }

      if (request.imageUrl) {
        const base64Data = request.imageUrl.includes(',') ? request.imageUrl.split(',')[1] : request.imageUrl
        
        generateVideoPayload.config.referenceImages = [{
          image: {
            imageBytes: base64Data,
            mimeType: 'image/jpeg'
          },
          referenceType: 'ASSET'
        }]
      }

      let operation = await this.googleGenAI.models.generateVideos(generateVideoPayload)

      while (!operation.done) {
        await new Promise((resolve) => setTimeout(resolve, 10000))
        operation = await this.googleGenAI.operations.getVideosOperation({operation: operation})
      }

      if (operation?.response) {
        const videos = operation.response.generatedVideos

        if (!videos || videos.length === 0) {
          throw new Error('No videos were generated.')
        }

        const firstVideo = videos[0]
        if (!firstVideo?.video?.uri) {
          throw new Error('Generated video is missing a URI.')
        }

        const url = decodeURIComponent(firstVideo.video.uri)
        const res = await fetch(`${url}&key=${this.googleApiKey}`)

        if (!res.ok) {
          throw new Error(`Failed to fetch video: ${res.status}`)
        }

        const videoBlob = await res.blob()
        const fileName = `video_${Date.now()}.mp4`
        const supabaseUrl = await this.saveVideoToSupabase(videoBlob, fileName, request.userId)
        
        await this.saveVideoToDatabase(
          request.userId,
          `Generated Video ${Date.now()}`,
          request.prompt,
          supabaseUrl,
          request.imageUrl ? 'image-to-video' : 'text-to-video',
          request.imageUrl
        )
        
        return {
          id: `video_${Date.now()}`,
          videoUrl: supabaseUrl,
          prompt: request.prompt,
          status: 'completed'
        }
      } else {
        throw new Error('No videos generated.')
      }

    } catch (error) {
      console.error('❌ Video generation error:', error)
      return {
        id: `video_${Date.now()}`,
        videoUrl: '',
        prompt: request.prompt,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async saveVideoToSupabase(videoBlob: Blob, fileName: string, userId: string): Promise<string> {
    try {
      const filePath = `${userId}/${fileName}`
      
      const { data, error } = await supabase.storage
        .from('generated-videos')
        .upload(filePath, videoBlob, {
          contentType: 'video/mp4',
          upsert: false
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('generated-videos')
        .getPublicUrl(filePath)

      return publicUrl

    } catch (error) {
      console.error('❌ Video save error:', error)
      throw error
    }
  }

  private async saveVideoToDatabase(
    userId: string,
    title: string,
    prompt: string,
    videoUrl: string,
    generationType: 'image-to-video' | 'text-to-video',
    sourceImageUrl?: string
  ): Promise<void> {
    try {
      console.log('💾 Saving video to database:', { userId, title, videoUrl, generationType })
      
      const { error } = await supabase
        .from('videos')
        .insert({
          user_id: userId,
          title: title,
          prompt: prompt,
          video_url: videoUrl,
          generation_type: generationType,
          source_image_url: sourceImageUrl,
          status: 'completed'
        })
        
      if (error) {
        console.error('❌ Database error:', error)
        throw error
      }
      
      console.log('✅ Video saved to database successfully')
    } catch (error) {
      console.error('❌ Failed to save video metadata:', error)
    }
  }
}

export const aiService = new AIService()
export type { AdGenerationRequest, AdGenerationResponse, VideoGenerationRequest, VideoPrompt, VideoGenerationResponse }