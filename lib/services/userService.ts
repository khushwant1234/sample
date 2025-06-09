// Helper function to get current user ID from Auth0 session
import { cookies } from 'next/headers';

export async function getCurrentUserId(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth0_session');
    if (!sessionCookie) {
      return 'anonymous'; // Fallback for unauthenticated users
    }

    const session = JSON.parse(sessionCookie.value);
    if (session.expires < Date.now()) {
      return 'anonymous'; // Session expired
    }

    // Use Auth0's sub (subject) as the user ID
    return session.user.sub || 'anonymous';
  } catch (error) {
    console.error('Error getting user ID:', error);
    return 'anonymous';
  }
}

export function getUserIdFromRequest(req?: Request): string {
  try {
    if (!req) {
      console.log('[UserService] No request object provided, using anonymous');
      return 'anonymous';
    }

    // Get cookies from request headers
    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) {
      console.log('[UserService] No cookie header found, using anonymous');
      return 'anonymous';
    }

    // Parse cookies to find auth0_session
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const sessionCookie = cookies['auth0_session'];
    if (!sessionCookie) {
      console.log('[UserService] No auth0_session cookie found, using anonymous');
      return 'anonymous';  
    }

    const session = JSON.parse(decodeURIComponent(sessionCookie));
    if (session.expires < Date.now()) {
      console.log('[UserService] Session expired, using anonymous');
      return 'anonymous';
    }

    const userId = session.user?.sub || 'anonymous';
    console.log('[UserService] Extracted user ID:', userId);
    return userId;
  } catch (error) {
    console.error('[UserService] Error getting user ID from request:', error);
    return 'anonymous';
  }
}

export function getUserIdFromCookie(cookieValue?: string): string {
  try {
    if (!cookieValue) {
      return 'anonymous';
    }

    const session = JSON.parse(cookieValue);
    if (session.expires < Date.now()) {
      return 'anonymous';
    }

    return session.user.sub || 'anonymous';
  } catch {
    return 'anonymous';
  }
}
