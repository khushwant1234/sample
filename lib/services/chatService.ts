import { createClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'
import type { Conversation, Message } from '@/lib/types/database'

const supabase = createClient()

export async function createConversation(title: string): Promise<Conversation> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      id: uuidv4(),
      title,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function addMessage(
  conversationId: string,
  content: string,
  role: 'user' | 'assistant',
  imageUrl?: string
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      id: uuidv4(),
      conversation_id: conversationId,
      content,
      role,
      image_url: imageUrl,
    })
    .select()
    .single()

  if (error) throw error

  // Update conversation timestamp
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  return data
}

export async function deleteConversation(id: string): Promise<void> {
  // Delete messages first (foreign key constraint)
  await supabase.from('messages').delete().eq('conversation_id', id)
  
  // Then delete conversation
  const { error } = await supabase.from('conversations').delete().eq('id', id)
  
  if (error) throw error
}

export async function updateConversationTitle(id: string, title: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ title })
    .eq('id', id)

  if (error) throw error
}

export async function createConversationWithFirstMessage(
  title: string,
  content: string,
  role: 'user' | 'assistant',
  imageUrl?: string
): Promise<{ conversation: Conversation; message: Message }> {
  // Create conversation first
  const conversation = await createConversation(title)
  
  // Add the first message
  const { data: messageData, error: messageError } = await supabase
    .from('messages')
    .insert({
      id: uuidv4(),
      conversation_id: conversation.id,
      content,
      role,
      image_url: imageUrl,
    })
    .select()
    .single()

  if (messageError) throw messageError

  return { conversation, message: messageData }
}

export async function deleteEmptyConversations(): Promise<void> {
  // Get all conversations that have no messages
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('id')

  if (convError) throw convError

  if (!conversations || conversations.length === 0) return

  // Check which conversations have messages
  const { data: messagesData, error: msgError } = await supabase
    .from('messages')
    .select('conversation_id')
    .in('conversation_id', conversations.map(c => c.id))

  if (msgError) throw msgError

  // Find conversations with no messages
  const conversationsWithMessages = new Set(
    messagesData?.map(m => m.conversation_id) || []
  )
  
  const emptyConversationIds = conversations
    .filter(c => !conversationsWithMessages.has(c.id))
    .map(c => c.id)

  // Delete empty conversations
  if (emptyConversationIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('conversations')
      .delete()
      .in('id', emptyConversationIds)
    
    if (deleteError) throw deleteError
  }
}
