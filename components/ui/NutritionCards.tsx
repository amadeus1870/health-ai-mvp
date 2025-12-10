import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import i18n from '../../config/i18n';

import { useLanguage } from '../../context/LanguageContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

interface BMICardProps {
    bmi: number;
    status: string;
    color: string;
    onInfoPress: () => void;
}

interface CaloriesCardProps {
    tdee: number;
    goalCalories: number;
    goalType: string;
    onInfoPress: () => void;
}

interface MacrosCardProps {
    protein: number;
    carbs: number;
    fats: number;
    onInfoPress: () => void;
}



export const BMICard: React.FC<BMICardProps> = ({ bmi, status, color, onInfoPress }) => {
    const { language } = useLanguage();
    const minBMI = 15;
    const maxBMI = 40;
    const percentage = Math.min(Math.max((bmi - minBMI) / (maxBMI - minBMI), 0), 1);

    return (
        <Animated.View entering={FadeInRight.delay(100)} style={styles.cardContainer}>
            <LinearGradient
                colors={['#002b19', '#2e7d32', '#aeea00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
            >
                <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="body" size={24} color="#FFF" />
                        </View>
                        <Text style={styles.cardTitle}>{i18n.t('nutrition.bmiTitle')}</Text>
                    </View>
                    <TouchableOpacity onPress={onInfoPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="information-circle-outline" size={24} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                </View>

                <View style={styles.contentContainer}>
                    <Text style={styles.mainValue}>{bmi.toFixed(1)}</Text>
                    <Text style={[styles.subValue, { color: '#FFF' }]}>{status}</Text>
                </View>

                {/* BMI Bar */}
                <View style={styles.barContainer}>
                    <LinearGradient
                        colors={['#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#e74c3c']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientBar}
                    />
                    <View style={[styles.indicator, { left: `${percentage * 100}%` }]} />
                </View>
                <View style={styles.labelsContainer}>
                    <Text style={styles.barLabel}>{i18n.t('nutrition.bmi.underweight')}</Text>
                    <Text style={styles.barLabel}>{i18n.t('nutrition.bmi.normal')}</Text>
                    <Text style={styles.barLabel}>{i18n.t('nutrition.bmi.overweight')}</Text>
                    <Text style={styles.barLabel}>{i18n.t('nutrition.bmi.obese')}</Text>
                </View>
            </LinearGradient>
        </Animated.View>
    );
};

// ... CaloriesCardProps

export const CaloriesCard: React.FC<CaloriesCardProps> = ({ tdee, goalCalories, goalType, onInfoPress }) => {
    const { language } = useLanguage();
    const isDeficit = goalCalories < tdee;
    const diff = Math.abs(tdee - goalCalories);

    return (
        <Animated.View entering={FadeInRight.delay(200)} style={styles.cardContainer}>
            <LinearGradient
                colors={['#1a2a6c', '#b21f1f', '#fdbb2d']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
            >
                <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="flame" size={24} color="#FFF" />
                        </View>
                        <Text style={styles.cardTitle}>{i18n.t('nutrition.calories')}</Text>
                    </View>
                    <TouchableOpacity onPress={onInfoPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="information-circle-outline" size={24} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                </View>

                <View style={styles.contentContainer}>
                    {/* Obiettivo Row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 12 }}>
                        <Text style={[styles.subValue, { fontSize: 16, color: 'rgba(255,255,255,0.9)' }]}>{i18n.t('nutrition.target')}:</Text>
                        <Text style={styles.mainValue} adjustsFontSizeToFit numberOfLines={1}>
                            {Math.round(goalCalories)} <Text style={styles.unit}>kcal</Text>
                        </Text>
                    </View>

                    {/* Fabbisogno Row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <Text style={[styles.subValue, { fontSize: 14, color: 'rgba(255,255,255,0.8)' }]}>{i18n.t('nutrition.tdee')}:</Text>
                        <Text style={[styles.mainValue, { fontSize: 20 }]}>{Math.round(tdee)}</Text>
                    </View>

                    {/* Deficit/Surplus Indicator */}
                    <View style={{ marginTop: 16, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                        <Text style={{ color: '#FFF', fontSize: 12, fontFamily: Typography.fontFamily.medium }}>
                            {isDeficit ? i18n.t('nutrition.deficit') : i18n.t('nutrition.surplus')} {isDeficit ? '-' : '+'}{Math.round(diff)}
                        </Text>
                    </View>
                </View>
            </LinearGradient>
        </Animated.View>
    );
};

// ... MacrosCardProps

export const MacrosCard: React.FC<MacrosCardProps> = ({ protein, carbs, fats, onInfoPress }) => {
    const { language } = useLanguage();
    const total = protein + carbs + fats;
    const pP = (protein / total) * 100;
    const cP = (carbs / total) * 100;
    const fP = (fats / total) * 100;

    return (
        <Animated.View entering={FadeInRight.delay(300)} style={styles.cardContainer}>
            <LinearGradient
                colors={['#8E0E00', '#EA384D', '#fdbb2d']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
            >
                <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="pie-chart" size={24} color="#FFF" />
                        </View>
                        <Text style={styles.cardTitle}>{i18n.t('nutrition.macrosTitle')}</Text>
                    </View>
                    <TouchableOpacity onPress={onInfoPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="information-circle-outline" size={24} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                </View>

                <View style={styles.macrosContainer}>
                    {/* Protein */}
                    <View style={styles.macroItem}>
                        <Text style={[styles.macroLabel, { color: '#4FC3F7', width: 80 }]} numberOfLines={1}>{i18n.t('nutrition.protein')}</Text>
                        <View style={[styles.macroBar, { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 16 }]}>
                            <View style={[styles.macroFill, { width: `${Math.min(pP + 15, 100)}%`, backgroundColor: '#4FC3F7' }]} />
                            <Text style={styles.percentageText}>{Math.round(pP)}%</Text>
                        </View>
                        <Text style={[styles.macroValue, { color: '#4FC3F7', width: 50, textAlign: 'right' }]}>{Math.round(protein)}g</Text>
                    </View>

                    {/* Carbs */}
                    <View style={styles.macroItem}>
                        <Text style={[styles.macroLabel, { color: '#2ecc71', width: 80 }]} numberOfLines={1}>{i18n.t('nutrition.carbs')}</Text>
                        <View style={[styles.macroBar, { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 16 }]}>
                            <View style={[styles.macroFill, { width: `${Math.min(cP + 15, 100)}%`, backgroundColor: '#2ecc71' }]} />
                            <Text style={styles.percentageText}>{Math.round(cP)}%</Text>
                        </View>
                        <Text style={[styles.macroValue, { color: '#2ecc71', width: 50, textAlign: 'right' }]}>{Math.round(carbs)}g</Text>
                    </View>

                    {/* Fats */}
                    <View style={styles.macroItem}>
                        <Text style={[styles.macroLabel, { color: '#f1c40f', width: 80 }]} numberOfLines={1}>{i18n.t('nutrition.fats')}</Text>
                        <View style={[styles.macroBar, { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 16 }]}>
                            <View style={[styles.macroFill, { width: `${Math.min(fP + 15, 100)}%`, backgroundColor: '#f1c40f' }]} />
                            <Text style={styles.percentageText}>{Math.round(fP)}%</Text>
                        </View>
                        <Text style={[styles.macroValue, { color: '#f1c40f', width: 50, textAlign: 'right' }]}>{Math.round(fats)}g</Text>
                    </View>
                </View>
            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        width: CARD_WIDTH,
        marginRight: 16,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    cardGradient: {
        padding: 20,
        borderRadius: 24,
        height: 240, // Increased height to prevent overflow
        justifyContent: 'space-between',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', // Space between title and info icon
        width: '100%',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1, // Allow title container to take available space
        marginRight: 8, // Add spacing between title and info icon
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardTitle: {
        fontSize: 18,
        color: '#FFF',
        fontFamily: Typography.fontFamily.bold,
        flex: 1, // Allow title to wrap
        flexWrap: 'wrap', // Ensure wrapping
    },
    contentContainer: {
        alignItems: 'center',
        marginVertical: 10,
        flex: 1, // Allow content to take available space
        justifyContent: 'center',
    },
    mainValue: {
        fontSize: 36,
        color: '#FFF',
        fontFamily: Typography.fontFamily.bold,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    unit: {
        fontSize: 20,
        fontFamily: Typography.fontFamily.medium,
    },
    subValue: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        fontFamily: Typography.fontFamily.medium,
        marginTop: 4,
    },
    // BMI Specific
    barContainer: {
        height: 12,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 6,
        marginTop: 10,
        position: 'relative',
        justifyContent: 'center',
    },
    gradientBar: {
        flex: 1,
        borderRadius: 6,
    },
    indicator: {
        position: 'absolute',
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#FFF',
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.2)',
        top: -2,
        marginLeft: -8, // Center indicator
    },
    labelsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    barLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
        fontFamily: Typography.fontFamily.regular,
    },
    // Calories Specific
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 12,
        padding: 10,
        width: '100%',
    },
    infoItem: {
        alignItems: 'center',
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    infoLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 4,
        fontFamily: Typography.fontFamily.regular,
    },
    infoValue: {
        fontSize: 16,
        color: '#FFF',
        fontFamily: Typography.fontFamily.bold,
    },
    // Macros Specific
    macrosContainer: {
        flexDirection: 'column',
        justifyContent: 'space-around',
        height: 160, // Increased height for even thicker bars
        width: '100%',
        paddingVertical: 10,
    },
    macroItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    macroBar: {
        height: 20, // Much thicker bars
        borderRadius: 10,
        overflow: 'hidden',
        flexDirection: 'row', // Align fill and text horizontally
        alignItems: 'center',
    },
    macroFill: {
        height: '100%',
        borderRadius: 10,
    },
    percentageText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        fontFamily: Typography.fontFamily.bold,
        marginLeft: 6, // Spacing from the colored bar
    },
    macroValue: {
        fontSize: 14,
        fontFamily: Typography.fontFamily.bold,
    },
    macroLabel: {
        fontSize: 14,
        fontFamily: Typography.fontFamily.medium,
    },
});
