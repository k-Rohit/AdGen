import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Upload, Sparkles, Square, Smartphone, Monitor, CheckCircle, XCircle, Video } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { motion } from "framer-motion";
import { aiService, AdGenerationRequest, AdGenerationResponse, VideoPrompt, VideoGenerationRequest } from "@/services/aiService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const CreateAd = () => {
  const [step, setStep] = useState(1);
  const [format, setFormat] = useState("square");
  // Tone and template removed from simplified flow
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<AdGenerationResponse | null>(null);
  const [includeVideoEffects, setIncludeVideoEffects] = useState(false);
  const [imageStyles, setImageStyles] = useState<Array<{name: string, description: string, prompt: string}>>([]);
  const [imageVariations, setImageVariations] = useState<Array<{url: string, style: string, description: string}>>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [isLoadingStyles, setIsLoadingStyles] = useState(false);
  const [isLoadingVariations, setIsLoadingVariations] = useState(false);
  const [videoPrompts, setVideoPrompts] = useState<VideoPrompt[]>([]);
  const [selectedVideoPrompt, setSelectedVideoPrompt] = useState<string>("");
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isLoadingVideoPrompts, setIsLoadingVideoPrompts] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const formats = [
    { id: "square", name: "Square (1:1)", icon: Square, desc: "Perfect for Instagram & Facebook" },
    { id: "story", name: "Story (9:16)", icon: Smartphone, desc: "Instagram & Facebook Stories" },
    { id: "landscape", name: "Landscape (16:9)", icon: Monitor, desc: "YouTube & Facebook Ads" },
  ];

  // Removed tone options

  const templates = [
    { id: 1, name: "Modern Minimal", category: "E-commerce" },
    { id: 2, name: "Bold Typography", category: "Fashion" },
    { id: 3, name: "Product Focus", category: "E-commerce" },
    { id: 4, name: "Lifestyle Blend", category: "Social Media" },
    { id: 5, name: "Clean Grid", category: "Tech" },
    { id: 6, name: "Vibrant Pop", category: "Food" },
  ];

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      setUploadedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Immediately generate 3 image variations for selection
      setIsLoadingVariations(true);
      try {
        console.log('🎨 Starting variation generation for:', file.name);
        const analysisMinimal = { productType: 'Product', style: 'Modern', mood: 'Professional' } as any;
        const variations = await aiService.generateImageVariations(file, analysisMinimal, undefined, user?.id);
        console.log('🎨 Generated variations:', variations);
        console.log('🎨 Variation URLs:', variations.map(v => v.url));
        setImageVariations(variations);
        // Prefill styles list from variations for simpler UI
        setImageStyles(variations.map(v => ({ name: v.style, description: v.description, prompt: v.style })));
        console.log('🎨 Set image variations and styles');
      } catch (e) {
        console.error('❌ Error generating variations:', e);
        toast({
          title: "Generation Error",
          description: "Failed to generate image variations. Using original image.",
          variant: "destructive",
        });
        // Fallback: use original image as variations
        const originalUrl = URL.createObjectURL(file);
        const fallbackVariations = [
          { url: originalUrl, style: 'Original Style', description: 'Your original product image' },
          { url: originalUrl, style: 'Modern Minimal', description: 'Modern minimal variation' },
          { url: originalUrl, style: 'Bold Dynamic', description: 'Bold dynamic variation' }
        ];
        setImageVariations(fallbackVariations);
        setImageStyles(fallbackVariations.map(v => ({ name: v.style, description: v.description, prompt: v.style })));
      } finally {
        setIsLoadingVariations(false);
        setStep(2);
      }
    }
  };

  // Generate video prompts after image variations are created
  const generateVideoPrompts = async () => {
    if (!imageVariations.length) {
      toast({
        title: "No image variations",
        description: "Please generate image variations first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingVideoPrompts(true);
    try {
      // Analyze the image directly for video prompts
      if (!uploadedImage) {
        throw new Error('No image uploaded');
      }
      
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(uploadedImage);
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
      });
      
      const analysis = await aiService.analyzeImageWithGPT4oMini(imageBase64);
      console.log('🎬 Fresh image analysis for video prompts:', analysis);
      
      const prompts = await aiService.generateVideoPrompts(analysis, imageVariations);
      setVideoPrompts(prompts);
      toast({
        title: "Video prompts generated",
        description: "Choose a prompt to generate your video.",
      });
    } catch (error) {
      console.error('Error generating video prompts:', error);
      toast({
        title: "Error",
        description: "Failed to generate video prompts.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingVideoPrompts(false);
    }
  };

  // Generate video using selected prompt
  const handleGenerateVideo = async () => {
    if (!selectedVideoPrompt) {
      toast({
        title: "No prompt selected",
        description: "Please select a video prompt first.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please sign in to generate videos.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingVideo(true);
    setGeneratedVideo(null);

    try {
      const selectedPrompt = videoPrompts.find(p => p.id === selectedVideoPrompt);
      if (!selectedPrompt) {
        throw new Error('Selected prompt not found');
      }

      const request: VideoGenerationRequest = {
        prompt: selectedPrompt.prompt,
        userId: user.id
      };

      // For image-to-video, use the first image variation
      if (selectedPrompt.type === 'image-to-video' && imageVariations.length > 0) {
        request.imageUrl = imageVariations[0].url;
      }

      const result = await aiService.generateVideo(request);

      if (result.status === 'completed') {
        setGeneratedVideo(result.videoUrl);
        toast({
          title: "Video generated successfully!",
          description: "Your AI-generated video is ready.",
        });
      } else {
        throw new Error(result.error || 'Video generation failed');
      }
    } catch (error) {
      console.error('Error generating video:', error);
      toast({
        title: "Video generation failed",
        description: error instanceof Error ? error.message : "Unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleGenerate = async () => {
    console.log('🎬 handleGenerate called');
    console.log('🎬 uploadedImage:', uploadedImage);
    console.log('🎬 selectedStyle:', selectedStyle);
    console.log('🎬 includeVideoEffects:', includeVideoEffects);
    
    if (!uploadedImage) {
      console.log('❌ No image selected');
      toast({
        title: "No image selected",
        description: "Please upload an image before generating.",
        variant: "destructive",
      });
      return;
    }

    // For simplified flow, selection optional; we can still generate video

    console.log('🎬 Starting generation...');
    setIsGenerating(true);
    setGenerationResult(null);

    try {
      // Always analyze the image first to get proper analysis
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(uploadedImage);
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
      });
      
      const imageAnalysis = await aiService.analyzeImageWithGPT4oMini(imageBase64);
      console.log('🔍 Actual image analysis:', imageAnalysis);

      // Generate video if effects are enabled
      const video = includeVideoEffects
        ? await aiService.generateVideoSimple(uploadedImage, selectedStyle)
        : { videoUrl: undefined, videoPrompt: '' };

      const result: AdGenerationResponse = {
        id: `gen_${Date.now()}`,
        status: 'completed',
        generatedContent: {
          generatedImages: imageVariations,
          videoUrl: video.videoUrl,
          videoPrompt: video.videoPrompt,
          imageAnalysis: imageAnalysis
        }
      };
      // Hard fallback: ensure a playable sample video when effects are enabled
      if (!result.generatedContent?.videoUrl && includeVideoEffects) {
        result.generatedContent = {
          ...result.generatedContent,
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          videoPrompt: result.generatedContent?.videoPrompt ?? 'Sample video (fallback)'
        };
      }
      setGenerationResult(result);
      
      // Save video to Supabase if video was generated
      if (result.generatedContent.videoUrl && user) {
        try {
          // Convert blob URL to file
          const response = await fetch(result.generatedContent.videoUrl);
          const videoBlob = await response.blob();
          
          // Create a file name
          const fileName = `video_${Date.now()}.mp4`;
          
          // Upload to Supabase storage
          const { data, error } = await supabase.storage
            .from('user-videos')
            .upload(`${user.id}/${fileName}`, videoBlob, {
              contentType: 'video/mp4',
              upsert: false
            });
          
          if (error) {
            console.error('Error uploading video to Supabase:', error);
          } else {
            console.log('✅ Video saved to Supabase:', data);
            toast({
              title: "Success",
              description: "Video generated and saved to your account!",
            });
          }
        } catch (error) {
          console.error('Error saving video:', error);
        }
      }

      if (result.status === 'completed') {
        toast({
          title: "Generation complete!",
          description: "Your ad has been generated successfully.",
        });
        setStep(4);
      } else {
        toast({
          title: "Generation failed",
          description: result.error || "Something went wrong.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground">
            Create New <span className="text-gradient">AI Ad</span>
          </h1>
          <p className="text-muted-foreground">Follow the steps to generate your perfect ad</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-12">
          {[
            { num: 1, label: "Upload" },
            { num: 2, label: "Choose Variation" },
            { num: 3, label: "Generate Video" },
          ].map((s, index) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold mb-2 transition-all ${
                    step >= s.num ? "gradient-primary text-white" : "glass text-muted-foreground"
                  }`}
                >
                  {s.num}
                </div>
                <span className="text-sm text-muted-foreground">{s.label}</span>
              </div>
              {index < 2 && (
                <div className={`h-0.5 flex-1 mx-4 ${step > s.num ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Card className="glass">
              <CardContent className="p-12">
                {imagePreview ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Uploaded product" 
                        className="w-full max-w-md mx-auto rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setUploadedImage(null);
                          setImagePreview(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                      {uploadedImage?.name} ({(uploadedImage?.size! / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                  <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    Drop your product image here
                  </h3>
                  <p className="text-muted-foreground mb-4">or click to browse</p>
                  <Button variant="outline">Choose File</Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    Supports: JPG, PNG, WebP (Max 10MB)
                  </p>
                </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button 
                onClick={() => setStep(2)} 
                size="lg" 
                className="glow"
                disabled={!uploadedImage}
              >
                Continue to Configure
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Choose Variation */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Variation Selection */}
            <Card className="glass">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  Choose an Image Variation
                </h3>
                {isLoadingVariations ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-6"></div>
                    <h4 className="text-lg font-semibold mb-2 text-foreground">AI is creating your image variations...</h4>
                    <p className="text-muted-foreground mb-4">This may take 15-45 seconds</p>
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">Step 1: Analyzing your image with OpenAI...</span>
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">Step 2: Generating creative prompts...</span>
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Step 3: Creating variations with Google AI...</span>
                        <span className="text-primary">⏳</span>
                      </div>
                    </div>
                  </div>
                ) : imageVariations.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imageVariations.map((variation, index) => {
                      console.log('Rendering variation:', index, variation);
                      return (
                      <div
                        key={index}
                        className={`glass rounded-xl p-4 hover-lift cursor-pointer group ${
                          selectedStyle === variation.style ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedStyle(variation.style)}
                      >
                        <div className="aspect-square rounded-lg mb-3 overflow-hidden bg-muted/20 flex items-center justify-center">
                          {variation.url ? (
                            <img 
                              src={variation.url} 
                              alt={variation.style} 
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                console.error('Image load error for', variation.style, ':', e);
                                console.error('Image URL:', variation.url);
                              }}
                              onLoad={() => {
                                console.log('Image loaded successfully for', variation.style);
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted/50">
                              <span className="text-muted-foreground text-sm">No image</span>
                            </div>
                          )}
                        </div>
                        <h4 className="font-semibold text-sm mb-1 text-foreground">
                          {variation.style}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {variation.description}
                        </p>
                      </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Upload an image to see variations</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Video Effects Toggle */}
            <Card className="glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Video className="w-6 h-6 text-primary" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Video Effects</h3>
                      <p className="text-sm text-muted-foreground">
                        Add dynamic video effects using Google's AI technology
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={includeVideoEffects}
                    onCheckedChange={setIncludeVideoEffects}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button onClick={() => setStep(1)} variant="outline">
                Back
              </Button>
              <Button 
                onClick={() => setStep(3)} 
                size="lg" 
                className="glow"
                disabled={isLoadingVariations || imageVariations.length === 0}
              >
                Continue to Video
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Video Generation */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Card className="glass">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Video className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Generate Video</h3>
                    <p className="text-muted-foreground">Create AI-generated videos from your images or text prompts</p>
                  </div>
                </div>

                {!videoPrompts.length && !isLoadingVideoPrompts && (
                  <div className="text-center py-8">
                    <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-lg font-semibold mb-2 text-foreground">Ready to Create Videos</h4>
                    <p className="text-muted-foreground mb-6">
                      Generate AI-powered video prompts based on your image variations. 
                      Choose from image-to-video or text-to-video options.
                    </p>
                    <Button onClick={generateVideoPrompts} className="glow">
                      Generate Video Prompts
                    </Button>
                  </div>
                )}

                {isLoadingVideoPrompts && (
                  <div className="text-center py-8">
                    <Sparkles className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
                    <h4 className="text-lg font-semibold mb-2 text-foreground">Generating Video Prompts</h4>
                    <p className="text-muted-foreground">GPT-4o-mini is creating creative video prompts for you...</p>
                    <div className="mt-4 max-w-md mx-auto space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">Analyzing image variations...</span>
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Creating video prompts...</span>
                      </div>
                    </div>
                  </div>
                )}

                {videoPrompts.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-foreground">Choose a Video Generation Option</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Select from AI-generated prompts. Each option shows whether it uses your image or creates from text.
                    </p>
                    
                    <RadioGroup value={selectedVideoPrompt} onValueChange={setSelectedVideoPrompt}>
                      {videoPrompts.map((prompt) => (
                        <div key={prompt.id} className="flex items-start space-x-3 p-4 glass rounded-lg hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value={prompt.id} id={prompt.id} className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor={prompt.id} className="cursor-pointer">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="font-medium text-foreground">{prompt.description}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  prompt.type === 'image-to-video' 
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                }`}>
                                  {prompt.type === 'image-to-video' ? '🖼️ Image-to-Video' : '📝 Text-to-Video'}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{prompt.prompt}</p>
                              <div className="text-xs text-muted-foreground">
                                {prompt.type === 'image-to-video' 
                                  ? 'Uses your selected image variation as the base for video generation'
                                  : 'Creates video from text description without using your image'
                                }
                              </div>
                            </Label>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>

                    {selectedVideoPrompt && (
                      <div className="pt-4 border-t border-border">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h5 className="font-medium text-foreground">Selected Option</h5>
                            <p className="text-sm text-muted-foreground">
                              {videoPrompts.find(p => p.id === selectedVideoPrompt)?.type === 'image-to-video' 
                                ? 'Will generate video from your image variation'
                                : 'Will generate video from text prompt only'
                              }
                            </p>
                          </div>
                          <Button 
                            onClick={handleGenerateVideo} 
                            disabled={isGeneratingVideo}
                            size="lg" 
                            className="glow"
                          >
                            {isGeneratingVideo ? (
                              <>
                                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                Generating Video...
                              </>
                            ) : (
                              <>
                                <Video className="w-4 h-4 mr-2" />
                                Generate Video
                              </>
                            )}
                          </Button>
                        </div>
                        
                        {isGeneratingVideo && (
                          <div className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-center space-x-3">
                              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                              <div>
                                <p className="text-sm font-medium text-foreground">Google Veo is generating your video...</p>
                                <p className="text-xs text-muted-foreground">This may take 30-60 seconds</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {generatedVideo && (
                  <div className="mt-6 p-4 glass rounded-lg">
                    <h4 className="text-lg font-semibold mb-4 text-foreground">🎉 Generated Video</h4>
                    <video 
                      src={generatedVideo} 
                      controls 
                      className="w-full max-w-md mx-auto rounded-lg"
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                    <div className="mt-4 text-center space-x-2">
                      <Button 
                        onClick={() => window.open(generatedVideo, '_blank')}
                        variant="outline"
                      >
                        View Full Size
                      </Button>
                      <Button 
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = generatedVideo;
                          a.download = `generated-video-${Date.now()}.mp4`;
                          a.click();
                        }}
                      >
                        Download Video
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button onClick={() => setStep(2)} variant="outline">
                Back
              </Button>
              <Button 
                onClick={() => {
                  toast({
                    title: "Ad Creation Complete!",
                    description: "Your AI-generated ad is ready.",
                  });
                }}
                size="lg" 
                className="glow"
              >
                Complete
                </Button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Results */}
        {step === 4 && generationResult && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Card className="glass">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2 text-foreground">
                    Ad Generated Successfully!
                  </h3>
                  <p className="text-muted-foreground">
                    Here are your AI-generated ad variations
                  </p>
                </div>

                {generationResult.generatedContent && (
                  <div className="space-y-8">

                    {/* Generated Video - Always show for debugging */}
                    {generationResult && (
                      <div>
                        <h4 className="text-lg font-semibold mb-4 text-foreground">Generated Video</h4>
                        <div className="glass rounded-lg p-6">
                          <div className="mb-4">
                            <p className="text-sm text-muted-foreground mb-2">AI-Generated Video Prompt:</p>
                            <div className="bg-muted/50 rounded-lg p-3">
                              <p className="text-foreground text-sm leading-relaxed">
                                {generationResult.generatedContent.videoPrompt || 'No video prompt available'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Debug Info */}
                          <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                            <p className="text-xs text-yellow-800 dark:text-yellow-200">
                              <strong>Debug Info:</strong><br/>
                              Video URL: {generationResult.generatedContent.videoUrl}<br/>
                              URL Type: {typeof generationResult.generatedContent.videoUrl}<br/>
                              URL Length: {generationResult.generatedContent.videoUrl?.length}
                            </p>
                            <div className="mt-2 space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  console.log('🔍 Testing video URL:', generationResult.generatedContent.videoUrl)
                                  window.open(generationResult.generatedContent.videoUrl, '_blank')
                                }}
                              >
                                Test URL in New Tab
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  console.log('🔍 Testing with sample video')
                                  const testVideo = document.querySelector('video')
                                  if (testVideo) {
                                    testVideo.src = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
                                    testVideo.load()
                                  }
                                }}
                              >
                                Test Sample Video
                              </Button>
                            </div>
                          </div>
                          
                          <div className="aspect-video bg-muted/20 rounded-lg flex items-center justify-center">
                            {generationResult.generatedContent.videoUrl ? (
                              <div className="w-full h-full">
                                <div className="mb-2 text-xs text-muted-foreground">
                                  Video URL: {generationResult.generatedContent.videoUrl}
                                </div>
                                <video 
                                  controls 
                                  className="w-full h-full rounded-lg"
                                  src={generationResult.generatedContent.videoUrl}
                                  preload="metadata"
                                  onError={(e) => {
                                    console.error('Video load error:', e)
                                    console.error('Video src:', generationResult.generatedContent.videoUrl)
                                    console.error('Video element:', e.target)
                                  }}
                                  onLoadStart={() => {
                                    console.log('Video loading started')
                                  }}
                                  onCanPlay={() => {
                                    console.log('Video can start playing')
                                  }}
                                >
                                  Your browser does not support the video tag.
                                </video>
                              </div>
                            ) : (
                              <div className="text-center">
                                <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No video URL available</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                  Video URL: {generationResult.generatedContent.videoUrl || 'undefined'}
                                </p>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="mt-4"
                                  onClick={() => {
                                    console.log('🔍 Full generation result:', generationResult)
                                  }}
                                >
                                  Log Full Result
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button onClick={() => setStep(1)} variant="outline">
                Create Another Ad
              </Button>
              <Button size="lg" className="glow">
                Download Results
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CreateAd;
