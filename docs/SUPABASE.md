# Supabase Documentation

## Overview

This project uses Supabase as the backend database and API service. Supabase provides PostgreSQL database, authentication, real-time subscriptions, edge functions, and storage capabilities.

## Project Configuration

- **Project ID**: `ummxlnjjrnwqvuxpkdfc`
- **URL**: `https://ummxlnjjrnwqvuxpkdfc.supabase.co`
- **Environment**: Production (with sandbox Paddle integration)

## Prerequisites

Before working with Supabase in this project, ensure you have:

1. **Supabase CLI installed**:

   ```bash
   npm install -g supabase
   # or
   npx supabase --version
   ```

2. **Docker installed** (for local development):

   - Required for running Supabase locally
   - Download from [docker.com](https://www.docker.com/products/docker-desktop)

3. **Project access**:
   - Access to the Supabase dashboard
   - Environment variables configured

## Essential Commands

### Project Setup & Management

```bash
# Link to existing Supabase project
supabase link --project-ref ummxlnjjrnwqvuxpkdfc

# Check project status
supabase status

# Start local development environment
supabase start

# Stop local development environment
supabase stop

# Reset local database (destructive)
supabase db reset
```

### Database Migrations
# Create a new migration
supabase migration new <migration_name>

# Apply pending migrations to remote database
supabase db push

# Pull schema changes from remote to local
supabase db pull

# Generate migration from schema diff
supabase db diff --schema public

# Reset local database and apply all migrations
supabase db reset

# Check migration status
supabase migration list

# Repair migrations that have diverged
supabase migration repair

# Verify database schema integrity
supabase db lint

# Create a database backup
supabase db dump -f backup.sql

# Restore from a database backup
supabase db restore -f backup.sql

# Show executed migrations
supabase migration list --status executed
```
### Type Generation

```bash
# Generate TypeScript types from database schema
supabase gen types typescript --local > src/integrations/supabase/types.ts

# Generate types from remote database
supabase gen types typescript --project-id ummxlnjjrnwqvuxpkdfc > src/integrations/supabase/types.ts
```

### Edge Functions

```bash
# Create new edge function
supabase functions new <function_name>

# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy <function_name>

# View function logs
supabase functions logs <function_name>

# Serve functions locally
supabase functions serve

# Test function locally
curl -i --location --request POST 'http://localhost:54321/functions/v1/<function_name>' \
  --header 'Authorization: Bearer <anon_key>' \
  --header 'Content-Type: application/json' \
  --data '{"key":"value"}'
```

## Database Schema

### Core Tables

#### 1. Profiles Table

Stores user profile information linked to Clerk authentication.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,  -- Clerk user ID
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_status TEXT DEFAULT 'free',
  subscription_plan TEXT,
  paddle_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2. Subscription Plans Table

Defines available subscription tiers and pricing.

```sql
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  interval_type TEXT DEFAULT 'month',
  paddle_product_id TEXT,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3. User Subscriptions Table

Tracks active user subscriptions.

```sql
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,  -- One subscription per user
  plan_id UUID NOT NULL,
  paddle_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  subscription_plan TEXT DEFAULT 'free',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 4. Payment History Table

Audit trail for all payment events.

```sql
CREATE TABLE public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  subscription_id TEXT,
  transaction_id TEXT,
  event_type TEXT NOT NULL,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  plan_name TEXT,
  paddle_data JSONB DEFAULT '{}',
  status TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Database Functions

#### 1. Subscription Management

```sql
-- Upsert user subscription
SELECT public.upsert_user_subscription(
  p_user_id := 'clerk_user_id',
  p_plan_id := 'plan_uuid',
  p_paddle_subscription_id := 'paddle_sub_id',
  p_status := 'active',
  p_current_period_start := now(),
  p_current_period_end := now() + interval '1 month'
);

-- Cancel subscription
SELECT public.cancel_user_subscription(
  p_user_id := 'clerk_user_id',
  p_paddle_subscription_id := 'paddle_sub_id',
  p_reason := 'user_initiated'
);
```

#### 2. Subscription Status View

```sql
-- Get comprehensive subscription status
SELECT * FROM public.user_subscription_status
WHERE user_id = 'clerk_user_id';
```

## Edge Functions

### 1. Paddle Webhook Handler

**Location**: `supabase/functions/paddle-webhook/`

Handles Paddle payment webhooks for subscription events:

- Subscription created
- Subscription updated
- Subscription cancelled
- Payment succeeded/failed

```bash
# Deploy webhook handler
supabase functions deploy paddle-webhook

# Test webhook locally
supabase functions serve paddle-webhook
```

### 2. Cancel Subscription

**Location**: `supabase/functions/cancel-subscription/`

Handles subscription cancellation requests from the frontend.

```bash
# Deploy cancellation function
supabase functions deploy cancel-subscription
```

## Row Level Security (RLS)

All tables have RLS enabled with policies based on Clerk user authentication:

```sql
-- Example policy for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
```

## Local Development

### Starting Local Environment

```bash
# Start all Supabase services locally
supabase start

# This will start:
# - PostgreSQL database
# - PostgREST API
# - Realtime server
# - Storage server
# - Edge functions runtime
# - Dashboard UI
```

### Environment Variables

Create `.env.local` with:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_local_anon_key
```

For production, use the values from `src/integrations/supabase/client.ts`.

## Common Operations

### 1. Creating Migrations

```bash
# Create migration for new feature
supabase migration new add_user_credits_system

# Edit the generated SQL file in supabase/migrations/
# Then apply it
supabase db push
```

### 2. Updating Schema

```bash
# After making schema changes in dashboard or SQL
supabase db pull

# Generate new TypeScript types
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### 3. Testing Functions

```bash
# Start functions locally
supabase functions serve

# Test paddle webhook
curl -X POST http://localhost:54321/functions/v1/paddle-webhook \
  -H "Content-Type: application/json" \
  -d '{"event_type": "subscription.created", "data": {...}}'
```

## Deployment

### Database Changes

```bash
# Deploy migrations to production
supabase db push

# Deploy edge functions
supabase functions deploy
```

### Rollback Strategy

```bash
# Create rollback migration if needed
supabase migration new rollback_feature_x

# Reset to specific migration (local only)
supabase db reset --db-url postgresql://...
```

## Monitoring & Debugging

### Logs

```bash
# View edge function logs
supabase functions logs paddle-webhook --follow

# View database logs (requires project access)
supabase logs --type database
```

### Dashboard Access

- **Production**: https://supabase.com/dashboard/project/ummxlnjjrnwqvuxpkdfc
- **Local**: http://localhost:54323

## Security Best Practices

1. **RLS Policies**: Always enable and test RLS policies
2. **Function Security**: Use `SECURITY DEFINER` for privileged operations
3. **Input Validation**: Validate all inputs in edge functions
4. **Environment Variables**: Never commit secrets to version control
5. **API Keys**: Use service role key only in secure server environments

## Troubleshooting

### Common Issues

1. **Migration Conflicts**:

   ```bash
   supabase db reset
   supabase db push
   ```

2. **Type Generation Errors**:

   ```bash
   supabase gen types typescript --local --debug
   ```

3. **Function Deployment Issues**:

   ```bash
   supabase functions deploy --debug
   ```

4. **Local Database Connection**:
   ```bash
   supabase status
   # Check if all services are running
   ```

### Getting Help

- **Supabase Docs**: https://supabase.com/docs
- **CLI Reference**: https://supabase.com/docs/reference/cli
- **Community**: https://github.com/supabase/supabase/discussions

## Integration with Frontend

The project uses the Supabase client configured in `src/integrations/supabase/client.ts`:

```typescript
import { supabase } from "@/integrations/supabase/client";

// Example usage
const { data, error } = await supabase
  .from("profiles")
  .select("*")
  .eq("user_id", userId);
```

## Payment Integration

The project integrates with Paddle for payments:

- Webhook handling in `paddle-webhook` function
- Payment history tracking in database
- Subscription status synchronization

This documentation covers all essential Supabase operations for this project. Refer to specific migration files for detailed schema information.
