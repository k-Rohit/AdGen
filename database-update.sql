-- Database Update Script - Run this in your Supabase SQL Editor
-- This adds the new tables for proper credits, ads, and template tracking

-- 1. Create user_credits table for tracking monthly credits
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

-- 2. Create credit_transactions table for detailed credit tracking
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

-- 3. Create ads table for tracking created ads
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

-- 4. Create template_usage table for tracking template usage
CREATE TABLE IF NOT EXISTS template_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  template_name TEXT NOT NULL,
  usage_count INTEGER DEFAULT 1,
  first_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, template_name)
);

-- 5. Enable Row Level Security for new tables
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage ENABLE ROW LEVEL SECURITY;

-- 6. Create policies for user_credits
CREATE POLICY "Users can view own credits" ON user_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credits" ON user_credits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own credits" ON user_credits FOR UPDATE USING (auth.uid() = user_id);

-- 7. Create policies for credit_transactions
CREATE POLICY "Users can view own credit transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credit transactions" ON credit_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Create policies for ads
CREATE POLICY "Users can view own ads" ON ads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ads" ON ads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ads" ON ads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ads" ON ads FOR DELETE USING (auth.uid() = user_id);

-- 9. Create policies for template_usage
CREATE POLICY "Users can view own template usage" ON template_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own template usage" ON template_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own template usage" ON template_usage FOR UPDATE USING (auth.uid() = user_id);

-- 10. Create function to track credit usage
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

-- 11. Create function to track template usage
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

-- 12. Create triggers
DROP TRIGGER IF EXISTS on_image_variation_created ON image_variations;
CREATE TRIGGER on_image_variation_created
  AFTER INSERT ON image_variations
  FOR EACH ROW EXECUTE FUNCTION public.track_credit_usage();

DROP TRIGGER IF EXISTS on_generation_created ON generations;
CREATE TRIGGER on_generation_created
  AFTER INSERT ON generations
  FOR EACH ROW EXECUTE FUNCTION public.track_template_usage();

-- 13. Migrate existing data (optional - run this to populate new tables with existing data)
-- This will create credit records for existing users based on their image_variations
INSERT INTO user_credits (user_id, month_year, credits_used, credits_total)
SELECT 
  user_id,
  TO_CHAR(created_at, 'YYYY-MM') as month_year,
  COUNT(*) as credits_used,
  50 as credits_total
FROM image_variations
GROUP BY user_id, TO_CHAR(created_at, 'YYYY-MM')
ON CONFLICT (user_id, month_year) DO NOTHING;

-- Migrate template usage data
INSERT INTO template_usage (user_id, template_name, usage_count, first_used_at, last_used_at)
SELECT 
  user_id,
  template,
  COUNT(*) as usage_count,
  MIN(created_at) as first_used_at,
  MAX(created_at) as last_used_at
FROM generations
GROUP BY user_id, template
ON CONFLICT (user_id, template_name) DO NOTHING;
