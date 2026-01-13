/**
 * In-App Purchase Products Configuration
 *
 * Define subscription products for iOS and Android
 */

export interface SubscriptionProduct {
  id: string;
  name: string;
  description: string;
  duration: "monthly" | "yearly";
  price: {
    ios: string;
    android: string;
  };
}

/**
 * Product IDs for App Store and Google Play
 * These must match the product IDs configured in App Store Connect and Google Play Console
 */
export const PRODUCT_IDS = {
  // iOS App Store product IDs
  ios: {
    monthly: "convex_panel_pro_m",
    yearly: "convex_panel_pro_y",
  },
  // Android Google Play product IDs
  android: {
    monthly: "convex_panel_pro_m",
    yearly: "convex_panel_pro_y",
  },
} as const;

/**
 * Subscription products available for purchase
 */
export const SUBSCRIPTION_PRODUCTS: SubscriptionProduct[] = [
  {
    id: "pro_monthly",
    name: "Mobile Pro Monthly",
    description: "Full access to all mobile features",
    duration: "monthly",
    price: {
      ios: "$2.49",
      android: "$2.49",
    },
  },
  {
    id: "pro_yearly",
    name: "Mobile Pro Yearly",
    description: "Full access to all mobile features - Save 20%",
    duration: "yearly",
    price: {
      ios: "$23.88",
      android: "$23.88",
    },
  },
];

/**
 * Get platform-specific product ID
 */
export function getPlatformProductId(
  productType: "monthly" | "yearly",
  platform: "ios" | "android",
): string {
  return PRODUCT_IDS[platform][productType];
}
