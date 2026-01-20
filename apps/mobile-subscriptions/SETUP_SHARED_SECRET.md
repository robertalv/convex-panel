# Setting Up Apple Shared Secret for In-App Purchases

## Step 1: Add Shared Secret to Convex Environment

Your App-Specific Shared Secret from App Store Connect is:

```
279a7199956f44c9a3ce1c26f5efcdde
```

### Add it to your Convex deployment:

1. **Go to your Convex Dashboard:**
   - Navigate to: https://dashboard.convex.dev
   - Select your `mobile-subscriptions` deployment

2. **Add Environment Variable:**
   - Go to **Settings** → **Environment Variables**
   - Click **Add Variable**
   - Name: `APPLE_SHARED_SECRET`
   - Value: `279a7199956f44c9a3ce1c26f5efcdde`
   - Click **Save**

3. **Redeploy** (Convex will automatically redeploy when you save the environment variable)

## Step 2: Configure App Store Server Notification URL

Your webhook endpoint URL should be:

```
https://your-convex-deployment.convex.site/appstore/webhook
```

### To find your actual URL:

1. Check your Convex dashboard for your deployment URL
2. It should look like: `https://happy-animal-123.convex.site`
3. Add `/appstore/webhook` to the end

### Add to App Store Connect:

1. Go to **App Store Connect** → **Your App** → **App Information**
2. Scroll to **App Store Server Notifications**
3. **Production Server URL:** Enter your webhook URL
4. **Sandbox Server URL:** (Optional) Use the same URL for testing
5. Click **Save**

## Step 3: Update Your Local Environment (Optional)

If you're running the Convex backend locally, add to `.env.local`:

```bash
APPLE_SHARED_SECRET=279a7199956f44c9a3ce1c26f5efcdde
```

**Note:** `.env.local` is gitignored to keep secrets safe.

## Step 4: Test Receipt Verification

The receipt verification is now implemented in:

- `convex/receiptVerification.ts` - Receipt verification logic
- `convex/subscriptions.ts` - Uses verification in mutations
- `convex/http.ts` - Webhook handler for App Store notifications

### What Happens Now:

1. **User purchases subscription** in your app
2. **App sends receipt** to your backend via `createSubscription` mutation
3. **Backend verifies** receipt with Apple's servers using your shared secret
4. **If valid**, subscription is activated in your database
5. **Apple sends notifications** to your webhook URL for renewals, cancellations, etc.

## Security Notes

✅ **Shared secret is stored securely** in Convex environment variables
✅ **Receipt verification happens server-side** to prevent fraud
✅ **Webhook endpoint logs all events** for audit trail
✅ **Duplicate transaction prevention** built into the subscription logic

## Important: Before Production

- [ ] Test with TestFlight and sandbox receipts
- [ ] Verify webhook receives notifications from Apple
- [ ] Test renewal, cancellation, and refund flows
- [ ] Implement Google Play verification for Android (currently placeholder)
- [ ] Set up monitoring/alerts for failed verifications

## Files Modified/Created:

1. ✅ `convex/receiptVerification.ts` - NEW: Receipt verification logic
2. ✅ `convex/subscriptions.ts` - UPDATED: Now uses receipt verification
3. ✅ `convex/http.ts` - NEW: Webhook endpoint for App Store notifications
4. ✅ `.env.example` - NEW: Template for environment variables
5. ✅ `SETUP_SHARED_SECRET.md` - This file

## Need Help?

- **Apple Documentation:** https://developer.apple.com/documentation/appstoreserverapi
- **Convex Environment Variables:** https://docs.convex.dev/production/environment-variables
- **Receipt Verification:** https://developer.apple.com/documentation/appstorereceipts/verifyreceipt

## Next Steps:

1. Add the environment variable to Convex (see Step 1 above)
2. Deploy your updated backend code:
   ```bash
   cd apps/mobile-subscriptions
   npx convex deploy
   ```
3. Configure the webhook URL in App Store Connect (Step 2 above)
4. Test with a TestFlight build!
