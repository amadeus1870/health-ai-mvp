import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import Animated, { useSharedValue, withTiming, Easing, useAnimatedProps } from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import i18n from '../../config/i18n';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface GlobalRiskChartProps {
    risks: any[]; // Array of risk factors
    size?: number;
}

export const GlobalRiskChart: React.FC<GlobalRiskChartProps> = ({ risks = [], size = 200 }) => {
    const progress = useSharedValue(0);
    const strokeWidth = 15;
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;

    // Calculate Average Risk Score
    // Low = 1, Medium = 2, High = 3
    let totalScore = 0;
    let maxScore = risks.length * 3;

    risks.forEach(r => {
        const severity = r.gravita?.toLowerCase();
        if (severity?.includes('alto')) totalScore += 3;
        else if (severity?.includes('medio')) totalScore += 2;
        else totalScore += 1;
    });

    const riskPercentage = maxScore > 0 ? totalScore / maxScore : 0;

    // Determine Color based on percentage
    let color = Colors.success; // Soft Green
    let label = 'low';
    if (riskPercentage > 0.66) { color = '#b61b1b'; label = 'high'; } // Custom Red
    else if (riskPercentage > 0.33) { color = Colors.warning; label = 'medium'; } // Soft Amber

    // useEffect(() => {
    //     progress.value = withTiming(riskPercentage, { duration: 1500, easing: Easing.out(Easing.exp) });
    // }, [riskPercentage]);

    // const animatedProps = useAnimatedProps(() => {
    //     const strokeDashoffset = circumference * (1 - progress.value);
    //     return {
    //         strokeDashoffset,
    //     };
    // });

    // Static calculation
    const strokeDashoffset = circumference * (1 - riskPercentage);

    return (
        <View style={styles.container}>
            <Svg width={size} height={size}>
                {/* Background Track */}
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="#FFFFFF" // White
                    strokeOpacity={0.2}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress Circle (STATIC) */}
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    rotation="-90"
                    origin={`${center}, ${center}`}
                />
            </Svg>
            <View style={styles.textContainer}>
                <Text style={[styles.scoreText, { color: '#FFFFFF' }]}>{Math.round(riskPercentage * 100)}%</Text>
                <Text style={styles.label}>{i18n.t('analysis.charts.globalRisk')}</Text>
                <Text style={[styles.subLabel, { color: '#FFFFFF' }]}>{i18n.t(`analysis.riskLevels.${label.toLowerCase()}`)}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreText: {
        fontSize: 32,
        fontFamily: Typography.fontFamily.bold,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    label: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)', // White with opacity
        fontFamily: Typography.fontFamily.medium,
        marginTop: 4,
        fontWeight: '600',
    },
    subLabel: {
        fontSize: 16,
        fontFamily: Typography.fontFamily.bold,
        marginTop: 2,
    },
});
