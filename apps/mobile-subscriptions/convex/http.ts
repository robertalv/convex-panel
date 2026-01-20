/**
 * HTTP Endpoints for App Store Server Notifications
 *
 * Apple sends webhook notifications to this endpoint when subscription events occur:
 * - Initial purchase
 * - Renewal
 * - Cancellation
 * - Refund
 * - etc.
 */

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

const http = httpRouter();

/**
 * App Store Server Notification endpoint
 * Apple POSTs to this URL when subscription events occur
 *
 * Configure in App Store Connect:
 * Production Server URL: https://your-deployment.convex.site/appstore/webhook
 */
http.route({
  path: "/appstore/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = (await request.json()) as any;

      console.log("[App Store Webhook] Received notification:", {
        notificationType: body.notification_type,
        subtype: body.subtype,
      });

      // Handle different notification types
      const notificationType = body.notification_type as string;
      const transactionInfo = body.unified_receipt?.latest_receipt_info?.[0];

      if (!transactionInfo) {
        console.warn("[App Store Webhook] No transaction info in notification");
        return new Response("OK", { status: 200 });
      }

      const transactionId = transactionInfo.transaction_id as string;
      const productId = transactionInfo.product_id as string;
      const expiresDateMs = transactionInfo.expires_date_ms as string;

      // Process the notification
      switch (notificationType) {
        case "INITIAL_BUY":
          console.log(`[App Store Webhook] Initial purchase: ${transactionId}`);
          // Already handled by the app, but log for tracking
          break;

        case "DID_RENEW":
          console.log(
            `[App Store Webhook] Subscription renewed: ${transactionId}`,
          );
          // Update subscription expiry date
          // TODO: Create internal mutation for renewal handling
          console.log("Renewal handling - implement mutation");
          break;

        case "DID_FAIL_TO_RENEW":
          console.log(`[App Store Webhook] Renewal failed: ${transactionId}`);
          // TODO: Create internal mutation for renewal failure
          console.log("Renewal failure handling - implement mutation");
          break;

        case "DID_CHANGE_RENEWAL_STATUS":
          console.log(
            `[App Store Webhook] Renewal status changed: ${transactionId}`,
          );
          const autoRenewStatus = body.auto_renew_status === "true";
          // TODO: Create internal mutation for auto-renew status update
          console.log("Auto-renew status update - implement mutation");
          break;

        case "CANCEL":
          console.log(
            `[App Store Webhook] Subscription cancelled: ${transactionId}`,
          );
          // TODO: Create internal mutation for cancellation
          console.log("Cancellation handling - implement mutation");
          break;

        case "REFUND":
          console.log(`[App Store Webhook] Refund issued: ${transactionId}`);
          // TODO: Create internal mutation for refund
          console.log("Refund handling - implement mutation");
          break;

        default:
          console.log(
            `[App Store Webhook] Unhandled notification type: ${notificationType}`,
          );
      }

      // Always return 200 to acknowledge receipt
      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error(
        "[App Store Webhook] Error processing notification:",
        error,
      );
      // Still return 200 to prevent retries
      return new Response("OK", { status: 200 });
    }
  }),
});

/**
 * Health check endpoint
 */
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }),
});

export default http;
