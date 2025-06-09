# Auth0 Setup Instructions

To complete the Auth0 integration, you need to set up an Auth0 application and configure the environment variables.

## 1. Create Auth0 Application

1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Click "Create Application"
3. Choose "Regular Web Application"
4. Select "Next.js" as the technology

## 2. Configure Application Settings

In your Auth0 application settings:

**Allowed Callback URLs:**

```
http://localhost:3000/auth/callback
```

**Allowed Logout URLs:**

```
http://localhost:3000
```

**Allowed Web Origins:**

```
http://localhost:3000
```

## 3. Update Environment Variables

Update your `.env.local` file with your Auth0 application details:

```env
# Generate a secret using: openssl rand -hex 32
AUTH0_SECRET='your-32-byte-secret-here'
APP_BASE_URL='http://localhost:3000'
AUTH0_DOMAIN='YOUR_DOMAIN.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'
```

## 4. Generate Secret

Run this command to generate a secure secret:

```bash
openssl rand -hex 32
```

## 5. Available Routes

After setup, these Auth0 routes will be available:

- `/api/auth/login` - Login page
- `/api/auth/logout` - Logout
- `/api/auth/callback` - Auth callback
- `/api/auth/me` - User profile

## 6. User Information

The application will now:

- Show a login screen for unauthenticated users
- Display user profile in the sidebar
- Provide logout functionality
- Protect the chat interface with authentication

## Features Added

- ✅ Auth0 provider wrapper in layout
- ✅ Authentication check in main page
- ✅ Login screen for unauthenticated users
- ✅ User profile display in sidebar
- ✅ Logout button
- ✅ Loading and error states
