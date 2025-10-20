# Supabase Setup Guide

## 1. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase-setup.sql`
4. Click **Run** to execute the script

This will create:
- `profiles` table for user data
- `generations` table for ad generation history
- `image_variations` table for storing generated images
- Storage bucket `generated-images` for image files
- Row Level Security policies
- User registration trigger

## 2. Database Update (NEW TABLES)

**IMPORTANT**: After running the initial setup, you need to run the database update script to add the new tables for proper tracking:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `database-update.sql`
4. Click **Run** to execute the script

This will create the new tables for proper statistics tracking:
- `user_credits` - Monthly credit tracking per user
- `credit_transactions` - Detailed credit usage history
- `ads` - Ad creation tracking
- `template_usage` - Template usage statistics
- Automatic triggers to track credit usage and template usage
- Data migration for existing users

## 3. Storage Setup

The script automatically creates a storage bucket called `generated-images` with the following structure:
```
generated-images/
├── {user_id}/
│   ├── variation_Warm and Inviting_1234567890_0.png
│   ├── variation_Modern Minimalism_1234567890_1.png
│   └── variation_Bold Dynamic_1234567890_2.png
```

## 4. Environment Variables

Make sure your `.env.local` file has:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_GOOGLE_API_KEY=your_google_api_key
```

## 5. Testing

1. Upload an image in the app
2. Check the browser console for logs
3. Check Supabase Storage in your dashboard to see generated images
4. Check the `image_variations` table to see metadata

## 6. Troubleshooting

- **Storage bucket not found**: Run the SQL script again
- **Permission denied**: Check RLS policies are created
- **Images not saving**: Check user authentication and storage policies
