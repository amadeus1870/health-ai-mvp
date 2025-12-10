import React from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../constants/Typography';
import { BlurView } from 'expo-blur';
import { MarkdownText } from '../../components/ui/MarkdownText';
import { SettingsHeader } from '../../components/ui/SettingsHeader';
import i18n from '../../config/i18n';

export default function TermsOfServiceScreen() {
    return (
        <ImageBackground
            source={require('../../assets/images/custom_bg.jpg')}
            style={{ flex: 1 }}
            resizeMode="cover"
        >
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            <SafeAreaView style={styles.container}>
                <SettingsHeader title={i18n.t('settings.terms')} />
                <ScrollView contentContainerStyle={styles.content}>
                    <MarkdownText style={{ color: '#FFF' }}>
                        {i18n.t('legal.termsOfService')}
                    </MarkdownText>
                    <View style={{ height: 50 }} />
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontFamily: Typography.fontFamily.bold,
        color: '#FFF',
        marginBottom: 8,
        marginTop: 60, // Space for header
    },
    date: {
        fontSize: 14,
        fontFamily: Typography.fontFamily.regular,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 30,
    },
    section: { marginBottom: 24 },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Typography.fontFamily.bold,
        color: '#FFB142',
        marginBottom: 8,
    },
    text: {
        fontSize: 16,
        fontFamily: Typography.fontFamily.regular,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 24,
    },
});
