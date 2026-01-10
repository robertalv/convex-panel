/**
 * Auth Card Component
 * 
 * Main authentication card that switches between device auth and deploy key forms
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../types';
import { DeviceAuthFlow } from './DeviceAuthFlow';
import { ConvexLogo } from '../ui/ConvexLogo';


type AuthMethod = 'device' | 'manual';

interface AuthCardProps {
  authMethod: AuthMethod;
  isAuthenticating: boolean;
  userCode: string | null;
  onStartDeviceAuth: () => void;
  onCancelDeviceAuth: () => void;
  deployUrl: string;
  deployKey: string;
  onDeployUrlChange: (value: string) => void;
  onDeployKeyChange: (value: string) => void;
  onManualConnect: () => void;
  authError: string | null;
  theme?: Theme;
}

export function AuthCard({
  authMethod,
  isAuthenticating,
  userCode,
  onStartDeviceAuth,
  onCancelDeviceAuth,
  deployUrl,
  deployKey,
  onDeployUrlChange,
  onDeployKeyChange,
  onManualConnect,
  authError,
  theme: themeOverride,
}: AuthCardProps) {
  const { theme: contextTheme } = useTheme();
  const theme = themeOverride || contextTheme;
  const isDeviceAuthPending = !!userCode;
  const isDark = theme.dark;

  // Surface raised color - matching desktop: rgb(52, 50, 47) in dark, rgb(248, 246, 243) in light
  const surfaceRaised = isDark ? '#34322f' : '#f8f6f3';
  const borderBase = theme.colors.border;

  return (
    <View style={styles.container}>
      {authError && (
        <View
          style={[
            styles.errorContainer,
            {
              backgroundColor: theme.colors.error + '20',
              borderColor: theme.colors.error + '33',
            },
          ]}
        >
          <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {authError}
          </Text>
        </View>
      )}

      {authMethod === 'device' ? (
        isDeviceAuthPending ? (
          <DeviceAuthFlow userCode={userCode!} onCancel={onCancelDeviceAuth} theme={theme} />
        ) : (
          <TouchableOpacity
            style={[
              styles.signInButton,
              {
                backgroundColor: surfaceRaised,
                borderColor: borderBase,
                opacity: isAuthenticating ? 0.5 : 1,
              },
            ]}
            onPress={onStartDeviceAuth}
            disabled={isAuthenticating}
            activeOpacity={0.8}
          >
            {isAuthenticating ? (
              <ActivityIndicator size="small" color={theme.colors.text} />
            ) : (
              <></>
            )}
            <Text style={[styles.signInButtonText, { color: theme.colors.text }]}>
              {isAuthenticating ? 'Starting...' : 'Sign in with Convex'}
            </Text>
          </TouchableOpacity>
        )
      ) : (
        <View style={styles.deployKeyForm}>
          <Text style={[styles.formDescription, { color: theme.colors.textSecondary }]}>
            Connect directly with your deployment URL and deploy key.
          </Text>
          {/* Deploy key form would go here - simplified for now */}
          <Text style={[styles.formDescription, { color: theme.colors.textSecondary }]}>
            Deploy key form coming soon
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 400,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    width: '100%',
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  deployKeyForm: {
    gap: 16,
  },
  formDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
});

