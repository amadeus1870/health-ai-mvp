import { Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function SettingsLayout() {
    return (
        <Stack screenOptions={{
            headerTransparent: true, // Transparent header
            headerStyle: { backgroundColor: 'transparent' },
            headerTintColor: '#FFF',
            headerTitleStyle: { color: '#FFF', textShadowColor: 'transparent', textShadowRadius: 0 }, // No "alone"
            contentStyle: { backgroundColor: Colors.background }, // Global BG
            headerShadowVisible: false, // Clean look
        }}>
            <Stack.Screen name="index" options={{ title: 'Impostazioni' }} />
            <Stack.Screen name="privacy" options={{ title: 'Privacy Policy', presentation: 'modal' }} />
            <Stack.Screen name="terms" options={{ title: 'Termini di Servizio', presentation: 'modal' }} />
            <Stack.Screen name="disclaimer" options={{ title: 'Disclaimer Medico', presentation: 'modal' }} />
            <Stack.Screen name="language" options={{ title: 'Lingua', presentation: 'modal' }} />
        </Stack>
    );
}
