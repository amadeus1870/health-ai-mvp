
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Ionicons } from '@expo/vector-icons';

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
        switch (status) {
            case 'optimal': return Colors.success;
            case 'warning': return Colors.warning;
            case 'critical': return Colors.error;
            default: return Colors.textSecondary;
        }
    };

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    const isOptimal = status === 'optimal';
    const mainTextColor = textColor || Colors.text;
    const secondaryTextColor = textColor ? 'rgba(255,255,255,0.7)' : Colors.textSecondary;

    const statusColor = getStatusColor();
    const containerStyle = textColor ? {
        backgroundColor: 'rgba(255,255,255,0.05)',
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
                            <Text style={styles.detailLabel}>Significato:</Text>
                            <Text style={styles.detailValue}>{meaning}</Text>
                        </View>
                    )}

                    {/* Cause & Remedy - Show only if NOT optimal */}
                    {!isOptimal && (
                        <>
                            {cause && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Possibili Cause:</Text>
                                    <Text style={styles.detailValue}>{cause}</Text>
                                </View>
                            )}
                            {remedy && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Rimedi Consigliati:</Text>
                                    <Text style={styles.detailValue}>{remedy}</Text>
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
