import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, Sparkles, Square, Smartphone, Monitor } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { motion } from "framer-motion";

const CreateAd = () => {
  const [step, setStep] = useState(1);
  const [format, setFormat] = useState("square");
  const [tone, setTone] = useState("professional");

  const formats = [
    { id: "square", name: "Square (1:1)", icon: Square, desc: "Perfect for Instagram & Facebook" },
    { id: "story", name: "Story (9:16)", icon: Smartphone, desc: "Instagram & Facebook Stories" },
    { id: "landscape", name: "Landscape (16:9)", icon: Monitor, desc: "YouTube & Facebook Ads" },
  ];

  const tones = [
    { id: "professional", name: "Professional", desc: "Formal and trustworthy" },
    { id: "casual", name: "Casual", desc: "Friendly and approachable" },
    { id: "luxury", name: "Luxury", desc: "Premium and exclusive" },
    { id: "playful", name: "Playful", desc: "Fun and energetic" },
  ];

  const templates = [
    { id: 1, name: "Modern Minimal", category: "E-commerce" },
    { id: 2, name: "Bold Typography", category: "Fashion" },
    { id: 3, name: "Product Focus", category: "E-commerce" },
    { id: 4, name: "Lifestyle Blend", category: "Social Media" },
    { id: 5, name: "Clean Grid", category: "Tech" },
    { id: 6, name: "Vibrant Pop", category: "Food" },
  ];

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
            { num: 2, label: "Configure" },
            { num: 3, label: "Generate" },
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
                <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary transition-colors cursor-pointer">
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
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} size="lg" className="glow">
                Continue to Configure
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Configure */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Format Selection */}
            <Card className="glass">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-foreground">Select Ad Format</h3>
                <RadioGroup value={format} onValueChange={setFormat}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {formats.map((f) => (
                      <div key={f.id} className="relative">
                        <RadioGroupItem value={f.id} id={f.id} className="peer sr-only" />
                        <Label
                          htmlFor={f.id}
                          className="flex flex-col items-center glass rounded-xl p-6 cursor-pointer hover-lift peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary"
                        >
                          <f.icon className="w-12 h-12 text-primary mb-3" />
                          <span className="font-semibold mb-1 text-foreground">{f.name}</span>
                          <span className="text-xs text-muted-foreground text-center">{f.desc}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Tone Selection */}
            <Card className="glass">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-foreground">Choose Tone</h3>
                <RadioGroup value={tone} onValueChange={setTone}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tones.map((t) => (
                      <div key={t.id} className="relative">
                        <RadioGroupItem value={t.id} id={t.id} className="peer sr-only" />
                        <Label
                          htmlFor={t.id}
                          className="flex items-center glass rounded-lg p-4 cursor-pointer hover-lift peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary"
                        >
                          <div className="flex-1">
                            <span className="font-semibold block mb-1 text-foreground">{t.name}</span>
                            <span className="text-sm text-muted-foreground">{t.desc}</span>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Template Selection */}
            <Card className="glass">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  Choose Template Style
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="glass rounded-xl p-4 hover-lift cursor-pointer group"
                    >
                      <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 rounded-lg mb-3 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                      </div>
                      <h4 className="font-semibold text-sm mb-1 text-foreground">
                        {template.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">{template.category}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button onClick={() => setStep(1)} variant="outline">
                Back
              </Button>
              <Button onClick={() => setStep(3)} size="lg" className="glow">
                Continue to Generate
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Generate */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Card className="glass">
              <CardContent className="p-12 text-center">
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
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button onClick={() => setStep(2)} variant="outline">
                Back
              </Button>
              <Button variant="outline">Cancel</Button>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CreateAd;
