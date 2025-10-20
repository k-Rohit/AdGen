import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sparkles, Search, MoreVertical, Download, Edit, Trash2, Eye, Grid3x3, List } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const Generations = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const generations = [
    {
      id: 1,
      title: "Product Ad - Sneakers",
      date: "2 hours ago",
      format: "Square",
      thumbnail: "sneakers",
    },
    {
      id: 2,
      title: "Social Story - Coffee",
      date: "5 hours ago",
      format: "Story",
      thumbnail: "coffee",
    },
    {
      id: 3,
      title: "Banner - Tech Product",
      date: "1 day ago",
      format: "Landscape",
      thumbnail: "tech",
    },
    {
      id: 4,
      title: "Instagram Post - Fashion",
      date: "1 day ago",
      format: "Square",
      thumbnail: "fashion",
    },
    {
      id: 5,
      title: "Facebook Ad - Skincare",
      date: "2 days ago",
      format: "Square",
      thumbnail: "skincare",
    },
    {
      id: 6,
      title: "Story - Food Delivery",
      date: "3 days ago",
      format: "Story",
      thumbnail: "food",
    },
    {
      id: 7,
      title: "YouTube Banner - Gaming",
      date: "4 days ago",
      format: "Landscape",
      thumbnail: "gaming",
    },
    {
      id: 8,
      title: "Product Shot - Watches",
      date: "5 days ago",
      format: "Square",
      thumbnail: "watches",
    },
  ];

  const filteredGenerations = generations.filter((gen) =>
    gen.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

        {/* Generations Display */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGenerations.map((gen) => (
              <Card key={gen.id} className="glass hover-lift group overflow-hidden">
                <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex items-center justify-center relative">
                  <Sparkles className="w-12 h-12 text-primary group-hover:scale-110 transition-transform" />
                  
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" variant="secondary" className="glass">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="secondary" className="glass">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="secondary" className="glass">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground truncate">
                        {gen.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">{gen.date}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {gen.format}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGenerations.map((gen) => (
              <Card key={gen.id} className="glass hover-lift">
                <div className="flex items-center p-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1">{gen.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{gen.date}</span>
                      <Badge variant="outline" className="text-xs">
                        {gen.format}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="glass">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="glass">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="glass">
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

        {filteredGenerations.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">No generations found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? "Try adjusting your search"
                : "Start creating your first AI-powered ad"}
            </p>
            <Button>Create New Ad</Button>
          </div>
        )}

        {/* Pagination */}
        {filteredGenerations.length > 0 && (
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" disabled className="glass">
              Previous
            </Button>
            <Button variant="outline" size="sm" className="glass bg-primary text-primary-foreground">
              1
            </Button>
            <Button variant="outline" size="sm" className="glass">
              2
            </Button>
            <Button variant="outline" size="sm" className="glass">
              3
            </Button>
            <Button variant="outline" size="sm" className="glass">
              Next
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Generations;
