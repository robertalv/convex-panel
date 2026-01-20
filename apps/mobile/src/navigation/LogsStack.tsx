import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LogsScreen } from "../features/logs/LogsScreen";

export type LogsStackParamList = {
  LogsList: undefined;
};

const Stack = createNativeStackNavigator<LogsStackParamList>();

export function LogsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="LogsList"
        component={LogsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
