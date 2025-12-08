import React from 'react';
import { View, ScrollView, StyleSheet, Alert, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import SettingsItem from '../../components/ui/SettingsItem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { Typography } from '../../constants/Typography';
import { Text } from 'react-native';

export default function SettingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const handleClearData = () => {
        Alert.alert(
            "Elimina tutti i dati",
            "Sei sicuro? Questa azione è irreversibile. Tutti i tuoi dati verranno cancellati dal dispositivo.",
            [
                { text: "Annulla", style: "cancel" },
                {
                    text: "Elimina",
                    style: "destructive",
                    onPress: () => {
                        // TODO: Implement Logic using storage service
                        Alert.alert("Dati Eliminati", "L'app verrà riavviata.");
                        // Force restart or nav to welcome
                    }
                }
            ]
        );
    };

    const handleClearChat = () => {
        Alert.alert(
            "Cancella Chat",
            "Vuoi cancellare la cronologia della conversazione con l'Assistente?",
            [
                { text: "Annulla", style: "cancel" },
                {
                    text: "Cancella",
                    style: "destructive",
                    onPress: () => {
                        // TODO: Implement Logic
                    }
                }
            ]
        );
    };

    return (
        <ImageBackground
            source={require('../../assets/images/custom_bg.jpg')}
            style={styles.container}
            resizeMode="cover"
        >
            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20, paddingTop: 100 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>PROFILO & DATI</Text>
                    <SettingsItem
                        icon="person-outline"
                        label="I miei dati"
                        onPress={() => Alert.alert("In arrivo", "Funzionalità di modifica profilo in arrivo.")}
                    />
                    <SettingsItem
                        icon="document-text-outline"
                        label="Esporta Report PDF"
                        onPress={() => Alert.alert("Export PDF", "Generazione report in corso...")}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>PREFERENZE</Text>
                    <SettingsItem
                        icon="globe-outline"
                        label="Lingua"
                        value="Italiano"
                        onPress={() => router.push('/settings/language')}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>INTELLIGENZA ARTIFICIALE</Text>
                    <SettingsItem
                        icon="chatbubbles-outline"
                        label="Cancella memoria chat"
                        onPress={handleClearChat}
                        color="#FFA000"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>LEGAL COMPLIANCE</Text>
                    <SettingsItem
                        icon="shield-checkmark-outline"
                        label="Privacy Policy"
                        onPress={() => router.push('/legal/privacy')}
                    />
                    <SettingsItem
                        icon="document-outline"
                        label="Termini di Servizio"
                        onPress={() => router.push('/legal/terms')}
                    />
                    <SettingsItem
                        icon="warning-outline"
                        label="Disclaimer Medico"
                        onPress={() => router.push('/settings/disclaimer')}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>ZONA PERICOLOSA</Text>
                    <SettingsItem
                        icon="trash-outline"
                        label="Elimina tutti i dati"
                        isDestructive
                        onPress={handleClearData}
                    />
                </View>

                <View style={styles.footer}>
                    <Text style={styles.versionText}>Versione 1.0.0 (Build 1)</Text>
                    <Text style={styles.footerText}>Made with ❤️ in Proactive Lab</Text>
                </View>
            </ScrollView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 30,
    },
    sectionHeader: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontFamily: Typography.fontFamily.bold,
        marginBottom: 10,
        marginLeft: 4,
        letterSpacing: 1,
    },
    footer: {
        alignItems: 'center',
        marginTop: 20,
    },
    versionText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        fontFamily: Typography.fontFamily.regular,
    },
    footerText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
        fontFamily: Typography.fontFamily.regular,
        marginTop: 4,
    },
});
