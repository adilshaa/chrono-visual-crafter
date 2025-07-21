# Referral System Testing Guide

## How to Test the Referral System

### 1. **Generate a Referral Link**

- Log in to your account
- Open the Referral Modal (usually accessible from user menu or settings)
- Your referral link will be automatically generated
- Copy the referral link (format: `https://yoursite.com/register?ref=ref_xxxxx`)

### 2. **Test Referral Link**

- In development mode, click the "Test" button in the ReferralModal
- Check browser console for detailed test results
- This simulates the referral flow without creating actual users

### 3. **Manual Testing**

- Open referral link in incognito/private browser window
- You should see the referral banner: "🎉 You've been invited!"
- Complete the signup process
- Check that:
  - New user receives 70 credits (50 base + 20 bonus)
  - Original user's credits increase by 20
  - `ref_credits` field is updated for the referrer

### 4. **Database Verification**

Check the `profiles` table for:

- `referred_by` field populated for new user
- `credits` and `ref_credits` updated for referrer
- `ref_id` generated for users who open referral modal

### 5. **Console Testing**

Use the browser console to test referral functionality:

```javascript
// Test a specific referral ID
import { testReferralSystem } from "@/utils/referralTest";
await testReferralSystem("ref_your_referral_id_here");
```

## Expected Behavior

### ✅ **Successful Referral Flow:**

1. Referrer generates unique referral link
2. New user clicks link and sees referral banner
3. New user completes signup
4. New user receives 70 credits with welcome message
5. Referrer's credits increase by 20
6. Database properly records referral relationship

### ❌ **Blocked Scenarios:**

- Self-referral attempts (same user trying to refer themselves)
- Invalid referral ID formats (not starting with 'ref\_')
- Non-existent referral IDs

## Troubleshooting

### Common Issues:

1. **Referral link not working**: Check URL format and ensure referral ID exists in database
2. **Credits not updating**: Check browser console for errors and database permissions
3. **Self-referral**: System prevents users from referring themselves
4. **Invalid referral ID**: Must start with 'ref\_' and exist in profiles table

### Debug Information:

- All referral activities are logged to console with detailed information
- Check Network tab for API calls to Supabase
- Verify database schema matches expected structure
