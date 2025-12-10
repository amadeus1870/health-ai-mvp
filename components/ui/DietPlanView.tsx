import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { DietPlan, DayPlan, Meal } from '../../types/Diet';
import { MealCard } from './MealCard';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { SoftCard } from './SoftCard';
import i18n from '../../config/i18n';

const { width } = Dimensions.get('window');

interface DietPlanViewProps {
    plan: DietPlan;
    onSwapMeal?: (meal: Meal, day: number, mealIndex: number) => void;
    onDailyShoppingList?: (day: number) => void;
}

export const DietPlanView: React.FC<DietPlanViewProps> = ({ plan, onSwapMeal, onDailyShoppingList }) => {
    const [selectedDay, setSelectedDay] = useState<number>(1);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        if (plan && plan.days.length > 0) {
            console.log("DietPlanView received plan:", JSON.stringify(plan.days.map(d => ({ day: d.day, type: typeof d.day }))));
        }
    }, [plan]);

    // plan.days might be incomplete during generation
    const currentDayPlan = plan.days.find(d => Number(d.day) === selectedDay);





    const renderTimelineItem = (day: number) => {
        const dayPlan = plan.days.find(d => Number(d.day) === day);
        const isGenerated = !!dayPlan;
        const isSelected = day === selectedDay;
        const dayNames = i18n.t('common.days.short') as unknown as string[];
        const dayName = dayNames[(day - 1) % 7];

        return (
            <TouchableOpacity
                key={day}
                onPress={() => isGenerated && setSelectedDay(day)}
                activeOpacity={isGenerated ? 0.7 : 1}
                disabled={!isGenerated}
            >
                <SoftCard style={[
                    styles.timelineItem,
                    isSelected && styles.timelineItemActive,
                    !isGenerated && styles.timelineItemDisabled
                ]}>
                    <BlurView intensity={isSelected ? 60 : 40} tint="dark" style={styles.timelineContentInner}>
                        <Text style={[styles.dayName, isSelected && styles.textActive, !isGenerated && styles.textDisabled]}>{dayName}</Text>
                        <Text style={[styles.dayNumber, isSelected && styles.textActive, !isGenerated && styles.textDisabled]}>{day}</Text>
                        {!isGenerated && (
                            <View style={styles.loadingDot} />
                        )}
                    </BlurView>
                </SoftCard>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Timeline */}
            <View style={styles.timelineContainer}>
                <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.timelineContent}
                >
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => renderTimelineItem(day))}
                </ScrollView>
            </View>

            {/* Meals List */}
            <View style={styles.mealsContainer}>
                {currentDayPlan ? (
                    <>
                        <View style={styles.dayHeaderRow}>
                            <Text style={styles.dayTitle}>
                                {i18n.t('nutrition.day')} {selectedDay} - {(i18n.t('common.days.long') as unknown as string[])[(selectedDay - 1) % 7]}
                            </Text>
                            {onDailyShoppingList && (
                                <TouchableOpacity
                                    onPress={() => onDailyShoppingList(selectedDay)}
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        borderRadius: 12,
                                        paddingHorizontal: 12,
                                        paddingVertical: 6,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Ionicons name="cart-outline" size={16} color="#FFF" />
                                    <Text style={{
                                        color: '#FFF',
                                        fontFamily: Typography.fontFamily.bold,
                                        fontSize: 12,
                                        marginLeft: 6
                                    }}>
                                        {i18n.t('nutrition.day')}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {currentDayPlan.meals.map((meal, index) => (
                            <MealCard
                                key={index}
                                meal={meal}
                                index={index}
                                onSwap={onSwapMeal ? () => onSwapMeal(meal, selectedDay, index) : undefined}
                            />
                        ))}
                    </>
                ) : (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>{i18n.t('nutrition.generatingDay', { day: selectedDay })}</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        marginBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontFamily: Typography.fontFamily.bold,
        color: '#FFF',
    },
    subtitle: {
        fontSize: 14,
        fontFamily: Typography.fontFamily.medium,
        color: 'rgba(255,255,255,0.7)',
    },
    timelineContainer: {
        marginBottom: 24,
    },
    timelineContent: {
        paddingHorizontal: 20,
        gap: 12,
    },
    timelineItem: {
        width: 60,
        height: 70,
        borderRadius: 16,
        padding: 0,
        backgroundColor: 'rgba(255,255,255,0.1)', // Glassy background like history item
        overflow: 'hidden',
        borderWidth: 0, // Removed default border
    },
    timelineContentInner: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timelineItemActive: {
        backgroundColor: 'rgba(255, 177, 66, 0.15)', // Orange tint
        borderWidth: 1,
        borderColor: '#FFB142',
    },
    timelineItemDisabled: {
        opacity: 0.5,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    dayName: {
        fontSize: 12,
        fontFamily: Typography.fontFamily.medium,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 4,
    },
    dayNumber: {
        fontSize: 18,
        fontFamily: Typography.fontFamily.bold,
        color: '#FFF',
    },
    textActive: {
        color: '#FFB142', // Orange text
    },
    textDisabled: {
        color: 'rgba(255,255,255,0.3)',
    },
    loadingDot: {
        position: 'absolute',
        bottom: 6,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.primary,
    },
    mealsContainer: {
        paddingHorizontal: 20,
    },
    dayHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    dayTitle: {
        fontSize: 16,
        fontFamily: Typography.fontFamily.semiBold,
        color: 'rgba(255,255,255,0.8)',
    },
    dailyShopButton: {
        width: 40,
        height: 40,
        backgroundColor: Colors.primary,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: 'rgba(255,255,255,0.6)',
        fontFamily: Typography.fontFamily.medium,
    }
});
