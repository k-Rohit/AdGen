import DashboardLayout from '@/components/layouts/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { marketingPostService, type MarketingPost } from '@/services/marketingpostService';
import { motion } from 'framer-motion';
import { Upload, X, Copy, Trash2, Sparkles, Image as ImageIcon, Hash, MessageSquare } from 'lucide-react';
import React, { useRef, useState, useEffect } from 'react'

function MarketingPost() {
     const [uploadedImage, setUploadedImage] = useState<File | null>(null);
     const [imagePreview, setImagePreview] = useState<string | null>(null);
     const [isGenerating, setIsGenerating] = useState(false);
     const [brandName, setBrandName] = useState('');
     const [selectedPlatform, setSelectedPlatform] = useState<'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok'>('instagram');
     const [selectedTone, setSelectedTone] = useState<'professional' | 'casual' | 'funny' | 'inspiring' | 'urgent'>('casual');
     const [marketingPosts, setMarketingPosts] = useState<MarketingPost[]>([]);
     const [showUploadModal, setShowUploadModal] = useState(false);
     const fileInputRef = useRef<HTMLInputElement>(null);
     const { user } = useAuth();
     const { toast } = useToast();

     // Fetch existing marketing posts
     useEffect(() => {
       if (user?.id) {
         fetchMarketingPosts();
       }
     }, [user?.id]);

     const fetchMarketingPosts = async () => {
       try {
         const posts = await marketingPostService.getMarketingPosts(user!.id);
         setMarketingPosts(posts);
       } catch (error) {
         console.error('Error fetching marketing posts:', error);
       }
     };

     const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
       const file = event.target.files?.[0];
       if (file) {
         if (file.size > 10 * 1024 * 1024) {
           toast({
             title: "File too large",
             description: "Please select an image smaller than 10MB.",
             variant: "destructive",
           });
           return;
         }
         
         setUploadedImage(file);
         const reader = new FileReader();
         reader.onload = (e) => {
           setImagePreview(e.target?.result as string);
         };
         reader.readAsDataURL(file);
         setShowUploadModal(true);
       }
     };

     const generateMarketingPost = async () => {
       if (!uploadedImage || !user?.id) return;

       setIsGenerating(true);
       try {
         const result = await marketingPostService.generateMarketingPost({
           userId: user.id,
           imageFile: uploadedImage,
           platform: selectedPlatform,
           tone: selectedTone,
           brandName: brandName || 'Your Brand'
         });

         toast({
           title: "Success!",
           description: "Marketing post generated successfully!",
         });

         // Reset form
         setUploadedImage(null);
         setImagePreview(null);
         setShowUploadModal(false);
         setBrandName('');
         
         // Refresh posts
         await fetchMarketingPosts();
       } catch (error) {
         console.error('Error generating marketing post:', error);
         toast({
           title: "Error",
           description: "Failed to generate marketing post. Please try again.",
           variant: "destructive",
         });
       } finally {
         setIsGenerating(false);
       }
     };

     const copyToClipboard = (text: string, type: string) => {
       navigator.clipboard.writeText(text);
       toast({
         title: "Copied!",
         description: `${type} copied to clipboard.`,
       });
     };

     const deletePost = async (postId: string) => {
       try {
         await marketingPostService.deleteMarketingPost(postId);
         await fetchMarketingPosts();
         toast({
           title: "Deleted",
           description: "Marketing post deleted successfully.",
         });
       } catch (error) {
         console.error('Error deleting post:', error);
         toast({
           title: "Error",
           description: "Failed to delete marketing post.",
           variant: "destructive",
         });
       }
     };

     const getPlatformIcon = (platform: string) => {
       switch (platform) {
         case 'instagram': return '📷';
         case 'facebook': return '📘';
         case 'twitter': return '🐦';
         case 'linkedin': return '💼';
         case 'tiktok': return '🎵';
         default: return '📱';
       }
     };

     const getToneColor = (tone: string) => {
       switch (tone) {
         case 'professional': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
         case 'casual': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
         case 'funny': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
         case 'inspiring': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
         case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
         default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
       }
     };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-foreground">
            Marketing Posts
          </h1>
          <p className="text-muted-foreground">
            AI-generated marketing content for your products
          </p>
        </div>

        {/* Generate New Post Button */}
        <div className="flex justify-end">
          <Button 
            onClick={() => fileInputRef.current?.click()}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Generate New Post
          </Button>
        </div>

        {/* Marketing Posts Grid */}
        {marketingPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marketingPosts.flatMap((post) => 
              // Create separate cards for each image variation
              post.image_variations && post.image_variations.length > 0 
                ? post.image_variations.map((variation, index) => (
                    <Card key={`${post.id}-${index}`} className="glass group hover:shadow-xl transition-all duration-300 overflow-hidden border-0">
                      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                        {/* Platform Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg">
                              {getPlatformIcon(post.platform)}
                            </div>
                            <div>
                              <div className="text-base font-bold text-gray-900 dark:text-white">{post.title}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{post.platform}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs px-3 py-1 ${getToneColor(post.tone)}`}>
                              {variation.style}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                              onClick={() => deletePost(post.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Single Image */}
                        <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center overflow-hidden relative">
                          <img 
                            src={variation.url} 
                            alt={variation.style}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          {/* Copy Image Button */}
                          <button
                            className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => copyToClipboard(variation.url, "Image URL")}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Post Content */}
                        <div className="p-5 space-y-4">
                          {/* Engaging Line */}
                          <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                            {post.engaging_line}
                          </p>

                          {/* Main Content */}
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {post.content}
                          </p>

                          {/* Hashtags */}
                          <div className="flex flex-wrap gap-2">
                            {post.hashtags.map((hashtag, hashtagIndex) => (
                              <span key={hashtagIndex} className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium">
                                {hashtag}
                              </span>
                            ))}
                          </div>

                          {/* Call to Action */}
                          <div className="pt-2">
                            <Button 
                              size="sm" 
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                              onClick={() => copyToClipboard(post.call_to_action, "Call to Action")}
                            >
                              {post.call_to_action}
                            </Button>
                          </div>

                          {/* Copy Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(post.content, "Content")}
                              className="flex-1"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Content
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(post.hashtags.join(' '), "Hashtags")}
                              className="flex-1"
                            >
                              <Hash className="w-4 h-4 mr-2" />
                              Copy Hashtags
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                : // Fallback for posts without variations
                  [(
                    <Card key={post.id} className="glass group hover:shadow-xl transition-all duration-300 overflow-hidden border-0">
                      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                        {/* Platform Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg">
                              {getPlatformIcon(post.platform)}
                            </div>
                            <div>
                              <div className="text-base font-bold text-gray-900 dark:text-white">{post.title}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{post.platform}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs px-3 py-1 ${getToneColor(post.tone)}`}>
                              {post.tone}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                              onClick={() => deletePost(post.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Single Image */}
                        <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center overflow-hidden relative">
                          <img 
                            src={post.product_image_url} 
                            alt="Product" 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>

                        {/* Post Content */}
                        <div className="p-5 space-y-4">
                          {/* Engaging Line */}
                          <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                            {post.engaging_line}
                          </p>

                          {/* Main Content */}
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {post.content}
                          </p>

                          {/* Hashtags */}
                          <div className="flex flex-wrap gap-2">
                            {post.hashtags.map((hashtag, hashtagIndex) => (
                              <span key={hashtagIndex} className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium">
                                {hashtag}
                              </span>
                            ))}
                          </div>

                          {/* Call to Action */}
                          <div className="pt-2">
                            <Button 
                              size="sm" 
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                              onClick={() => copyToClipboard(post.call_to_action, "Call to Action")}
                            >
                              {post.call_to_action}
                            </Button>
                          </div>

                          {/* Copy Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(post.content, "Content")}
                              className="flex-1"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Content
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(post.hashtags.join(' '), "Hashtags")}
                              className="flex-1"
                            >
                              <Hash className="w-4 h-4 mr-2" />
                              Copy Hashtags
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )]
            )}
          </div>
        ) : (
          <Card className="glass">
            <CardContent className="p-12 text-center">
              <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                No marketing posts yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Upload a product image to generate your first AI-powered marketing post
              </p>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Create Your First Post
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl bg-background">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Generate Marketing Posts
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUploadModal(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Image Preview */}
                {imagePreview && (
                  <div className="space-y-4">
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Uploaded product" 
                        className="w-full h-64 object-cover rounded-lg mx-auto"
                      />
                    </div>
                  </div>
                )}

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brandName">Brand Name</Label>
                    <Input
                      id="brandName"
                      placeholder="Your Brand"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="platform">Platform</Label>
                    <Select value={selectedPlatform} onValueChange={(value: any) => setSelectedPlatform(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="twitter">Twitter</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tone">Tone</Label>
                    <Select value={selectedTone} onValueChange={(value: any) => setSelectedTone(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="funny">Funny</SelectItem>
                        <SelectItem value="inspiring">Inspiring</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowUploadModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={generateMarketingPost}
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Posts
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default MarketingPost