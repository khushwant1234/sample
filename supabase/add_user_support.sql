-- Add user_id support to conversations and messages tables
-- This migration adds user identification to ensure users only see their own chats

-- Add user_id column to conversations table
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'anonymous';

-- Add user_id column to messages table (for consistency and future features)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'anonymous';

-- Create indexes for better performance on user queries
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);

-- Update Row Level Security policies to be user-specific
-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations on conversations" ON conversations;
DROP POLICY IF EXISTS "Allow all operations on messages" ON messages;

-- Create user-specific policies for conversations
CREATE POLICY "Users can only see their own conversations" ON conversations
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can only create conversations for themselves" ON conversations
  FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can only update their own conversations" ON conversations
  FOR UPDATE USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can only delete their own conversations" ON conversations
  FOR DELETE USING (user_id = current_setting('app.current_user_id', true));

-- Create user-specific policies for messages
CREATE POLICY "Users can only see messages from their conversations" ON messages
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can only create messages for their conversations" ON messages
  FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can only update their own messages" ON messages
  FOR UPDATE USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can only delete their own messages" ON messages
  FOR DELETE USING (user_id = current_setting('app.current_user_id', true));

-- For development/demo purposes, create a fallback policy for unauthenticated access
-- Remove these in production
CREATE POLICY "Allow anonymous access for demo" ON conversations
  FOR ALL USING (user_id = 'anonymous');

CREATE POLICY "Allow anonymous access for demo" ON messages
  FOR ALL USING (user_id = 'anonymous');
