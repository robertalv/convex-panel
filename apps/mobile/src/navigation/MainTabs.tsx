/**
 * Main Tabs Navigator
 *
 * Bottom tab navigation for main app screens
 */

import React from "react";
import { Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "../components/ui/Icon";
import { useTheme } from "../contexts/ThemeContext";
import {
  DeploymentSheetProvider,
  useDeploymentSheet,
} from "../contexts/DeploymentSheetContext";
import { DeploymentSelectorSheet } from "../components/DeploymentSelectorSheet";
import DashboardStack from "./DashboardStack";
import { DataStack } from "./DataStack";
import { LogsStack } from "./LogsStack";
import AccountScreen from "../screens/AccountScreen";
import type { MainTabParamList } from "../types";

const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabsContent() {
  const { theme } = useTheme();
  const { sheetRef } = useDeploymentSheet();

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: "#FFFFFF",
          tabBarInactiveTintColor: "rgba(255, 255, 255, 0.6)",
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
          },
          tabBarLabelStyle: {
            fontFamily: Platform.select({
              ios: "Menlo",
              android: "monospace",
              default: "monospace",
            }),
            fontSize: 12,
          },
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.text,
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardStack}
          options={{
            headerShown: false,
            tabBarLabel: "Dashboard",
            tabBarIcon: ({ color, size }) => (
              <Icon name="health" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Data"
          component={DataStack}
          options={{
            headerShown: false,
            tabBarLabel: "Data",
            tabBarIcon: ({ color, size }) => (
              <Icon name="database" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Logs"
          component={LogsStack}
          options={{
            headerShown: false,
            tabBarLabel: "Logs",
            tabBarIcon: ({ color, size }) => (
              <Icon name="terminal" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Account"
          component={AccountScreen}
          options={{
            tabBarLabel: "Account",
            headerTitle: "Account",
            tabBarIcon: ({ color, size }) => (
              <Icon name="user" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
      <DeploymentSelectorSheet
        sheetRef={sheetRef}
        onClose={() => {
          // Optionally refetch data when selection changes
        }}
      />
    </>
  );
}

export default function MainTabs() {
  return (
    <DeploymentSheetProvider>
      <MainTabsContent />
    </DeploymentSheetProvider>
  );
}
