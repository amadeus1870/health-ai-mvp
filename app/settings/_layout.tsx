import { Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { GlassView } from '../../components/ui/GlassView';
import { StyleSheet } from 'react-native';

export default function SettingsLayout() {
    const headerBlur = () => (
        <GlassView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
    );

    return (
        <Stack screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
        }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="privacy" options={{ presentation: 'modal' }} />
            <Stack.Screen name="terms" options={{ presentation: 'modal' }} />
            <Stack.Screen name="disclaimer" options={{ presentation: 'modal' }} />
            <Stack.Screen name="language" options={{ presentation: 'modal' }} />
        </Stack>
    );
}
