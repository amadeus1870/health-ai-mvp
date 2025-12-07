import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Dimensions, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');
const MAP_WIDTH = width; // Full width
const MAP_HEIGHT = MAP_WIDTH * 1.5; // Aspect ratio approx

interface BodyMapProps {
    onOrganPress: (organ: string) => void;
    organStatus: Record<string, 'optimal' | 'warning' | 'critical'>;
}

const PulsingDot = ({ status }: { status: 'optimal' | 'warning' | 'critical' | 'neutral' }) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.7);

    React.useEffect(() => {
        scale.value = withRepeat(
            withSequence(withTiming(1.5, { duration: 1000 }), withTiming(1, { duration: 1000 })),
            -1,
            true
        );
        opacity.value = withRepeat(
            withSequence(withTiming(0.3, { duration: 1000 }), withTiming(0.7, { duration: 1000 })),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const getColor = () => {
        switch (status) {
            case 'critical': return Colors.error;
            case 'warning': return Colors.warning;
            case 'optimal': return Colors.success;
            case 'neutral': return '#4facfe';
            default: return '#4facfe';
        }
    };

    return (
        <Animated.View
            style={[
                styles.dot,
                { backgroundColor: getColor() },
                animatedStyle,
            ]}
        />
    );
};

export const ORGAN_ZONES: Record<string, { top: number, left: number, width: number, height: number }> = {
    'Cervello': { top: 6, left: 42, width: 16, height: 10 },
    'Tiroide': { top: 26, left: 45, width: 10, height: 5 },
    'Polmoni': { top: 35, left: 55, width: 15, height: 10 },
    'Cuore': { top: 42, left: 45, width: 15, height: 10 },
    'Fegato': { top: 51, left: 37.5, width: 15, height: 10 },
    'Stomaco': { top: 52, left: 54, width: 15, height: 10 },
    'Pancreas': { top: 60, left: 45, width: 15, height: 8 },
    'Colecisti': { top: 56, left: 32.75, width: 10, height: 8 },
    'Reni': { top: 60, left: 55, width: 15, height: 10 },
    'Intestino': { top: 70, left: 42, width: 16, height: 12 },
    'Colon': { top: 75, left: 60, width: 15, height: 10 },
    'Prostata': { top: 86, left: 45, width: 10, height: 8 },
};

export const getOrganCenter = (organ: string, mapWidth: number, mapHeight: number) => {
    const zone = ORGAN_ZONES[organ];
    if (!zone) return { x: 0, y: 0 };

    const x = (zone.left + zone.width / 2) / 100 * mapWidth;
    const y = (zone.top + zone.height / 2) / 100 * mapHeight;
    return { x, y };
};

export const BodyMap: React.FC<BodyMapProps> = ({ onOrganPress, organStatus }) => {

    const renderZone = (organ: string) => {
        const zone = ORGAN_ZONES[organ];
        if (!zone) return null;

        const status = organStatus[organ];

        return (
            <TouchableOpacity
                key={organ}
                style={[styles.zone, {
                    top: `${zone.top}%`,
                    left: `${zone.left}%`,
                    width: `${zone.width}%`,
                    height: `${zone.height}%`
                }]}
                onPress={() => onOrganPress(organ)}
                activeOpacity={0.6}
            >
                {status && <PulsingDot status={status} />}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { width: MAP_WIDTH, height: MAP_HEIGHT }]}>
            <Image
                source={require('../../assets/images/body_map.png')}
                style={styles.image}
                resizeMode="contain"
            />

            {Object.keys(ORGAN_ZONES).map(organ => renderZone(organ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignSelf: 'center',
        position: 'relative',
        marginVertical: 20,
        top: -10, // Moved up by 10px total
    },
    image: {
        width: '100%',
        height: '100%',
    },
    zone: {
        position: 'absolute',
        // backgroundColor: 'rgba(255, 0, 0, 0.2)', // Debug: visible zones
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50,
    },
    dot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
});
