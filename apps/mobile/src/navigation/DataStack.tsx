/**
 * Data Stack Navigator
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DataBrowserScreen } from "../features/data/DataBrowserScreen";
import { ErrorBoundary } from "../features/data/components/ErrorBoundary";

export type DataStackParamList = {
  DataBrowser: undefined;
};

const Stack = createNativeStackNavigator<DataStackParamList>();

export function DataStack() {
  return (
    <ErrorBoundary>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="DataBrowser" component={DataBrowserScreen} />
      </Stack.Navigator>
    </ErrorBoundary>
  );
}
