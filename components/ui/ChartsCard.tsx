import React from 'react';
import { View, StyleSheet, Text, ScrollView, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { SoftCard } from './SoftCard';
import { VitalScoreChart } from './VitalScoreChart';
import { RadarChart } from '../charts/RadarChart';
import { GlobalRiskChart } from '../charts/GlobalRiskChart';


import { LinearGradient } from 'expo-linear-gradient';
import i18n from '../../config/i18n';

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = Platform.OS === 'ios' ? height * 0.42 : height * 0.48; // iOS smaller
const CARD_WIDTH = width * 0.85;
const SPACING = 12;
const SNAP_INTERVAL = CARD_WIDTH + SPACING;
const INSET = (width - CARD_WIDTH) / 2;



import { useLanguage } from '../../context/LanguageContext';

interface ChartsCardProps {
    results: any;
    vitalScore: number;
    onVitalInfo: () => void;
    onLipidInfo: () => void;
    onRiskInfo: () => void;
}
export const ChartsCard: React.FC<ChartsCardProps> = ({ results, vitalScore, onVitalInfo, onLipidInfo, onRiskInfo }) => {
    const { language } = useLanguage(); // Trigger re-render on language change
    // Prepare Cholesterol Data
    const q = results?.cholesterolAnalysis?.quantitative;
    const parse = (v: string) => parseFloat(v?.replace(/[^0-9.]/g, '') || '0');

    const radarData = q ? [
        { label: i18n.t('analysis.charts.total'), value: parse(q.total), fullMark: 300, target: 200, isOk: parse(q.total) <= 200 },
        { label: i18n.t('analysis.charts.ldl'), value: parse(q.ldl), fullMark: 200, target: 100, isOk: parse(q.ldl) <= 100 },
        { label: i18n.t('analysis.charts.hdl'), value: parse(q.hdl), fullMark: 100, target: 60, isOk: parse(q.hdl) >= 60 },
        { label: i18n.t('analysis.charts.triglycerides'), value: parse(q.triglycerides), fullMark: 300, target: 150, isOk: parse(q.triglycerides) <= 150 },
    ] : [];

    const renderGradientCard = (title: string, children: React.ReactNode, gradientColors: readonly [string, string, ...string[]], onInfoPress: () => void) => (
        <SoftCard style={[styles.card, { width: CARD_WIDTH, marginRight: SPACING, borderWidth: 0 }]}>
            <LinearGradient
                colors={gradientColors}
                style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            <View style={styles.cardContent}>
                <View style={styles.headerRow}>
                    <Text style={styles.chartTitle}>{title}</Text>
                    <TouchableOpacity onPress={onInfoPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="information-circle-outline" size={24} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                </View>
                {children}
            </View>
        </SoftCard>
    );

    const hasRadarData = radarData.length > 0 && radarData.some(d => d.value > 0);

    const CHART_SIZE = CARD_HEIGHT * 0.55;

    return (
        <View style={styles.container}>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={SNAP_INTERVAL}
                decelerationRate="fast"
                snapToAlignment="start"
                contentContainerStyle={{ paddingHorizontal: INSET, paddingBottom: 40 }}
                style={{ overflow: 'visible' }}
            >
                {/* 1. Vital Score -> BMI Style */}
                {renderGradientCard(
                    i18n.t('analysis.vitalScoreTitle'),
                    <>
                        <View style={styles.chartContainer}>
                            <VitalScoreChart score={vitalScore} size={CHART_SIZE} />
                        </View>
                        <Text style={styles.chartDescription}>
                            {i18n.t('analysis.charts.vitalScoreDesc')}
                        </Text>
                    </>,
                    ['#1a2a6c', '#b21f1f', '#fdbb2d'], // BMI Gradient
                    onVitalInfo
                )}

                {/* 2. Cholesterol Radar -> Calories Style */}
                {renderGradientCard(
                    i18n.t('analysis.lipidTitle'),
                    <>
                        <View style={styles.chartContainer}>
                            {hasRadarData ? (
                                <RadarChart data={radarData} size={CHART_SIZE + 30} />
                            ) : (
                                <View style={{ alignItems: 'center', justifyContent: 'center', opacity: 0.5, flex: 1 }}>
                                    <Text style={{ color: '#FFF', fontSize: 16, fontFamily: Typography.fontFamily.medium }}>
                                        {i18n.t('analysis.charts.noData')}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.chartDescription}>
                            {hasRadarData
                                ? i18n.t('analysis.charts.lipidDesc')
                                : i18n.t('analysis.charts.dataUnavailable')}
                        </Text>
                    </>,
                    ['#8E0E00', '#EA384D', '#fdbb2d'], // Calories Gradient
                    onLipidInfo
                )}

                {/* 3. Global Risk -> Macros Style */}
                {results?.fattoriDiRischio && renderGradientCard(
                    i18n.t('analysis.riskTitle'),
                    <>
                        <View style={styles.chartContainer}>
                            <GlobalRiskChart risks={results.fattoriDiRischio} size={CHART_SIZE} />
                        </View>
                        <Text style={styles.chartDescription}>
                            {i18n.t('analysis.charts.riskDesc')}
                        </Text>
                    </>,
                    ['#002b19', '#2e7d32', '#aeea00'], // Macros Gradient (High Contrast Green)
                    onRiskInfo
                )}
            </ScrollView>


        </View>
    );
};

const styles = StyleSheet.create({
    // ... container styles
    container: {
        marginBottom: 20,
        marginHorizontal: -20, // Break out of parent padding
    },
    card: {
        padding: 0, // Remove default padding to let BlurView fill
        backgroundColor: 'transparent', // Transparent for BlurView
        height: CARD_HEIGHT,
        // overflow: 'hidden', // Removed to allow shadow
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    cardContent: {
        padding: 20,
        paddingTop: 24,
        alignItems: 'center',
        justifyContent: 'flex-start',
        flex: 1,
    },
    // ... other styles
    chartContainer: {
        marginVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 10,
    },
    chartTitle: {
        fontSize: 24,
        fontFamily: Typography.fontFamily.bold,
        color: '#FFFFFF', // White
        marginBottom: 0,
        // alignSelf: 'center', // Removed to allow flex layout
        // textAlign: 'center', // Removed
        height: 32,
        textShadowColor: 'rgba(0, 0, 0, 0.2)', // Light shadow for readability
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    chartDescription: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)', // White with high opacity
        textAlign: 'center',
        marginTop: 10,
        fontFamily: Typography.fontFamily.regular,
        lineHeight: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.3)', // Stronger shadow for readability against light/glass
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    paginationHint: {
        alignItems: 'center',
        marginTop: 10,
    },
    paginationText: {
        fontSize: 12,
        color: '#FFF',
        fontFamily: Typography.fontFamily.medium,
        opacity: 0.8,
    },
});
