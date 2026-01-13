# Mobile Subscriptions Backend

Convex backend for managing mobile Pro subscriptions for the Convex Panel mobile app.

## Overview

This backend handles:

- User management tied to OAuth authentication
- Mobile Pro subscription tracking
- IAP (In-App Purchase) receipt verification
- Subscription lifecycle (create, renew, cancel, expire)
- Cross-device subscription sync

## Deployment

- **Deployment URL**: https://friendly-wombat-759.convex.cloud
- **Dashboard**: https://dashboard.convex.dev/d/friendly-wombat-759

## Schema

### Tables

**users**

- Stores user identity from BigBrain OAuth
- Fields: email, name, accessTokenHash, createdAt, updatedAt, lastSeenAt
- Index: by_email

**subscriptions**

- Tracks mobile Pro subscriptions
- Fields: userId, status (active/expired/cancelled), platform (ios/android), transactionId, productId, receiptData, startDate, expiryDate, autoRenewing
- Indexes: by_user, by_status, by_transaction, by_expiry

**subscriptionEvents**

- Audit log for subscription lifecycle events
- Fields: subscriptionId, userId, eventType (created/activated/renewed/cancelled/expired), platform, metadata
- Indexes: by_subscription, by_user, by_event_type, by_created_at

## Functions

### Queries

**checkProStatus(email: string)**

- Returns: `{ isPro: boolean, subscription: Subscription | null }`
- Checks if a user has an active, non-expired Pro subscription

**getUserByEmail(email: string)**

- Returns user profile

**getSubscriptionHistory(email: string)**

- Returns all subscriptions for a user

### Mutations

**getOrCreateUser(email: string, name?: string)**

- Creates or updates user on login
- Returns: userId

**createSubscription(email, name?, platform, transactionId, productId, receiptData?, expiryDate)**

- Creates a new Pro subscription after IAP purchase
- Automatically creates user if doesn't exist
- Handles renewal if transaction ID already exists
- Returns: subscriptionId

**cancelSubscription(email: string)**

- Cancels active subscription
- Returns: subscriptionId

## Integration with Mobile App

### 1. Install Convex Client

```bash
cd apps/mobile
pnpm add convex
```

### 2. Create Convex Context

```typescript
// apps/mobile/src/contexts/ConvexContext.tsx
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient("https://friendly-wombat-759.convex.cloud");

export function ConvexSubscriptionProvider({ children }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
```

### 3. Create useIsProUser Hook

```typescript
// apps/mobile/src/hooks/useIsProUser.ts
import { useQuery } from "convex/react";
import { api } from "../../mobile-subscriptions/convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";

export function useIsProUser() {
  const { session } = useAuth();
  const email = session?.user?.email;

  const result = useQuery(
    api.subscriptions.checkProStatus,
    email ? { email } : "skip",
  );

  return {
    isPro: result?.isPro ?? false,
    subscription: result?.subscription,
    isLoading: result === undefined,
  };
}
```

### 4. Purchase Flow Integration

When user completes IAP:

```typescript
import { useMutation } from "convex/react";
import { api } from "../../mobile-subscriptions/convex/_generated/api";

const createSubscription = useMutation(api.subscriptions.createSubscription);

// After successful IAP
await createSubscription({
  email: user.email,
  name: user.name,
  platform: Platform.OS === "ios" ? "ios" : "android",
  transactionId: purchase.transactionId,
  productId: purchase.productId,
  receiptData: purchase.transactionReceipt,
  expiryDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
});
```

## Next Steps

1. **IAP Integration**: Implement actual Apple/Google IAP verification
   - Add receipt verification endpoint
   - Validate receipts with Apple/Google servers
   - Handle subscription renewals via webhooks

2. **Product IDs**: Define subscription tiers
   - `mobile_pro_monthly`: $9.99/month
   - `mobile_pro_yearly`: $99.99/year

3. **Testing**: Create test users and subscriptions for development

4. **Security**: Add authentication middleware to verify requests come from authenticated users

## Local Development

```bash
cd apps/mobile-subscriptions
pnpm install
npx convex dev
```

## Deploy

```bash
cd apps/mobile-subscriptions
npx convex deploy
```
