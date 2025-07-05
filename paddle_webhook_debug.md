# Paddle Webhook Debugging and Implementation Guide

## Overview
This document provides a comprehensive debugging and implementation plan for Paddle webhook payment processing with Supabase data storage.

## 1. Environment Setup and Validation

### Required Environment Variables
```bash
# Production Environment
PADDLE_WEBHOOK_SIGNING_SECRET=whsec_your_actual_signing_secret
APP_ENVIRONMENT=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Development Environment
APP_ENVIRONMENT=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Validation Checklist
- [ ] All required environment variables are set
- [ ] Supabase service role key has proper permissions
- [ ] Paddle webhook signing secret is configured (production only)
- [ ] APP_ENVIRONMENT is correctly set

## 2. Paddle Dashboard Configuration

### Webhook URL Configuration
1. **Webhook Endpoint**: `https://your-project.supabase.co/functions/v1/paddle-webhook`
2. **Events to Subscribe**:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`
   - `transaction.completed`

### Webhook Settings
- **Signature Verification**: Enabled (production)
- **Retry Policy**: Enabled with exponential backoff
- **Timeout**: 30 seconds

## 3. Database Schema Verification

### Required Tables
1. **profiles**: User profile information
2. **subscription_plans**: Available subscription plans
3. **user_subscriptions**: Active user subscriptions

### Key Fields Verification
```sql
-- Check subscription_plans have paddle_product_id
SELECT name, paddle_product_id FROM subscription_plans WHERE paddle_product_id IS NOT NULL;

-- Verify RLS policies are enabled
SELECT schemaname, tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('profiles', 'subscription_plans', 'user_subscriptions');
```

## 4. Webhook Processing Flow

### 1. Request Validation
- ✅ Verify HTTP method (POST)
- ✅ Parse request body
- ✅ Validate JSON structure
- ✅ Check required fields

### 2. Signature Verification
- ✅ Extract Paddle-Signature header
- ✅ Parse timestamp and hash
- ✅ Validate timestamp (5-minute tolerance)
- ✅ Compute HMAC-SHA256
- ✅ Compare signatures

### 3. Event Processing
- ✅ Route by event_type
- ✅ Extract user_id from custom_data
- ✅ Validate user exists or create profile
- ✅ Update subscription status
- ✅ Create/update subscription record

### 4. Error Handling
- ✅ Log all errors with context
- ✅ Return appropriate HTTP status codes
- ✅ Provide detailed error messages
- ✅ Handle database transaction failures

## 5. Testing Strategy

### Test Scenarios
1. **Valid Subscription Creation**
   - New user with valid product ID
   - Existing user upgrading plan
   
2. **Transaction Completion**
   - One-time payment processing
   - Subscription renewal
   
3. **Subscription Cancellation**
   - Immediate cancellation
   - End-of-period cancellation
   
4. **Error Cases**
   - Invalid signature
   - Missing user ID
   - Unknown product ID
   - Database connection failure

### Testing Tools
- `webhook_test_comprehensive.js`: Automated test suite
- `database_verification.js`: Database state verification
- Paddle webhook simulator (dashboard)

## 6. Monitoring and Logging

### Log Levels
- **INFO**: Normal operation events
- **WARN**: Recoverable issues
- **ERROR**: Processing failures
- **CRITICAL**: System configuration errors
- **DEBUG**: Detailed debugging information

### Key Metrics to Monitor
- Webhook success rate
- Processing latency
- Database operation success
- Signature verification failures
- User profile creation/update rates

## 7. Troubleshooting Guide

### Common Issues

#### 1. Signature Verification Failures
**Symptoms**: 401 responses, "Signature verification failed"
**Solutions**:
- Verify PADDLE_WEBHOOK_SIGNING_SECRET is correct
- Check APP_ENVIRONMENT setting
- Validate webhook URL in Paddle dashboard

#### 2. User Profile Not Found
**Symptoms**: "User validation failed" errors
**Solutions**:
- Ensure userId is included in custom_data
- Verify user exists in authentication system
- Check profile creation logic

#### 3. Product ID Not Found
**Symptoms**: "Subscription plan not found" errors
**Solutions**:
- Verify paddle_product_id in subscription_plans table
- Check product ID mapping in Paddle dashboard
- Ensure product IDs match exactly

#### 4. Database Connection Issues
**Symptoms**: Database operation failures
**Solutions**:
- Verify SUPABASE_SERVICE_ROLE_KEY permissions
- Check RLS policies allow operations
- Validate database schema

## 8. Security Considerations

### Production Requirements
- ✅ Enable signature verification
- ✅ Use HTTPS for webhook endpoint
- ✅ Implement proper error handling
- ✅ Log security events
- ✅ Validate all input data

### Development Safeguards
- ⚠️ Signature verification bypassed (logged)
- ✅ Comprehensive logging enabled
- ✅ Test data isolation
- ✅ Error simulation capabilities

## 9. Performance Optimization

### Database Optimization
- Index on user_id fields
- Efficient upsert operations
- Connection pooling
- Query optimization

### Webhook Processing
- Async processing for heavy operations
- Proper error recovery
- Idempotent operations
- Request deduplication

## 10. Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database schema up to date
- [ ] Paddle dashboard configured
- [ ] Monitoring setup complete

### Post-deployment
- [ ] Webhook endpoint responding
- [ ] Test webhook delivery
- [ ] Monitor error rates
- [ ] Verify database updates
- [ ] Check log output

## 11. Emergency Procedures

### Webhook Failures
1. Check Supabase function logs
2. Verify environment variables
3. Test database connectivity
4. Validate Paddle configuration
5. Review recent code changes

### Data Inconsistency
1. Identify affected users
2. Check webhook delivery logs
3. Manual data correction if needed
4. Implement data validation scripts
5. Monitor for recurring issues

## Support Resources

- **Paddle Documentation**: https://developer.paddle.com/webhooks
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Webhook Testing Tools**: Included in this implementation
- **Database Verification**: `database_verification.js`