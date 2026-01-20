import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GradientBackground } from "../../components/auth/GradientBackground";
import { AuthCard } from "../../components/auth/AuthCard";
import { ConvexLettering } from "../../components/ui/ConvexLettering";
import { useTheme, darkTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import * as authService from "../../services/auth";
import * as WebBrowser from "expo-web-browser";
import {
  APP_VERSION,
  GIT_COMMIT_HASH,
  GIT_REPO_URL,
  BUILD_NUMBER,
} from "../../utils/version";
import { ConvexLogo } from "@/components/ui/ConvexLogo";

type AuthMethod = "device" | "manual";

export default function WelcomeScreen() {
  const { theme } = useTheme();
  const { login } = useAuth();
  const [authMethod, setAuthMethod] = useState<AuthMethod>("device");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [userCode, setUserCode] = useState<string | null>(null);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [deployUrl, setDeployUrl] = useState("");
  const [deployKey, setDeployKey] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const pollAbortRef = useRef(false);

  const handleStartDeviceAuth = useCallback(async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    setUserCode(null);
    pollAbortRef.current = false;

    try {
      const deviceAuth = await authService.startDeviceAuthorization();
      setUserCode(deviceAuth.user_code);

      const url =
        deviceAuth.verification_uri_complete || deviceAuth.verification_uri;
      setVerificationUrl(url);

      // Open in-app browser (slide-up modal)
      await WebBrowser.openAuthSessionAsync(url, undefined, {
        preferEphemeralSession: true,
      });

      const interval = (deviceAuth.interval || 5) * 1000;
      const maxAttempts = Math.floor(
        deviceAuth.expires_in / (deviceAuth.interval || 5),
      );
      let attempts = 0;

      const poll = async () => {
        if (pollAbortRef.current || attempts >= maxAttempts) {
          setIsAuthenticating(false);
          if (attempts >= maxAttempts) {
            setAuthError("Authorization expired. Please try again.");
            setUserCode(null);
          }
          return;
        }

        try {
          const tokenResponse =
            await authService.pollForDeviceToken(deviceAuth);

          if (tokenResponse) {
            const dashboardSession =
              await authService.exchangeForDashboardToken(
                tokenResponse.access_token,
              );

            await login(dashboardSession);
            setIsAuthenticating(false);
            setUserCode(null);
          } else {
            attempts++;
            setTimeout(poll, interval);
          }
        } catch (err: any) {
          setIsAuthenticating(false);
          setAuthError(err.message || "Authorization failed");
          setUserCode(null);
        }
      };

      setTimeout(poll, interval);
    } catch (err: any) {
      setIsAuthenticating(false);
      setAuthError(err.message || "Failed to start authorization");
      setUserCode(null);
    }
  }, [login]);

  const handleCancelDeviceAuth = useCallback(() => {
    pollAbortRef.current = true;
    setIsAuthenticating(false);
    setUserCode(null);
    setVerificationUrl(null);
    setAuthError(null);
  }, []);

  const handleManualConnect = useCallback(async () => {
    console.log("Manual connect:", { deployUrl, deployKey });
  }, [deployUrl, deployKey]);

  const handleOpenLink = useCallback(async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  }, []);

  return (
    <GradientBackground>
      <StatusBar
        backgroundColor={theme.colors.background}
        barStyle="light-content"
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Convex Logo at the top */}
          <View style={styles.logoContainer}>
            <ConvexLogo size={32} />
            <ConvexLettering width={126} height={20} color="#FFFFFF" />
          </View>

          {/* Auth Card */}
          <View style={styles.cardContainer}>
            <AuthCard
              authMethod={authMethod}
              isAuthenticating={isAuthenticating}
              userCode={userCode}
              verificationUrl={verificationUrl}
              onStartDeviceAuth={handleStartDeviceAuth}
              onCancelDeviceAuth={handleCancelDeviceAuth}
              deployUrl={deployUrl}
              deployKey={deployKey}
              onDeployUrlChange={setDeployUrl}
              onDeployKeyChange={setDeployKey}
              onManualConnect={handleManualConnect}
              authError={authError}
              theme={darkTheme}
            />
          </View>

          {/* Version and commit info at the bottom right */}
          <View style={styles.versionContainer}>
            <Text
              style={[
                styles.versionText,
                { color: theme.colors.textSecondary },
              ]}
            >
              v{APP_VERSION} ({BUILD_NUMBER})
            </Text>
            {GIT_COMMIT_HASH !== "unknown" && GIT_REPO_URL && (
              <>
                <Text
                  style={[
                    styles.versionText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {" - "}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    handleOpenLink(`${GIT_REPO_URL}/commit/${GIT_COMMIT_HASH}`)
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.commitText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {GIT_COMMIT_HASH.substring(0, 7)}
                  </Text>
                </TouchableOpacity>
              </>
            )}
            {GIT_COMMIT_HASH !== "unknown" && !GIT_REPO_URL && (
              <>
                <Text
                  style={[
                    styles.versionText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {" - "}
                </Text>
                <Text
                  style={[
                    styles.versionText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {GIT_COMMIT_HASH.substring(0, 7)}
                </Text>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    minHeight: 600,
    maxWidth: 960,
    width: "100%",
    alignSelf: "center",
  },
  logoContainer: {
    position: "absolute",
    top: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    gap: 12,
  },
  cardContainer: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  versionContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  versionText: {
    fontSize: 12,
  },
  commitText: {
    fontSize: 12,
    textDecorationLine: "underline",
  },
});
