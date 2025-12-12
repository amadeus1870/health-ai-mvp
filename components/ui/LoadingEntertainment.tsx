import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { GlassView } from './GlassView';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const TIPS_KEYS = ['hydration', 'movement', 'sleep', 'fiber', 'stress', 'chewing'];

import { SoftCard } from './SoftCard';

import i18n from '../../config/i18n';

interface LoadingEntertainmentProps {
    message?: string;
}

const getIcon = (key: string) => {
    switch (key) {
        case 'hydration': return 'water-outline';
        case 'movement': return 'walk-outline';
        case 'sleep': return 'moon-outline';
        case 'fiber': return 'nutrition-outline';
        case 'stress': return 'happy-outline';
        case 'chewing': return 'restaurant-outline';
        default: return 'information-circle-outline';
    }
};

export const LoadingEntertainment: React.FC<LoadingEntertainmentProps> = ({ message }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % TIPS_KEYS.length);
        }, 4000); // Change every 4 seconds

        return () => clearInterval(interval);
    }, []);

    const currentKey = TIPS_KEYS[currentIndex];

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <GlassView
                    intensity={60}
                    tint="dark"
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.contentContainer}>
                    <Animated.View
                        key={currentIndex}
                        entering={FadeIn.duration(500)}
                        exiting={FadeOut.duration(500)}
                        style={styles.content}
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons name={getIcon(currentKey) as any} size={32} color="#FFF" />
                        </View>
                        <Text style={styles.title}>{i18n.t('loading.didYouKnow')}</Text>
                        <Text style={styles.tipTitle}>{i18n.t(`loading.tips.${currentKey}.title`)}</Text>
                        <Text style={styles.text}>{i18n.t(`loading.tips.${currentKey}.text`)}</Text>
                    </Animated.View>

                    <View style={styles.dotsContainer}>
                        {TIPS_KEYS.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    { backgroundColor: index === currentIndex ? Colors.primary : 'rgba(255,255,255,0.2)' }
                                ]}
                            />
                        ))}
                    </View>

                    <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 8 }} />
                        <Text style={styles.loadingText}>{message || i18n.t('loading.preparing')}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: width - 40,
        alignSelf: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    card: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        backgroundColor: 'transparent',
    },
    contentContainer: {
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 240,
    },
    content: {
        alignItems: 'center',
        width: '100%',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primary, // Orange
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
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        fontFamily: Typography.fontFamily.medium,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    tipTitle: {
        fontSize: 20,
        color: '#FFF',
        fontFamily: Typography.fontFamily.bold,
        marginBottom: 8,
        textAlign: 'center',
    },
    text: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        fontFamily: Typography.fontFamily.regular,
        textAlign: 'center',
        lineHeight: 24,
    },
    dotsContainer: {
        flexDirection: 'row',
        marginTop: 24,
        marginBottom: 16,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginHorizontal: 4,
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        fontFamily: Typography.fontFamily.regular,
    }
});
