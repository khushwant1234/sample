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

-- Allow authenticated users to upload images (optional - can be changed based on your needs)
CREATE POLICY "Authenticated users can upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'generated-images');

-- Allow users to delete their own images (optional)
CREATE POLICY "Users can delete own images" ON storage.objects 
FOR DELETE USING (bucket_id = 'generated-images');
