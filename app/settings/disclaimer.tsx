import React from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import { Typography } from '../../constants/Typography';
import { SettingsHeader } from '../../components/ui/SettingsHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import i18n from '../../config/i18n';

export default function DisclaimerScreen() {


    return (
        <ImageBackground
            source={require('../../assets/images/custom_bg.jpg')}
            style={styles.container}
            resizeMode="cover"
        >
            <SafeAreaView style={{ flex: 1 }}>
                <SettingsHeader title={i18n.t('settings.disclaimer')} />
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.text}>
                        {i18n.t('disclaimer.fullText')}
                    </Text>
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
    text: {
        color: '#FFF',
        fontSize: 14,
        fontFamily: Typography.fontFamily.regular,
        lineHeight: 22,
    },
});
