import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import * as authService from "../../services/auth";
import * as WebBrowser from "expo-web-browser";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { AuthStackParamList, DeviceAuthResponse } from "../../types";

type DeviceAuthScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "DeviceAuth">;
  route: RouteProp<AuthStackParamList, "DeviceAuth">;
};

export default function DeviceAuthScreen({
  navigation,
}: DeviceAuthScreenProps) {
  const { theme } = useTheme();
  const { login } = useAuth();
  const [authResponse, setAuthResponse] = useState<DeviceAuthResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startAuth();
  }, []);

  const startAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.startDeviceAuthorization();
      setAuthResponse(response);
      setIsLoading(false);
      startPolling(response);
    } catch (err: any) {
      setError(err.message || "Failed to start authorization");
      setIsLoading(false);
    }
  };

  const startPolling = async (auth: DeviceAuthResponse) => {
    setIsPolling(true);
    const interval = (auth.interval || 5) * 1000;
    const maxAttempts = Math.floor(auth.expires_in / (auth.interval || 5));
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setIsPolling(false);
        setError("Authorization expired. Please try again.");
        return;
      }

      try {
        const tokenResponse = await authService.pollForDeviceToken(auth);

        if (tokenResponse) {
          const dashboardSession = await authService.exchangeForDashboardToken(
            tokenResponse.access_token,
          );

          await login(dashboardSession);
          setIsPolling(false);
        } else {
          attempts++;
          setTimeout(poll, interval);
        }
      } catch (err: any) {
        setIsPolling(false);
        setError(err.message || "Authorization failed");
      }
    };

    setTimeout(poll, interval);
  };

  const handleCopyCode = async () => {
    if (authResponse) {
      await Clipboard.setStringAsync(authResponse.user_code);
      Alert.alert("Copied!", "User code copied to clipboard");
    }
  };

  const handleOpenBrowser = async () => {
    if (authResponse) {
      const url =
        authResponse.verification_uri_complete || authResponse.verification_uri;

      try {
        // Open in-app browser (slide-up modal)
        await WebBrowser.openAuthSessionAsync(url, undefined, {
          preferEphemeralSession: true,
        });
      } catch (error) {
        Alert.alert("Error", "Cannot open browser");
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Initializing...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={startAuth}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Sign in to Convex
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          >
            Follow these steps to authenticate:
          </Text>
        </View>

        <View style={styles.steps}>
          <StepItem number={1} text="Copy your user code" theme={theme} />
          <View
            style={[
              styles.codeContainer,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Text style={[styles.code, { color: theme.colors.text }]}>
              {authResponse?.user_code}
            </Text>
            <TouchableOpacity
              style={[
                styles.copyButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleCopyCode}
            >
              <Text style={styles.copyButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>

          <StepItem
            number={2}
            text="Open the authorization page"
            theme={theme}
          />
          <TouchableOpacity
            style={[styles.browserButton, { borderColor: theme.colors.border }]}
            onPress={handleOpenBrowser}
          >
            <Text
              style={[
                styles.browserButtonText,
                { color: theme.colors.primary },
              ]}
            >
              Open Browser
            </Text>
          </TouchableOpacity>

          <StepItem
            number={3}
            text="Paste your code and authorize"
            theme={theme}
          />
        </View>

        {isPolling && (
          <View style={styles.pollingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text
              style={[
                styles.pollingText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Waiting for authorization...
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text
            style={[
              styles.cancelButtonText,
              { color: theme.colors.textSecondary },
            ]}
          >
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function StepItem({
  number,
  text,
  theme,
}: {
  number: number;
  text: string;
  theme: any;
}) {
  return (
    <View style={styles.stepItem}>
      <View
        style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}
      >
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <Text style={[styles.stepText, { color: theme.colors.text }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  steps: {
    flex: 1,
    gap: 16,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  stepText: {
    fontSize: 16,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginLeft: 44,
    marginBottom: 8,
  },
  code: {
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 4,
  },
  copyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  copyButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  browserButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    marginLeft: 44,
    marginBottom: 8,
  },
  browserButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  pollingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 24,
  },
  pollingText: {
    fontSize: 14,
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
