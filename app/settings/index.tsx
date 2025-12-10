import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, ImageBackground, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import SettingsItem from '../../components/ui/SettingsItem';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { Typography } from '../../constants/Typography';
import { Text } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { ProfileService } from '../../services/ProfileService';
import { AnalysisService } from '../../services/AnalysisService';
import { PdfService } from '../../services/PdfService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../../config/i18n';
import { CustomAlert } from '../../components/ui/CustomAlert';
import { InfoModal } from '../../components/ui/InfoModal';
import { SettingsHeader } from '../../components/ui/SettingsHeader';

const LANG_NAMES: Record<string, string> = {
    'it': 'Italiano',
    'en': 'English',
    'es': 'Español',
    'fr': 'Français',
    'de': 'Deutsch'
};

export default function SettingsScreen() {
    const router = useRouter();
    const { language } = useLanguage();
    const [isExporting, setIsExporting] = useState(false);

    // Modal States
    const [clearDataAlertVisible, setClearDataAlertVisible] = useState(false);
    const [clearChatAlertVisible, setClearChatAlertVisible] = useState(false);
    const [infoModalVisible, setInfoModalVisible] = useState(false);
    const [successAlertVisible, setSuccessAlertVisible] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleClearData = () => {
        setClearDataAlertVisible(true);
    };

    const confirmClearData = async () => {
        try {
            await AsyncStorage.multiRemove([
                'user_profile_v1',
                'user_diet_plan_v1',
                'analysis_history_v1',
                'chat_history_v1'
            ]);
            setSuccessMessage(i18n.t('settings.restartMessage'));
            setSuccessAlertVisible(true);
            // Ideally, we should reset context state here too, but a restart is cleaner for MVP
        } catch (e) {
            console.error("Failed to clear data", e);
        }
    };

    const handleClearChat = () => {
        setClearChatAlertVisible(true);
    };

    const confirmClearChat = async () => {
        try {
            await AsyncStorage.removeItem('chat_history_v1');
            setSuccessMessage(i18n.t('settings.chatDeletedMessage'));
            setSuccessAlertVisible(true);
        } catch (e) {
            console.error("Failed to clear chat", e);
        }
    };

    const handleExportPdf = async () => {
        if (isExporting) return;
        setIsExporting(true);
        try {
            const profile = await ProfileService.getProfile();
            const analysis = await AnalysisService.getLastAnalysis();

            if (!analysis) {
                Alert.alert(i18n.t('common.error'), i18n.t('dashboard.noHistory'));
                return;
            }

            const vitalScore = AnalysisService.calculateVitalScore(analysis);
            await PdfService.generateAndShareAnalysisPdf(analysis, profile, vitalScore, language);
            // Alert.alert(i18n.t('common.success'), i18n.t('settings.exportSuccess')); // Share sheet is enough feedback usually
        } catch (error) {
            console.error("Export Error", error);
            Alert.alert(i18n.t('common.error'), i18n.t('settings.exportError'));
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <ImageBackground
            source={require('../../assets/images/custom_bg.jpg')}
            style={styles.container}
            resizeMode="cover"
        >
            <SafeAreaView style={{ flex: 1 }}>
                <SettingsHeader title={i18n.t('settings.title')} />
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>{i18n.t('settings.sections.profile')}</Text>
                        <SettingsItem
                            icon="person-outline"
                            label={i18n.t('settings.profileData')}
                            onPress={() => router.replace('/(tabs)/profile')}
                        />
                        <SettingsItem
                            icon="document-text-outline"
                            label={i18n.t('settings.exportPdf')}
                            onPress={handleExportPdf}
                            rightElement={isExporting ? <ActivityIndicator size="small" color="#FFF" /> : undefined}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>{i18n.t('settings.sections.preferences')}</Text>
                        <SettingsItem
                            icon="globe-outline"
                            label={i18n.t('settings.language')}
                            value={LANG_NAMES[language] || language.toUpperCase()}
                            onPress={() => router.push('/settings/language')}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>{i18n.t('settings.sections.ai')}</Text>
                        <SettingsItem
                            icon="chatbubbles-outline"
                            label={i18n.t('settings.clearChat')}
                            onPress={handleClearChat}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>INFO</Text>
                        <SettingsItem
                            icon="information-circle-outline"
                            label={i18n.t('settings.info')}
                            value={`v1.0.0`}
                            onPress={() => setInfoModalVisible(true)}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>{i18n.t('settings.sections.legal')}</Text>
                        <SettingsItem
                            icon="shield-checkmark-outline"
                            label={i18n.t('settings.privacy')}
                            onPress={() => router.push('/legal/privacy')}
                        />
                        <SettingsItem
                            icon="document-outline"
                            label={i18n.t('settings.terms')}
                            onPress={() => router.push('/legal/terms')}
                        />
                        <SettingsItem
                            icon="warning-outline"
                            label={i18n.t('settings.disclaimer')}
                            onPress={() => router.push('/settings/disclaimer')}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>{i18n.t('settings.sections.danger')}</Text>
                        <SettingsItem
                            icon="trash-outline"
                            label={i18n.t('settings.deleteData')}
                            onPress={handleClearData}
                        />
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.versionText}>Versione 1.0.0 (Build 1)</Text>
                        <Text style={styles.footerText}>my Proactive Lab AI</Text>
                    </View>
                </ScrollView>
            </SafeAreaView>

            {/* Modals */}
            <CustomAlert
                visible={clearDataAlertVisible}
                onClose={() => setClearDataAlertVisible(false)}
                title={i18n.t('settings.deleteData')}
                message={i18n.t('settings.deleteDataConfirm')}
                type="warning"
                actions={[
                    { text: i18n.t('settings.cancel'), onPress: () => { }, style: 'cancel' },
                    { text: i18n.t('settings.confirm'), onPress: confirmClearData, style: 'destructive' }
                ]}
            />

            <CustomAlert
                visible={clearChatAlertVisible}
                onClose={() => setClearChatAlertVisible(false)}
                title={i18n.t('settings.clearChat')}
                message={i18n.t('settings.clearChatConfirm')}
                type="warning"
                actions={[
                    { text: i18n.t('settings.cancel'), onPress: () => { }, style: 'cancel' },
                    { text: i18n.t('settings.confirm'), onPress: confirmClearChat, style: 'destructive' }
                ]}
            />

            <CustomAlert
                visible={successAlertVisible}
                onClose={() => setSuccessAlertVisible(false)}
                title={i18n.t('common.success')}
                message={successMessage}
                type="success"
            />

            <InfoModal
                visible={infoModalVisible}
                onClose={() => setInfoModalVisible(false)}
                title="my Proactive Lab AI"
                message={`Version 1.0.0 (Build 1)${'\n\n'}Developed by Proactive Lab.`}
            />
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
