import { initTRPC } from '@trpc/server';
import 'server-only';

// Context type for tRPC
export interface TRPCContext {
  req?: Request;
}

// Initialize tRPC with context
const t = initTRPC.context<TRPCContext>().create();

// Export reusable router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;
