import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  Purchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  PurchaseError,
  Product,
  getAvailablePurchases,
} from "react-native-iap";
import { Platform, Alert } from "react-native";
import { PRODUCT_IDS, getPlatformProductId } from "../config/products";
import axios from "axios";

const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL as string | undefined

export async function initializeIAP(): Promise<boolean> {
  try {
    const connected = await initConnection();
    return connected;
  } catch (error) {
    return false;
  }
}

export async function closeIAP(): Promise<void> {
  try {
    await endConnection();
  } catch (error) {
    console.error("Failed to close connection:", error);
  }
}

/**
 * Get available subscription products
 */
export async function getAvailableSubscriptions(): Promise<Product[]> {
  try {
    const platform = Platform.OS as "ios" | "android";
    const productIds = Object.values(PRODUCT_IDS[platform]);
    const products = await fetchProducts({ skus: productIds, type: "subs" });
    return products as Product[];
  } catch (error) {
    throw error;
  }
}

/**
 * Purchase a subscription
 */
export async function purchaseSubscription(productId: string): Promise<void> {
  try {
    const platform = Platform.OS as "ios" | "android";

    if (platform === "ios") {
      await requestPurchase({
        request: {
          apple: {
            sku: productId,
          },
        },
        type: "subs",
      });
    } else {
      await requestPurchase({
        request: {
          android: {
            skus: [productId],
          },
        },
        type: "subs",
      });
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Verify and activate subscription in Convex backend
 */
export async function activateSubscription(
  email: string,
  name: string | undefined,
  purchase: Purchase,
): Promise<void> {
  try {
    const platform = Platform.OS as "ios" | "android";
    const isYearly = purchase.productId.includes("yearly");
    const expiryDays = isYearly ? 365 : 30;
    const expiryDate = Date.now() + expiryDays * 24 * 60 * 60 * 1000;

    const response = await axios.post(
      `${CONVEX_URL}/api/mutation`,
      {
        path: "subscriptions:createSubscription",
        args: {
          email,
          name,
          platform,
          transactionId: purchase.transactionId,
          productId: purchase.productId,
          receiptData: purchase.purchaseToken || purchase.transactionId,
          expiryDate,
        },
        format: "json",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    await finishTransaction({ purchase, isConsumable: false });
  } catch (error: any) {
    throw error;
  }
}

/**
 * Set up purchase listeners
 */
export function setupPurchaseListeners(
  onPurchaseUpdate: (purchase: Purchase) => void,
  onPurchaseError: (error: PurchaseError) => void,
) {
  const purchaseUpdateSubscription = purchaseUpdatedListener((purchase) => {
    onPurchaseUpdate(purchase as Purchase);
  });

  const purchaseErrorSubscription = purchaseErrorListener((error) => {
    onPurchaseError(error);
  });

  return () => {
    purchaseUpdateSubscription.remove();
    purchaseErrorSubscription.remove();
  };
}

/**
 * Cancel subscription (redirect to platform settings)
 */
export async function cancelSubscription(email: string): Promise<void> {
  try {
    await axios.post(
      `${CONVEX_URL}/api/mutation`,
      {
        path: "subscriptions:cancelSubscription",
        args: { email },
        format: "json",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const platform = Platform.OS;
    const message =
      platform === "ios"
        ? "To complete cancellation, go to Settings > Your Name > Subscriptions > Convex Panel and cancel there."
        : "To complete cancellation, go to Google Play Store > Menu > Subscriptions > Convex Panel and cancel there.";

    Alert.alert("Subscription Cancelled", message, [{ text: "OK" }]);
  } catch (error) {
    throw error;
  }
}

/**
 * Restore previous purchases
 * Useful when user reinstalls app or switches devices
 */
export async function restorePurchases(
  email: string,
  name: string | undefined,
): Promise<Purchase[]> {
  try {
    const availablePurchases = await getAvailablePurchases();
    if (availablePurchases.length === 0) {
      return [];
    }

    for (const purchase of availablePurchases) {
      try {
        await activateSubscription(email, name, purchase);
      } catch (error) {
        console.error("Failed to restore purchase:", error);
      }
    }

    return availablePurchases as Purchase[];
  } catch (error) {
    throw error;
  }
}
