import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay, withSequence } from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

const { width } = Dimensions.get('window');

interface SuccessModalProps {
    visible: boolean;
    onClose: () => void;
    message?: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ visible, onClose, message = "Profilo salvato correttamente!" }) => {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            scale.value = withSequence(
                withSpring(1.2),
                withSpring(1)
            );
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


                <Animated.View style={[styles.card, animatedStyle]}>
                    <BlurView
                        intensity={60}
                        tint="dark"
                        style={StyleSheet.absoluteFill}
                        experimentalBlurMethod='dimezisBlurView'
                    />
                    <View style={styles.contentContainer}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="checkmark" size={50} color="#FFF" />
                        </View>

                        <Text style={styles.title}>Successo!</Text>
                        <Text style={styles.message}>{message}</Text>

                        <TouchableOpacity style={styles.button} onPress={onClose}>
                            <Text style={styles.buttonText}>Ottimo</Text>
                        </TouchableOpacity>
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
        backgroundColor: 'transparent', // Removed overlay color
    },
    card: {
        width: width * 0.8,
        backgroundColor: 'transparent', // Transparent for BlurView
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    contentContainer: {
        padding: 30,
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFB142', // Orange
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#FFB142',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 5,
    },
    title: {
        fontSize: 24,
        color: '#FFFFFF', // White
        marginBottom: 10,
        fontFamily: Typography.fontFamily.bold,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    message: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)', // White transparent
        textAlign: 'center',
        marginBottom: 24,
        fontFamily: Typography.fontFamily.regular,
        lineHeight: 22,
    },
    button: {
        backgroundColor: '#FFB142', // Orange
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 16,
        shadowColor: '#FFB142',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
        fontFamily: Typography.fontFamily.semiBold,
    },
});
