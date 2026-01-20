/**
 * Receipt Verification for iOS and Android In-App Purchases
 *
 * This module handles server-side verification of purchase receipts
 * to prevent fraud and ensure legitimate subscriptions.
 */

/**
 * iOS Receipt Verification Response
 */
interface AppleReceiptResponse {
  status: number;
  receipt?: {
    bundle_id: string;
    application_version: string;
    in_app: Array<{
      quantity: string;
      product_id: string;
      transaction_id: string;
      original_transaction_id: string;
      purchase_date: string;
      purchase_date_ms: string;
      expires_date?: string;
      expires_date_ms?: string;
      is_trial_period?: string;
      is_in_intro_offer_period?: string;
    }>;
  };
  latest_receipt_info?: Array<{
    product_id: string;
    transaction_id: string;
    original_transaction_id: string;
    expires_date_ms: string;
  }>;
  pending_renewal_info?: Array<{
    auto_renew_product_id: string;
    auto_renew_status: string;
    expiration_intent?: string;
  }>;
}

/**
 * Verify iOS receipt with Apple's servers
 *
 * @param receiptData - Base64 encoded receipt data from the device
 * @param sharedSecret - Your app-specific shared secret from App Store Connect
 * @param sandbox - Whether to use sandbox environment (for testing)
 * @returns Verification result with receipt details
 */
export async function verifyAppleReceipt(
  receiptData: string,
  sharedSecret: string,
  sandbox: boolean = false,
): Promise<{
  isValid: boolean;
  transactionId?: string;
  productId?: string;
  expiresDateMs?: string;
  error?: string;
}> {
  // Determine endpoint (production or sandbox)
  const endpoint = sandbox
    ? "https://sandbox.itunes.apple.com/verifyReceipt"
    : "https://buy.itunes.apple.com/verifyReceipt";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "receipt-data": receiptData,
        password: sharedSecret,
        "exclude-old-transactions": true,
      }),
    });

    if (!response.ok) {
      return {
        isValid: false,
        error: `Apple server returned ${response.status}`,
      };
    }

    const data = (await response.json()) as AppleReceiptResponse;

    // Status codes:
    // 0 = valid
    // 21007 = sandbox receipt sent to production (retry with sandbox)
    // 21008 = production receipt sent to sandbox (retry with production)
    if (data.status === 21007 && !sandbox) {
      // Receipt is from sandbox, retry with sandbox endpoint
      return verifyAppleReceipt(receiptData, sharedSecret, true);
    }

    if (data.status === 21008 && sandbox) {
      // Receipt is from production, retry with production endpoint
      return verifyAppleReceipt(receiptData, sharedSecret, false);
    }

    if (data.status !== 0) {
      return {
        isValid: false,
        error: `Apple verification failed with status ${data.status}`,
      };
    }

    // Get latest transaction info
    const latestReceipt = data.latest_receipt_info?.[0];
    if (!latestReceipt) {
      return {
        isValid: false,
        error: "No receipt info found",
      };
    }

    return {
      isValid: true,
      transactionId: latestReceipt.transaction_id,
      productId: latestReceipt.product_id,
      expiresDateMs: latestReceipt.expires_date_ms,
    };
  } catch (error) {
    console.error("[Receipt Verification] Apple verification error:", error);
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Verify Android receipt with Google Play
 *
 * Note: Requires Google Play Developer API credentials
 * For now, returns a placeholder - implement with Google API client
 */
export async function verifyGoogleReceipt(
  purchaseToken: string,
  productId: string,
  packageName: string,
): Promise<{
  isValid: boolean;
  error?: string;
}> {
  // TODO: Implement Google Play verification
  // This requires:
  // 1. Setting up Google Play Developer API
  // 2. Creating a service account
  // 3. Using googleapis npm package
  // 4. POST to: https://www.googleapis.com/androidpublisher/v3/applications/{packageName}/purchases/subscriptions/{subscriptionId}/tokens/{token}

  console.warn(
    "[Receipt Verification] Google Play verification not yet implemented",
  );

  // For now, return valid for development
  // IMPORTANT: Implement this before accepting real Android subscriptions!
  return {
    isValid: true, // INSECURE - implement before production!
  };
}

/**
 * Main verification function that handles both platforms
 */
export async function verifyReceipt(
  platform: "ios" | "android",
  receiptData: string | undefined,
  transactionId: string,
  productId: string,
  sharedSecret?: string,
): Promise<{
  isValid: boolean;
  error?: string;
}> {
  if (platform === "ios") {
    if (!receiptData) {
      return { isValid: false, error: "Receipt data required for iOS" };
    }

    if (!sharedSecret) {
      console.error(
        "[Receipt Verification] Apple shared secret not configured!",
      );
      return { isValid: false, error: "Server configuration error" };
    }

    const result = await verifyAppleReceipt(receiptData, sharedSecret);

    // Verify transaction ID matches
    if (result.isValid && result.transactionId !== transactionId) {
      return {
        isValid: false,
        error: "Transaction ID mismatch",
      };
    }

    return result;
  } else {
    // Android verification
    if (!receiptData) {
      return { isValid: false, error: "Purchase token required for Android" };
    }

    return verifyGoogleReceipt(receiptData, productId, "dev.convex.panel");
  }
}
