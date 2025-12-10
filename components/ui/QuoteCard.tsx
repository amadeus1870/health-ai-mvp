import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Colors } from '../../constants/Colors';
import { SoftCard } from './SoftCard';

import i18n from '../../config/i18n';

export const QuoteCard = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % 10); // 10 quotes
        }, 15000); // 15 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View
                key={index}
                entering={FadeIn.duration(1000)}
                exiting={FadeOut.duration(1000)}
                layout={LinearTransition}
                style={{ width: '100%', alignItems: 'center' }}
            >
                <SoftCard style={styles.card}>
                    <BlurView
                        intensity={60}
                        tint="dark"
                        style={StyleSheet.absoluteFill}
                        experimentalBlurMethod='dimezisBlurView'
                    />
                    <View style={styles.cardContent}>
                        <Text style={styles.quoteMark}>“</Text>
                        <Text style={styles.quote}>{i18n.t(`loading.quotes.${index}`)}</Text>
                        <Text style={styles.quoteMark}>”</Text>
                    </View>
                </SoftCard>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        // marginHorizontal: 20, // Removed
        zIndex: 10,
        width: '100%',
    },
    card: {
        padding: 0,
        backgroundColor: 'transparent', // Transparent for BlurView
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        width: '90%', // Simplified width
        // maxWidth: '90%', // Removed
        height: 240, // Increased height for decorative quotes
        elevation: 8, // Android shadow
        shadowColor: '#000', // iOS Shadow
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    cardContent: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    quoteMark: {
        fontSize: 40,
        color: '#FFB142', // Orange
        fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
        lineHeight: 40,
        opacity: 0.8,
    },
    quote: {
        fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
        fontStyle: 'italic',
        fontSize: 22,
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 32,
        marginVertical: 10,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
});
