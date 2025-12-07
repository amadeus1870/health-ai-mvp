import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AnalysisProvider } from '../context/AnalysisContext';

import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AnalysisProvider>
        <View style={{ flex: 1 }}>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }} initialRouteName="welcome">
            <Stack.Screen name="welcome" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </View>
      </AnalysisProvider>
    </SafeAreaProvider>
  );
}
