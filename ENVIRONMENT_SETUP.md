# Environment Setup Guide

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI API Configuration (Optional - for real AI integration)
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_GOOGLE_API_KEY=your_google_api_key

**Note**: The Google API key is used in the GoogleGenAI constructor for browser authentication.
```

## Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your Supabase dashboard, go to Settings > API
3. Copy your Project URL and anon/public key
4. Add them to your `.env.local` file

## Database Schema

Run these SQL commands in your Supabase SQL editor to create the required tables:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create generations table
CREATE TABLE generations (
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

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own generations" ON generations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own generations" ON generations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own generations" ON generations FOR UPDATE USING (auth.uid() = user_id);
```

## Authentication Setup

1. In your Supabase dashboard, go to Authentication > Settings
2. Configure your site URL (e.g., `http://localhost:5173` for development)
3. Add redirect URLs for OAuth providers if using Google sign-in
4. Enable email confirmations if desired

## Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins
6. In Supabase, go to Authentication > Providers and configure Google OAuth

## AI Integration

The app currently uses a **mock AI service** that works out of the box without any API keys. This means you can test the full functionality immediately!

### Current Setup (Mock Service)
- ✅ **No API keys required**
- ✅ **Works immediately**
- ✅ **Generates realistic ad content**
- ✅ **Full user experience**

### Optional: Real AI Integration
If you want to use real AI instead of the mock service:

#### OpenAI GPT-4o-mini (Image Analysis & Ad Copy)
1. Get an OpenAI API key from [openai.com](https://openai.com)
2. Add it to your `.env.local` file as `VITE_OPENAI_API_KEY=your_key_here`
3. The app will automatically use GPT-4o-mini for image analysis and ad copy generation

#### Google AI (Video Generation with Veo 3.1)
1. Get a Google AI API key from [Google AI Studio](https://aistudio.google.com/)
2. Add it to your `.env.local` file as `VITE_GOOGLE_API_KEY=your_key_here`
3. The app will use Google's Veo 3.1 to generate dynamic videos from your uploaded images

**Note**: The mock service provides excellent results for testing and development. You only need real AI APIs if you want to generate content based on actual image analysis and create video effects.

## Running the Application

1. Install dependencies: `npm install`
2. Set up your environment variables
3. Run the development server: `npm run dev`
4. Open [http://localhost:5173](http://localhost:5173) in your browser

## Troubleshooting

- Make sure all environment variables are set correctly
- Check that your Supabase project is active
- Verify that the database schema is created
- Ensure Row Level Security policies are in place
