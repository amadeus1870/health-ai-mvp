import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';

import { Typography } from '../../constants/Typography';



interface VitalScoreChartProps {
    score: number;
    size?: number;
}

export const VitalScoreChart: React.FC<VitalScoreChartProps> = ({ score, size = 200 }) => {
    // const animatedScore = useSharedValue(0);
    const radius = size / 2;
    const strokeWidth = 3;
    const numSegments = 60; // Number of ticks
    const segmentLength = 15;

    // useEffect(() => {
    //     animatedScore.value = withTiming(score, {
    //         duration: 1500,
    //         easing: Easing.out(Easing.exp),
    //     });
    // }, [score, animatedScore]);

    const getSegmentColor = (index: number) => {
        const ratio = index / numSegments;

        // Vibrant Colors
        if (ratio < 0.33) return '#FF453A'; // Vibrant Red
        if (ratio < 0.66) return '#FFD60A'; // Vibrant Yellow
        return '#32D74B'; // Vibrant Green
    };

    const segments = Array.from({ length: numSegments }).map((_, i) => {
        const angle = (i / numSegments) * 360;
        const radian = (angle - 90) * (Math.PI / 180); // -90 to start at top

        const x1 = radius + (radius - 10) * Math.cos(radian);
        const y1 = radius + (radius - 10) * Math.sin(radian);
        const x2 = radius + (radius - 10 - segmentLength) * Math.cos(radian);
        const y2 = radius + (radius - 10 - segmentLength) * Math.sin(radian);

        const isActive = i < (score / 100) * numSegments;
        const color = isActive ? getSegmentColor(i) : 'rgba(255, 255, 255, 0.3)'; // White inactive with opacity
        const opacity = isActive ? 1 : 1; // Opacity handled in color string for inactive

        return (
            <Line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity={opacity}
            />
        );
    });

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size}>
                {segments}
            </Svg>
            <View style={styles.textContainer}>
                <Text style={styles.scoreText}>{Math.round(score)}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 5,
        alignSelf: 'center',
    },
    textContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreText: {
        fontSize: 48,
        color: '#FFFFFF', // White text
        fontFamily: Typography.fontFamily.bold,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
});
