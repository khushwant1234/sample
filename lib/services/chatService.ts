import { createClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'
import type { Conversation, Message } from '@/lib/types/database'
import { getCurrentUserId } from './userService'

const supabase = createClient()

export async function createConversation(title: string, userId?: string): Promise<Conversation> {
  const finalUserId = userId || await getCurrentUserId();
  
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      id: uuidv4(),
      title,
      user_id: finalUserId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getConversations(userId?: string): Promise<Conversation[]> {
  const finalUserId = userId || await getCurrentUserId();
  
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', finalUserId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getConversation(id: string, userId?: string): Promise<Conversation | null> {
  const finalUserId = userId || await getCurrentUserId();
  
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .eq('user_id', finalUserId)
    .single()

  if (error) return null
  return data
}

export async function getMessages(conversationId: string, userId?: string): Promise<Message[]> {
  const finalUserId = userId || await getCurrentUserId();
  
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('user_id', finalUserId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function addMessage(
  conversationId: string,
  content: string,
  role: 'user' | 'assistant',
  imageUrl?: string,
  userId?: string
): Promise<Message> {
  const finalUserId = userId || await getCurrentUserId();
  
  const { data, error } = await supabase
    .from('messages')
    .insert({
      id: uuidv4(),
      conversation_id: conversationId,
      content,
      role,
      image_url: imageUrl,
      user_id: finalUserId,
    })
    .select()
    .single()

  if (error) throw error

  // Update conversation timestamp (only if user owns the conversation)
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)
    .eq('user_id', finalUserId)

  return data
}

export async function deleteConversation(id: string, userId?: string): Promise<void> {
  const finalUserId = userId || await getCurrentUserId();
  
  // Delete messages first (foreign key constraint) - only user's messages
  await supabase
    .from('messages')
    .delete()
    .eq('conversation_id', id)
    .eq('user_id', finalUserId)
  
  // Then delete conversation - only if user owns it
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id)
    .eq('user_id', finalUserId)
  
  if (error) throw error
}

export async function updateConversationTitle(id: string, title: string, userId?: string): Promise<void> {
  const finalUserId = userId || await getCurrentUserId();
  
  const { error } = await supabase
    .from('conversations')
    .update({ title })
    .eq('id', id)
    .eq('user_id', finalUserId)

  if (error) throw error
}

export async function createConversationWithFirstMessage(
  title: string,
  content: string,
  role: 'user' | 'assistant',
  imageUrl?: string,
  userId?: string
): Promise<{ conversation: Conversation; message: Message }> {
  const finalUserId = userId || await getCurrentUserId();
  
  // Create conversation first
  const conversation = await createConversation(title, finalUserId)
  
  // Add the first message
  const { data: messageData, error: messageError } = await supabase
    .from('messages')
    .insert({
      id: uuidv4(),
      conversation_id: conversation.id,
      content,
      role,
      image_url: imageUrl,
      user_id: finalUserId,
    })
    .select()
    .single()

  if (messageError) throw messageError

  return { conversation, message: messageData }
}

export async function deleteEmptyConversations(userId?: string): Promise<void> {
  const finalUserId = userId || await getCurrentUserId();
  
  // Get all conversations that have no messages for this user
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', finalUserId)

  if (convError) throw convError

  if (!conversations || conversations.length === 0) return

  // Check which conversations have messages for this user
  const { data: messagesData, error: msgError } = await supabase
    .from('messages')
    .select('conversation_id')
    .in('conversation_id', conversations.map(c => c.id))
    .eq('user_id', finalUserId)

  if (msgError) throw msgError

  // Find conversations with no messages
  const conversationsWithMessages = new Set(
    messagesData?.map(m => m.conversation_id) || []
  )
  
  const emptyConversationIds = conversations
    .filter(c => !conversationsWithMessages.has(c.id))
    .map(c => c.id)

  // Delete empty conversations for this user
  if (emptyConversationIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('conversations')
      .delete()
      .in('id', emptyConversationIds)
      .eq('user_id', finalUserId)
    
    if (deleteError) throw deleteError
  }
}
