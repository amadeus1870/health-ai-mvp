import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withDelay,
    withRepeat,
    withTiming,
    Easing,
    withSequence,
    withSpring,
    SharedValue
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Particle types and their configurations - EVEN LARGER SIZES
const PARTICLES = [
    { icon: 'document-text', color: '#FFF', size: 96 }, // Doubled from ~48
    { icon: 'flask', color: '#4A90E2', size: 44 },
    { icon: 'water', color: '#FF4B4B', size: 40 },
    { icon: 'document-text', color: '#FFF', size: 84 }, // Doubled from ~42
    { icon: 'flask', color: '#357ABD', size: 50 },
    { icon: 'water', color: '#E03131', size: 46 },
    { icon: 'document-text', color: '#FFF', size: 88 }, // Doubled from ~44
    { icon: 'flask', color: '#4A90E2', size: 40 },
    { icon: 'water', color: '#FF4B4B', size: 52 },
    { icon: 'document-text', color: '#FFF', size: 92 }, // Doubled from ~46
];

const Particle = ({ index, config, touchX, isTouching }: { index: number, config: any, touchX: SharedValue<number>, isTouching: SharedValue<boolean> }) => {
    const startX = Math.random() * width;
    const duration = 5000 + Math.random() * 3000; // Slower: 5-8 seconds
    const delay = Math.random() * 4000;

    const translateY = useSharedValue(-100);
    const opacity = useSharedValue(0);
    const rotate = useSharedValue(0);

    useEffect(() => {
        translateY.value = withDelay(
            delay,
            withRepeat(
                withTiming(height + 100, { duration, easing: Easing.linear }),
                -1,
                false
            )
        );

        opacity.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(0.9, { duration: 200 }),
                    withDelay(duration - 400, withTiming(0, { duration: 200 }))
                ),
                -1,
                false
            )
        );

        rotate.value = withDelay(
            delay,
            withRepeat(
                withTiming(360, { duration: duration * 1.5, easing: Easing.linear }),
                -1,
                false
            )
        );
    }, [delay, duration, opacity, rotate, translateY]);

    const animatedStyle = useAnimatedStyle(() => {
        // Stronger attraction logic
        // If touching, target is touchX. If not, target is startX.
        // We interpolate to make it smooth but responsive.



        // Only attract if within a certain range? No, user wants global attraction.
        // Let's make it follow the finger with some "lag" based on particle index/randomness
        // to keep the cascade effect.

        const attraction = isTouching.value
            ? (touchX.value - startX) * 0.9 // Move 90% towards finger
            : 0;

        return {
            transform: [
                { translateY: translateY.value },
                { translateX: withSpring(startX + attraction, { damping: 15, stiffness: 100 }) },
                { rotate: `${rotate.value}deg` }
            ],
            opacity: opacity.value,
        };
    });

    return (
        <Animated.View style={[styles.particle, animatedStyle]}>
            <Ionicons name={config.icon as any} size={config.size} color={config.color} />
        </Animated.View>
    );
};

export const FallingParticles = ({ isActive, touchX, isTouching }: { isActive: boolean, touchX: SharedValue<number>, isTouching: SharedValue<boolean> }) => {
    if (!isActive) return null;

    // Generate a set of particles
    const particles = Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        config: PARTICLES[i % PARTICLES.length]
    }));

    return (
        <View style={styles.container} pointerEvents="none">
            {particles.map((p) => (
                <Particle key={p.id} index={p.id} config={p.config} touchX={touchX} isTouching={isTouching} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        // zIndex removed to ensure visibility (renders in order)
        overflow: 'hidden',
    },
    particle: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
});
