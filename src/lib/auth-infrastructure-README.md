# Supabase Auth Infrastructure

This document describes the Supabase Auth infrastructure used for user authentication and session management.

## Components

### 1. Authentication Context (`src/contexts/SupabaseAuthContext.tsx`)

The main authentication context provider that manages:

- User authentication state
- Profile synchronization with database
- Session management
- Authentication methods (sign in, sign up, sign out, etc.)

**Key Features:**

- Automatic profile creation for new users
- Session persistence across browser refreshes
- Cross-tab session synchronization
- Comprehensive error handling

**Usage:**

```tsx
import {
  SupabaseAuthProvider,
  useAuthContext,
} from "@/contexts/SupabaseAuthContext";

// Wrap your app
<SupabaseAuthProvider>
  <App />
</SupabaseAuthProvider>;

// Use in components
const { user, profile, loading, signIn, signOut } = useAuthContext();
```

### 2. Auth Hook (`src/hooks/useSupabaseAuth.tsx`)

A convenient hook that provides authentication functionality:

```tsx
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

const {
  user,
  profile,
  loading,
  isSignedIn,
  updateProfile,
  refreshProfile,
  signOut,
} = useSupabaseAuth();
```

**Maintained Features:**

- Payment success toast handling
- Profile refresh functionality
- Consistent interface for authentication operations

### 3. Auth Wrapper (`src/components/auth/SupabaseAuthWrapper.tsx`)

Provides Supabase authentication wrapper:

```tsx
import SupabaseAuthWrapper from "@/components/auth/SupabaseAuthWrapper";

<SupabaseAuthWrapper>
  <App />
</SupabaseAuthWrapper>;
```

### 4. Error Handling (`src/lib/auth-errors.ts`)

Comprehensive error handling for Supabase Auth errors:

```tsx
import {
  handleAuthError,
  getAuthErrorCode,
  isAuthError,
} from "@/lib/auth-errors";

try {
  await supabase.auth.signIn(email, password);
} catch (error) {
  const userMessage = handleAuthError(error);
  const errorCode = getAuthErrorCode(error);
}
```

**Handled Error Types:**

- Invalid credentials
- Email not confirmed
- User already registered
- Token expired
- Rate limiting
- Generic errors

### 5. Session Validation (`src/lib/session-validation.ts`)

Utilities for validating sessions and ensuring proper auth headers:

```tsx
import {
  validateSession,
  requireAuth,
  withAuth,
  debugAuthHeaders,
} from "@/lib/session-validation";

// Validate current session
const validation = await validateSession();

// Require authentication for operations
const { user, session } = await requireAuth();

// Wrap operations with auth check
const result = await withAuth(async () => {
  return await someProtectedOperation();
});

// Debug auth headers
const hasHeaders = debugAuthHeaders();
```

## Authentication Methods

### Sign In

```tsx
const { signIn } = useAuthContext();
const response = await signIn(email, password);
```

### Sign Up

```tsx
const { signUp } = useAuthContext();
const response = await signUp(email, password, { full_name: "John Doe" });
```

### OTP Verification

```tsx
const { verifyOTP } = useAuthContext();
const response = await verifyOTP(email, token, "signup");
```

### Password Reset

```tsx
const { resetPassword } = useAuthContext();
const response = await resetPassword(email);
```

### Sign Out

```tsx
const { signOut } = useAuthContext();
await signOut();
```

## Profile Management

The system automatically creates and manages user profiles in the `profiles` table:

```sql
-- Profile structure
profiles {
  id: string (UUID)
  user_id: string (references auth.users.id)
  email: string
  full_name: string
  avatar_url: string
  subscription_status: string
  subscription_plan: string
  credits: number
  -- ... other fields
}
```

**Profile Operations:**

```tsx
const { updateProfile, refreshProfile } = useAuthContext();

// Update profile
await updateProfile({ full_name: "New Name" });

// Refresh from database
await refreshProfile();
```

## Session Management

### Automatic Features

- Session persistence in localStorage
- Automatic token refresh
- Cross-tab synchronization
- Session expiration handling

### Manual Validation

```tsx
import { validateSession } from "@/lib/session-validation";

const validation = await validateSession();
if (validation.isValid) {
  // User is authenticated
  console.log("User:", validation.user);
} else {
  // Handle unauthenticated state
  console.log("Error:", validation.error);
}
```

## Database Integration

The infrastructure ensures that:

1. All database calls include proper auth headers
2. RLS policies work with Supabase Auth sessions
3. `auth.uid()` functions correctly in policies
4. No conflicts with existing database operations

### Validation

```tsx
import { withAuth } from "@/lib/session-validation";

// Ensure auth before database operations
const data = await withAuth(async () => {
  return await supabase.from("profiles").select("*");
});
```

## Authentication Features

The infrastructure provides comprehensive authentication functionality:

1. **Consistent Interface**: `useSupabaseAuth` provides a clean, consistent API
2. **Profile Management**: Full profile operations with automatic syncing
3. **Session Handling**: Robust session management with automatic refresh
4. **Error Handling**: Provides user-friendly error messages

## Environment Variables

Required environment variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Testing

Use the validation utilities to test the infrastructure:

```tsx
import { validateAuthInfrastructure } from "@/lib/validate-auth-infrastructure";

// Run comprehensive validation
validateAuthInfrastructure();
```

## Security Considerations

1. **RLS Policies**: Ensure all tables have proper RLS policies using `auth.uid()`
2. **Session Validation**: Always validate sessions before sensitive operations
3. **Error Handling**: Don't expose sensitive information in error messages
4. **Token Management**: Supabase handles token refresh automatically

## Next Steps

After implementing this infrastructure:

1. Authentication pages are implemented (Login, Register, VerifyOTP)
2. Routing is configured for auth pages
3. All authentication components use Supabase
4. Full functionality testing completed
5. Clean, Clerk-free implementation

## Troubleshooting

### Common Issues

1. **Session not persisting**: Check localStorage and ensure proper initialization
2. **Database calls failing**: Verify RLS policies and session validation
3. **Profile not syncing**: Check profile creation logic and database permissions
4. **Cross-tab issues**: Ensure auth state listener is properly set up

### Debug Tools

```tsx
import { debugAuthHeaders, validateSession } from "@/lib/session-validation";

// Check auth headers
const hasHeaders = debugAuthHeaders();

// Validate session
const validation = await validateSession();
console.log("Session validation:", validation);
```
