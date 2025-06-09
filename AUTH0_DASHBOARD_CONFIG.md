# Auth0 Dashboard Configuration Required

## Error: Callback URL mismatch

To fix this error, you need to configure the Auth0 Dashboard with the correct URLs:

### Steps:

1. **Go to Auth0 Dashboard**: https://manage.auth0.com/
2. **Navigate to Applications** → Click on your application
3. **Go to Settings tab**
4. **Add these URLs to the respective fields**:

#### Allowed Callback URLs:

```
http://localhost:3000/api/auth/callback
```

#### Allowed Logout URLs:

```
http://localhost:3000
```

#### Allowed Web Origins:

```
http://localhost:3000
```

#### Allowed Origins (CORS):

```
http://localhost:3000
```

5. **Click "Save Changes"**

### Current Environment Variables:

- **Domain**: `dev-z0fdfc3a7lfn06qd.us.auth0.com`
- **Client ID**: `upFYyHGpt73ubosJUPVkr6xDaUvp2UrX`
- **Base URL**: `http://localhost:3000`

After configuring these URLs in the Auth0 Dashboard, the authentication flow should work properly.

### Test the Flow:

1. Start the development server: `npm run dev`
2. Go to `http://localhost:3000`
3. Click "Sign In"
4. You should be redirected to Auth0 login
5. After login, you should be redirected back to the app
