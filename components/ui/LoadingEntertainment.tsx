import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const TIPS = [
    { icon: "water-outline", title: "Idratazione", text: "Bere acqua prima dei pasti può aiutarti a sentirti sazio più velocemente." },
    { icon: "walk-outline", title: "Movimento", text: "Una passeggiata di 10 minuti dopo mangiato aiuta a regolare la glicemia." },
    { icon: "moon-outline", title: "Sonno", text: "Dormire 7-8 ore a notte è fondamentale per il recupero muscolare e mentale." },
    { icon: "nutrition-outline", title: "Fibre", text: "Le fibre aiutano la digestione e mantengono stabile il livello di energia." },
    { icon: "happy-outline", title: "Stress", text: "Lo stress cronico può influenzare negativamente il metabolismo." },
    { icon: "restaurant-outline", title: "Masticazione", text: "Masticare lentamente migliora la digestione e l'assorbimento dei nutrienti." },
];

import { SoftCard } from './SoftCard';

export const LoadingEntertainment = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % TIPS.length);
        }, 4000); // Change every 4 seconds

        return () => clearInterval(interval);
    }, []);

    const currentTip = TIPS[currentIndex];

    return (
        <View style={styles.container}>
            <SoftCard style={styles.card}>
                <BlurView intensity={60} tint="dark" style={styles.blurContainer} experimentalBlurMethod='dimezisBlurView'>
                    <Animated.View
                        key={currentIndex}
                        entering={FadeIn.duration(500)}
                        exiting={FadeOut.duration(500)}
                        style={styles.content}
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons name={currentTip.icon as any} size={32} color="#FFF" />
                        </View>
                        <Text style={styles.title}>Lo sapevi che?</Text>
                        <Text style={styles.tipTitle}>{currentTip.title}</Text>
                        <Text style={styles.text}>{currentTip.text}</Text>
                    </Animated.View>

                    <View style={styles.dotsContainer}>
                        {TIPS.map((_, index) => (
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
                        <Text style={styles.loadingText}>Stiamo preparando il tuo piano...</Text>
                    </View>
                </BlurView>
            </SoftCard>
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
    blurContainer: {
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
