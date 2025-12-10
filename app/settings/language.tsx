import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { SettingsHeader } from '../../components/ui/SettingsHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import i18n from '../../config/i18n';

const LANGUAGES = [
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

export default function LanguageScreen() {
    const router = useRouter();
    const { language, setLanguage } = useLanguage();
    const insets = useSafeAreaInsets();

    const handleSelect = (langCode: string) => {
        setLanguage(langCode);
        router.back();
    };

    return (
        <ImageBackground
            source={require('../../assets/images/custom_bg.jpg')}
            style={styles.container}
            resizeMode="cover"
        >
            <SettingsHeader title={i18n.t('settings.language')} />
            <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 70 }]}>
                {LANGUAGES.map((lang) => (
                    <TouchableOpacity
                        key={lang.code}
                        style={[
                            styles.option,
                            language === lang.code && styles.selectedOption
                        ]}
                        onPress={() => handleSelect(lang.code)}
                    >
                        <View style={styles.langInfo}>
                            <Text style={styles.flag}>{lang.flag}</Text>
                            <Text style={[
                                styles.langName,
                                language === lang.code && styles.selectedText
                            ]}>
                                {lang.name}
                            </Text>
                        </View>
                        {language === lang.code && (
                            <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                        )}
                    </TouchableOpacity>
                ))}
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
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginBottom: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    selectedOption: {
        backgroundColor: 'rgba(255, 159, 67, 0.1)', // Primary with opacity
        borderColor: Colors.primary,
    },
    langInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    flag: {
        fontSize: 24,
        marginRight: 15,
    },
    langName: {
        fontSize: 16,
        color: '#FFF',
        fontFamily: Typography.fontFamily.medium,
    },
    selectedText: {
        color: Colors.primary,
        fontFamily: Typography.fontFamily.bold,
    },
});
