import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useProfile } from "../hooks/useBigBrain";
import { useIsProUser } from "../hooks/useIsProUser";
import {
  initializeIAP,
  getAvailableSubscriptions,
  purchaseSubscription,
  setupPurchaseListeners,
  activateSubscription,
  restorePurchases,
} from "../services/iap";
import type { Product, Purchase, PurchaseError } from "react-native-iap";

export default function SubscriptionScreen() {
  const { theme } = useTheme();
  const { session } = useAuth();
  const accessToken = session?.accessToken ?? null;
  const { data: profile } = useProfile(accessToken);
  const { isPro, subscription, isLoading: isLoadingProStatus } = useIsProUser();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    let cleanupListeners: (() => void) | undefined;

    const initialize = async () => {
      try {
        const connected = await initializeIAP();
        if (connected) {
          setIsLoadingProducts(true);
          const availableProducts = await getAvailableSubscriptions();
          setProducts(availableProducts);

          if (__DEV__) {
            Alert.alert(
              "IAP Debug",
              `Found ${availableProducts.length} products`,
              [{ text: "OK" }],
            );
          }
        }
      } catch (error) {
        console.error("Failed to initialize IAP:", error);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    const onPurchaseUpdate = async (purchase: Purchase) => {
      setIsPurchasing(true);

      try {
        const userEmail =
          profile?.emails?.[0]?.email || session?.profile?.email;
        const userName = profile?.name;

        if (!userEmail) {
          throw new Error("No email found");
        }

        await activateSubscription(userEmail, userName, purchase);

        Alert.alert(
          "Success!",
          "Your Pro subscription is now active. Enjoy unlimited access!",
          [{ text: "OK" }],
        );
      } catch (error: any) {
        console.error(
          "[SubscriptionScreen] Failed to activate subscription:",
          error,
        );
        Alert.alert(
          "Activation Failed",
          "Purchase succeeded but failed to activate. Please contact support.",
          [{ text: "OK" }],
        );
      } finally {
        setIsPurchasing(false);
      }
    };

    const onPurchaseError = (error: PurchaseError) => {
      setIsPurchasing(false);

      const errorCode = error.code?.toString() || "";
      if (
        errorCode.includes("CANCELLED") ||
        errorCode.includes("E_USER_CANCELLED")
      ) {
        return;
      }

      Alert.alert(
        "Purchase Failed",
        error.message || "Failed to complete purchase. Please try again.",
        [{ text: "OK" }],
      );
    };

    cleanupListeners = setupPurchaseListeners(
      onPurchaseUpdate,
      onPurchaseError,
    );
    initialize();

    return () => {
      if (cleanupListeners) {
        cleanupListeners();
      }
    };
  }, [profile, session]);

  const handlePurchase = async (productId: string) => {
    if (isPurchasing) return;

    setIsPurchasing(true);
    try {
      await purchaseSubscription(productId);
    } catch (error: any) {
      setIsPurchasing(false);

      const errorCode = error.code?.toString() || "";
      if (
        errorCode.includes("CANCELLED") ||
        errorCode.includes("E_USER_CANCELLED")
      ) {
        return;
      }

      Alert.alert(
        "Purchase Failed",
        "Failed to start purchase. Please try again.",
        [{ text: "OK" }],
      );
    }
  };

  const handleRestorePurchases = async () => {
    if (isRestoring) return;

    setIsRestoring(true);
    try {
      const userEmail = profile?.emails?.[0]?.email || session?.profile?.email;
      const userName = profile?.name;

      if (!userEmail) {
        throw new Error("No email found");
      }

      const restoredPurchases = await restorePurchases(userEmail, userName);

      if (restoredPurchases.length > 0) {
        Alert.alert(
          "Success!",
          `Restored ${restoredPurchases.length} purchase(s). Your Pro subscription is now active.`,
          [{ text: "OK" }],
        );
      } else {
        Alert.alert(
          "No Purchases Found",
          "No previous purchases were found for this account.",
          [{ text: "OK" }],
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Restore Failed",
        "Failed to restore purchases. Please try again.",
        [{ text: "OK" }],
      );
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View
          style={[styles.header, { backgroundColor: theme.colors.surface }]}
        >
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Mobile Pro
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          >
            Unlock unlimited access to all features
          </Text>
        </View>

        {isLoadingProStatus ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={styles.loader}
          />
        ) : isPro ? (
          <View
            style={[
              styles.activeCard,
              {
                backgroundColor: theme.colors.success + "20",
                borderColor: theme.colors.success,
              },
            ]}
          >
            <Text
              style={[styles.activeStatus, { color: theme.colors.success }]}
            >
              ✓ Active Pro Subscription
            </Text>
            {subscription && (
              <Text
                style={[
                  styles.renewalDate,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Renews: {new Date(subscription.expiryDate).toLocaleDateString()}
              </Text>
            )}
          </View>
        ) : (
          <View>
            {isLoadingProducts ? (
              <ActivityIndicator
                size="large"
                color={theme.colors.primary}
                style={styles.loader}
              />
            ) : products.length > 0 ? (
              <View style={styles.productsContainer}>
                {products.map((product) => {
                  const isYearly = product.id.includes("yearly");
                  return (
                    <TouchableOpacity
                      key={product.id}
                      style={[
                        styles.productCard,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                        },
                        isYearly && {
                          borderColor: theme.colors.primary,
                          borderWidth: 2,
                        },
                      ]}
                      onPress={() => handlePurchase(product.id)}
                      disabled={isPurchasing}
                      activeOpacity={0.7}
                    >
                      {isYearly && (
                        <View
                          style={[
                            styles.bestValueBadge,
                            { backgroundColor: theme.colors.primary },
                          ]}
                        >
                          <Text style={styles.bestValueText}>BEST VALUE</Text>
                        </View>
                      )}
                      <Text
                        style={[
                          styles.productTitle,
                          { color: theme.colors.text },
                        ]}
                      >
                        {isYearly ? "Yearly" : "Monthly"}
                      </Text>
                      <Text
                        style={[
                          styles.productPrice,
                          { color: theme.colors.primary },
                        ]}
                      >
                        {product.displayPrice}
                      </Text>
                      <Text
                        style={[
                          styles.productPeriod,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {isYearly ? "$1.67/month" : "per month"}
                      </Text>
                      {isYearly && (
                        <Text
                          style={[
                            styles.savingsText,
                            { color: theme.colors.success },
                          ]}
                        >
                          Save 44%
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text
                style={[
                  styles.emptyText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                No subscription plans available
              </Text>
            )}

            {!isPro && (
              <TouchableOpacity
                style={[
                  styles.restoreButton,
                  { backgroundColor: theme.colors.surface },
                ]}
                onPress={handleRestorePurchases}
                disabled={isRestoring}
                activeOpacity={0.7}
              >
                {isRestoring ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                  />
                ) : (
                  <Text
                    style={[
                      styles.restoreButtonText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Restore Purchases
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {isPurchasing && (
          <View
            style={[
              styles.purchasingOverlay,
              { backgroundColor: theme.colors.background + "DD" },
            ]}
          >
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.purchasingText, { color: theme.colors.text }]}>
              Processing purchase...
            </Text>
          </View>
        )}

        <View
          style={[styles.features, { backgroundColor: theme.colors.surface }]}
        >
          <Text style={[styles.featuresTitle, { color: theme.colors.text }]}>
            Pro Features
          </Text>
          <View style={styles.featuresList}>
            <Text
              style={[styles.feature, { color: theme.colors.textSecondary }]}
            >
              • Unlimited deployments
            </Text>
            <Text
              style={[styles.feature, { color: theme.colors.textSecondary }]}
            >
              • Advanced data browser
            </Text>
            <Text
              style={[styles.feature, { color: theme.colors.textSecondary }]}
            >
              • Real-time logs filtering
            </Text>
            <Text
              style={[styles.feature, { color: theme.colors.textSecondary }]}
            >
              • Priority support
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  loader: {
    marginVertical: 32,
  },
  activeCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 24,
    marginBottom: 24,
    alignItems: "center",
  },
  activeStatus: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  renewalDate: {
    fontSize: 14,
  },
  productsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  productCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    position: "relative",
  },
  bestValueBadge: {
    position: "absolute",
    top: -8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestValueText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  productTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 8,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  productPeriod: {
    fontSize: 14,
    marginBottom: 8,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 32,
  },
  restoreButton: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  purchasingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  purchasingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
  },
  features: {
    borderRadius: 12,
    padding: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  featuresList: {
    gap: 8,
  },
  feature: {
    fontSize: 14,
    lineHeight: 20,
  },
});
