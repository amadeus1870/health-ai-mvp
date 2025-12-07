import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView, ImageBackground } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const LANGUAGES = [
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

export default function LanguageScreen() {
    const [selectedLang, setSelectedLang] = useState('it');

    return (
        <ImageBackground
            source={require('../../assets/images/custom_bg.jpg')}
            style={styles.container}
            resizeMode="cover"
        >
            <ScrollView contentContainerStyle={styles.content}>
                {LANGUAGES.map((lang) => (
                    <TouchableOpacity
                        key={lang.code}
                        style={[
                            styles.item,
                            selectedLang === lang.code && styles.selectedItem
                        ]}
                        onPress={() => setSelectedLang(lang.code)}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.flag}>{lang.flag}</Text>
                            <Text style={[
                                styles.name,
                                selectedLang === lang.code && styles.selectedText
                            ]}>{lang.name}</Text>
                        </View>

                        {selectedLang === lang.code && (
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
        paddingTop: 100, // Space for translucent header
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        marginBottom: 12,
        borderRadius: 16,
        // backgroundColor: 'rgba(255,255,255,0.05)', // Removed for uniform style
        // borderWidth: 1, // Removed
        // borderColor: 'rgba(255,255,255,0.1)', // Removed
    },
    selectedItem: {
        backgroundColor: 'rgba(255, 177, 66, 0.1)', // Primary tint
        borderColor: Colors.primary,
    },
    flag: {
        fontSize: 24,
        marginRight: 16,
    },
    name: {
        fontSize: 16,
        color: '#EEE',
        fontFamily: Typography.fontFamily.medium,
    },
    selectedText: {
        color: '#FFF',
        fontFamily: Typography.fontFamily.bold,
    },
});
