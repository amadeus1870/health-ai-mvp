import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

const { width } = Dimensions.get('window');

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface CustomAlertProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: AlertType;
    actions?: { text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }[];
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
    visible,
    onClose,
    title,
    message,
    type = 'info',
    actions
}) => {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            scale.value = withSequence(
                withSpring(1.1),
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

    const getConfig = (type: AlertType) => {
        switch (type) {
            case 'success': return { icon: 'checkmark', color: Colors.success };
            case 'error': return { icon: 'close', color: Colors.error };
            case 'warning': return { icon: 'alert', color: Colors.primary };
            case 'info': default: return { icon: 'information', color: '#FFB142' }; // Orange
        }
    };

    const config = getConfig(type);

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <BlurView
                    intensity={60}
                    style={StyleSheet.absoluteFill}
                    tint="dark"
                   
                />

                <Animated.View style={[styles.card, animatedStyle]}>
                    <BlurView
                        intensity={60}
                        tint="dark"
                        style={StyleSheet.absoluteFill}
                       
                    />
                    <View style={styles.contentContainer}>
                        <View style={[styles.iconContainer, { backgroundColor: config.color, shadowColor: config.color }]}>
                            <Ionicons name={config.icon as any} size={40} color="#FFF" />
                        </View>

                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>

                        {actions ? (
                            <View style={styles.actionsContainer}>
                                {actions.map((action, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.button,
                                            action.style === 'cancel' ? styles.cancelButton : { backgroundColor: config.color, shadowColor: config.color },
                                            actions.length > 1 && { width: '100%', marginBottom: index < actions.length - 1 ? 12 : 0 }
                                        ]}
                                        onPress={() => {
                                            action.onPress();
                                            onClose();
                                        }}
                                    >
                                        <Text style={[
                                            styles.buttonText,
                                            action.style === 'cancel' && styles.cancelButtonText
                                        ]}>{action.text}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: config.color, shadowColor: config.color }]}
                                onPress={onClose}
                            >
                                <Text style={styles.buttonText}>OK</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>
            </View >
        </Modal >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)', // Darker overlay
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
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 5,
    },
    title: {
        fontSize: 22,
        color: '#FFFFFF', // White
        marginBottom: 10,
        fontFamily: Typography.fontFamily.bold,
        textAlign: 'center',
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
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 16,
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
    actionsContainer: {
        flexDirection: 'column',
        width: '100%',
    },
    cancelButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Glass button
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        shadowColor: '#000',
        shadowOpacity: 0.1,
    },
    cancelButtonText: {
        color: '#FFFFFF',
    }
});
