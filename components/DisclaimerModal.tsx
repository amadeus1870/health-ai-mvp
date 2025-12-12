import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import { GlassView } from './ui/GlassView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { MarkdownText } from './ui/MarkdownText';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../config/i18n';

const { width, height } = Dimensions.get('window');
const DISCLAIMER_ACCEPTED_KEY = 'disclaimer_accepted_v2';

export const DisclaimerModal = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        checkDisclaimerStatus();
    }, []);

    const checkDisclaimerStatus = async () => {
        try {
            const accepted = await AsyncStorage.getItem(DISCLAIMER_ACCEPTED_KEY);
            if (accepted !== 'true') {
                setVisible(true);
            }
        } catch (error) {
            console.error("Failed to check disclaimer status", error);
        }
    };

    const handleAccept = async () => {
        try {
            await AsyncStorage.setItem(DISCLAIMER_ACCEPTED_KEY, 'true');
            setVisible(false);
        } catch (error) {
            console.error("Failed to save disclaimer status", error);
        }
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={() => { }} // Prevent closing with back button
        >
            <View style={styles.container}>
                <GlassView
                    intensity={80}
                    tint="dark"
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none" // Ensure background doesn't intercept touches
                    disableBlurEffect={Platform.OS === 'android'} // Optimize for Android
                />

                <View style={[styles.card, { backgroundColor: '#1E1E1E', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 }]}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="medical" size={40} color="#FF5252" />
                    </View>

                    <Text style={styles.title}>{i18n.t('disclaimer.title')}</Text>

                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                        <MarkdownText style={{ color: '#FFF' }}>
                            {i18n.t('disclaimer.fullText')}
                        </MarkdownText>
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.button} onPress={handleAccept}>
                            <Text style={styles.buttonText}>{i18n.t('disclaimer.accept')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 20,
    },
    card: {
        width: width * 0.85,
        maxHeight: height * 0.7,
        backgroundColor: '#1E1E1E',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 82, 82, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontFamily: Typography.fontFamily.bold,
        color: '#FFF',
        marginBottom: 16,
        textAlign: 'center',
    },
    scrollView: {
        width: '100%',
        marginBottom: 20,
    },
    scrollContent: {
        paddingVertical: 10,
    },
    text: {
        fontSize: 16,
        fontFamily: Typography.fontFamily.regular,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 16,
        lineHeight: 24,
        textAlign: 'center',
    },
    highlight: {
        fontSize: 16,
        fontFamily: Typography.fontFamily.bold,
        color: '#FF5252',
        marginBottom: 16,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    button: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: Typography.fontFamily.bold,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'transparent',
        width: '100%',
    },
});
