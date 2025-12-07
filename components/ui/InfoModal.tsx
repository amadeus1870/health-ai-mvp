import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Typography } from '../../constants/Typography';

const { width } = Dimensions.get('window');

interface InfoModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    message: string;
}

export const InfoModal: React.FC<InfoModalProps> = ({ visible, onClose, title, message }) => {
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
                            <Ionicons name="information" size={40} color="#FFF" />
                        </View>

                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>

                        <TouchableOpacity style={styles.button} onPress={onClose}>
                            <Text style={styles.buttonText}>Ho capito</Text>
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
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    card: {
        width: width * 0.85,
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
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#3498db', // Blue for info
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#3498db',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 5,
    },
    title: {
        fontSize: 22,
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
        lineHeight: 24,
    },
    button: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: Typography.fontFamily.semiBold,
    },
});
