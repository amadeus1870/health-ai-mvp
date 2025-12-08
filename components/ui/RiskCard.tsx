import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { SoftCard } from './SoftCard';
import { Ionicons } from '@expo/vector-icons';
import { MarkdownText } from './MarkdownText';

import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';

interface RiskFactor {
    identificazione: string;
    gravita: 'Basso' | 'Medio' | 'Alto';
    probabilita: string;
    spiegazione: string;
}

interface RiskCardProps {
    risk: RiskFactor;
}

const RiskGauge = ({ severity }: { severity: string }) => {
    const size = 60;
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    const circumference = Math.PI * radius; // Semi-circle

    let percentage = 0;
    let color = Colors.success;

    const cleanSeverity = severity?.toLowerCase().replace(/[*_]/g, '').trim();

    if (cleanSeverity?.includes('alto')) {
        percentage = 0.85; color = Colors.error;
    } else if (cleanSeverity?.includes('medio')) {
        percentage = 0.5; color = Colors.warning;
    } else if (cleanSeverity?.includes('basso')) {
        percentage = 0.2; color = Colors.success;
    } else {
        percentage = 0.1; color = Colors.textSecondary;
    }

    const strokeDashoffset = circumference * (1 - percentage);

    // Path for background arc (semi-circle)
    const bgPath = `M ${strokeWidth / 2},${center} A ${radius},${radius} 0 0,1 ${size - strokeWidth / 2},${center}`;

    // Path for progress arc
    // We need to calculate end point for dynamic arc or use strokeDasharray
    // Simple way for semi-circle gauge:
    // Rotate -180 deg to start from left? No, SVG coords.
    // Let's use strokeDasharray.

    return (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size / 2 + 10}>
                {/* Background Track */}
                <Path
                    d={`M ${strokeWidth},${center} A ${radius},${radius} 0 0,1 ${size - strokeWidth},${center}`}
                    stroke="#E1E8ED"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                />
                {/* Progress */}
                <Path
                    d={`M ${strokeWidth},${center} A ${radius},${radius} 0 0,1 ${size - strokeWidth},${center}`}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                />
            </Svg>
            <Text style={{ fontSize: 10, fontFamily: Typography.fontFamily.bold, color, marginTop: -5 }}>
                {severity?.toUpperCase()}
            </Text>
        </View>
    );
};

export const RiskCard: React.FC<RiskCardProps & { textColor?: string }> = ({ risk, textColor }) => {
    const getSeverityColor = (severity: string) => {
        const cleanSeverity = severity?.toLowerCase().replace(/[*_]/g, '').trim();
        if (cleanSeverity?.includes('alto')) return Colors.error;
        if (cleanSeverity?.includes('medio') && !cleanSeverity?.includes('basso')) return Colors.warning; // Medio pure
        if (cleanSeverity?.includes('medio') && cleanSeverity?.includes('basso')) return Colors.warning; // Medio-basso
        if (cleanSeverity?.includes('basso')) return Colors.success;
        return Colors.textSecondary;
    };

    const titleColor = textColor || Colors.text;
    const bodyColor = textColor ? textColor : Colors.text;
    const secondaryColor = textColor ? 'rgba(255,255,255,0.7)' : Colors.textSecondary;

    const severityColor = getSeverityColor(risk.gravita);

    const containerStyle = textColor ? {
        backgroundColor: severityColor + '33',
        borderWidth: 1,
        borderColor: severityColor,
    } : {
        backgroundColor: severityColor + '15',
    };

    return (
        <SoftCard style={[styles.container, containerStyle] as any}>
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <View style={[styles.badge, { backgroundColor: getSeverityColor(risk.gravita), alignSelf: 'flex-start', marginBottom: 6 }]}>
                        <Text style={[styles.badgeText, { color: '#FFF' }]}>
                            RISCHIO
                        </Text>
                    </View>
                    <View style={styles.titleRow}>
                        <Ionicons name="alert-circle-outline" size={24} color={getSeverityColor(risk.gravita)} />
                        <Text style={[styles.title, { color: titleColor }]}>{risk.identificazione}</Text>
                    </View>
                </View>
                <RiskGauge severity={risk.gravita} />
            </View>

            <Text style={[styles.probability, { color: secondaryColor }]}>Probabilità Rischio: {risk.probabilita}</Text>
            <MarkdownText style={[styles.explanation, { color: bodyColor }]}>{risk.spiegazione}</MarkdownText>
        </SoftCard>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: 12 },
    header: { marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    titleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    title: { fontSize: 16, color: Colors.text, marginLeft: 8, fontFamily: Typography.fontFamily.bold, flex: 1 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 10, fontFamily: Typography.fontFamily.bold },
    probability: { fontSize: 12, color: Colors.textSecondary, marginBottom: 8, fontFamily: Typography.fontFamily.semiBold },
    explanation: { fontSize: 14, color: Colors.text, lineHeight: 22, fontFamily: Typography.fontFamily.regular },
});
