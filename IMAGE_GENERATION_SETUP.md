# Image Generation & Model Selection Setup

## 📋 What's Been Implemented

✅ **Dual Model System**:

- **Gemini 1.5 Flash** - Fast, efficient text responses with higher rate limits
- **Gemini 1.5 Pro** - More capable, detailed text analysis (user selectable)
- **Gemini 2.0 Flash** - 🖼️ **ONLY MODEL that can generate actual images**

✅ **Model Selection UI** - Switch between Flash (fast) and Pro (smart) for text
✅ **Rate Limiting** - Exponential backoff retry logic with 15 req/min limit
✅ **Database Schema** - Added image_url column to messages table
✅ **Supabase Storage** - Images stored in cloud storage, not database
✅ **UI Updates** - Messages display generated images with model information
✅ **Fallback System** - Graceful degradation if image generation fails

## 🔧 Setup Steps Required

### 1. Database Migration

Run this SQL in your Supabase dashboard (SQL Editor):

```sql
-- Add image_url column to messages table to support image generation
ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add index for image messages
CREATE INDEX IF NOT EXISTS idx_messages_image_url ON messages(image_url) WHERE image_url IS NOT NULL;
```

### 2. Supabase Storage Setup

Run this SQL in your Supabase dashboard (SQL Editor) to create the storage bucket:

```sql
-- Create the generated-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-images',
  'generated-images',
  true,
  10485760, -- 10MB limit per file
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
);

-- Create storage policies to allow public read access
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'generated-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'generated-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete own images" ON storage.objects
FOR DELETE USING (bucket_id = 'generated-images');
```

### 3. Package Installation

The `@google/genai` package should already be installed, but if you get import errors, run:

```bash
npm install @google/genai
```

## 🎯 How to Test

1. Start your development server:

   ```bash
   npm run dev
   ```

2. **Test Model Selection**:

   - Use the model toggle buttons (⚡ Flash vs 🧠 Pro) for different text quality
   - Notice performance difference between models

3. **Test Image Generation** (uses Gemini 2.0 Flash automatically):

   - "Generate an image of a sunset over mountains"
   - "Create a picture of a futuristic city"
   - "Draw me a cute cat wearing a hat"
   - "Make an image of a rainbow over a castle"

4. **Verify Model Usage**:
   - Check the footer text to see which models are being used
   - Image generation always uses Gemini 2.0 Flash (only image-capable model)
   - Text responses use your selected model (Flash or Pro)

## 🔄 How It Works

1. **Model Selection**: Choose between Flash (⚡ fast) and Pro (🧠 smart) for text responses
2. **Text Detection**: System detects image generation requests using keywords
3. **Automatic Image Model**: Uses `gemini-2.0-flash-preview-image-generation` for actual image creation (🖼️ ONLY model with this capability)
4. **Supabase Storage**: Images stored in cloud storage and referenced via public URLs
5. **Fallback**: If image generation fails, provides creative descriptions using selected text model
6. **Model Display**: UI shows which models are being used for transparency

## 🚨 Notes

- The Gemini 2.0 Flash image generation model is in preview, so availability may vary
- Images are stored in Supabase Storage with 10MB file size limit and public access
- Rate limiting is set to 15 requests per minute to stay within API limits
- System gracefully falls back to descriptions if image generation fails

## 🎨 Example Usage

**User**: "Generate an image of a dragon flying over a medieval castle"

**Response**: The AI will generate an actual image and display it in the chat, along with descriptive text about the creation.
