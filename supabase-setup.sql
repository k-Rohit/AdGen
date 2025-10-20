-- Supabase Database Setup Script
-- Run this in your Supabase SQL Editor

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create generations table
CREATE TABLE IF NOT EXISTS generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  format TEXT NOT NULL,
  tone TEXT NOT NULL,
  template TEXT NOT NULL,
  image_url TEXT,
  generated_content JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create image_variations table to store generated images
CREATE TABLE IF NOT EXISTS image_variations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  original_image_url TEXT,
  variation_name TEXT NOT NULL,
  variation_description TEXT,
  generated_image_url TEXT NOT NULL,
  prompt_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_variations ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 6. Create policies for generations
CREATE POLICY "Users can view own generations" ON generations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own generations" ON generations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own generations" ON generations FOR UPDATE USING (auth.uid() = user_id);

-- 7. Create policies for image_variations
CREATE POLICY "Users can view own image variations" ON image_variations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own image variations" ON image_variations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own image variations" ON image_variations FOR UPDATE USING (auth.uid() = user_id);

-- 8. Create storage bucket for generated images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;

-- 9. Create storage policies
CREATE POLICY "Users can upload their own images" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'generated-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own images" ON storage.objects 
FOR SELECT USING (
  bucket_id = 'generated-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own images" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'generated-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 10. Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create user_credits table for tracking monthly credits
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  credits_used INTEGER DEFAULT 0,
  credits_total INTEGER DEFAULT 50,
  month_year TEXT NOT NULL, -- Format: '2024-01'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

-- 12. Create credit_transactions table for detailed credit tracking
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('used', 'refunded', 'purchased', 'bonus')),
  credits_amount INTEGER NOT NULL,
  description TEXT,
  related_table TEXT, -- 'image_variations', 'generations', etc.
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Create ads table for tracking created ads
CREATE TABLE IF NOT EXISTS ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  format TEXT NOT NULL,
  template_used TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'published', 'archived')),
  image_variations_count INTEGER DEFAULT 0,
  video_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Create template_usage table for tracking template usage
CREATE TABLE IF NOT EXISTS template_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  template_name TEXT NOT NULL,
  usage_count INTEGER DEFAULT 1,
  first_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, template_name)
);

-- 15. Enable Row Level Security for new tables
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage ENABLE ROW LEVEL SECURITY;

-- 16. Create policies for user_credits
CREATE POLICY "Users can view own credits" ON user_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credits" ON user_credits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own credits" ON user_credits FOR UPDATE USING (auth.uid() = user_id);

-- 17. Create policies for credit_transactions
CREATE POLICY "Users can view own credit transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credit transactions" ON credit_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 18. Create policies for ads
CREATE POLICY "Users can view own ads" ON ads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ads" ON ads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ads" ON ads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ads" ON ads FOR DELETE USING (auth.uid() = user_id);

-- 19. Create policies for template_usage
CREATE POLICY "Users can view own template usage" ON template_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own template usage" ON template_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own template usage" ON template_usage FOR UPDATE USING (auth.uid() = user_id);

-- 20. Create function to initialize user credits for new month
CREATE OR REPLACE FUNCTION public.initialize_user_credits()
RETURNS TRIGGER AS $$
DECLARE
  current_month TEXT;
BEGIN
  current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  INSERT INTO public.user_credits (user_id, month_year, credits_used, credits_total)
  VALUES (NEW.user_id, current_month, 0, 50)
  ON CONFLICT (user_id, month_year) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 21. Create function to track credit usage
CREATE OR REPLACE FUNCTION public.track_credit_usage()
RETURNS TRIGGER AS $$
DECLARE
  current_month TEXT;
  credits_to_deduct INTEGER;
BEGIN
  current_month := TO_CHAR(NOW(), 'YYYY-MM');
  credits_to_deduct := 1; -- 1 credit per image generation
  
  -- Initialize credits for this month if not exists
  INSERT INTO public.user_credits (user_id, month_year, credits_used, credits_total)
  VALUES (NEW.user_id, current_month, 0, 50)
  ON CONFLICT (user_id, month_year) DO NOTHING;
  
  -- Update credits used
  UPDATE public.user_credits 
  SET credits_used = credits_used + credits_to_deduct,
      updated_at = NOW()
  WHERE user_id = NEW.user_id AND month_year = current_month;
  
  -- Record transaction
  INSERT INTO public.credit_transactions (
    user_id, 
    transaction_type, 
    credits_amount, 
    description, 
    related_table, 
    related_id
  ) VALUES (
    NEW.user_id, 
    'used', 
    credits_to_deduct, 
    'Image generation: ' || NEW.variation_name,
    'image_variations',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 22. Create function to track template usage
CREATE OR REPLACE FUNCTION public.track_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.template_usage (user_id, template_name)
  VALUES (NEW.user_id, NEW.template)
  ON CONFLICT (user_id, template_name) 
  DO UPDATE SET 
    usage_count = template_usage.usage_count + 1,
    last_used_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 23. Create triggers
DROP TRIGGER IF EXISTS on_image_variation_created ON image_variations;
CREATE TRIGGER on_image_variation_created
  AFTER INSERT ON image_variations
  FOR EACH ROW EXECUTE FUNCTION public.track_credit_usage();

DROP TRIGGER IF EXISTS on_generation_created ON generations;
CREATE TRIGGER on_generation_created
  AFTER INSERT ON generations
  FOR EACH ROW EXECUTE FUNCTION public.track_template_usage();

-- 24. Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
