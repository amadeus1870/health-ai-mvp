import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AnalysisProvider } from '../context/AnalysisContext';
import { LanguageProvider } from '../context/LanguageContext';
import { DisclaimerModal } from '../components/DisclaimerModal';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GlassView } from '../components/ui/GlassView';

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

  const headerBlur = () => (
    <GlassView intensity={90} tint="dark" style={{ flex: 1 }} />
  );

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AnalysisProvider>
          <View style={{ flex: 1 }}>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }} initialRouteName="welcome">
              <Stack.Screen name="welcome" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="legal/privacy"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="legal/terms"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="settings/disclaimer"
                options={{
                  headerShown: false,
                }}
              />
            </Stack>
            {/* <DisclaimerModal /> */}
          </View>
        </AnalysisProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
