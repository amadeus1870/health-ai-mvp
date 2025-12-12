import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { GlassView } from './GlassView';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import i18n from '../../config/i18n';

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
            // Android: No animation (Direct mounting)
            if (Platform.OS === 'android') {
                scale.value = 1;
                opacity.value = 1;
            } else {
                scale.value = withSpring(1);
                opacity.value = withSpring(1);
            }
        } else {
            scale.value = 0;
            opacity.value = 0;
        }
    }, [visible, scale, opacity]);

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
                <GlassView
                    intensity={20}
                    tint="dark"
                    style={StyleSheet.absoluteFill}
                />
                {Platform.OS === 'android' ? (
                    <View style={styles.androidContainer}>
                        <View style={styles.androidCard}>
                            <View style={styles.contentContainer}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="medical" size={32} color="#FFF" />
                                </View>

                                <Text style={styles.title}>{i18n.t('nutrition.newAnalysis.title')}</Text>
                                <Text style={styles.message}>
                                    {i18n.t('nutrition.newAnalysis.message')}
                                </Text>

                                <View style={styles.buttonContainer}>
                                    <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
                                        <Text style={styles.secondaryButtonText}>{i18n.t('nutrition.newAnalysis.keep')}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.primaryButton} onPress={onConfirm}>
                                        <Text style={styles.primaryButtonText}>{i18n.t('nutrition.newAnalysis.regenerate')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                ) : (
                    <Animated.View style={[styles.card, animatedStyle]}>
                        <GlassView
                            intensity={80}
                            tint="dark"
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.contentContainer}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="medical" size={32} color="#FFF" />
                            </View>

                            <Text style={styles.title}>{i18n.t('nutrition.newAnalysis.title')}</Text>
                            <Text style={styles.message}>
                                {i18n.t('nutrition.newAnalysis.message')}
                            </Text>

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
                                    <Text style={styles.secondaryButtonText}>{i18n.t('nutrition.newAnalysis.keep')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.primaryButton} onPress={onConfirm}>
                                    <Text style={styles.primaryButtonText}>{i18n.t('nutrition.newAnalysis.regenerate')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                )}
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
    androidContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)', // Darker background for visibility
    },
    androidCard: {
        width: width * 0.85,
        backgroundColor: '#1E1E1E', // Solid background
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        overflow: 'hidden',
        elevation: 10,
    },
});
