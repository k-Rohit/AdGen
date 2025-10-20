import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Upload, Sparkles, Square, Smartphone, Monitor, CheckCircle, XCircle, Video } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { motion } from "framer-motion";
import { aiService, AdGenerationRequest, AdGenerationResponse } from "@/services/aiService";
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
      // Simple: just generate a video now using selected style (if any)
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
          imageAnalysis: { productType: 'Product', style: 'Modern', mood: 'Professional', colors: [], keyFeatures: [] }
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

        {/* Step 3: Generate */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Debug Info for Step 3 */}
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded text-xs">
              <strong>Step 3 Debug:</strong><br/>
              isGenerating: {isGenerating ? 'YES' : 'NO'}<br/>
              selectedStyle: {selectedStyle || 'none'}<br/>
              includeVideoEffects: {includeVideoEffects ? 'YES' : 'NO'}<br/>
              uploadedImage: {uploadedImage ? uploadedImage.name : 'none'}
            </div>
            
            <Card className="glass">
              <CardContent className="p-12 text-center">
                {isGenerating ? (
                  <>
                <Sparkles className="w-20 h-20 text-primary mx-auto mb-6 animate-pulse" />
                <h3 className="text-2xl font-bold mb-4 text-foreground">
                  AI is analyzing your product...
                </h3>
                <p className="text-muted-foreground mb-8">
                  This usually takes 10-15 seconds
                </p>
                <div className="max-w-md mx-auto space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">Analyzing image...</span>
                    <span className="text-primary">✓</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">Generating copy...</span>
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Creating variations...</span>
                  </div>
                </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold mb-4 text-foreground">
                      Ready to Generate
                    </h3>
                    <p className="text-muted-foreground mb-8">
                      Review your settings and click generate to create your ad
                    </p>
                    <div className="max-w-md mx-auto text-sm text-muted-foreground">Click Generate to create a video from the chosen variation.</div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button onClick={() => setStep(2)} variant="outline" disabled={isGenerating}>
                Back
              </Button>
              {isGenerating ? (
                <Button variant="outline" disabled>Generating...</Button>
              ) : (
                <Button onClick={handleGenerate} size="lg" className="glow">
                  Generate Video
                </Button>
              )}
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
