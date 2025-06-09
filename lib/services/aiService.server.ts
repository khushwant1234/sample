import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI, Modality } from "@google/genai";
import { uploadImageToStorage } from '@/lib/services/storageService';
import 'server-only';

// Initialize Gemini AI (legacy)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Initialize new Google GenAI for image generation
const genAINew = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Available text generation models
const TEXT_MODELS = {
  'flash': 'gemini-1.5-flash',      // Fast, efficient, higher rate limits
  'pro': 'gemini-1.5-pro',         // More capable, slower, lower rate limits
} as const;

// Image generation model (only one available currently)
const IMAGE_MODEL = 'gemini-2.0-flash-preview-image-generation'; // ⚡ Only model that can generate actual images

// Get text generation model based on preference
function getTextModel(modelPreference: keyof typeof TEXT_MODELS = 'flash') {
  return genAI.getGenerativeModel({ 
    model: TEXT_MODELS[modelPreference],
    generationConfig: {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 1024,
    },
  });
}

// Generate image using Gemini 2.0 Flash (⚡ ONLY MODEL THAT CAN GENERATE IMAGES)
async function generateImageWithGemini(prompt: string): Promise<{ imageUrl: string; text?: string }> {
  try {
    const response = await genAINew.models.generateContent({
      model: IMAGE_MODEL, // ⚡ This is the ONLY model that can generate actual images
      contents: prompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    let imageUrl = '';
    let responseText = '';

    if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          responseText = part.text;
        } else if (part.inlineData && part.inlineData.data) {
          // Upload image to Supabase Storage
          const imageData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          const extension = mimeType.includes('png') ? 'png' : 'jpg';
          
          // Create unique filename
          const timestamp = Date.now();
          const randomId = Math.random().toString(36).substring(2, 15);
          const filename = `generated-${timestamp}-${randomId}.${extension}`;
          
          // Upload to Supabase Storage and get public URL
          imageUrl = await uploadImageToStorage(imageData, filename);
        }
      }
    }

    return { imageUrl, text: responseText };
  } catch (error) {
    console.error('Error generating image with Gemini:', error);
    throw error;
  }
}

// Simple rate limiting
let requestCount = 0;
let lastResetTime = Date.now();
const RATE_LIMIT = 15; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute in milliseconds

function checkRateLimit(): boolean {
  const now = Date.now();
  
  // Reset counter if a minute has passed
  if (now - lastResetTime > RATE_WINDOW) {
    requestCount = 0;
    lastResetTime = now;
  }
  
  if (requestCount >= RATE_LIMIT) {
    return false;
  }
  
  requestCount++;
  return true;
}

// Retry function with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>, 
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();    } catch (error: unknown) {
      if (i === maxRetries - 1) throw error;
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // If it's a rate limit error, wait longer
      if (errorMessage.includes('429') || errorMessage.includes('quota')) {
        const delay = baseDelay * Math.pow(2, i) * (errorMessage.includes('429') ? 3 : 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error; // Don't retry for other errors
      }
    }
  }
  throw new Error('Max retries exceeded');
}

// Check if the message is asking for image generation
function isImageRequest(message: string): boolean {
  const imageKeywords = [
    'generate image', 'create image', 'make image', 'draw', 'picture of',
    'image of', 'show me', 'visualize', 'create a picture', 'generate a picture',
    'make a picture', 'create art', 'generate art', 'paint', 'sketch', 'illustration'
  ];
  
  const lowerMessage = message.toLowerCase();
  return imageKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Extract image description from user message
function extractImageDescription(message: string): string {
  // Remove common image request phrases to get the core description
  const removePhases = [
    'generate image of', 'create image of', 'make image of', 'generate an image of',
    'create an image of', 'make an image of', 'draw me', 'picture of', 'image of',
    'show me', 'visualize', 'create a picture of', 'generate a picture of',
    'make a picture of', 'create art of', 'generate art of', 'paint', 'sketch',
    'illustration of', 'generate image', 'create image', 'make image'
  ];
  
  let description = message;
  removePhases.forEach(phrase => {
    const regex = new RegExp(phrase, 'gi');
    description = description.replace(regex, '').trim();
  });
  
  return description || message;
}

// Server-side AI response generation
export async function generateAIResponseServer(
  message: string, 
  model: 'flash' | 'pro' = 'flash',
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<{ text: string; imageUrl?: string; modelUsed?: string }> {
  try {
    // Check rate limit
    if (!checkRateLimit()) {
      return {
        text: "I'm getting a lot of requests right now! Please wait a moment and try again. Thanks for your patience! 😊",
        modelUsed: `${TEXT_MODELS[model]} (rate limited)`
      };
    }

    // Validate model selection
    const modelKey = (model in TEXT_MODELS) ? model as keyof typeof TEXT_MODELS : 'flash';
    const currentTextModel = getTextModel(modelKey);

    // Check if this is an image generation request
    if (isImageRequest(message)) {
      const description = extractImageDescription(message);
      
      try {
        // Try to generate actual image with Gemini 2.0
        const imageResult = await retryWithBackoff(async () => {
          return await generateImageWithGemini(description);
        });
        
        return { 
          text: imageResult.text || `Here's your generated image: ${description}`,
          imageUrl: imageResult.imageUrl,
          modelUsed: `${IMAGE_MODEL} (🖼️ IMAGE GENERATION)`
        };
      } catch (error) {
        console.error('Image generation failed, falling back to description:', error);
        
        // Fallback to creative description if image generation fails
        const prompt = `The user asked for image generation: "${description}". 
        Since I cannot generate the actual image right now, provide a creative response that:
        1. Acknowledges their image request warmly
        2. Gives a vivid, detailed description of what such an image would look like
        3. Suggests they try again or mentions that image generation is temporarily unavailable
        Keep it concise and engaging.`;
        
        const result = await retryWithBackoff(async () => {
          return await currentTextModel.generateContent(prompt);
        });
        
        const response = await result.response;
        
        return { 
          text: response.text(),
          modelUsed: `${TEXT_MODELS[modelKey]} (text fallback)`
        };
      }    } else {
      // Regular text generation with conversation context
      let prompt = `You are Neural Chat, a helpful AI assistant powered by Gemini. 
      Respond naturally and conversationally.
      Keep responses helpful, concise, and engaging.`;
      
      // Add conversation history if available
      if (conversationHistory && conversationHistory.length > 0) {
        prompt += `\n\nHere's our conversation so far:\n`;        conversationHistory.forEach((msg) => {
          const role = msg.role === 'user' ? 'Human' : 'Assistant';
          prompt += `${role}: ${msg.content}\n`;
        });
        prompt += `\nHuman: ${message}\nAssistant:`;
      } else {
        prompt += `\n\nUser message: "${message}"`;
      }
      
      const result = await retryWithBackoff(async () => {
        return await currentTextModel.generateContent(prompt);
      });
      
      const response = await result.response;
      
      return { 
        text: response.text(),
        modelUsed: `${TEXT_MODELS[modelKey]} (text only)`
      };
    }  } catch (error: unknown) {
    console.error('Error generating AI response:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Handle specific error types
    if (errorMessage.includes('429') || errorMessage.includes('quota')) {
      return { 
        text: "I'm experiencing high demand right now. Please try again in a few moments! In the meantime, feel free to explore other conversations. 🚀",
        modelUsed: 'quota_exceeded'
      };
    }
    
    // Fallback response for other errors
    const fallbackResponses = [
      "I'm having a bit of trouble processing that right now. Could you try rephrasing your question?",
      "It seems there's a temporary hiccup on my end. Let me help you in a different way - what would you like to explore?",
      "I'm experiencing some technical difficulties, but I'm still here to assist! What can I help you with?",
    ];
    
    const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    return { 
      text: fallback,
      modelUsed: 'fallback'
    };
  }
}
