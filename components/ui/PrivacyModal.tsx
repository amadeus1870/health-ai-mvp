import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { MarkdownText } from './MarkdownText';
import i18n from '../../config/i18n';

interface LegalModalProps {
    visible: boolean;
    onClose: () => void;
    onApprove: () => void;
    type: 'privacy' | 'terms' | 'disclaimer';
}

export const LegalModal: React.FC<LegalModalProps> = ({ visible, onClose, onApprove, type }) => {
    const getContent = () => {
        switch (type) {
            case 'privacy':
                return {
                    title: i18n.t('settings.privacy'),
                    content: i18n.t('legal.privacyPolicy')
                };
            case 'terms':
                return {
                    title: i18n.t('settings.terms'),
                    content: i18n.t('legal.termsOfService')
                };
            case 'disclaimer':
                return {
                    title: i18n.t('settings.disclaimer'),
                    content: i18n.t('disclaimer.fullText')
                };
            default:
                return { title: '', content: '' };
        }
    };

    const { title, content } = getContent();

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <BlurView
                    intensity={60}
                    style={StyleSheet.absoluteFill}
                    tint="dark"
                    experimentalBlurMethod='dimezisBlurView'
                />
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                        <MarkdownText style={{ color: '#FFF' }}>
                            {content}
                        </MarkdownText>
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.approveButton} onPress={onApprove}>
                            <Text style={styles.approveButtonText}>{i18n.t('disclaimer.accept')}</Text>
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
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: 'transparent',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '80%',
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontFamily: Typography.fontFamily.bold,
        color: '#FFF',
        flex: 1, // Allow title to take space
        marginRight: 10, // Add spacing for close button
    },
    closeButton: {
        padding: 4,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    text: {
        fontSize: 16,
        fontFamily: Typography.fontFamily.regular,
        color: 'rgba(255, 255, 255, 0.8)',
        lineHeight: 24,
    },
    footer: {
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    approveButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    approveButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontFamily: Typography.fontFamily.bold,
    },
});
