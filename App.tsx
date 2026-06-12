import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";

import { CameraScreen } from "./src/screens/CameraScreen";
import { AuraReportScreen } from "./src/screens/AuraReportScreen";
import { DailyAuraScreen } from "./src/screens/DailyAuraScreen";
import { RootStackParamList } from "./src/navigation/types";

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "transparent",
  },
};

export default function App() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: "#05070c",
          },
        }}
      >
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="AuraReport" component={AuraReportScreen} />
        <Stack.Screen name="DailyAura" component={DailyAuraScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
