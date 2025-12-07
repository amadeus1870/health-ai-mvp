import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Polygon, Line, Text as SvgText, Circle, G } from 'react-native-svg';
import Animated, { useSharedValue, withTiming, useAnimatedProps, Easing } from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

interface RadarDataPoint {
    label: string;
    value: number; // Current value
    fullMark: number; // Max value for the axis (e.g., 300 for Total Cholesterol)
    target: number; // Target value (e.g., 200)
    isOk?: boolean; // New prop for status
}

interface RadarChartProps {
    data: RadarDataPoint[];
    size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({ data, size = 300 }) => {
    const radius = (size / 2) - 40; // Padding for labels
    const center = size / 2;
    const angleSlice = (Math.PI * 2) / data.length;

    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withTiming(1, { duration: 1500, easing: Easing.out(Easing.exp) });
    }, []);

    // Helper to calculate coordinates
    const getCoordinates = (value: number, index: number, max: number) => {
        const angle = index * angleSlice - Math.PI / 2; // Start from top
        const r = (value / max) * radius;
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle),
        };
    };

    // Background Grid (Concentric Polygons)
    const gridLevels = 4;
    const grid = Array.from({ length: gridLevels }).map((_, level) => {
        const factor = (level + 1) / gridLevels;
        const points = data.map((_, i) => {
            const { x, y } = getCoordinates(1, i, 1); // Normalized max radius
            // Scale by factor relative to center
            const r = radius * factor;
            const angle = i * angleSlice - Math.PI / 2;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
        }).join(' ');

        return (
            <Polygon
                key={`grid-${level}`}
                points={points}
                stroke="#FFFFFF" // White grid lines
                strokeWidth="1"
                fill="none"
                strokeOpacity={0.3}
            />
        );
    });

    // Axes Lines
    const axes = data.map((item, i) => {
        const { x, y } = getCoordinates(1, i, 1); // End of axis
        // Calculate label position with some padding
        const labelR = radius + 25;
        const angle = i * angleSlice - Math.PI / 2;
        const labelX = center + labelR * Math.cos(angle);
        const labelY = center + labelR * Math.sin(angle);

        return (
            <G key={`axis-${i}`}>
                <Line
                    x1={center}
                    y1={center}
                    x2={center + radius * Math.cos(angle)}
                    y2={center + radius * Math.sin(angle)}
                    stroke="#FFFFFF" // White axis lines
                    strokeWidth="1"
                    strokeOpacity={0.3}
                />
                <SvgText
                    x={labelX}
                    y={labelY}
                    fill="#FFFFFF" // White text
                    fontSize="11"
                    fontWeight="600"
                    fontFamily={Typography.fontFamily.medium}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                >
                    {item.label}
                </SvgText>
            </G>
        );
    });

    // Safe Zone (Target Area)
    const safeZonePoints = data.map((item, i) => {
        // Normalize target relative to fullMark
        // If target is a "max limit" (e.g. < 200), we plot it.
        // If it's a "min limit" (e.g. > 40 HDL), we might need to invert logic or just plot it.
        // For simplicity, we plot the target value on the axis.
        const normalizedValue = Math.min(item.target, item.fullMark);
        const { x, y } = getCoordinates(normalizedValue, i, item.fullMark);
        return `${x},${y}`;
    }).join(' ');

    // User Data Polygon
    const userPoints = data.map((item, i) => {
        const normalizedValue = Math.min(item.value, item.fullMark);
        const { x, y } = getCoordinates(normalizedValue, i, item.fullMark);
        return `${x},${y}`;
    }).join(' ');

    const animatedProps = useAnimatedProps(() => {
        // We can animate the points if we want complex interpolation, 
        // but for now let's animate opacity or scale of the whole shape
        return {
            opacity: progress.value,
            transform: [{ scale: progress.value }] // This scales from top-left, need center transform
        };
    });

    return (
        <View style={styles.container}>
            <Svg width={size} height={size}>
                {/* Grid */}
                {grid}

                {/* Axes & Labels */}
                {axes}

                {/* Safe Zone Area - GREEN */}
                <Polygon
                    points={safeZonePoints}
                    fill="#32D74B" // Vibrant Green
                    fillOpacity={0.2} // Increased opacity for visibility
                    stroke="#32D74B"
                    strokeWidth="1"
                    strokeDasharray="4, 4"
                />

                {/* User Data Area */}
                <Polygon
                    points={userPoints}
                    fill={Colors.primary}
                    fillOpacity={0.2}
                    stroke={Colors.primary}
                    strokeWidth="2"
                />

                {/* Data Points */}
                {data.map((item, i) => {
                    const normalizedValue = Math.min(item.value, item.fullMark);
                    const { x, y } = getCoordinates(normalizedValue, i, item.fullMark);
                    const pointColor = item.isOk ? '#32D74B' : '#FF453A'; // Vibrant Green / Red

                    return (
                        <Circle
                            key={`point-${i}`}
                            cx={x}
                            cy={y}
                            r="5"
                            fill={pointColor}
                            stroke="#FFF"
                            strokeWidth="1.5"
                        />
                    );
                })}
            </Svg>
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: '#32D74B' }]} />
                    <Text style={styles.legendText}>Zona Ideale / Valori OK</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: '#FF453A' }]} />
                    <Text style={styles.legendText}>Fuori Range</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    legend: {
        flexDirection: 'row',
        marginTop: 10,
        gap: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 12,
        color: '#FFFFFF', // White
        fontFamily: Typography.fontFamily.medium,
        fontWeight: '600',
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});
