import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Typography } from '../../constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SoftCard } from './SoftCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

interface DietStrategyCardsProps {
    dietType: string;
    onInfoPress: (title: string, message: string) => void;
}

import i18n from '../../config/i18n';

import { useLanguage } from '../../context/LanguageContext';

const DietCard = ({ title, icon, color, children, onInfoPress, gradientColors, gradientLocations }: any) => {
    const Content = () => (
        <>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: gradientColors ? 'rgba(255,255,255,0.2)' : `${color}20` }]}>
                        <Ionicons name={icon} size={24} color={color} />
                    </View>
                    <Text style={styles.cardTitle}>{title}</Text>
                </View>
                {onInfoPress && (
                    <TouchableOpacity onPress={onInfoPress}>
                        <Ionicons name="information-circle-outline" size={24} color="rgba(255,255,255,0.6)" />
                    </TouchableOpacity>
                )}
            </View>
            <View style={styles.body}>
                {children}
            </View>
        </>
    );

    return (
        <SoftCard style={styles.cardContainer}>
            {gradientColors ? (
                <LinearGradient
                    colors={gradientColors}
                    locations={gradientLocations}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardContent}
                >
                    <Content />
                </LinearGradient>
            ) : (
                <BlurView intensity={60} tint="dark" style={styles.cardContent}>
                    <Content />
                </BlurView>
            )}
        </SoftCard>
    );
};

export const DietStrategyCards: React.FC<DietStrategyCardsProps> = ({ dietType, onInfoPress }) => {
    const { language } = useLanguage();

    const getDietDetails = (dietType: string) => {
        const normalized = dietType.toLowerCase();

        let strategyKey = 'balanced'; // Default

        if (normalized.includes('mediterranea') || normalized.includes('mediterranean')) {
            strategyKey = 'mediterranean';
        } else if (normalized.includes('keto') || normalized.includes('chetogenica')) {
            strategyKey = 'keto';
        } else if (normalized.includes('vegetariana') || normalized.includes('vegetarian')) {
            strategyKey = 'vegetarian';
        } else if (normalized.includes('vegana') || normalized.includes('vegan')) {
            strategyKey = 'vegan';
        } else if (normalized.includes('paleo')) {
            strategyKey = 'paleo';
        }

        return {
            description: i18n.t(`nutrition.strategies.${strategyKey}.description`),
            detailedReasoning: i18n.t(`nutrition.strategies.${strategyKey}.reasoning`),
            allowed: i18n.t(`nutrition.strategies.${strategyKey}.allowed`) as unknown as string[],
            avoided: i18n.t(`nutrition.strategies.${strategyKey}.avoided`) as unknown as string[]
        };
    };

    const details = getDietDetails(dietType);

    return (
        <>
            {/* Card 1: Explanation */}
            <DietCard
                title={i18n.t('nutrition.strategies.whyTitle')}
                icon="book-outline"
                color="#FFF" // White icon for better contrast on gradient
                gradientColors={['#1e3c72', '#9b59b6', '#fdbb2d']} // Dark Blue, Purple, Yellow (Health Map Style)
                onInfoPress={() => onInfoPress(
                    i18n.t('nutrition.strategies.customStrategy'),
                    `${details.detailedReasoning}\n\n---\n\n${i18n.t('nutrition.strategies.strategyDisclaimer')}`
                )}
            >
                <Text style={styles.description}>{details.description}</Text>
            </DietCard>

            {/* Card 2: Allowed Foods */}
            <DietCard title={i18n.t('nutrition.strategies.allowedTitle')} icon="checkmark-circle-outline" color="#2ecc71">
                <View style={styles.tagsContainer}>
                    {details.allowed.slice(0, 8).map((item, index) => (
                        <View key={index} style={[styles.tag, { backgroundColor: 'rgba(46, 204, 113, 0.15)', borderColor: 'rgba(46, 204, 113, 0.3)' }]}>
                            <Text style={[styles.tagText, { color: '#2ecc71' }]}>{item}</Text>
                        </View>
                    ))}
                </View>
            </DietCard>

            {/* Card 3: Avoided Foods */}
            <DietCard title={i18n.t('nutrition.strategies.avoidedTitle')} icon="close-circle-outline" color="#e74c3c">
                <View style={styles.tagsContainer}>
                    {details.avoided.slice(0, 8).map((item, index) => (
                        <View key={index} style={[styles.tag, { backgroundColor: 'rgba(231, 76, 60, 0.15)', borderColor: 'rgba(231, 76, 60, 0.3)' }]}>
                            <Text style={[styles.tagText, { color: '#e74c3c' }]}>{item}</Text>
                        </View>
                    ))}
                </View>
            </DietCard>
        </>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        width: CARD_WIDTH,
        height: 240,
        marginRight: 16,
        padding: 0, // Remove default padding to let BlurView fill
        backgroundColor: 'transparent', // Transparent for BlurView
        overflow: 'hidden', // Clip BlurView
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)', // Match AnalysisHistoryModal
        borderRadius: 24, // Match SoftCard radius
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    cardContent: {
        flex: 1,
        padding: 20,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: 8,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontFamily: Typography.fontFamily.bold,
        color: '#FFF',
        flex: 1,
        flexWrap: 'wrap',
    },
    body: {
        flex: 1,
        justifyContent: 'center',
    },
    description: {
        fontSize: 16,
        fontFamily: Typography.fontFamily.medium,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 24,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        alignContent: 'center',
        gap: 8,
    },
    tag: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
    },
    tagText: {
        fontSize: 12,
        fontFamily: Typography.fontFamily.bold,
    },
});
