import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { SoftCard } from '../../components/ui/SoftCard';
import { BlurView } from 'expo-blur'; import { Ionicons } from '@expo/vector-icons';
import { GlobalStyles } from '../../constants/GlobalStyles';

import { useRouter, useFocusEffect } from 'expo-router';
import { InfoModal } from '../../components/ui/InfoModal';
import { ShoppingListModal } from '../../components/ui/ShoppingListModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../../config/i18n';

// Services & Context
import { ProfileService } from '../../services/ProfileService';
import { AnalysisService } from '../../services/AnalysisService';
import { WellnessService } from '../../services/WellnessService';
import { useAnalysis } from '../../context/AnalysisContext';

import { LinearGradient } from 'expo-linear-gradient';
import { VitalScoreChart } from '../../components/ui/VitalScoreChart';
// Note: VitalScoreChart component is used here.

import { useLanguage } from '../../context/LanguageContext';

export default function Dashboard() {
    const router = useRouter();
    const { language } = useLanguage();
    const { results } = useAnalysis(); // Get analysis from context (or fetch if missing)

    // State for Data
    const [profile, setProfile] = useState<any>(null);
    const [dietPlan, setDietPlan] = useState<any>(null);
    const [strategy, setStrategy] = useState<any>(null);

    // Derived State
    const [healthScore, setHealthScore] = useState(0);
    const [criticalOrgansCount, setCriticalOrgansCount] = useState(0);
    const [nextMeal, setNextMeal] = useState<any>(null);
    const [nextMealIndex, setNextMealIndex] = useState<number>(-1);
    const [dailyMacros, setDailyMacros] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
    const [eatenMeals, setEatenMeals] = useState<number[]>([]);

    // Shopping List State
    const [shoppingListVisible, setShoppingListVisible] = useState(false);
    const [filteredShoppingListPlan, setFilteredShoppingListPlan] = useState<any>(null);

    // Load eaten meals state
    useEffect(() => {
        const loadEatenState = async () => {
            try {
                const today = new Date().toISOString().split('T')[0];
                const key = `eaten_meals_${today}`;
                const saved = await AsyncStorage.getItem(key);
                if (saved) {
                    setEatenMeals(JSON.parse(saved));
                } else {
                    // Reset if new day (or no key)
                    setEatenMeals([]);
                }
            } catch (e) {
                console.error("Failed to load eaten meals", e);
            }
        };
        loadEatenState();
    }, []);

    const markMealAsEaten = async (index: number) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const key = `eaten_meals_${today}`;
            const newEaten = [...eatenMeals, index];
            setEatenMeals(newEaten);
            await AsyncStorage.setItem(key, JSON.stringify(newEaten));

            // Re-calc next meal immediately
            // logic handled in existing effect dependent on eatenMeals
        } catch (e) {
            console.error("Failed to save eaten meal", e);
        }
    };

    const handleOpenDailyShoppingList = () => {
        if (!dietPlan) return;
        const dayIndex = new Date().getDay();
        const planDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        const todayPlan = dietPlan.days[planDayIndex];

        if (todayPlan) {
            // Create temp plan for modal
            const dailyPlan = { ...dietPlan, days: [todayPlan] };
            setFilteredShoppingListPlan(dailyPlan);
            setShoppingListVisible(true);
        } else {
            Alert.alert(i18n.t('dashboard.noPlanAlertTitle'), i18n.t('dashboard.noPlanAlertMessage'));
        }
    };

    // Info Modal State
    const [infoModalVisible, setInfoModalVisible] = useState(false);
    const [infoTitle, setInfoTitle] = useState('');
    const [infoMessage, setInfoMessage] = useState('');

    const showInfo = (title: string, message: string) => {
        setInfoTitle(title);
        setInfoMessage(message);
        setInfoModalVisible(true);
    };

    const loadData = async () => {
        const userProfile = await ProfileService.getProfile();
        setProfile(userProfile);

        // Analysis: Use Context or Fetch Last
        let analysisData = results;
        if (!analysisData) {
            analysisData = await AnalysisService.getLastAnalysis();
        }

        if (analysisData) {
            // 1. Calculate Score using the standard Vital Score method
            const score = AnalysisService.calculateVitalScore(analysisData);
            setHealthScore(score);

            // 2. Organ Status
            const { status } = WellnessService.calculateOrganStatus(analysisData);
            const issues = Object.values(status).filter(s => s === 'warning' || s === 'critical').length;
            setCriticalOrgansCount(issues);

            // 3. Strategy Targets
            if (userProfile) {
                const strat = AnalysisService.calculateNutritionalStrategy(userProfile);
                setStrategy(strat);
            }
        }

        // Diet Plan
        const savedPlan = await ProfileService.getDietPlan();
        if (savedPlan && savedPlan.days) {
            setDietPlan(savedPlan);

            // 4. Next Meal & Daily Macros
            // ... (Logic remains same, just ensuring data consistency)
            const dayIndex = new Date().getDay(); // 0 is Sunday
            // Adjust for array index 0-6 where 0 might be Monday? DietPlan usually day 1 = Monday
            // Let's map JS Day 0 (Sun) -> Plan Day 7, Day 1 (Mon) -> Plan Day 1
            let planDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
            const todayPlan = savedPlan.days[planDayIndex];

            if (todayPlan) {
                // Calculate Totals
                let cal = 0, p = 0, c = 0, f = 0;
                todayPlan.meals.forEach((m: any) => {
                    cal += m.calories;
                    p += m.protein;
                    c += m.carbs;
                    f += m.fats;
                });
                setDailyMacros({ calories: cal, protein: p, carbs: c, fats: f });

                // Find Next Meal based on sequential completion
                // Filter out eaten meals, take the first one
                const meals = todayPlan.meals;
                const remainingMeals = meals.map((m: any, i: number) => ({ ...m, realIndex: i }))
                    .filter((m: any) => !eatenMeals.includes(m.realIndex));

                if (remainingMeals.length > 0) {
                    setNextMeal(remainingMeals[0]);
                    setNextMealIndex(remainingMeals[0].realIndex);
                } else {
                    setNextMeal(null); // All eaten
                }
            }
        }
    };

    useEffect(() => {
        if (dietPlan) {
            // Re-run logic when dietPlan or eatenMeals changes
            // Need to duplicate logic or extract it? 
            // Simplest is to copy the specific nextMeal finding part here
            const dayIndex = new Date().getDay();
            let planDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
            const todayPlan = dietPlan.days[planDayIndex];
            if (todayPlan) {
                const meals = todayPlan.meals;
                const remainingMeals = meals.map((m: any, i: number) => ({ ...m, realIndex: i }))
                    .filter((m: any) => !eatenMeals.includes(m.realIndex));

                if (remainingMeals.length > 0) {
                    setNextMeal(remainingMeals[0]);
                    setNextMealIndex(remainingMeals[0].realIndex);
                } else {
                    setNextMeal(null);
                }
            }
        }
    }, [dietPlan, eatenMeals]);

    useFocusEffect(
        React.useCallback(() => {
            loadData();
        }, [results])
    );

    const userName = profile?.name?.split(' ')[0] || 'Utente';
    // Randomized tip for now (or could be fetched)
    const dailyTip = i18n.t('dashboard.dailyTip'); // Can randomize later

    return (
        <ImageBackground
            source={require('../../assets/images/custom_bg.jpg')}
            style={styles.container}
            resizeMode="cover"
        >
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>



                    {/* 1. HEADER PERSONALE */}
                    {/* 1. HEADER PERSONALE */}
                    <View style={[GlobalStyles.headerContainer, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={GlobalStyles.headerTitle}>{i18n.t('dashboard.greeting', { name: userName })}</Text>
                            <Text style={GlobalStyles.headerSubtitle}>{new Date().toLocaleDateString(i18n.locale, { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity
                                style={styles.settingsButton}
                                onPress={() => router.push('/settings')}
                            >
                                <Ionicons name="settings-outline" size={24} color="#FFF" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/(tabs)/profile')}>
                                <View style={styles.avatarPlaceholder}>
                                    {profile?.profilePicture ? (
                                        <Image
                                            source={{ uri: profile.profilePicture }}
                                            style={styles.avatarImage}
                                        />
                                    ) : (
                                        <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 2. VITAL SCORE (Credit Card Style) */}
                    <SoftCard style={[styles.vitalCard, { padding: 0, borderWidth: 0 }]}>
                        <LinearGradient
                            colors={['#1a2a6c', '#b21f1f', '#fdbb2d']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
                        />

                        {/* Content Overlay */}
                        <View style={{ padding: 24, flex: 1, justifyContent: 'space-between', zIndex: 10 }}>
                            {/* Header Row */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={styles.vitalTitle}>{i18n.t('dashboard.vitalScoreTitle')}</Text>
                                <TouchableOpacity
                                    onPress={() => showInfo(
                                        i18n.t('dashboard.vitalScoreTitle'),
                                        i18n.t('dashboard.vitalScoreInfo')
                                    )}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons name="information-circle-outline" size={24} color="rgba(255,255,255,0.8)" />
                                </TouchableOpacity>
                            </View>

                            {/* Score & Bar */}
                            <View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                        <Text style={{ color: '#FFF', fontSize: 42, fontFamily: Typography.fontFamily.bold }}>{healthScore}</Text>
                                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18, fontFamily: Typography.fontFamily.medium, marginLeft: 4 }}>/100</Text>
                                    </View>

                                    {/* Link Moved Here */}
                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}
                                        onPress={() => router.push('/(tabs)/biomarkers')}
                                    >
                                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontFamily: Typography.fontFamily.medium, marginRight: 4 }}>{i18n.t('common.view')}</Text>
                                        <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.9)" />
                                    </TouchableOpacity>
                                </View>

                                {/* Linear Progress Bar */}
                                <View style={{ height: 12, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6, overflow: 'hidden' }}>
                                    <LinearGradient
                                        colors={['#FF453A', '#FFD60A', '#32D74B']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={{ width: `${healthScore}%`, height: '100%', borderRadius: 6 }}
                                    />
                                </View>
                            </View>
                        </View>
                    </SoftCard>

                    {/* 3. STATO ORGANI (Redesigned) */}
                    <SoftCard style={[styles.vitalCard, { height: 170, padding: 0, overflow: 'hidden', borderWidth: 0 }]}>
                        <LinearGradient
                            colors={['#1e3c72', '#9b59b6', '#fdbb2d']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={{ padding: 20, flex: 1 }}>
                            <View style={styles.row}>
                                <View style={{ zIndex: 10, flex: 1 }}>
                                    <Text style={[styles.vitalTitle, { fontSize: 24 }]}>{i18n.t('dashboard.healthMapTitle')}</Text>
                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}
                                        onPress={() => router.push('/(tabs)/wellness')}
                                    >
                                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontFamily: Typography.fontFamily.medium, marginRight: 4 }}>{i18n.t('common.view')}</Text>
                                        <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.9)" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                        {/* Image anchored strictly to bottom of the CARD */}
                        <Image
                            source={require('../../assets/images/body_map.png')}
                            style={{ width: 140, height: 190, position: 'absolute', right: -10, bottom: -20, resizeMode: 'contain' }}
                        />
                    </SoftCard>

                    {/* 4. STRATEGIA NUTRIZIONALE (Redesigned) */}
                    <SoftCard style={[styles.vitalCard, { height: 'auto', padding: 0, overflow: 'hidden', borderWidth: 0 }]}>
                        <LinearGradient
                            colors={['#11998e', '#f2994a', '#f6d365']} // Green, Orange, Yellow
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={{ padding: 24 }}>
                            {/* Header */}
                            {/* Header */}
                            <View style={{ marginBottom: 16 }}>
                                {/* Row 1: Title + Info */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <Text style={[styles.vitalTitle, { fontSize: 22 }]}>{i18n.t('dashboard.nutritionStrategyTitle')}</Text>
                                    <TouchableOpacity
                                        onPress={() => showInfo(
                                            i18n.t('dashboard.nutritionStrategyTitle'),
                                            i18n.t('dashboard.nutritionStrategyInfo')
                                        )}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Ionicons name="information-circle-outline" size={24} color="rgba(255,255,255,0.8)" />
                                    </TouchableOpacity>
                                </View>

                                {/* Row 2: Subtitle + Shopping List Button */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={styles.vitalSubtitle}>{i18n.t('dashboard.dailyGoals')}</Text>

                                    <TouchableOpacity
                                        onPress={handleOpenDailyShoppingList}
                                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}
                                    >
                                        <Ionicons name="cart-outline" size={14} color="#FFF" style={{ marginRight: 4 }} />
                                        <Text style={{ color: '#FFF', fontSize: 12, fontFamily: Typography.fontFamily.medium }}>{i18n.t('dashboard.dailyShopping')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Main Content: 2 Columns */}
                            {strategy ? (() => {
                                const targetCals = strategy.goalCalories || 2000;
                                const pGram = Math.round((targetCals * (strategy.macros?.protein || 30) / 100) / 4);
                                const cGram = Math.round((targetCals * (strategy.macros?.carbs || 40) / 100) / 4);
                                const fGram = Math.round((targetCals * (strategy.macros?.fats || 30) / 100) / 9);

                                return (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        {/* Left Column: Stats */}
                                        <View style={{ flex: 1, paddingRight: 10 }}>
                                            {/* Calories */}
                                            <View style={{ marginBottom: 12 }}>
                                                <Text style={{ fontSize: 32, fontFamily: Typography.fontFamily.bold, color: '#FFF' }}>
                                                    {targetCals} <Text style={{ fontSize: 16, fontFamily: Typography.fontFamily.medium, opacity: 0.8 }}>kcal</Text>
                                                </Text>
                                            </View>

                                            {/* Macros Row */}
                                            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', gap: 16 }}>
                                                <View>
                                                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: Typography.fontFamily.medium, marginBottom: 2 }}>Carb</Text>
                                                    <Text style={{ fontSize: 16, color: '#FFF', fontFamily: Typography.fontFamily.bold }}>{cGram}g</Text>
                                                </View>
                                                <View>
                                                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: Typography.fontFamily.medium, marginBottom: 2 }}>Prot</Text>
                                                    <Text style={{ fontSize: 16, color: '#FFF', fontFamily: Typography.fontFamily.bold }}>{pGram}g</Text>
                                                </View>
                                                <View>
                                                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: Typography.fontFamily.medium, marginBottom: 2 }}>Fat</Text>
                                                    <Text style={{ fontSize: 16, color: '#FFF', fontFamily: Typography.fontFamily.bold }}>{fGram}g</Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Right Column: Image */}
                                        <View>
                                            <Image
                                                source={require('../../assets/images/meal.png')}
                                                style={{ width: 150, height: 150, resizeMode: 'contain' }}
                                            />
                                        </View>
                                    </View>
                                );
                            })() : (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <ActivityIndicator color="#FFF" />
                                </View>
                            )}

                            {/* 5. PROSSIMO PASTO (Nested - Map Page Style / Glass) */}
                            <SoftCard style={[styles.vitalCard, { height: 'auto', minHeight: 180, marginTop: 24, marginBottom: 0, padding: 0, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'transparent', marginHorizontal: 10 }]}>
                                <BlurView
                                    intensity={60}
                                    tint="dark"
                                    style={StyleSheet.absoluteFill}
                                   
                                />
                                <View style={{ padding: 24 }}>
                                    {/* Title Inside */}
                                    <Text style={[styles.vitalTitle, { fontSize: 22, marginBottom: 16 }]}>{i18n.t('dashboard.nextMeal')}</Text>

                                    {/* Logic: Show Next Meal OR Success if all eaten */}
                                    {dietPlan && !nextMeal && eatenMeals.length > 0 ? (
                                        // SUCCESS STATE: All meals eaten
                                        <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center' }}>
                                            <View style={{
                                                width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(76, 175, 80, 0.2)',
                                                alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                                                borderWidth: 1, borderColor: 'rgba(76, 175, 80, 0.5)'
                                            }}>
                                                <Ionicons name="checkmark" size={30} color="#4caf50" />
                                            </View>
                                            <Text style={[styles.vitalTitle, { fontSize: 18, marginBottom: 4, textAlign: 'center' }]}>{i18n.t('dashboard.goalsCompleted')}</Text>
                                            <Text style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontSize: 13 }}>
                                                {i18n.t('dashboard.allMealsEaten')}
                                            </Text>
                                        </View>
                                    ) : nextMeal ? (
                                        // SHOW NEXT MEAL
                                        <View>
                                            <View style={styles.mealHeader}>
                                                <View style={styles.mealTag}>
                                                    <Text style={styles.mealTagText}>{nextMeal.type.toUpperCase()}</Text>
                                                </View>
                                                <Text style={styles.mealKcal}>{nextMeal.calories} kcal</Text>
                                            </View>
                                            {/* Reduced Font Size */}
                                            <Text style={[styles.mealName, { fontSize: 16, marginBottom: 16 }]}>{nextMeal.name}</Text>

                                            <TouchableOpacity
                                                style={[styles.actionButton, { paddingVertical: 10, borderRadius: 12, width: '100%', backgroundColor: '#2ecc71' }]}
                                                onPress={() => markMealAsEaten(nextMealIndex)}
                                            >
                                                <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                                                <Text style={[styles.actionButtonText, { fontSize: 13 }]}>{i18n.t('dashboard.markAsEaten')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        // NO PLAN
                                        <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center' }}>
                                            <Ionicons name="restaurant-outline" size={24} color="rgba(255,255,255,0.3)" style={{ marginBottom: 6 }} />
                                            <Text style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 12 }}>{i18n.t('dashboard.noPlan')}</Text>
                                        </View>
                                    )}
                                </View>
                            </SoftCard>

                            {/* Nutrition Link */}
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 16 }}
                                onPress={() => router.push('/(tabs)/nutrition')}
                            >
                                <Text style={{ color: '#FFF', fontFamily: Typography.fontFamily.medium, marginRight: 4 }}>{i18n.t('common.view')}</Text>
                                <Ionicons name="chevron-forward" size={16} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </SoftCard>





                    {/* Legal Links Footer */}
                    <View style={styles.legalContainer}>
                        <TouchableOpacity onPress={() => router.push('/legal/privacy')} style={styles.legalLinkContainer}>
                            <Text style={styles.legalLink}>{i18n.t('settings.privacy')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/legal/terms')} style={styles.legalLinkContainer}>
                            <Text style={styles.legalLink}>{i18n.t('settings.terms')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/settings/disclaimer')} style={styles.legalLinkContainer}>
                            <Text style={styles.legalLink}>{i18n.t('settings.disclaimer')}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </SafeAreaView>

            {/* Info Modal placed here to ensure it overlays everything */}
            <InfoModal
                visible={infoModalVisible}
                onClose={() => setInfoModalVisible(false)}
                title={infoTitle}
                message={infoMessage}
            />

            <ShoppingListModal
                visible={shoppingListVisible}
                onClose={() => {
                    setShoppingListVisible(false);
                    setFilteredShoppingListPlan(null);
                }}
                dietPlan={filteredShoppingListPlan || dietPlan}
            />
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    greeting: {
        fontSize: 28,
        fontFamily: Typography.fontFamily.bold, // e.g. Poppins-Bold
        color: '#FFF',
    },
    date: {
        fontSize: 14,
        fontFamily: Typography.fontFamily.regular,
        color: 'rgba(255,255,255,0.6)',
        textTransform: 'capitalize',
        marginTop: 4,
    },
    settingsButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    profileButton: {},
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden', // Ensure image clips to border radius
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    avatarText: {
        fontSize: 20,
        fontFamily: Typography.fontFamily.bold,
        color: '#FFF',
    },
    sectionHeaderContainer: {
        marginBottom: 16,
        marginTop: 24,
    },
    sectionHeader: {
        fontSize: 18,
        fontFamily: Typography.fontFamily.bold,
        color: '#FFF',
    },
    // Glass Card Style (Mappa Style)
    glassCard: {
        backgroundColor: 'rgba(30, 41, 59, 0.7)', // Darker semi-transparent
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderRadius: 20,
        // If SoftCard supports 'blur', we might need to pass a prop, but styling wise this mimics it.
        // Assuming SoftCard wraps children in BlurView if configured, or we just rely on semi-transparent bg.
        padding: 0, // Reset padding if overriding
    },
    // Score Card
    scoreCard: {
        padding: 24,
    },
    scoreContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    scoreCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    scoreNumber: {
        fontSize: 28,
        fontFamily: Typography.fontFamily.bold,
        color: '#FFF',
    },
    scoreLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
    },
    vitalCard: {

        height: 170,
        marginBottom: 20,
        marginHorizontal: 20,
        backgroundColor: 'transparent',
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    vitalTitle: {
        color: '#FFF',
        fontSize: 24,
        fontFamily: Typography.fontFamily.bold,
        marginBottom: 4,
    },
    vitalSubtitle: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
        fontFamily: Typography.fontFamily.medium,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text,
        marginBottom: 12,
        marginLeft: 4,
    },
    cardTitle: {
        fontSize: 20,
        fontFamily: Typography.fontFamily.bold,
        color: '#FFF',
    },
    cardSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 6,
        fontFamily: Typography.fontFamily.medium,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    // Map Preview
    mapPreviewCard: {
        padding: 20,
    },
    mapRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    smallButton: {
        marginTop: 16,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    smallButtonText: {
        color: '#FFF',
        fontSize: 13,
        fontFamily: Typography.fontFamily.medium,
    },
    // Nutrition
    row: {
        flexDirection: 'row',
    },
    halfCard: {
        flex: 1,
        padding: 20,
        justifyContent: 'space-between',
        minHeight: 140,
    },
    statValue: {
        fontSize: 26,
        fontFamily: Typography.fontFamily.bold,
        color: '#FFF',
    },
    statLabel: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
    },
    miniBarBg: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        width: '100%',
    },
    miniBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    macroRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        alignItems: 'center',
    },
    macroLabel: {
        fontSize: 13,
        fontFamily: Typography.fontFamily.medium,
    },
    macroValue: {
        fontSize: 13,
        color: '#FFF',
        fontFamily: Typography.fontFamily.bold,
    },
    // Meal
    mealCard: {
        padding: 24,
    },
    mealHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        alignItems: 'center',
    },
    mealTag: {
        backgroundColor: 'rgba(255, 177, 66, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 177, 66, 0.3)',
    },
    mealTagText: {
        color: '#FFB142',
        fontSize: 11,
        fontFamily: Typography.fontFamily.bold,
        textTransform: 'uppercase',
    },
    mealKcal: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
        fontFamily: Typography.fontFamily.medium,
    },
    mealName: {
        fontSize: 20,
        color: '#FFF',
        fontFamily: Typography.fontFamily.bold,
        marginBottom: 20,
        lineHeight: 28,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        borderRadius: 16,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontFamily: Typography.fontFamily.bold,
    },
    legalContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10,
        gap: 12,
    },
    legalLinkContainer: {
        paddingVertical: 4,
    },
    legalLink: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.5)',
        fontFamily: Typography.fontFamily.medium,
    },
    // Actions Grid
    section: {
        marginBottom: 0,
        marginHorizontal: 20,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginHorizontal: 20,
    },
    actionItem: {
        width: '23%',
        alignItems: 'center',
        marginBottom: 10,
    },
    actionIconCard: {
        width: 56,
        height: 56,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    actionLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 11,
        textAlign: 'center',
        fontFamily: Typography.fontFamily.medium,
    },
    // Tip
    tipCard: {
        padding: 20,
        backgroundColor: 'rgba(255, 241, 118, 0.05)',
        borderColor: 'rgba(255, 241, 118, 0.2)',
        borderWidth: 1,
        marginHorizontal: 20,
    },
    tipText: {
        fontSize: 15,
        fontStyle: 'italic',
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 24,
        fontFamily: Typography.fontFamily.medium,
    },
    tipLabel: {
        fontSize: 11,
        color: '#f1c40f',
        fontFamily: Typography.fontFamily.bold,
        marginBottom: 6,
        letterSpacing: 1,
    },
    actionCard: {
        width: 100,
        height: 100,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 0,
        overflow: 'hidden',
        padding: 10,
    },
    actionText: {
        color: '#FFF',
        fontSize: 12,
        fontFamily: Typography.fontFamily.bold,
        textAlign: 'center',
    },
});
