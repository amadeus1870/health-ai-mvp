
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

import { SoftCard } from './SoftCard';
import { Ionicons } from '@expo/vector-icons';

interface CholesterolData {
    quantitative: {
        description: string;
        total: string;
        hdl: string;
        ldl: string;
        triglycerides: string;
    };
    qualitative: {
        description: string;
        metrics: {
            name: string;
            value: string;
            status: 'optimal' | 'warning' | 'critical';
            interpretation: string;
        }[];
    };
}

const ComparisonRow = ({ label, value, target, unit, isLowerBetter = true, statusOverride, labelColor }: { label: string, value: number, target: number, unit: string, isLowerBetter?: boolean, statusOverride?: string, labelColor?: string }) => {

    let excessColor = Colors.error;
    if (statusOverride === 'warning') {
        excessColor = Colors.warning;
    }

    const maxScale = Math.max(value, target) * 1.3;
    const userWidth = Math.min((value / maxScale) * 100, 100);
    const targetLeft = Math.min((target / maxScale) * 100, 100);

    // Calculate segments
    // If Lower is Better (Standard):
    // - Safe Segment: 0 to min(Value, Target) -> Green
    // - Excess Segment: Target to Value (if Value > Target) -> Red/Yellow

    // If Higher is Better (HDL):
    // - This logic might need inversion, but adhering to user's "Left Green, Right Red" request for now as it fits the "Exceeding Limit" mental model.
    // - For HDL, exceeding target is GOOD. So we might want to keep it all Green?
    // - Let's stick to the requested visual: "Left of target green".

    const safeWidth = Math.min(userWidth, targetLeft);
    const excessWidth = Math.max(0, userWidth - targetLeft);

    const textColor = labelColor || Colors.text;
    const secondaryColor = labelColor ? 'rgba(255,255,255,0.7)' : Colors.textSecondary;

    return (
        <View style={styles.rowContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, alignItems: 'flex-end' }}>
                <Text style={[styles.rowLabel, { color: textColor, marginBottom: 0 }]}>{label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={[styles.barValue, { color: textColor, fontSize: 16 }]}>{value}</Text>
                    {/* Removed target from here */}
                </View>
            </View>

            <View style={styles.track}>
                {/* Safe Segment (Green) */}
                <View
                    style={{
                        position: 'absolute',
                        left: 0,
                        height: '100%',
                        width: `${safeWidth}%`,
                        backgroundColor: Colors.success,
                        borderTopLeftRadius: 6,
                        borderBottomLeftRadius: 6,
                        borderTopRightRadius: excessWidth > 0 ? 0 : 6,
                        borderBottomRightRadius: excessWidth > 0 ? 0 : 6,
                        zIndex: 2
                    }}
                />

                {/* Excess Segment (Red/Yellow) */}
                {excessWidth > 0 && (
                    <View
                        style={{
                            position: 'absolute',
                            left: `${targetLeft}%`,
                            height: '100%',
                            width: `${excessWidth}%`,
                            backgroundColor: excessColor,
                            borderTopRightRadius: 6,
                            borderBottomRightRadius: 6,
                            zIndex: 2
                        }}
                    />
                )}

                {/* Target Marker */}
                <View style={[styles.targetMarker, { left: `${targetLeft}%`, zIndex: 3 }]} />
            </View>
            <Text style={[styles.barLabel, { marginTop: 4, alignSelf: 'flex-end', fontSize: 10, color: secondaryColor }]}>Obiettivo: {isLowerBetter ? '<' : '>'} {target} {unit}</Text>
        </View>
    );
};

// RadarChart removed


// ... existing imports

export const CholesterolCard: React.FC<{ data: CholesterolData, textColor?: string }> = ({ data, textColor }) => {
    const parseValue = (val: string) => {
        const num = parseFloat(val?.replace(/[^0-9.]/g, ''));
        return isNaN(num) ? 0 : num;
    };

    const total = parseValue(data.quantitative.total);
    const ldl = parseValue(data.quantitative.ldl);
    const hdl = parseValue(data.quantitative.hdl);
    const tri = parseValue(data.quantitative.triglycerides);

    // Calculate status for quantitative metrics
    const getTotalStatus = (v: number) => v < 200 ? 'optimal' : v < 240 ? 'warning' : 'critical';
    const getLDLStatus = (v: number) => v < 100 ? 'optimal' : v < 160 ? 'warning' : 'critical';
    const getHDLStatus = (v: number) => v >= 60 ? 'optimal' : v >= 40 ? 'warning' : 'critical';
    const getTriStatus = (v: number) => v < 150 ? 'optimal' : v < 200 ? 'warning' : 'critical';

    const titleColor = textColor || Colors.primary;
    const descColor = textColor || '#636E72';
    const labelColor = textColor || Colors.text;
    const secondaryColor = textColor ? 'rgba(255,255,255,0.7)' : Colors.textSecondary;

    return (
        <View>
            {/* Quantitative Analysis */}
            {/* Quantitative Analysis */}
            <View style={[styles.sectionHeaderContainer, { backgroundColor: '#FFFFFF' }]}>
                <Ionicons name="stats-chart" size={18} color={Colors.orange} />
                <Text style={[styles.sectionHeaderText, { color: Colors.orange }]}>Analisi Quantitativa</Text>
            </View>
            <Text style={[styles.description, { color: descColor }]}>{data.quantitative.description}</Text>

            <View style={{ marginBottom: 24, marginTop: 10 }}>
                <ComparisonRow
                    label="Colesterolo Totale"
                    value={total}
                    target={200}
                    unit="mg/dL"
                    statusOverride={getTotalStatus(total)}
                    labelColor={labelColor}
                />
                <ComparisonRow
                    label="Colesterolo LDL (Cattivo)"
                    value={ldl}
                    target={100}
                    unit="mg/dL"
                    statusOverride={getLDLStatus(ldl)}
                    labelColor={labelColor}
                />
                <ComparisonRow
                    label="Colesterolo HDL (Buono)"
                    value={hdl}
                    target={50}
                    unit="mg/dL"
                    isLowerBetter={false}
                    statusOverride={getHDLStatus(hdl)}
                    labelColor={labelColor}
                />
                <ComparisonRow
                    label="Trigliceridi"
                    value={tri}
                    target={150}
                    unit="mg/dL"
                    statusOverride={getTriStatus(tri)}
                    labelColor={labelColor}
                />
            </View>



            {/* Qualitative Analysis */}
            {/* Qualitative Analysis */}
            <View style={[styles.sectionHeaderContainer, { backgroundColor: '#FFFFFF' }]}>
                <Ionicons name="flask" size={18} color={Colors.orange} />
                <Text style={[styles.sectionHeaderText, { color: Colors.orange }]}>Analisi Qualitativa Avanzata</Text>
            </View>
            <Text style={[styles.description, { color: descColor }]}>{data.qualitative.description}</Text>

            {data.qualitative.metrics.map((metric, index) => {
                // Determine target based on metric name
                let target = 0;
                let isLowerBetter = true;
                let unit = '';

                if (metric.name.includes('Non-HDL')) { target = 130; unit = 'mg/dL'; }
                else if (metric.name.includes('TG/HDL')) { target = 2.0; unit = 'ratio'; }
                else if (metric.name.includes('Remnant')) { target = 30; unit = 'mg/dL'; }
                else if (metric.name.includes('LAP')) { target = 30; unit = 'score'; }

                const val = parseValue(metric.value);

                return (
                    <View key={index} style={styles.metricContainer}>
                        <ComparisonRow
                            label={metric.name}
                            value={val}
                            target={target}
                            unit={unit}
                            isLowerBetter={isLowerBetter}
                            statusOverride={metric.status}
                            labelColor={labelColor}
                        />
                        <Text style={[styles.metricInterpretation, { color: secondaryColor }]}>{metric.interpretation}</Text>
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    // chartCard removed
    subtitle: { fontSize: 12, color: Colors.textSecondary, marginBottom: 16 },

    rowContainer: { marginBottom: 20 },
    rowLabel: { fontSize: 14, fontFamily: Typography.fontFamily.bold, color: Colors.text, marginBottom: 6 },

    barLabel: { fontSize: 12, color: Colors.textSecondary, fontFamily: Typography.fontFamily.regular },
    barValue: { fontSize: 12, fontFamily: Typography.fontFamily.bold },

    track: { height: 24, backgroundColor: '#F0F2F5', borderRadius: 6, overflow: 'hidden', width: '100%', position: 'relative' },
    fill: { height: '100%', borderRadius: 6 },
    targetMarker: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 2,
        backgroundColor: '#2D3436',
        zIndex: 10,
    },

    // qualitativeCard removed
    sectionHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 12,
        marginTop: 4,
    },
    sectionHeaderText: {
        fontSize: 16,
        fontFamily: Typography.fontFamily.bold,
        marginLeft: 8,
    },
    description: {
        fontSize: 16,
        color: '#636E72',
        lineHeight: 24,
        fontFamily: Typography.fontFamily.regular,
        marginBottom: 20,
    },
    divider: { height: 1, backgroundColor: '#E1E8ED', marginBottom: 20 },

    metricContainer: { marginBottom: 24 },
    metricInterpretation: { fontSize: 12, color: Colors.textSecondary, fontFamily: Typography.fontFamily.medium, fontStyle: 'italic', marginTop: -8 },
});

