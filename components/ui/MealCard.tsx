import i18n from '../../config/i18n';
import { useLanguage } from '../../context/LanguageContext';

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from './GlassView';
import { SoftCard } from './SoftCard';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Meal } from '../../types/Diet';

interface MealCardProps {
    meal: Meal;
    index: number;
    onSwap?: () => void;
}

export const MealCard: React.FC<MealCardProps> = ({ meal, index, onSwap }) => {
    const { language } = useLanguage();
    const [expanded, setExpanded] = useState(false);
    const rotation = useSharedValue(0);

    const toggleExpand = () => {
        setExpanded(!expanded);
        rotation.value = withTiming(expanded ? 0 : 180);
    };

    const arrowStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${rotation.value}deg` }],
        };
    });

    const bodyStyle = useAnimatedStyle(() => {
        return {
            height: expanded ? 'auto' : 0,
            opacity: withTiming(expanded ? 1 : 0),
        };
    });

    const getMealIcon = (type: string) => {
        // ... existing switch logic (placeholder if not visible)
        // Note: The previous view view didn't show the body, but assuming standard logic. 
        // Actually, let's just properly close the function and move logic inside.
        return 'restaurant';
    };

    // Helper to translate meal type (moved inside to access i18n scope cleanly, though it was fine outside)
    const getTranslatedMealType = (type: string) => {
        const t = type.toLowerCase();
        if (t.includes('colazione') || t.includes('breakfast')) return i18n.t('nutrition.mealTypes.breakfast');
        if (t.includes('pranzo') || t.includes('lunch')) return i18n.t('nutrition.mealTypes.lunch');
        if (t.includes('cena') || t.includes('dinner')) return i18n.t('nutrition.mealTypes.dinner');
        if (t.includes('spuntino') || t.includes('snack') || t.includes('merenda')) return i18n.t('nutrition.mealTypes.snack');
        return type; // Fallback
    };

    // Android: Use standard State rendering to avoid Reanimated freeze
    if (Platform.OS === 'android') {
        return (
            <TouchableOpacity activeOpacity={0.9} onPress={() => setExpanded(!expanded)} style={styles.container}>
                <SoftCard style={styles.cardContainer}>
                    <View style={[styles.cardContent, { backgroundColor: 'rgba(30,30,30,0.95)' }]}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                <View style={styles.typeBadge}>
                                    <Text style={styles.typeText}>{getTranslatedMealType(meal.type)}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.caloriesText}>{meal.calories} {i18n.t('nutrition.calories')}</Text>
                                    <View style={{ marginLeft: 8 }}>
                                        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color="rgba(255,255,255,0.6)" />
                                    </View>
                                </View>
                            </View>
                        </View>

                        <Text style={styles.mealName}>{meal.name}</Text>

                        {/* Macros Badges (Visible always) */}
                        <View style={styles.macrosRow}>
                            <View style={[styles.macroBadge, { backgroundColor: 'rgba(79, 195, 247, 0.2)' }]}>
                                <Text style={[styles.macroText, { color: '#4FC3F7' }]}>{meal.macros.protein}g {i18n.t('nutrition.protein')}</Text>
                            </View>
                            <View style={[styles.macroBadge, { backgroundColor: 'rgba(46, 204, 113, 0.2)' }]}>
                                <Text style={[styles.macroText, { color: '#2ecc71' }]}>{meal.macros.carbs}g {i18n.t('nutrition.carbs')}</Text>
                            </View>
                            <View style={[styles.macroBadge, { backgroundColor: 'rgba(241, 196, 15, 0.2)' }]}>
                                <Text style={[styles.macroText, { color: '#f1c40f' }]}>{meal.macros.fats}g {i18n.t('nutrition.fats')}</Text>
                            </View>
                        </View>

                        {/* Expanded Content */}
                        {expanded && (
                            <View style={styles.body}>
                                <View style={styles.divider} />
                                <Text style={styles.sectionTitle}>{i18n.t('nutrition.ingredients')}</Text>
                                <View style={styles.ingredientsList}>
                                    {meal.ingredients.map((ing, i) => (
                                        <Text key={i} style={styles.ingredientText}>• {ing}</Text>
                                    ))}
                                </View>

                                {meal.description && (
                                    <>
                                        <Text style={[styles.sectionTitle, { marginTop: 12 }]}>{i18n.t('nutrition.preparation')}</Text>
                                        <Text style={styles.descriptionText}>{meal.description}</Text>
                                    </>
                                )}
                            </View>
                        )}
                    </View>
                </SoftCard>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity activeOpacity={0.9} onPress={toggleExpand} style={styles.container}>
            <SoftCard style={styles.cardContainer}>
                <GlassView intensity={40} tint="dark" style={styles.cardContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <View style={styles.typeBadge}>
                                <Text style={styles.typeText}>{getTranslatedMealType(meal.type)}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.caloriesText}>{meal.calories} {i18n.t('nutrition.calories')}</Text>
                                <Animated.View style={[arrowStyle, { marginLeft: 8 }]}>
                                    <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.6)" />
                                </Animated.View>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.mealName}>{meal.name}</Text>

                    {/* ... Action Row ... */}

                    {/* Macros Badges (Visible always) */}
                    <View style={styles.macrosRow}>
                        <View style={[styles.macroBadge, { backgroundColor: 'rgba(79, 195, 247, 0.2)' }]}>
                            <Text style={[styles.macroText, { color: '#4FC3F7' }]}>{meal.macros.protein}g {i18n.t('nutrition.protein')}</Text>
                        </View>
                        <View style={[styles.macroBadge, { backgroundColor: 'rgba(46, 204, 113, 0.2)' }]}>
                            <Text style={[styles.macroText, { color: '#2ecc71' }]}>{meal.macros.carbs}g {i18n.t('nutrition.carbs')}</Text>
                        </View>
                        <View style={[styles.macroBadge, { backgroundColor: 'rgba(241, 196, 15, 0.2)' }]}>
                            <Text style={[styles.macroText, { color: '#f1c40f' }]}>{meal.macros.fats}g {i18n.t('nutrition.fats')}</Text>
                        </View>
                    </View>

                    {/* Expanded Content */}
                    <Animated.View style={[styles.body, bodyStyle]}>
                        <View style={styles.divider} />
                        <Text style={styles.sectionTitle}>{i18n.t('nutrition.ingredients')}</Text>
                        <View style={styles.ingredientsList}>
                            {meal.ingredients.map((ing, i) => (
                                <Text key={i} style={styles.ingredientText}>• {ing}</Text>
                            ))}
                        </View>

                        {meal.description && (
                            <>
                                <Text style={[styles.sectionTitle, { marginTop: 12 }]}>{i18n.t('nutrition.preparation')}</Text>
                                <Text style={styles.descriptionText}>{meal.description}</Text>
                            </>
                        )}
                    </Animated.View>
                </GlassView>
            </SoftCard>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    cardContainer: {
        padding: 0,
        backgroundColor: 'transparent',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 20,
    },
    cardContent: {
        padding: 16,
    },
    header: {
        marginBottom: 8,
    },
    typeBadge: {
        backgroundColor: 'rgba(255, 177, 66, 0.2)', // Light Orange
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    typeText: {
        fontSize: 12,
        color: Colors.primary,
        fontFamily: Typography.fontFamily.bold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    caloriesText: {
        fontSize: 14,
        color: '#FFF',
        fontFamily: Typography.fontFamily.semiBold,
    },
    mealName: {
        fontSize: 18,
        color: '#FFF',
        fontFamily: Typography.fontFamily.bold,
        marginBottom: 12,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 8,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    macrosRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    macroBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Glassy default
    },
    macroText: {
        fontSize: 12,
        fontFamily: Typography.fontFamily.semiBold,
        color: 'rgba(255, 255, 255, 0.9)', // White default
    },
    body: {
        overflow: 'hidden',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontFamily: Typography.fontFamily.semiBold,
        color: '#FFF',
        marginBottom: 4,
    },
    ingredientsList: {
        marginLeft: 4,
    },
    ingredientText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        fontFamily: Typography.fontFamily.regular,
        lineHeight: 20,
    },
    descriptionText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        fontFamily: Typography.fontFamily.regular,
        lineHeight: 20,
    },
});
