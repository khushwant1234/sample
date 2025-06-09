import { z } from 'zod';
import { router, publicProcedure } from './server';
import { generateAIResponseServer } from '@/lib/services/aiService.server';
import { 
  getConversations, 
  getMessages, 
  addMessage, 
  createConversation,
  createConversationWithFirstMessage,
  deleteConversation,
  updateConversationTitle,
  deleteEmptyConversations
} from '@/lib/services/chatService';
import { getUserIdFromRequest } from '@/lib/services/userService';

// AI Router
const aiRouter = router({
  generateResponse: publicProcedure
    .input(z.object({
      message: z.string().min(1),
      model: z.enum(['flash', 'pro']).default('flash'),
      conversationHistory: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string()
      })).optional()
    }))
    .mutation(async ({ input }) => {
      const { message, model, conversationHistory } = input;
      const response = await generateAIResponseServer(message, model, conversationHistory);
      return response;
    }),
});

// Chat Router  
const chatRouter = router({
  getConversations: publicProcedure
    .query(async ({ ctx }) => {
      const userId = getUserIdFromRequest(ctx.req);
      return await getConversations(userId);
    }),

  createConversation: publicProcedure
    .input(z.object({
      title: z.string().min(1)
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = getUserIdFromRequest(ctx.req);
      return await createConversation(input.title, userId);
    }),

  deleteEmptyConversations: publicProcedure
    .mutation(async ({ ctx }) => {
      const userId = getUserIdFromRequest(ctx.req);
      await deleteEmptyConversations(userId);
      return { success: true };
    }),

  getMessages: publicProcedure
    .input(z.object({
      conversationId: z.string()
    }))
    .query(async ({ input, ctx }) => {
      const userId = getUserIdFromRequest(ctx.req);
      return await getMessages(input.conversationId, userId);
    }),

  addMessage: publicProcedure
    .input(z.object({
      conversationId: z.string(),
      content: z.string().min(1),
      role: z.enum(['user', 'assistant']),
      imageUrl: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const { conversationId, content, role, imageUrl } = input;
      const userId = getUserIdFromRequest(ctx.req);
      return await addMessage(conversationId, content, role, imageUrl, userId);
    }),

  createConversationWithFirstMessage: publicProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      role: z.enum(['user', 'assistant']),
      imageUrl: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const { title, content, role, imageUrl } = input;
      const userId = getUserIdFromRequest(ctx.req);
      return await createConversationWithFirstMessage(title, content, role, imageUrl, userId);
    }),

  deleteConversation: publicProcedure
    .input(z.object({
      id: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = getUserIdFromRequest(ctx.req);
      await deleteConversation(input.id, userId);
      return { success: true };
    }),
  updateConversationTitle: publicProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1)
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = getUserIdFromRequest(ctx.req);
      await updateConversationTitle(input.id, input.title, userId);
      return { success: true };
    }),
});

// Main App Router
export const appRouter = router({
  ai: aiRouter,
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;
