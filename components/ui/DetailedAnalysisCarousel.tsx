import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Dimensions, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { SoftCard } from './SoftCard';
import { Ionicons } from '@expo/vector-icons';
import { RiskCard } from './RiskCard';
import { BiomarkerRow } from './BiomarkerRow';
import { SupplementCard } from './SupplementCard';
import { CholesterolCard } from './CholesterolCard';
import { CurrentSupplementCard } from './CurrentSupplementCard';
import { MarkdownText } from './MarkdownText';
import i18n from '../../config/i18n';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.65; // Increased width
const CARD_HEIGHT = 180; // Reverted height
const SPACING = 12;
const SNAP_INTERVAL = CARD_WIDTH + SPACING; // This might not be strictly needed if not snapping, but kept for consistency
const INSET = 20;

interface DetailedAnalysisCarouselProps {
    results: any;
    onExport?: () => void;
    isExporting?: boolean;
}

import { useLanguage } from '../../context/LanguageContext';

export const DetailedAnalysisCarousel: React.FC<DetailedAnalysisCarouselProps> = ({ results, onExport, isExporting }) => {
    const { language } = useLanguage(); // Trigger re-render on language change
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedCard, setSelectedCard] = useState<{ title: string, content: React.ReactNode } | null>(null);

    const openModal = (title: string, content: React.ReactNode) => {
        setSelectedCard({ title, content });
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setSelectedCard(null);
    };

    const renderDarkCard = (title: string, icon: keyof typeof Ionicons.glyphMap, gradientColors: readonly [string, string, ...string[]], content: React.ReactNode, headerAction?: React.ReactNode) => (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => openModal(title, content)}
            style={{ marginRight: SPACING }}
        >
            <SoftCard style={[styles.card, {
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                borderWidth: 0,
            }]}>
                <View style={styles.innerContainer}>
                    <LinearGradient
                        colors={gradientColors}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />

                    {/* Hero Icon */}
                    <View style={styles.heroIconContainer}>
                        <Ionicons
                            name={icon}
                            size={140}
                            color="rgba(255,255,255,0.2)"
                            style={{ transform: [{ rotate: '-15deg' }] }}
                        />
                    </View>

                    <View style={styles.cardContent}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                            <Ionicons name={icon} size={32} color="#FFF" style={{ marginBottom: 12 }} />
                            {headerAction}
                        </View>
                        <Text style={[styles.cardTitle, { color: '#FFF' }]}>{title}</Text>

                        <View style={{ flex: 1 }} />
                        <Text style={styles.tapToViewText}>{i18n.t('analysis.carousel.tapDetails')}</Text>
                    </View>
                </View>
            </SoftCard>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: INSET, paddingBottom: 40 }}
                style={{ overflow: 'visible' }}
            >
                {/* 0. REPORT COMPLETO (Premium Card) - Blue/Indigo Gradient */}
                {onExport && (
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={onExport} // Direct action for this card
                        style={{ marginRight: SPACING }}
                    >
                        <SoftCard style={[styles.card, {
                            width: CARD_WIDTH,
                            height: CARD_HEIGHT,
                            borderWidth: 0,
                        }]}>
                            <View style={styles.innerContainer}>
                                <LinearGradient
                                    colors={['#1A237E', '#3949AB', '#304FFE']} // Deep Indigo -> Blue
                                    style={StyleSheet.absoluteFill}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                />

                                {/* Hero Icon */}
                                <View style={styles.heroIconContainer}>
                                    <Ionicons
                                        name="document-text"
                                        size={140}
                                        color="rgba(255,255,255,0.15)"
                                        style={{ transform: [{ rotate: '-15deg' }] }}
                                    />
                                </View>

                                <View style={styles.cardContent}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 12 }}>
                                        <Ionicons name="document-text" size={32} color="#FFF" />
                                        {/* Action Button MOVED HERE */}
                                        <View style={{
                                            backgroundColor: 'rgba(255,255,255,0.2)',
                                            paddingVertical: 6,
                                            paddingHorizontal: 12,
                                            borderRadius: 12,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            borderWidth: 1,
                                            borderColor: 'rgba(255,255,255,0.3)'
                                        }}>
                                            {isExporting ? (
                                                <TouchableOpacity disabled>
                                                    <Text style={{ color: '#FFF', fontFamily: Typography.fontFamily.bold, fontSize: 12 }}>...</Text>
                                                </TouchableOpacity>
                                            ) : (
                                                <>
                                                    <Ionicons name="download-outline" size={16} color="#FFF" style={{ marginRight: 4 }} />
                                                    <Text style={{ color: '#FFF', fontFamily: Typography.fontFamily.bold, fontSize: 12 }}>PDF</Text>
                                                </>
                                            )}
                                        </View>
                                    </View>

                                    <Text style={[styles.cardTitle, { color: '#FFF', fontSize: 22, marginTop: -5 }]}>{i18n.t('analysis.carousel.fullReport')}</Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4, fontFamily: Typography.fontFamily.medium }}>
                                        {i18n.t('analysis.carousel.exportAnalysis')}
                                    </Text>

                                    <View style={{ flex: 1 }} />

                                </View>
                            </View>
                        </SoftCard>
                    </TouchableOpacity>
                )}

                {/* 1. VALUTAZIONE GENERALE - Dark Orange -> Light Orange */}
                {results.valutazioneGenerale && renderDarkCard(
                    i18n.t('analysis.carousel.generalEval'),
                    "pulse",
                    ['#E65100', '#F57C00', '#FFB74D'], // Dark Orange -> Orange -> Light Orange
                    <>
                        <Text style={styles.subHeader}>{i18n.t('analysis.carousel.overview')}</Text>
                        <MarkdownText style={styles.bodyText}>{results.valutazioneGenerale?.panoramica}</MarkdownText>

                        <View style={styles.divider} />
                        <Text style={styles.subHeader}>{i18n.t('analysis.carousel.mainResults')}</Text>
                        <MarkdownText style={styles.bodyText}>{results.valutazioneGenerale?.risultati}</MarkdownText>

                        <View style={styles.divider} />
                        <Text style={styles.subHeader}>{i18n.t('analysis.carousel.trends')}</Text>
                        <MarkdownText style={styles.bodyText}>{results.valutazioneGenerale?.tendenze}</MarkdownText>

                        <View style={styles.divider} />
                        <Text style={styles.subHeader}>{i18n.t('analysis.carousel.correlations')}</Text>
                        <MarkdownText style={styles.bodyText}>{results.valutazioneGenerale?.correlazioni}</MarkdownText>
                    </>
                )}

                {/* 2. FATTORI DI RISCHIO - Dark Red -> Light Red */}
                {results.fattoriDiRischio && results.fattoriDiRischio.length > 0 && renderDarkCard(
                    i18n.t('analysis.carousel.riskFactors'),
                    "alert-circle",
                    ['#B71C1C', '#D32F2F', '#EF5350'], // Dark Red -> Red -> Light Red
                    <>
                        {results.fattoriDiRischio.map((risk: any, index: number) => (
                            <RiskCard key={index} risk={risk} textColor="#FFF" />
                        ))}
                    </>
                )}

                {/* 3. RACCOMANDAZIONI - Dark Green -> Light Green */}
                {results.raccomandazioni && renderDarkCard(
                    i18n.t('analysis.carousel.recommendations'),
                    "medkit",
                    ['#1B5E20', '#388E3C', '#66BB6A'], // Dark Green -> Green -> Light Green
                    <>
                        <Text style={styles.subHeader}>{i18n.t('analysis.carousel.considerations')}</Text>
                        <MarkdownText style={styles.bodyText}>{results.raccomandazioni?.mediche}</MarkdownText>

                        <View style={styles.divider} />
                        <Text style={styles.subHeader}>{i18n.t('analysis.carousel.lifestyle')}</Text>
                        <MarkdownText style={styles.bodyText}>{results.raccomandazioni?.stileDiVita}</MarkdownText>

                        <View style={styles.divider} />
                        <Text style={styles.subHeader}>{i18n.t('analysis.carousel.followUp')}</Text>
                        <MarkdownText style={styles.bodyText}>{results.raccomandazioni?.followUp}</MarkdownText>

                        <View style={styles.divider} />
                        <Text style={styles.subHeader}>{i18n.t('analysis.carousel.specialists')}</Text>
                        <MarkdownText style={styles.bodyText}>{results.raccomandazioni?.specialisti}</MarkdownText>
                    </>
                )}

                {/* 4. PROFILO LIPIDICO DETTAGLIATO - Dark Blue -> Light Blue */}
                {results.cholesterolAnalysis && renderDarkCard(
                    i18n.t('analysis.carousel.lipidProfile'),
                    "water",
                    ['#0D47A1', '#1976D2', '#42A5F5'], // Dark Blue -> Blue -> Light Blue
                    <CholesterolCard data={results.cholesterolAnalysis} textColor="#FFF" />
                )}

                {/* 5. DETTAGLIO BIOMARCATORI - Dark Purple -> Light Purple */}
                {results.biomarkers && renderDarkCard(
                    i18n.t('analysis.carousel.biomarkersDetail'),
                    "list",
                    ['#4A148C', '#7B1FA2', '#AB47BC'], // Dark Purple -> Purple -> Light Purple
                    <>
                        {results.biomarkers.map((item: any, index: number) => (
                            <BiomarkerRow
                                key={index}
                                name={item.name}
                                value={item.value}
                                unit={item.unit}
                                status={item.status}
                                target={item.target}
                                meaning={item.meaning}
                                cause={item.cause}
                                remedy={item.remedy}
                                textColor="#FFF"
                            />
                        ))}
                    </>
                )}

                {/* 6. INTEGRATORI - Dark Amber -> Light Amber */}
                {results.supplements && (results.supplements.recommended.length > 0 || (results.supplements.current && results.supplements.current.length > 0)) && renderDarkCard(
                    i18n.t('analysis.carousel.supplements'),
                    "bandage",
                    ['#FF6F00', '#FFA000', '#FFCA28'], // Dark Amber -> Amber -> Light Amber
                    <>
                        {/* Current Supplements Section */}
                        {results.supplements.current && results.supplements.current.length > 0 && (
                            <>
                                <View style={styles.sectionHeaderContainer}>
                                    <Ionicons name="person" size={18} color="#E65100" />
                                    <Text style={styles.sectionHeaderText}>{i18n.t('analysis.carousel.currentSupplements')}</Text>
                                </View>
                                {results.supplements.current.map((supp: any, index: number) => (
                                    <CurrentSupplementCard key={`curr-${index}`} supplement={supp} textColor="#FFF" />
                                ))}
                                <View style={styles.divider} />
                            </>
                        )}

                        {/* Recommended Supplements Section */}
                        {results.supplements.recommended && results.supplements.recommended.length > 0 && (
                            <>
                                <View style={styles.sectionHeaderContainer}>
                                    <Ionicons name="star" size={18} color="#E65100" />
                                    <Text style={styles.sectionHeaderText}>{i18n.t('analysis.carousel.recommendedSupplements')}</Text>
                                </View>
                                {results.supplements.recommended.map((supp: any, index: number) => (
                                    <SupplementCard key={`rec-${index}`} supplement={supp} textColor="#FFF" />
                                ))}
                            </>
                        )}
                    </>
                )}

                {/* 7. CONCLUSIONE - Dark Gray -> Light Gray */}
                {results.conclusione && renderDarkCard(
                    i18n.t('analysis.carousel.conclusion'),
                    "checkmark-done-circle",
                    ['#263238', '#455A64', '#78909C'], // Dark Gray -> Gray -> Light Gray
                    <MarkdownText style={styles.bodyText}>{results.conclusione}</MarkdownText>
                )}

            </ScrollView>


            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <View style={styles.modalContainer}>

                    <View style={styles.modalContent}>
                        <BlurView
                            intensity={60}
                            tint="dark"
                            style={StyleSheet.absoluteFill}
                            experimentalBlurMethod='dimezisBlurView'
                        />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{selectedCard?.title}</Text>
                            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={styles.modalBody}>
                            {selectedCard?.content}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        marginHorizontal: -20,
    },
    card: {
        padding: 0,
        backgroundColor: 'transparent',
        // overflow: 'hidden', // Removed to allow shadow
        borderRadius: 20,
        // borderWidth: 0, // Handled in inline style or SoftCard default
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    innerContainer: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
    },
    heroIconContainer: {
        position: 'absolute',
        right: -20,
        bottom: -20,
        zIndex: 0,
    },
    cardContent: {
        flex: 1,
        padding: 20,
        justifyContent: 'flex-start',
    },
    cardTitle: {
        fontSize: 18,
        fontFamily: Typography.fontFamily.bold,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        lineHeight: 24,
    },

    tapToViewText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)', // Lighter for dark bg
        fontFamily: Typography.fontFamily.medium,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'transparent',
    },
    modalContent: {
        backgroundColor: 'transparent',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '80%',
        paddingTop: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: Typography.fontFamily.bold,
        color: '#FFF',
    },
    closeButton: {
        padding: 4,
    },
    modalBody: {
        padding: 24,
        paddingBottom: 40,
    },
    // Content Styles (reused but adapted for white background)
    subHeader: {
        fontSize: 16,
        fontFamily: Typography.fontFamily.semiBold,
        color: '#FFF', // Changed to white for dark bg
        marginBottom: 8,
        marginTop: 8,
    },
    bodyText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)', // Light text for dark bg
        lineHeight: 24,
        fontFamily: Typography.fontFamily.regular,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)', // Light divider
        marginVertical: 16,
    },
    sectionHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF', // White background
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 12,
        marginTop: 4,
    },
    sectionHeaderText: {
        fontSize: 16,
        fontFamily: Typography.fontFamily.bold,
        color: '#E65100', // Dark Orange
        marginLeft: 8,
    },
});
