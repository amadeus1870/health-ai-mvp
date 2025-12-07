import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import Animated, { useAnimatedStyle, withTiming, useSharedValue, interpolate, Extrapolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Meal } from '../../types/Diet';
import { BlurView } from 'expo-blur';
import { SoftCard } from './SoftCard';

interface MealCardProps {
    meal: Meal;
    index: number;
    onSwap?: () => void;
}

export const MealCard: React.FC<MealCardProps> = ({ meal, index, onSwap }) => {
    const [expanded, setExpanded] = useState(false);
    const animation = useSharedValue(0);

    const toggleExpand = () => {
        const target = expanded ? 0 : 1;
        animation.value = withTiming(target, { duration: 300 });
        setExpanded(!expanded);
    };

    const bodyStyle = useAnimatedStyle(() => {
        return {
            maxHeight: interpolate(animation.value, [0, 1], [0, 1000], Extrapolate.CLAMP),
            opacity: animation.value,
            marginTop: interpolate(animation.value, [0, 1], [0, 10], Extrapolate.CLAMP),
        };
    });

    const arrowStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${interpolate(animation.value, [0, 1], [0, 180])}deg` }],
        };
    });

    const getMealIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'colazione': return 'cafe-outline';
            case 'spuntino': return 'nutrition-outline';
            case 'pranzo': return 'restaurant-outline';
            case 'merenda': return 'ice-cream-outline';
            case 'cena': return 'moon-outline';
            default: return 'restaurant-outline';
        }
    };

    return (
        <TouchableOpacity activeOpacity={0.9} onPress={toggleExpand} style={styles.container}>
            <SoftCard style={styles.cardContainer}>
                <BlurView intensity={40} tint="dark" style={styles.cardContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <View style={styles.typeBadge}>
                                <Text style={styles.typeText}>{meal.type}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.caloriesText}>{meal.calories} kcal</Text>
                                <Animated.View style={[arrowStyle, { marginLeft: 8 }]}>
                                    <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.6)" />
                                </Animated.View>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.mealName}>{meal.name}</Text>

                    {/* Action Row */}
                    <View style={styles.actionRow}>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            {onSwap && (
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        onSwap();
                                    }}
                                    style={styles.actionButton}
                                >
                                    <Ionicons name="swap-horizontal" size={20} color={Colors.primary} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Macros Badges (Visible always) */}
                    <View style={styles.macrosRow}>
                        <View style={[styles.macroBadge, { backgroundColor: 'rgba(79, 195, 247, 0.2)' }]}>
                            <Text style={[styles.macroText, { color: '#4FC3F7' }]}>{meal.macros.protein}g Prot</Text>
                        </View>
                        <View style={[styles.macroBadge, { backgroundColor: 'rgba(46, 204, 113, 0.2)' }]}>
                            <Text style={[styles.macroText, { color: '#2ecc71' }]}>{meal.macros.carbs}g Carb</Text>
                        </View>
                        <View style={[styles.macroBadge, { backgroundColor: 'rgba(241, 196, 15, 0.2)' }]}>
                            <Text style={[styles.macroText, { color: '#f1c40f' }]}>{meal.macros.fats}g Gras</Text>
                        </View>
                    </View>

                    {/* Expanded Content */}
                    <Animated.View style={[styles.body, bodyStyle]}>
                        <View style={styles.divider} />
                        <Text style={styles.sectionTitle}>Ingredienti</Text>
                        <View style={styles.ingredientsList}>
                            {meal.ingredients.map((ing, i) => (
                                <Text key={i} style={styles.ingredientText}>• {ing}</Text>
                            ))}
                        </View>

                        {meal.description && (
                            <>
                                <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Preparazione</Text>
                                <Text style={styles.descriptionText}>{meal.description}</Text>
                            </>
                        )}
                    </Animated.View>
                </BlurView>
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
