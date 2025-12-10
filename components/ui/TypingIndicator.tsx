import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay, withSequence } from 'react-native-reanimated';


const Dot = ({ delay }: { delay: number }) => {
    const opacity = useSharedValue(0.3);
    const scale = useSharedValue(0.8);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withDelay(delay, withTiming(1, { duration: 500 })),
                withTiming(0.3, { duration: 500 })
            ),
            -1,
            true
        );
        scale.value = withRepeat(
            withSequence(
                withDelay(delay, withTiming(1.2, { duration: 500 })),
                withTiming(0.8, { duration: 500 })
            ),
            -1,
            true
        );
    }, [delay, opacity, scale]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    return <Animated.View style={[styles.dot, animatedStyle]} />;
};

export default function TypingIndicator() {
    return (
        <View style={styles.container}>
            <Dot delay={0} />
            <Dot delay={200} />
            <Dot delay={400} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 20,
        marginLeft: 4,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFF',
        marginHorizontal: 3,
    },
});
