import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

interface NewAnalysisModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const NewAnalysisModal: React.FC<NewAnalysisModalProps> = ({ visible, onClose, onConfirm }) => {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            scale.value = withSpring(1);
            opacity.value = withSpring(1);
        } else {
            scale.value = 0;
            opacity.value = 0;
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            opacity: opacity.value,
        };
    });

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <BlurView
                    intensity={20}
                    tint="dark"
                    style={StyleSheet.absoluteFill}
                />
                <Animated.View style={[styles.card, animatedStyle]}>
                    <BlurView
                        intensity={80}
                        tint="dark"
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.contentContainer}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="medical" size={32} color="#FFF" />
                        </View>

                        <Text style={styles.title}>Nuova Analisi Rilevata</Text>
                        <Text style={styles.message}>
                            I tuoi dati clinici sono cambiati. I calcoli calorici sono stati aggiornati automaticamente.
                            {'\n\n'}
                            Vuoi rigenerare anche il piano pasti settimanale per adattarlo ai nuovi risultati?
                        </Text>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
                                <Text style={styles.secondaryButtonText}>No, mantieni</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.primaryButton} onPress={onConfirm}>
                                <Text style={styles.primaryButtonText}>Sì, rigenera</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    card: {
        width: width * 0.85,
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    contentContainer: {
        padding: 24,
        alignItems: 'center',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 5,
    },
    title: {
        fontSize: 20,
        color: '#FFFFFF',
        marginBottom: 12,
        fontFamily: Typography.fontFamily.bold,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginBottom: 24,
        fontFamily: Typography.fontFamily.regular,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        gap: 12,
    },
    secondaryButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    secondaryButtonText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 15,
        fontFamily: Typography.fontFamily.semiBold,
    },
    primaryButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontFamily: Typography.fontFamily.bold,
    },
});
