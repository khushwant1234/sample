# Neural Chat AI

A modern ChatGPT-like application powered by Google Gemini AI, built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- 🤖 **Powered by Google Gemini AI** - Advanced text generation and creative responses
- 🎨 **Image Concept Generation** - Request detailed descriptions of images and visual concepts
- 💬 **Real-time Chat Interface** - Smooth conversation experience with modern UI
- 🗂️ **Smart Conversation Management** - Automatic conversation creation and cleanup
- ✏️ **Dynamic Conversation Titles** - Auto-generated titles based on first message
- 🗑️ **Conversation History** - Edit titles and delete conversations
- 🎭 **Glassmorphism Design** - Modern, beautiful UI with gradient backgrounds
- 📱 **Mobile-Responsive** - Works perfectly on all devices
- 🎯 **TypeScript** - Full type safety throughout the application
- 🚀 **Auto-conversation Creation** - Start chatting immediately without manual setup

## AI Capabilities

### Text Generation

- Powered by Gemini 1.5 Pro model
- Contextual and engaging responses
- Topic-aware conversations
- Creative writing assistance

### Image Concept Generation

Try asking for:

- "Generate image of a sunset over mountains"
- "Create picture of a futuristic city"
- "Draw a magical forest"
- "Visualize a space station"

The AI will provide detailed, creative descriptions of what such images would look like.

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account and project
- A Google AI Studio account for Gemini API access

### Setup

1. **Clone and install dependencies:**

   ```bash
   npm install
   ```

2. **Set up Supabase:**

   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Run the SQL from `supabase/schema.sql` in your Supabase SQL editor

3. **Get Gemini API Key:**

   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key for Gemini

4. **Configure environment variables:**
   Update `.env` with your credentials:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

5. **Run the development server:**

   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

The application uses two main tables:

- **conversations**: Stores chat conversation metadata
- **messages**: Stores individual messages within conversations

## Customization

### Adding Real AI Integration

Replace the mock AI service in `lib/services/aiService.ts` with your preferred AI provider:

- OpenAI GPT
- Anthropic Claude
- Google Gemini
- Local models via Ollama

### Styling

The UI uses Tailwind CSS. Customize the design by modifying the component classes or extending the Tailwind configuration.

## Project Structure

```
├── app/                  # Next.js app directory
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Main chat page
├── components/          # React components
│   ├── ChatInterface.tsx
│   └── Sidebar.tsx
├── lib/                 # Utilities and services
│   ├── services/        # Business logic
│   ├── supabase/        # Database clients
│   └── types/           # TypeScript types
└── supabase/           # Database schema
```

## License

MIT License - feel free to use this project as a starting point for your own chat applications!
