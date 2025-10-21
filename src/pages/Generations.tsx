import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sparkles, Search, MoreVertical, Download, Edit, Trash2, Eye, Grid3x3, List, Image, Video, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface ImageVariation {
  id: string;
  variation_name: string;
  variation_description: string;
  generated_image_url: string;
  prompt_used: string;
  created_at: string;
}

interface Video {
  id: string;
  title: string;
  prompt: string;
  video_url: string;
  generation_type: string;
  source_image_url?: string;
  status: string;
  created_at: string;
}

const Generations = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [images, setImages] = useState<ImageVariation[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(true);

  // Fetch user's generated images
  const fetchImages = async () => {
    if (!user) return;
    
    try {
      setLoadingImages(true);
      const { data, error } = await supabase
        .from('image_variations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching images:', error);
        return;
      }

      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoadingImages(false);
    }
  };

  // Fetch user's generated videos
  const fetchVideos = async () => {
    if (!user) return;
    
    try {
      setLoadingVideos(true);
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching videos:', error);
        return;
      }

      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    fetchImages();
    fetchVideos();
  }, [user]);

  // Filter images based on search query
  const filteredImages = images.filter((img) =>
    img.variation_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    img.variation_description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle image actions
  const handleDownloadImage = async (imageUrl: string, fileName: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('image_variations')
        .delete()
        .eq('id', imageId);

      if (error) {
        console.error('Error deleting image:', error);
        return;
      }

      // Refresh images list
      fetchImages();
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };


  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-foreground">
            My <span className="text-gradient">Generations</span>
          </h1>
          <p className="text-muted-foreground">View and manage all your AI-generated ads</p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search generations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="glass"
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="glass"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs for Images and Videos */}
        <Tabs defaultValue="images" className="w-full">
          <TabsList className="grid w-full grid-cols-2 glass">
            <TabsTrigger value="images" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Images ({images.length})
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Videos ({videos.length})
            </TabsTrigger>
          </TabsList>

          {/* Images Tab */}
          <TabsContent value="images" className="mt-6">
            {loadingImages ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading images...</span>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredImages.map((img) => (
                  <Card key={img.id} className="glass hover-lift group overflow-hidden">
                    <div className="aspect-square relative overflow-hidden">
                      <img
                        src={img.generated_image_url}
                        alt={img.variation_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                      />
                      
                      <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button 
                          size="icon" 
                          variant="secondary" 
                          className="glass"
                          onClick={() => window.open(img.generated_image_url, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="secondary" 
                          className="glass"
                          onClick={() => handleDownloadImage(img.generated_image_url, `${img.variation_name}.png`)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="secondary" 
                          className="glass text-destructive hover:text-destructive"
                          onClick={() => handleDeleteImage(img.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-foreground truncate">
                            {img.variation_name}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {img.variation_description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(img.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass">
                            <DropdownMenuItem onClick={() => window.open(img.generated_image_url, '_blank')}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Full Size
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadImage(img.generated_image_url, `${img.variation_name}.png`)}>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteImage(img.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredImages.map((img) => (
                  <Card key={img.id} className="glass hover-lift">
                    <div className="flex items-center p-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden mr-4 flex-shrink-0">
                        <img
                          src={img.generated_image_url}
                          alt={img.variation_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground mb-1">{img.variation_name}</h3>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {img.variation_description}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{new Date(img.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="glass"
                          onClick={() => window.open(img.generated_image_url, '_blank')}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="glass"
                          onClick={() => handleDownloadImage(img.generated_image_url, `${img.variation_name}.png`)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass">
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteImage(img.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {!loadingImages && filteredImages.length === 0 && (
              <div className="text-center py-12">
                <Image className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-foreground">No images found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery
                    ? "Try adjusting your search"
                    : "Start creating your first AI-generated image"}
                </p>
                <Button>Create New Ad</Button>
              </div>
            )}
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="mt-6">
            {loadingVideos ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading videos...</span>
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-12">
                <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-foreground">No videos yet</h3>
                <p className="text-muted-foreground mb-6">
                  Generate videos from your images to see them here.
                </p>
                <Button>Create New Ad</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <Card key={video.id} className="glass group hover:shadow-lg transition-all duration-300">
                    <div className="aspect-video bg-muted/20 rounded-t-lg flex items-center justify-center">
                      <video 
                        controls 
                        className="w-full h-full rounded-lg"
                        src={video.video_url}
                        preload="metadata"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground mb-2 truncate">{video.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{video.prompt}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {video.generation_type}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Generations;
