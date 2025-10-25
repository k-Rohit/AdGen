import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { supabase } from "@/lib/supabase";

interface MarketingPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  hashtags: string[];
  engaging_line: string;
  call_to_action: string;
  tone: string;
  platform: string;
  product_image_url: string;
  image_variations: Array<{
    url: string;
    style: string;
    description: string;
  }>;
  created_at: string;
  updated_at: string;
}

interface MarketingPostRequest {
  userId: string;
  imageFile: File;
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok';
  tone: 'professional' | 'casual' | 'funny' | 'inspiring' | 'urgent';
  brandName?: string;
}

class MarketingPostService {
  private openai: OpenAI;
  private googleGenAI: GoogleGenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });

    this.googleGenAI = new GoogleGenAI({
      apiKey: import.meta.env.VITE_GOOGLE_API_KEY
    });
  }

  async generateMarketingPost(request: MarketingPostRequest): Promise<MarketingPost> {
    try {
      console.log('🚀 Starting marketing post generation...');

      // Step 1: Analyze the uploaded image
      const imageAnalysis = await this.analyzeImage(request.imageFile);
      console.log('🔍 Image analysis:', imageAnalysis);

      // Step 2: Generate marketing content
      const marketingContent = await this.generateMarketingContent(imageAnalysis, request);
      console.log('📝 Marketing content:', marketingContent);

      // Step 3: Generate image variations
      const imageVariations = await this.generateImageVariations(request.imageFile, imageAnalysis, request.userId);
      console.log('🎨 Image variations:', imageVariations);

      // Step 4: Upload original image to Supabase
      const originalImageUrl = await this.uploadImageToSupabase(request.imageFile, request.userId);

      // Step 5: Create marketing post object
      const marketingPost: Omit<MarketingPost, 'id' | 'created_at' | 'updated_at'> = {
        user_id: request.userId,
        title: marketingContent.title,
        content: marketingContent.content,
        hashtags: marketingContent.hashtags,
        engaging_line: marketingContent.engagingLine,
        call_to_action: marketingContent.callToAction,
        tone: request.tone,
        platform: request.platform,
        product_image_url: originalImageUrl,
        image_variations: imageVariations
      };

      // Step 6: Save to database
      const savedPost = await this.saveMarketingPostToDatabase(marketingPost);
      console.log('✅ Marketing post saved:', savedPost);

      return savedPost;
    } catch (error) {
      console.error('❌ Error generating marketing post:', error);
      throw error;
    }
  }

  private async analyzeImage(imageFile: File): Promise<any> {
    const imageBase64 = await this.fileToBase64(imageFile);
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Look at this image carefully. What specific product do you see? Give me the exact product name and type. Also analyze the colors, style, mood, and key features. Return ONLY valid JSON without any markdown formatting or code blocks: {\"productName\": \"exact product name\", \"productType\": \"product category\", \"colors\": [\"color1\", \"color2\"], \"style\": \"style description\", \"mood\": \"mood description\", \"keyFeatures\": [\"feature1\", \"feature2\"]}"
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    const analysisText = response.choices[0]?.message?.content || '{}';
    
    // Clean the response to remove markdown formatting
    const cleanedText = analysisText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    
    return JSON.parse(cleanedText);
  }

  private async generateMarketingContent(imageAnalysis: any, request: MarketingPostRequest): Promise<any> {
    const prompt = `Create marketing content for ${imageAnalysis.productName || imageAnalysis.productType} for ${request.platform} platform with ${request.tone} tone.

Product Details:
- Name: ${imageAnalysis.productName || imageAnalysis.productType}
- Type: ${imageAnalysis.productType}
- Colors: ${imageAnalysis.colors?.join(', ') || 'various'}
- Style: ${imageAnalysis.style || 'modern'}
- Mood: ${imageAnalysis.mood || 'appealing'}
- Key Features: ${imageAnalysis.keyFeatures?.join(', ') || 'quality'}

Brand: ${request.brandName || 'Your Brand'}

Create:
1. A catchy title (max 50 characters)
2. Engaging opening line (max 100 characters)
3. Main content (max 200 characters for social media)
4. 5-8 relevant hashtags
5. Call-to-action (max 30 characters)

Return ONLY valid JSON without any markdown formatting or code blocks:
{
  "title": "Catchy Title",
  "engagingLine": "Engaging opening line",
  "content": "Main marketing content",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
  "callToAction": "Shop Now"
}`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500
    });

    const contentText = response.choices[0]?.message?.content || '{}';
    
    // Clean the response to remove markdown formatting
    const cleanedText = contentText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    
    return JSON.parse(cleanedText);
  }

  private async generateImageVariations(imageFile: File, imageAnalysis: any, userId: string): Promise<Array<{url: string, style: string, description: string}>> {
    // Generate 3 different style prompts for variations
    const variationPrompts = [
      {
        name: "Modern Minimal",
        prompt: `Create a modern, minimalist version of this ${imageAnalysis.productType}. Clean background, simple composition, focus on the product. Professional lighting, subtle shadows. Don't change the original product image just the background and composition, and enhance the image quality.`,
        description: "Clean and modern aesthetic"
      },
      {
        name: "Vibrant Lifestyle",
        prompt: `Create a vibrant, lifestyle-focused version of this ${imageAnalysis.productType}. Bright colors, dynamic composition, show the product in use. Energetic and engaging. Don't change the original product image just the background and composition, and enhance the image quality.`,
        description: "Vibrant and lifestyle-oriented"
      },
      {
        name: "Luxury Premium",
        prompt: `Create a luxury, premium version of this ${imageAnalysis.productType}. Elegant composition, sophisticated lighting, premium feel. High-end aesthetic. Don't change the original product image just the background and composition, and enhance the image quality.`,
        description: "Luxury and premium feel"
      }
    ];

    const variations: Array<{url: string, style: string, description: string}> = [];

    for (const promptData of variationPrompts) {
      try {
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
        for await (const chunk of response) {
          if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
            const fileName = `marketing_${promptData.name}_${Date.now()}.png`;
            const inlineData = chunk.candidates[0].content.parts[0].inlineData;
            
            if (!inlineData.data) continue;
            
            const binaryString = atob(inlineData.data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            const imageBlob = new Blob([bytes], { type: inlineData.mimeType || 'image/png' });
            
            // Upload to Supabase
            const imageUrl = await this.uploadImageBlobToSupabase(imageBlob, fileName, userId);
            
            variations.push({
              url: imageUrl,
              style: promptData.name,
              description: promptData.description
            });
            
            imageGenerated = true;
            break;
          }
        }
        
        if (!imageGenerated) {
          console.warn(`Failed to generate image for ${promptData.name}`);
        }
      } catch (error) {
        console.error(`Error generating ${promptData.name}:`, error);
      }
    }

    return variations;
  }

  private async uploadImageToSupabase(imageFile: File, userId: string): Promise<string> {
    const fileName = `marketing_original_${Date.now()}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('generated-images')
      .upload(`${userId}/${fileName}`, imageFile, {
        contentType: imageFile.type,
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('generated-images')
      .getPublicUrl(`${userId}/${fileName}`);

    return publicUrl;
  }

  private async uploadImageBlobToSupabase(imageBlob: Blob, fileName: string, userId: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('generated-images')
      .upload(`${userId}/${fileName}`, imageBlob, {
        contentType: imageBlob.type,
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('generated-images')
      .getPublicUrl(`${userId}/${fileName}`);

    return publicUrl;
  }

  private async saveMarketingPostToDatabase(post: Omit<MarketingPost, 'id' | 'created_at' | 'updated_at'>): Promise<MarketingPost> {
    const { data, error } = await supabase
      .from('image_variations')
      .insert({
        user_id: post.user_id,
        original_image_url: post.product_image_url,
        variation_name: 'marketing_post', // Identifier for marketing posts
        variation_description: JSON.stringify({
          title: post.title,
          content: post.content,
          hashtags: post.hashtags,
          engaging_line: post.engaging_line,
          call_to_action: post.call_to_action,
          tone: post.tone,
          platform: post.platform,
          image_variations: post.image_variations
        }),
        generated_image_url: post.product_image_url, // Same as original for marketing posts
        prompt_used: `Marketing post for ${post.platform} with ${post.tone} tone`
      })
      .select()
      .single();

    if (error) throw error;
    
    // Transform the data to match MarketingPost interface
    const descriptionData = JSON.parse(data.variation_description);
    return {
      id: data.id,
      user_id: data.user_id,
      title: descriptionData.title,
      content: descriptionData.content,
      hashtags: descriptionData.hashtags,
      engaging_line: descriptionData.engaging_line,
      call_to_action: descriptionData.call_to_action,
      tone: descriptionData.tone,
      platform: descriptionData.platform,
      product_image_url: data.original_image_url,
      image_variations: descriptionData.image_variations,
      created_at: data.created_at,
      updated_at: data.created_at // Use created_at as updated_at since there's no updated_at column
    };
  }

  async getMarketingPosts(userId: string): Promise<MarketingPost[]> {
    const { data, error } = await supabase
      .from('image_variations')
      .select('*')
      .eq('user_id', userId)
      .eq('variation_name', 'marketing_post')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform the data to match MarketingPost interface
    return (data || []).map(item => {
      const descriptionData = JSON.parse(item.variation_description);
      return {
        id: item.id,
        user_id: item.user_id,
        title: descriptionData.title,
        content: descriptionData.content,
        hashtags: descriptionData.hashtags,
        engaging_line: descriptionData.engaging_line,
        call_to_action: descriptionData.call_to_action,
        tone: descriptionData.tone,
        platform: descriptionData.platform,
        product_image_url: item.original_image_url,
        image_variations: descriptionData.image_variations,
        created_at: item.created_at,
        updated_at: item.created_at // Use created_at as updated_at since there's no updated_at column
      };
    });
  }

  async deleteMarketingPost(postId: string): Promise<void> {
    const { error } = await supabase
      .from('image_variations')
      .delete()
      .eq('id', postId)
      .eq('variation_name', 'marketing_post');

    if (error) throw error;
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  }
}

export const marketingPostService = new MarketingPostService();
export type { MarketingPost, MarketingPostRequest };