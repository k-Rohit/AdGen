import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  LayoutDashboard, 
  Sparkles, 
  Image, 
  Layout, 
  Settings, 
  Menu, 
  X,
  LogOut,
  User,
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [creditsTotal] = useState(50);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Create New Ad", path: "/dashboard/create", icon: Sparkles },
    { name: "My Generations", path: "/dashboard/generations", icon: Image },
    { name: "Templates", path: "/dashboard/templates", icon: Layout },
    { name: "Settings", path: "/dashboard/settings", icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Fetch credits data
  const fetchCredits = async () => {
    if (!user) return;

    try {
      setLoadingCredits(true);
      
      // Get current month's start date
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Count generations this month (1 credit per generation)
      const { count } = await supabase
        .from('image_variations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      setCreditsUsed(count || 0);
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoadingCredits(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, [user]);

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signed out successfully",
          description: "You have been signed out.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const creditsPercentage = (creditsUsed / creditsTotal) * 100;
  
  // Helper function to get days until month end
  const getDaysUntilMonthEnd = () => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const diffInDays = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays;
  };

  return (
    <div className="min-h-screen dark flex bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 h-screen w-64 glass border-r border-border z-50 transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                <img src="/webicon.png" alt="AdGen AI Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-bold text-foreground">AdGen AI</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden absolute top-4 right-4"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all",
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Credits Info */}
          <div className="p-4 border-t border-border">
            <div className="glass rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Credits</span>
                <span className="text-sm text-muted-foreground">
                  {loadingCredits ? (
                    <div className="h-4 w-12 bg-muted animate-pulse rounded"></div>
                  ) : (
                    `${creditsUsed}/${creditsTotal}`
                  )}
                </span>
              </div>
              {loadingCredits ? (
                <div className="h-2 w-full bg-muted animate-pulse rounded mb-2"></div>
              ) : (
                <Progress value={creditsPercentage} className="mb-2" />
              )}
              <p className="text-xs text-muted-foreground">
                {loadingCredits ? (
                  <div className="h-3 w-20 bg-muted animate-pulse rounded"></div>
                ) : (
                  `Resets in ${getDaysUntilMonthEnd()} days`
                )}
              </p>
            </div>

            <Link to="/pricing">
              <Button className="w-full mb-2 glow">
                <CreditCard className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
            </Link>

            {/* User Menu */}
            <div className="flex items-center space-x-3 p-3 glass rounded-lg">
              <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.user_metadata?.full_name || user?.email || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">Pro Plan</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="flex-shrink-0"
                onClick={handleSignOut}
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 glass border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="flex-1 lg:hidden" />
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
