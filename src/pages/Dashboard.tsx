import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Image, Zap, TrendingUp, Upload, Layout, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface DashboardStats {
  generationsThisMonth: number;
  creditsRemaining: number;
  creditsTotal: number;
  adsCreatedToday: number;
  templatesUsed: number;
  recentGenerations: Array<{
    id: string;
    title: string;
    date: string;
    format: string;
  }>;
}

const Dashboard = () => {
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  
  const [stats, setStats] = useState<DashboardStats>({
    generationsThisMonth: 0,
    creditsRemaining: 50,
    creditsTotal: 50,
    adsCreatedToday: 0,
    templatesUsed: 0,
    recentGenerations: []
  });
  const [loading, setLoading] = useState(true);

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get current date ranges
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      // Fetch generations this month (from image_variations)
      const { count: generationsThisMonth } = await supabase
        .from('image_variations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      // Fetch ads created today (from generations table)
      const { count: adsCreatedToday } = await supabase
        .from('generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString());

      // Fetch templates used (unique templates from generations)
      const { data: templatesData } = await supabase
        .from('generations')
        .select('template')
        .eq('user_id', user.id);
      
      const uniqueTemplates = new Set(templatesData?.map(item => item.template) || []);
      const templatesUsed = uniqueTemplates.size;

      // Fetch recent generations (last 6 from generations table)
      const { data: recentGenerationsData } = await supabase
        .from('generations')
        .select('id, title, format, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6);

      const recentGenerations = recentGenerationsData?.map(gen => ({
        id: gen.id,
        title: gen.title,
        date: getTimeAgo(gen.created_at),
        format: gen.format
      })) || [];

      // Calculate credits (for now, using a simple system)
      // In a real app, you'd have a separate credits table
      const creditsUsed = (generationsThisMonth || 0) * 1; // 1 credit per generation
      const creditsTotal = 50; // Monthly limit
      const creditsRemaining = Math.max(0, creditsTotal - creditsUsed);

      setStats({
        generationsThisMonth: generationsThisMonth || 0,
        creditsRemaining,
        creditsTotal,
        adsCreatedToday: adsCreatedToday || 0,
        templatesUsed,
        recentGenerations
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  // Helper function to get days until month end
  const getDaysUntilMonthEnd = () => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const diffInDays = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays;
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [user]);

  // Calculate trends (simplified for now)
  const getTrend = (current: number, previous: number = 0) => {
    if (previous === 0) return current > 0 ? `+${current}` : '0';
    const change = current - previous;
    const percentage = Math.round((change / previous) * 100);
    return change >= 0 ? `+${percentage}%` : `${percentage}%`;
  };

  const statsData = [
    { 
      title: "Generations This Month", 
      value: stats.generationsThisMonth.toString(), 
      icon: Zap, 
      trend: getTrend(stats.generationsThisMonth, 0) 
    },
    { 
      title: "Credits Remaining", 
      value: `${stats.creditsRemaining}/${stats.creditsTotal}`, 
      icon: Sparkles, 
      trend: `${Math.round((stats.creditsRemaining / stats.creditsTotal) * 100)}%` 
    },
    { 
      title: "Ads Created Today", 
      value: stats.adsCreatedToday.toString(), 
      icon: Image, 
      trend: getTrend(stats.adsCreatedToday, 0) 
    },
    { 
      title: "Templates Used", 
      value: stats.templatesUsed.toString(), 
      icon: Layout, 
      trend: getTrend(stats.templatesUsed, 0) 
    },
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
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="glass">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2"></div>
                  <div className="h-3 w-12 bg-muted animate-pulse rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            statsData.map((stat) => (
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
            ))
          )}
        </div>

        {/* Credits Progress */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-foreground">Monthly Credits</CardTitle>
            <CardDescription>
              {loading ? (
                <div className="h-4 w-48 bg-muted animate-pulse rounded"></div>
              ) : (
                `${stats.creditsRemaining} of ${stats.creditsTotal} credits remaining this month`
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-2 w-full bg-muted animate-pulse rounded mb-2"></div>
            ) : (
              <Progress 
                value={(stats.creditsRemaining / stats.creditsTotal) * 100} 
                className="mb-2" 
              />
            )}
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {loading ? (
                  <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                ) : (
                  `Resets in ${getDaysUntilMonthEnd()} days`
                )}
              </span>
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

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="glass">
                  <div className="aspect-square bg-muted animate-pulse rounded-t-xl"></div>
                  <CardHeader>
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded mb-2"></div>
                    <div className="flex items-center justify-between">
                      <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
                      <div className="h-5 w-12 bg-muted animate-pulse rounded-full"></div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : stats.recentGenerations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.recentGenerations.map((gen) => (
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
          ) : (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">No generations yet</h3>
              <p className="text-muted-foreground mb-6">
                Start creating your first AI-powered ad to see it here.
              </p>
              <Link to="/dashboard/create">
                <Button>Create New Ad</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
