import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Search, Star } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const Templates = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [
    "All",
    "E-commerce",
    "Real Estate",
    "SaaS",
    "Social Media",
    "Food & Beverage",
    "Fashion",
  ];

  const templates = [
    { id: 1, name: "Modern Minimal", category: "E-commerce", premium: false, rating: 4.8 },
    { id: 2, name: "Bold Typography", category: "Fashion", premium: true, rating: 4.9 },
    { id: 3, name: "Product Focus", category: "E-commerce", premium: false, rating: 4.7 },
    { id: 4, name: "Lifestyle Blend", category: "Social Media", premium: false, rating: 4.6 },
    { id: 5, name: "Clean Grid", category: "SaaS", premium: true, rating: 4.9 },
    { id: 6, name: "Vibrant Pop", category: "Food & Beverage", premium: false, rating: 4.8 },
    { id: 7, name: "Luxury Showcase", category: "Real Estate", premium: true, rating: 5.0 },
    { id: 8, name: "Social Story", category: "Social Media", premium: false, rating: 4.5 },
    { id: 9, name: "Tech Minimal", category: "SaaS", premium: false, rating: 4.7 },
    { id: 10, name: "Food Delight", category: "Food & Beverage", premium: true, rating: 4.9 },
    { id: 11, name: "Fashion Forward", category: "Fashion", premium: false, rating: 4.6 },
    { id: 12, name: "Property Hero", category: "Real Estate", premium: true, rating: 4.8 },
  ];

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || template.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-foreground">
            Browse <span className="text-gradient">Templates</span>
          </h1>
          <p className="text-muted-foreground">
            Choose from professionally designed templates for every industry
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 glass"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category.toLowerCase() ? "default" : "outline"}
              onClick={() => setActiveCategory(category.toLowerCase())}
              className="glass"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="glass hover-lift cursor-pointer group">
              <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 rounded-t-xl flex items-center justify-center relative">
                {template.premium && (
                  <Badge className="absolute top-3 right-3 gradient-primary">Premium</Badge>
                )}
                <Sparkles className="w-12 h-12 text-primary group-hover:scale-110 transition-transform" />
              </div>
              <CardHeader>
                <CardTitle className="text-base text-foreground flex items-center justify-between">
                  <span>{template.name}</span>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Star className="w-3 h-3 fill-primary text-primary mr-1" />
                    {template.rating}
                  </div>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{template.category}</p>
              </CardHeader>
              <CardContent className="pb-4">
                <Button className="w-full" variant="outline">
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No templates found matching your criteria</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Templates;
