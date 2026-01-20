import React from "react";
import { Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "../components/ui/Icon";
import { useTheme } from "../contexts/ThemeContext";
import { useDeployment } from "../contexts/DeploymentContext";
import { SheetProvider, useSheet } from "../contexts/SheetContext";
import { DeploymentSelectorSheet } from "../components/DeploymentSelectorSheet";
import { MenuSheet } from "../components/MenuSheet";
import { ScreenHeader } from "../components/ScreenHeader";
import { TeamHeader } from "../components/TeamHeader";
import DashboardStack from "./DashboardStack";
import { DataStack } from "./DataStack";
import { LogsStack } from "./LogsStack";
import AccountScreen from "../screens/AccountScreen";
import SubscriptionScreen from "../screens/SubscriptionScreen";
import TeamScreen from "../screens/TeamScreen";
import TeamBillingScreen from "../screens/TeamBillingScreen";
import type { MainTabParamList } from "../types";

const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabsContent() {
  const { theme } = useTheme();
  const { deployment } = useDeployment();
  const deploymentSheet = useSheet("deployment");
  const menuSheet = useSheet("menu");
  const showTabBar = !!deployment;

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: "#FFFFFF",
          tabBarInactiveTintColor: "rgba(255, 255, 255, 0.6)",
          tabBarStyle: showTabBar
            ? {
                backgroundColor: theme.colors.surface,
                borderTopColor: theme.colors.border,
              }
            : { display: "none" },
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
            header: () => <ScreenHeader title="Account" />,
            tabBarIcon: ({ color, size }) => (
              <Icon name="user" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Subscription"
          component={SubscriptionScreen}
          options={{
            tabBarButton: () => null,
            header: () => <ScreenHeader title="Mobile Pro" />,
          }}
        />
        <Tab.Screen
          name="Team"
          component={TeamScreen}
          options={{
            tabBarButton: () => null,
            header: () => <TeamHeader />,
          }}
        />
        <Tab.Screen
          name="TeamBilling"
          component={TeamBillingScreen}
          options={{
            tabBarButton: () => null,
            header: () => <TeamHeader showBackButton />,
          }}
        />
      </Tab.Navigator>
      <DeploymentSelectorSheet
        sheetRef={deploymentSheet.sheetRef}
        onClose={() => {
          // Optionally refetch data when selection changes
        }}
      />
      <MenuSheet
        sheetRef={menuSheet.sheetRef}
        closeSheet={menuSheet.closeSheet}
      />
    </>
  );
}

export default function MainTabs() {
  return (
    <SheetProvider>
      <MainTabsContent />
    </SheetProvider>
  );
}
