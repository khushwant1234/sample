import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Extract the auth action from the pathname
  const pathSegments = pathname.split('/');
  const action = pathSegments[pathSegments.length - 1];
  
  switch (action) {
    case 'login':
      // Redirect to Auth0 login
      const auth0Domain = process.env.AUTH0_DOMAIN;
      const clientId = process.env.AUTH0_CLIENT_ID;
      const redirectUri = `${process.env.APP_BASE_URL}/api/auth/callback`;
      
      const authUrl = `https://${auth0Domain}/authorize?` +
        `response_type=code&` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri!)}&` +
        `scope=openid%20profile%20email`;
      
      return NextResponse.redirect(authUrl);
      
    case 'logout':
      // Clear session and redirect to Auth0 logout
      const logoutUrl = `https://${process.env.AUTH0_DOMAIN}/v2/logout?` +
        `client_id=${process.env.AUTH0_CLIENT_ID}&` +
        `returnTo=${encodeURIComponent(process.env.APP_BASE_URL!)}`;
      
      const response = NextResponse.redirect(logoutUrl);
      response.cookies.delete('auth0_session');
      return response;
      
    case 'callback':
      // Handle Auth0 callback
      const code = url.searchParams.get('code');
      if (!code) {
        return NextResponse.redirect(`${process.env.APP_BASE_URL}?error=no_code`);
      }
      
      try {
        // Exchange code for tokens
        const tokenResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            client_id: process.env.AUTH0_CLIENT_ID,
            client_secret: process.env.AUTH0_CLIENT_SECRET,
            code,
            redirect_uri: `${process.env.APP_BASE_URL}/api/auth/callback`,
          }),
        });
        
        const tokens = await tokenResponse.json();
        
        if (!tokenResponse.ok) {
          throw new Error(tokens.error_description || 'Token exchange failed');
        }
        
        // Get user info
        const userResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        });
        
        const user = await userResponse.json();
        
        // Create session cookie
        const sessionData = {
          user,
          tokens,
          expires: Date.now() + (tokens.expires_in * 1000),
        };
        
        const response = NextResponse.redirect(process.env.APP_BASE_URL!);
        response.cookies.set('auth0_session', JSON.stringify(sessionData), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: tokens.expires_in,
        });
        
        return response;
      } catch (error) {
        console.error('Auth callback error:', error);
        return NextResponse.redirect(`${process.env.APP_BASE_URL}?error=auth_failed`);
      }
      
    case 'profile':
      // Get user profile from session
      const sessionCookie = request.cookies.get('auth0_session');
      if (!sessionCookie) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }
      
      try {
        const session = JSON.parse(sessionCookie.value);
        if (session.expires < Date.now()) {
          return NextResponse.json({ error: 'Session expired' }, { status: 401 });
        }
          return NextResponse.json({ user: session.user });
      } catch {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
      }
      
    default:
      return NextResponse.json({ error: 'Invalid auth action' }, { status: 404 });
  }
}