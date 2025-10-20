import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Download, Check, Star, LogOut, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const { user, signOut } = useAuth();
  const { toast } = useToast();

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

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Copy",
      description: "Smart ad text generation that converts. Our AI analyzes your product and creates compelling copy that resonates with your audience.",
    },
    {
      icon: Zap,
      title: "Professional Templates",
      description: "Pre-designed layouts for every platform. Choose from hundreds of stunning templates optimized for Instagram, Facebook, and more.",
    },
    {
      icon: Download,
      title: "Export Anywhere",
      description: "Multiple formats ready to go. Download in any size or format you need, from Instagram stories to billboard ads.",
    },
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: billingPeriod === "monthly" ? "$0" : "$0",
      description: "Perfect for trying out our platform",
      features: ["3 generations/month", "Watermarked exports", "Basic templates", "Standard support"],
      cta: "Start Free",
      popular: false,
    },
    {
      name: "Pro",
      price: billingPeriod === "monthly" ? "$19" : "$15",
      description: "Best for creators and small businesses",
      features: ["50 generations/month", "No watermark", "All templates", "Priority support", "HD exports"],
      cta: "Start Pro Trial",
      popular: true,
    },
    {
      name: "Agency",
      price: billingPeriod === "monthly" ? "$99" : "$79",
      description: "For agencies and power users",
      features: ["Unlimited generations", "API access", "Custom templates", "Dedicated support", "White label"],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "E-commerce Owner",
      content: "This tool cut my ad creation time from hours to minutes. The AI-generated copy is surprisingly good!",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    },
    {
      name: "Marcus Johnson",
      role: "Marketing Director",
      content: "We've seen a 40% increase in click-through rates since using these AI-generated ads. Game changer.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    },
    {
      name: "Emily Rodriguez",
      role: "Social Media Manager",
      content: "The templates are gorgeous and the customization options are endless. My clients love the results.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    },
  ];

  return (
    <div className="min-h-screen dark">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">AdGen AI</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost">
                    <User className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/sign-in">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/sign-up">
                  <Button>Start Free</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden gradient-hero">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full blur-[100px]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-fuchsia-500 rounded-full blur-[120px]" />
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-block mb-6">
              <span className="px-4 py-2 rounded-full glass text-sm font-medium text-foreground">
                ✨ AI-Powered Ad Generation
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Turn Product Images Into
              <br />
              <span className="text-gradient animate-gradient-shift bg-300%">Stunning Ads in Seconds</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Upload your product photos and let our AI create professional, conversion-optimized ads 
              with compelling copy and beautiful designs.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Link to="/dashboard/create">
                  <Button size="lg" className="glow group">
                    Create New Ad
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              ) : (
                <Link to="/sign-up">
                  <Button size="lg" className="glow group">
                    Start Creating Free
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              )}
              <Button size="lg" variant="outline" className="glass">
                Watch Demo
              </Button>
            </div>

            <div className="mt-12 text-sm text-muted-foreground">
              Trusted by <span className="font-semibold text-foreground">10,000+</span> creators worldwide
            </div>
          </motion.div>

          {/* Sample Ad Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-2xl p-6 hover-lift">
                <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 rounded-xl mb-4 flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-foreground">Sample Ad {i}</h3>
                <p className="text-sm text-muted-foreground">AI-generated copy and design</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-background">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Everything You Need to Create <span className="text-gradient">Perfect Ads</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to make ad creation effortless
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass rounded-2xl p-8 hover-lift"
              >
                <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-card">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Create Ads in <span className="text-gradient">3 Simple Steps</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: "1", title: "Upload Product Image", desc: "Drag and drop your product photo" },
              { step: "2", title: "AI Generates Variations", desc: "Get multiple ad designs instantly" },
              { step: "3", title: "Customize & Download", desc: "Fine-tune and export in any format" },
            ].map((item, index) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-background">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Simple, <span className="text-gradient">Transparent Pricing</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">Choose the plan that fits your needs</p>
            
            <div className="inline-flex items-center glass rounded-full p-1">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-6 py-2 rounded-full transition-all ${
                  billingPeriod === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("annual")}
                className={`px-6 py-2 rounded-full transition-all ${
                  billingPeriod === "annual" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Annual <span className="text-xs ml-1">(Save 20%)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan) => (
              <motion.div
                key={plan.name}
                whileHover={{ scale: 1.02 }}
                className={`glass rounded-2xl p-8 ${plan.popular ? "ring-2 ring-primary glow" : ""} relative`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2 text-foreground">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                </div>
                
                <div className="mb-6">
                  <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center text-sm">
                      <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {user ? (
                  <Link to="/dashboard">
                    <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link to="/sign-up">
                    <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                      {plan.cta}
                    </Button>
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6 bg-card">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Loved by <span className="text-gradient">Creators Worldwide</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass rounded-2xl p-6"
              >
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground mb-6">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Templates</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 gradient-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-foreground">AdGen AI</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2024 AdGen AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
