# Database Migration Instructions

## Issue

The current RLS (Row Level Security) policies are causing errors because they rely on PostgreSQL session variables that don't work well with connection pooling.

## Solution

Run the new migration that simplifies the approach by disabling RLS and handling user isolation at the application level.

## Steps to Fix

### 1. Run the Database Migration

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/fix_user_isolation.sql`
4. Click "Run" to execute the migration

**Option B: Using Supabase CLI**

```bash
supabase db reset --db-url "your-database-url"
```

### 2. Restart Your Development Server

After running the migration, restart your Next.js development server:

```bash
npm run dev
```

### 3. Test the Application

1. Try creating a new conversation
2. Verify that user isolation is working by:
   - Logging in as different users
   - Confirming each user only sees their own chats

## What the Migration Does

1. **Ensures user_id columns exist** on both conversations and messages tables
2. **Creates performance indexes** for user-based queries
3. **Removes all RLS policies** that were causing conflicts
4. **Disables RLS** entirely (user filtering handled by application)
5. **Creates simple allow-all policies** for basic access
6. **Updates existing data** to have 'anonymous' user_id where needed

## Key Changes Made to Application Code

1. **Chat Service**: All database operations now filter by `user_id`
2. **User Service**: Extracts Auth0 user ID from session cookies
3. **tRPC Router**: Passes user context to all chat operations
4. **Application Level Security**: User isolation handled in TypeScript, not database

## Verification

After the migration, the application should:

- ✅ Allow creating new conversations
- ✅ Show only user-specific conversations
- ✅ Handle anonymous users gracefully
- ✅ Work with both authenticated and unauthenticated sessions

## Troubleshooting

If you still see errors:

1. Check that the migration ran successfully
2. Verify your Supabase connection is working
3. Clear browser cookies and try again
4. Check browser console for any Auth0 session errors

The application will now handle user isolation at the application level, which is more reliable and easier to debug than database-level RLS policies.
