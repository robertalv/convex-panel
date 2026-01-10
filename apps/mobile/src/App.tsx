/**
 * App Entry Point
 *
 * Sets up providers and initializes the app
 */

import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "react-native";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DeploymentProvider } from "./contexts/DeploymentContext";
import { QueryProvider } from "./contexts/QueryContext";
import RootNavigator from "./navigation/RootNavigator";
import { StyleSheet } from "react-native";

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <QueryProvider>
        <ThemeProvider>
          <AuthProvider>
            <DeploymentProvider>
              <RootNavigator />
            </DeploymentProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
