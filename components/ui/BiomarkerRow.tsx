
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { MarkdownText } from './MarkdownText';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

interface BiomarkerRowProps {
    name: string;
    value: string;
    unit: string;
    status: 'optimal' | 'warning' | 'critical';
    target?: string;
    meaning?: string;
    cause?: string;
    remedy?: string;
}

export const BiomarkerRow: React.FC<BiomarkerRowProps & { textColor?: string }> = ({ name, value, unit, status, target, meaning, cause, remedy, textColor }) => {
    const [expanded, setExpanded] = useState(false);

    const getStatusColor = () => {
        // 1. Try mathematical evaluation if value and target are present
        if (value && target) {
            try {
                // Extract numeric value
                const valMatch = value.match(/[\d.,]+/);
                if (valMatch) {
                    const val = parseFloat(valMatch[0].replace(',', '.'));

                    // Parse Target
                    // Case 1: Range "10 - 20" or "10-20"
                    if (target.includes('-')) {
                        const parts = target.split('-').map(p => parseFloat(p.replace(/[^0-9.,]/g, '').replace(',', '.')));
                        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                            const min = parts[0];
                            const max = parts[1];

                            if (val >= min && val <= max) return Colors.success; // Inside range

                            // Borderline logic (within 10% of range width or absolute value?)
                            // Let's use 10% of the limit value as a "warning zone"
                            const toleranceMin = min * 0.1;
                            const toleranceMax = max * 0.1;

                            if ((val >= min - toleranceMin && val < min) || (val > max && val <= max + toleranceMax)) {
                                return Colors.warning;
                            }
                            return Colors.error;
                        }
                    }

                    // Case 2: Max Limit "< 100"
                    if (target.includes('<')) {
                        const max = parseFloat(target.replace(/[^0-9.,]/g, '').replace(',', '.'));
                        if (!isNaN(max)) {
                            if (val < max) return Colors.success;
                            if (val <= max * 1.1) return Colors.warning; // +10% tolerance
                            return Colors.error;
                        }
                    }

                    // Case 3: Min Limit "> 50"
                    if (target.includes('>')) {
                        const min = parseFloat(target.replace(/[^0-9.,]/g, '').replace(',', '.'));
                        if (!isNaN(min)) {
                            if (val > min) return Colors.success;
                            if (val >= min * 0.9) return Colors.warning; // -10% tolerance
                            return Colors.error;
                        }
                    }
                }
            } catch (e) {
                // Fallback to text analysis if parsing fails
            }
        }

        // 2. Fallback to Text Analysis (Existing Logic)
        const s = status?.toLowerCase().trim() || '';

        // Critical / High Risk
        // 'alt' covers: alto, alta, alti, alte, alterato, altamente
        // 'elevat' covers: elevato, elevata
        // 'carent' covers: carente, carenza
        // 'insufficien' covers: insufficiente, insufficienza
        // 'eccessiv' covers: eccessivo, eccessiva
        if (s.includes('critic') || s.includes('alt') || s.includes('high') || s.includes('élevé') || s.includes('hoch') || s.includes('fuori') || s.includes('out') || s.includes('bad') || s.includes('alert') || s.includes('elevat') || s.includes('eccessiv') || s.includes('carent') || s.includes('insufficien') || s.includes('scars') || s.includes('grav') || s.includes('seri')) return Colors.error;

        // Warning / Medium Risk
        // 'medi' covers: medio, media, medium
        // 'moderat' covers: moderato, moderata
        // 'liev' covers: lieve
        // 'limit' covers: limite, limitato
        if (s.includes('warn') || s.includes('attenz') || s.includes('medi') || s.includes('moyen') || s.includes('mittel') || s.includes('moderat') || s.includes('liev') || s.includes('limit') || s.includes('borderline')) return Colors.warning;

        // Optimal / Low Risk
        // 'bass' covers: basso, bassa (Note: sometimes low is bad, but usually optimal in risk context. If AI puts 'basso' in status, we assume it means 'Low Risk' or 'Normal Low')
        // 'norm' covers: normal, normale, norma
        // 'ottim' covers: ottimale, ottimi
        // 'regolar' covers: regolare
        // 'negativ' covers: negativo (usually good for tests)
        if (s.includes('optim') || s.includes('ottim') || s.includes('ok') || s.includes('norm') || s.includes('bass') || s.includes('low') || s.includes('faible') || s.includes('niedrig') || s.includes('buon') || s.includes('eccellent') || s.includes('perfett') || s.includes('regolar') || s.includes('negativ')) return Colors.success;

        return Colors.textSecondary;
    };

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    const isOptimal = getStatusColor() === Colors.success;
    const mainTextColor = textColor || Colors.text;
    const secondaryTextColor = textColor ? 'rgba(255,255,255,0.7)' : Colors.textSecondary;

    const statusColor = getStatusColor();
    const containerStyle = textColor ? {
        backgroundColor: statusColor + '33', // Transparent colored background
        borderWidth: 1,
        borderColor: statusColor,
    } : {
        backgroundColor: statusColor + '33'
    };

    return (
        <TouchableOpacity
            onPress={toggleExpand}
            activeOpacity={0.7}
            style={[
                styles.container,
                containerStyle
            ]}
        >
            <View style={styles.header}>
                <View style={styles.mainContent}>
                    {/* Top Row: Indicator + Name */}
                    <View style={styles.topRow}>
                        <View style={[styles.indicator, { backgroundColor: getStatusColor() }]} />
                        <Text style={[styles.name, { color: mainTextColor }]}>{name}</Text>
                    </View>

                    {/* Bottom Row: Value + Unit */}
                    <View style={styles.bottomRow}>
                        <View style={styles.valueContainer}>
                            <Text style={[styles.value, { color: mainTextColor }]}>{value}</Text>
                            <Text style={[styles.unit, { color: secondaryTextColor }]}>{unit}</Text>
                        </View>
                    </View>

                    {/* Target Row */}
                    {target && (
                        <View style={styles.targetRow}>
                            <Text style={[styles.targetLabel, { color: secondaryTextColor }]}>Target:</Text>
                            <Text style={[styles.targetValue, { color: mainTextColor }]}>{target}</Text>
                        </View>
                    )}
                </View>

                <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={secondaryTextColor} />
            </View>

            {expanded && (
                <View style={[styles.detailsContainer, textColor ? { backgroundColor: 'rgba(255,255,255,0.05)' } : {}]}>
                    {/* Meaning - Always show */}
                    {meaning && (
                        <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: secondaryTextColor }]}>Significato:</Text>
                            <MarkdownText style={[styles.detailValue, { color: mainTextColor }]}>{meaning}</MarkdownText>
                        </View>
                    )}

                    {/* Cause & Remedy - Show only if NOT optimal */}
                    {!isOptimal && (
                        <>
                            {cause && (
                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: secondaryTextColor }]}>Possibili Cause:</Text>
                                    <MarkdownText style={[styles.detailValue, { color: mainTextColor }]}>{cause}</MarkdownText>
                                </View>
                            )}
                            {remedy && (
                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: secondaryTextColor }]}>Rimedi Consigliati:</Text>
                                    <MarkdownText style={[styles.detailValue, { color: mainTextColor }]}>{remedy}</MarkdownText>
                                </View>
                            )}
                        </>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 8,
        // borderBottomWidth: 1, // Removed border
        // borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    mainContent: {
        flex: 1,
        marginRight: 16,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 16, // Align with text start (indicator width + margin)
    },
    indicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
        marginTop: 2,
    },
    name: {
        fontSize: 16,
        color: Colors.text,
        marginBottom: 4,
        fontFamily: Typography.fontFamily.bold,
        flexShrink: 1,
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    value: {
        fontSize: 18,
        color: Colors.text,
        marginRight: 4,
        fontFamily: Typography.fontFamily.bold,
    },
    unit: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontFamily: Typography.fontFamily.medium,
    },
    targetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 16,
        marginTop: 2,
    },
    targetLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontFamily: Typography.fontFamily.medium,
        marginRight: 4,
    },
    targetValue: {
        fontSize: 12,
        color: Colors.text,
        fontFamily: Typography.fontFamily.semiBold,
    },
    detailsContainer: {
        marginTop: 12,
        paddingLeft: 16,
        paddingRight: 8,
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 8,
    },
    detailRow: {
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 2,
        fontFamily: Typography.fontFamily.bold,
    },
    detailValue: {
        fontSize: 14,
        color: Colors.text,
        lineHeight: 20,
        fontFamily: Typography.fontFamily.regular,
    }
});
