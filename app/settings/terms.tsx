import React from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import { Typography } from '../../constants/Typography';
import { SettingsHeader } from '../../components/ui/SettingsHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import i18n from '../../config/i18n';
import { Colors } from '../../constants/Colors';

export default function TermsScreen() {
    const insets = useSafeAreaInsets();

    return (
        <ImageBackground
            source={require('../../assets/images/custom_bg.jpg')}
            style={styles.container}
            resizeMode="cover"
        >
            <SettingsHeader title={i18n.t('settings.terms')} />
            <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 20 }]}>
                <Text style={styles.text}>
                    {i18n.t('legal.termsOfService')}
                </Text>
            </ScrollView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    text: {
        color: '#FFF',
        fontSize: 14,
        fontFamily: Typography.fontFamily.regular,
        lineHeight: 22,
    },
});
