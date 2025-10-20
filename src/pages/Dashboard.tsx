import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Image, Zap, TrendingUp, Upload, Layout } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  
  const stats = [
    { title: "Generations This Month", value: "23", icon: Zap, trend: "+12%" },
    { title: "Credits Remaining", value: "27/50", icon: Sparkles, trend: "54%" },
    { title: "Ads Created Today", value: "5", icon: Image, trend: "+2" },
    { title: "Templates Used", value: "8", icon: Layout, trend: "+3" },
  ];

  const recentGenerations = [
    { id: 1, title: "Product Ad - Sneakers", date: "2 hours ago", format: "Square" },
    { id: 2, title: "Social Story - Coffee", date: "5 hours ago", format: "Story" },
    { id: 3, title: "Banner - Tech Product", date: "1 day ago", format: "Landscape" },
    { id: 4, title: "Instagram Post - Fashion", date: "1 day ago", format: "Square" },
    { id: 5, title: "Facebook Ad - Skincare", date: "2 days ago", format: "Square" },
    { id: 6, title: "Story - Food Delivery", date: "3 days ago", format: "Story" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2 text-foreground">
            Welcome back, <span className="text-gradient">{userName}</span>!
          </h1>
          <p className="text-muted-foreground">Here's what's happening with your ad creations today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="glass hover-lift">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-primary mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  {stat.trend}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Credits Progress */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-foreground">Monthly Credits</CardTitle>
            <CardDescription>27 of 50 credits remaining this month</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={54} className="mb-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Resets in 12 days</span>
              <Link to="/pricing" className="text-primary hover:underline">
                Upgrade plan
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/dashboard/create">
              <Card className="glass hover-lift cursor-pointer group">
                <CardContent className="flex items-center p-6">
                  <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Upload & Generate</h3>
                    <p className="text-sm text-muted-foreground">Start creating new ads</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/dashboard/templates">
              <Card className="glass hover-lift cursor-pointer group">
                <CardContent className="flex items-center p-6">
                  <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Layout className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Browse Templates</h3>
                    <p className="text-sm text-muted-foreground">Explore design options</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Generations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Recent Generations</h2>
            <Link to="/dashboard/generations">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentGenerations.map((gen) => (
              <Card key={gen.id} className="glass hover-lift cursor-pointer group">
                <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 rounded-t-xl flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <CardHeader>
                  <CardTitle className="text-base text-foreground">{gen.title}</CardTitle>
                  <CardDescription className="flex items-center justify-between">
                    <span>{gen.date}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {gen.format}
                    </span>
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
