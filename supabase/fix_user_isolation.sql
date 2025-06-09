-- Fix user isolation by disabling RLS and handling user filtering at application level
-- This approach is more compatible with connection pooling and easier to debug

-- First, ensure the user_id columns exist
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'anonymous';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'anonymous';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- Drop all existing RLS policies
DROP POLICY IF EXISTS "Users can only see their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can only create conversations for themselves" ON conversations;
DROP POLICY IF EXISTS "Users can only update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can only delete their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can only see messages from their conversations" ON messages;
DROP POLICY IF EXISTS "Users can only create messages for their conversations" ON messages;
DROP POLICY IF EXISTS "Users can only update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can only delete their own messages" ON messages;
DROP POLICY IF EXISTS "Allow anonymous access for demo" ON conversations;
DROP POLICY IF EXISTS "Allow anonymous access for demo" ON messages;
DROP POLICY IF EXISTS "Allow all operations on conversations" ON conversations;
DROP POLICY IF EXISTS "Allow all operations on messages" ON messages;

-- Disable RLS (we'll handle user isolation at the application level)
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Create simple policies that allow all operations
-- (user filtering will be handled by the application)
CREATE POLICY "Allow all operations" ON conversations FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON messages FOR ALL USING (true);

-- Update existing data to have anonymous user_id if null
UPDATE conversations SET user_id = 'anonymous' WHERE user_id IS NULL OR user_id = '';
UPDATE messages SET user_id = 'anonymous' WHERE user_id IS NULL OR user_id = '';
