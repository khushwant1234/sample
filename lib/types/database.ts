export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string
          title: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          content: string
          role: 'user' | 'assistant'
          user_id: string
          created_at: string
          image_url?: string
        }
        Insert: {
          id?: string
          conversation_id: string
          content: string
          role: 'user' | 'assistant'
          user_id: string
          created_at?: string
          image_url?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          content?: string
          role?: 'user' | 'assistant'
          user_id?: string
          created_at?: string
          image_url?: string
        }
      }
    }
  }
}

export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
