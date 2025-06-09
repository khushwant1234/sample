-- Add image_url column to messages table to support image generation
ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add index for image messages
CREATE INDEX IF NOT EXISTS idx_messages_image_url ON messages(image_url) WHERE image_url IS NOT NULL;
