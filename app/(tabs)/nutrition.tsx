import { useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground, ActivityIndicator, RefreshControl, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { ProfileService } from '../../services/ProfileService';
import { AnalysisService } from '../../services/AnalysisService';
import { UserProfile, initialUserProfile } from '../../types/Profile';
import { BMICard, CaloriesCard, MacrosCard } from '../../components/ui/NutritionCards';
import { InfoModal } from '../../components/ui/InfoModal';
import { Ionicons } from '@expo/vector-icons';
import { generateDayDiet, reAnalyzeBiomarkers } from '../../services/gemini';
import { LoadingEntertainment } from '../../components/ui/LoadingEntertainment';
import { DietStrategyCards } from '../../components/ui/DietStrategyCards';
import { useAnalysis } from '../../context/AnalysisContext';
import { useLanguage } from '../../context/LanguageContext';
import { DietPlanView } from '../../components/ui/DietPlanView';
import { DietPlan } from '../../types/Diet';
import { CustomAlert, AlertType } from '../../components/ui/CustomAlert';
import { SoftCard } from '../../components/ui/SoftCard';

import { ShoppingListModal } from '../../components/ui/ShoppingListModal';
import { NewAnalysisModal } from '../../components/ui/NewAnalysisModal';
import { MealSwapModal } from '../../components/ui/MealSwapModal';
import { Meal } from '../../types/Diet';
import { PdfService } from '../../services/PdfService';
import { LinearGradient } from 'expo-linear-gradient';
import { GlobalStyles } from '../../constants/GlobalStyles';
import i18n from '../../config/i18n';

// ... imports

export default function NutritionScreen() {
  const { isBackgroundUpdating, results, pendingProfileUpdate, setPendingProfileUpdate, setResults } = useAnalysis();
  const { language } = useLanguage();
  const isFirstRun = React.useRef(true);


  const [profile, setProfile] = useState<UserProfile>(initialUserProfile);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [strategy, setStrategy] = useState<any>(null);

  // Diet Plan State
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [loadingDiet, setLoadingDiet] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0); // 0 to 7
  const [loadingMessage, setLoadingMessage] = useState('');


  // Info Modal State
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoTitle, setInfoTitle] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  // Shopping List State
  const [shoppingListVisible, setShoppingListVisible] = useState(false);
  const [filteredShoppingListPlan, setFilteredShoppingListPlan] = useState<DietPlan | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type: AlertType;
    actions?: { text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }[];
  }>({ title: '', message: '', type: 'info' });

  const showAlert = (title: string, message: string, type: AlertType = 'info', actions?: any[]) => {
    setAlertConfig({ title, message, type, actions });
    setAlertVisible(true);
  };

  // Meal Swap State
  const [swapModalVisible, setSwapModalVisible] = useState(false);
  const [mealToSwap, setMealToSwap] = useState<{ meal: Meal, day: number, index: number } | null>(null);

  // New Analysis Modal State
  const [showNewAnalysisModal, setShowNewAnalysisModal] = useState(false);



  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSwapRequest = (meal: Meal, day: number, index: number) => {
    setMealToSwap({ meal, day, index });
    setSwapModalVisible(true);
  };

  const handleConfirmSwap = async (newMeal: Meal) => {
    if (!mealToSwap || !dietPlan) return;

    const newDietPlan = { ...dietPlan };
    const dayPlan = newDietPlan.days.find(d => d.day === mealToSwap.day);
    if (dayPlan) {
      dayPlan.meals[mealToSwap.index] = newMeal;
      setDietPlan(newDietPlan);
      await ProfileService.saveDietPlan(newDietPlan);
    }
    setSwapModalVisible(false);
    setMealToSwap(null);
  };

  const showInfo = (title: string, message: string) => {
    setInfoTitle(title);
    setInfoMessage(message);
    setInfoModalVisible(true);
  };

  const loadData = async (contextAnalysis: any | null = null) => {
    try {
      const userProfile = await ProfileService.getProfile();
      // Use context analysis if available, otherwise fetch last from DB
      const analysis = contextAnalysis || await AnalysisService.getLastAnalysis();
      const savedDietPlan = await ProfileService.getDietPlan();

      if (userProfile) {
        setProfile(userProfile);
        // Use centralized AnalysisService for calculations
        const stra = AnalysisService.calculateNutritionalStrategy(userProfile);
        setStrategy(stra);
      }

      if (savedDietPlan) {
        setDietPlan(savedDietPlan);
      }
    } catch (error) {
      console.error("Failed to load nutrition data", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDailyShoppingList = (day: number) => {
    if (!dietPlan) return;
    const dayPlan = dietPlan.days.find(d => d.day === day);
    if (dayPlan) {
      // Create a temporary plan with only this day
      const dailyPlan: DietPlan = {
        ...dietPlan,
        days: [dayPlan]
      };
      setFilteredShoppingListPlan(dailyPlan);
      setShoppingListVisible(true);
    }
  };

  const handleGenerateDiet = async (contextAnalysis: any | null = null) => {
    setLoadingDiet(true);
    setGenerationProgress(0);
    setLoadingMessage(i18n.t('nutrition.generating'));
    setDietPlan({ days: [] }); // Reset plan

    try {
      // Use context analysis if provided (fresh from upload), otherwise fetch last
      const analysis = contextAnalysis || await AnalysisService.getLastAnalysis();

      if (!analysis) {
        throw new Error(i18n.t('nutrition.noAnalysisError'));
      }

      let currentDays: any[] = [];

      // Incremental Generation Loop
      for (let day = 1; day <= 7; day++) {
        setLoadingMessage(i18n.t('nutrition.generatingDay', { day: day }));
        // Add delay to avoid hitting Gemini API rate limits (approx 15 RPM)
        if (day > 1) {
          await new Promise(resolve => setTimeout(resolve, 15000));
        }
        try {
          // Calculate strategy to get targets using centralized service
          const strategy = AnalysisService.calculateNutritionalStrategy(profile);

          // Generate single day with strict targets
          const rawDayPlan = await generateDayDiet(
            Number(day),
            profile,
            strategy.goalCalories,
            strategy.macros,
            currentDays,
            analysis,
            language
          );

          // Force correct day number and ensure it's a number
          const dayPlan = { ...rawDayPlan, day: Number(day) };

          // Add to local array (create new reference)
          currentDays = [...currentDays, dayPlan];

          // Create new plan object
          const newPlan = { days: currentDays, updatedAt: new Date().toISOString() };

          // Update state immediately to show progress
          setDietPlan(newPlan);
          setGenerationProgress(day);

          // Save progress
          await ProfileService.saveDietPlan(newPlan);

        } catch (error) {
          console.error(`Failed to generate day ${day}`, error);
          if (day === 1) throw error;
        }
      }

    } catch (error: any) {
      if (error.message === i18n.t('nutrition.noAnalysisError')) {
        showInfo(i18n.t('nutrition.noPlanTitle'), error.message);
      } else {
        console.error("Failed to generate diet plan", error);
        showInfo(i18n.t('nutrition.errorTitle'), i18n.t('nutrition.errorGenerate'));
      }
    } finally {
      setLoadingDiet(false);
      setLoadingMessage('');
    }
  };

  const handlePrintPdf = async () => {
    if (!dietPlan || !dietPlan.days || dietPlan.days.length === 0) {
      Alert.alert(i18n.t('nutrition.noPlanTitle'), i18n.t('nutrition.noPlanExport'));
      return;
    }
    setIsGeneratingPdf(true);
    try {
      // Small delay to allow UI to render the loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      await PdfService.generateAndShareDietPdf(dietPlan, profile, language);
    } catch (error) {
      Alert.alert(i18n.t('nutrition.errorTitle'), i18n.t('nutrition.errorPdf'));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // NEW: Handle both Analysis Update + Diet Gen
  const handleFullRegenerate = async () => {
    setLoadingDiet(true);
    setGenerationProgress(0); // Uses same progress bar, maybe repurpose for "Analysis" phase
    setLoadingMessage(i18n.t('nutrition.reanalyzing'));
    // Phase 1: Update Analysis
    try {
      const lastAnalysis = results || await AnalysisService.getLastAnalysis();
      if (lastAnalysis) {
        // Show some UI feedback for this phase? 
        // Currently LoadingEntertainment just shows "Sto generando..." 
        // We could rely on that generic loading state.


        const newAnalysis = await reAnalyzeBiomarkers(lastAnalysis, language);
        const newId = await AnalysisService.saveAnalysis(newAnalysis);

        // Update Global Context
        const updatedAnalysis = { ...newAnalysis, id: newId, timestamp: new Date().toISOString() };
        setResults(updatedAnalysis);

        // Phase 2: Generate Diet with NEW analysis
        // We call handleGenerateDiet but we need to pass the new analysis
        // But handleGenerateDiet also sets loadingDiet(true) etc. 
        // It's cleaner to just call the core loop here or refactor.
        // Refactoring: Let's reuse handleGenerateDiet logic but pass the analysis.
        // We'll just call handleGenerateDiet(updatedAnalysis) 
        // BUT we need to make sure handleGenerateDiet doesn't reset loading state prematurely if we were already loading?
        // Actually handleGenerateDiet sets loadingDiet(true) at start and false at end. perfect.
        await handleGenerateDiet(updatedAnalysis);

      } else {
        // No analysis to update? Just gen diet?
        await handleGenerateDiet();
      }

    } catch (error) {
      console.error("Full Regenerate Failed", error);
      showInfo(i18n.t('nutrition.errorTitle'), i18n.t('nutrition.updateFailed'));
      setLoadingDiet(false);
      setLoadingMessage('');
    } finally {
      // handleGenerateDiet handles the finally block for itself. 
      // If we crash before that, we need to ensure loading is off?
      // handleGenerateDiet will turn it off. 
    }
  };

  const handleOpenShoppingList = () => {
    if (!dietPlan) {
      Alert.alert(i18n.t('nutrition.noPlanTitle'), i18n.t('nutrition.noPlanShopping'));
      return;
    }
    setFilteredShoppingListPlan(null); // Show full list
    setShoppingListVisible(true);
  };

  const handleRegenerateDietAlert = () => {
    showAlert(
      i18n.t('nutrition.regenerateAlertTitle'),
      i18n.t('nutrition.regenerateAlertMessage'),
      "warning",
      [
        { text: i18n.t('common.cancel'), onPress: () => { }, style: "cancel" },
        { text: i18n.t('nutrition.regenerate'), onPress: handleGenerateDiet, style: "destructive" }
      ]
    );
  };

  const handleFullRegenerateAlert = () => {
    showAlert(
      i18n.t('nutrition.fullRegenerateAlertTitle'),
      i18n.t('nutrition.fullRegenerateAlertMessage'),
      "warning",
      [
        { text: i18n.t('common.cancel'), onPress: () => { }, style: "cancel" },
        { text: i18n.t('nutrition.fullRegenerate'), onPress: handleFullRegenerate, style: "destructive" }
      ]
    );
  };


  useEffect(() => {
    loadData();
  }, [language]);

  // Listen for new analysis results
  useEffect(() => {
    if (results) {

      // Use centralized logic
      const stra = AnalysisService.calculateNutritionalStrategy(profile);
      setStrategy(stra);

      // Check if we need to prompt for regeneration
      // Trigger if:
      // 1. No diet plan exists
      // 2. OR Analysis is newer than Diet Plan (using timestamps)
      const analysisTimestamp = results.timestamp ? new Date(results.timestamp).getTime() : 0;
      const planTimestamp = dietPlan?.updatedAt ? new Date(dietPlan.updatedAt).getTime() : 0;

      // If analysis is significantly newer (> 10 seconds to avoid race conditions)
      // or if we have results but no plan
      // AND we are not currently loading/generating a diet AND initial load is done
      if (!loading && !loadingDiet && ((!dietPlan || !dietPlan.days || dietPlan.days.length === 0) || (analysisTimestamp > planTimestamp + 10000))) {

        // setShowNewAnalysisModal(true);  // TEMPORARILY DISABLED FOR ANDROID DEBUGGING
      }
    }
  }, [results, dietPlan?.updatedAt, loadingDiet, loading, profile]); // Added profile dep as strategy depends on it


  // Check for Pending Profile Update (from Profile Screen)
  useFocusEffect(
    useCallback(() => {
      if (pendingProfileUpdate) {

        // setShowNewAnalysisModal(true);  // TEMPORARILY DISABLED FOR ANDROID DEBUGGING
        setPendingProfileUpdate(false); // Clear flag immediately so we don't loop
      }
    }, [pendingProfileUpdate])
  );

  useFocusEffect(
    useCallback(() => {
      if (isBackgroundUpdating) {
        // showInfo(
        //   i18n.t('nutrition.updatingTitle'),
        //   i18n.t('nutrition.updatingMessage')
        // );  // TEMPORARILY DISABLED FOR ANDROID DEBUGGING
      } else {
        loadData();
      }
    }, [isBackgroundUpdating])
  );

  if (loading) {
    return (
      <ImageBackground source={require('../../assets/images/custom_bg.jpg')} style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
        <CustomAlert
          visible={alertVisible}
          onClose={() => setAlertVisible(false)}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          actions={alertConfig.actions}
        />
      </ImageBackground>
    );
  }

  /* SAFE MODE REMOVED - RESTORING CONTENT WITH FIXES */
  return (
    <ImageBackground key={language} source={require('../../assets/images/custom_bg.jpg')} style={styles.container} resizeMode="cover">
      <SafeAreaView style={{ flex: 1 }}>
        {isBackgroundUpdating && (
          <TouchableOpacity
            style={styles.updatingBanner}
            activeOpacity={0.8}
            onPress={() => showInfo(
              i18n.t('nutrition.updatingTitle'),
              i18n.t('nutrition.updatingMessage')
            )}
          >
            <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 10 }} />
            <Text style={styles.updatingText}>{i18n.t('nutrition.updatingBannerText')}</Text>
          </TouchableOpacity>
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />}
        >


          <View style={GlobalStyles.headerContainer}>
            <Text style={GlobalStyles.headerTitle}>{i18n.t('nutrition.strategyTitle')}</Text>
            <Text style={GlobalStyles.headerSubtitle}>{i18n.t('nutrition.strategySubtitle')}</Text>
          </View>


          <View style={styles.sectionContainer}>


            {strategy && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselContent}
                decelerationRate="fast"
                snapToInterval={Dimensions.get('window').width * 0.85 + 16}
              >
                <DietStrategyCards
                  dietType={profile.dietType}
                  onInfoPress={showInfo}
                />
              </ScrollView>
            )}

            {strategy && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselContent}
                decelerationRate="fast"
                snapToInterval={Dimensions.get('window').width * 0.85 + 16}
              >
                <CaloriesCard
                  tdee={strategy.tdee}
                  goalCalories={strategy.goalCalories}
                  goalType={strategy.goalType}
                  onInfoPress={() => showInfo(
                    i18n.t('nutrition.caloriesTitle'),
                    i18n.t('nutrition.caloriesInfo')
                  )}
                />
                <MacrosCard
                  protein={strategy.macros.protein}
                  carbs={strategy.macros.carbs}
                  fats={strategy.macros.fats}
                  totalCalories={strategy.goalCalories} // Pass total calories here!
                  onInfoPress={() => showInfo(
                    i18n.t('nutrition.macrosTitle'),
                    i18n.t('nutrition.macrosInfo')
                  )}
                />
                <BMICard
                  bmi={strategy.bmi}
                  status={strategy.bmiStatus}
                  color={strategy.bmiColor}
                  onInfoPress={() => showInfo(
                    i18n.t('nutrition.bmiTitle'),
                    i18n.t('nutrition.bmiInfo')
                  )}
                />
              </ScrollView>
            )}
          </View>


          <View style={styles.sectionContainer}>
            <SoftCard style={[styles.dietPlanCard, { padding: 0, overflow: 'hidden', borderWidth: 0 }]}>
              <LinearGradient
                colors={['#11998e', '#11998e', '#f2994a', '#f6d365']} // Green (long), Orange, Yellow
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.dietPlanContent}>
                <View style={{ marginBottom: 16, paddingHorizontal: 20, paddingTop: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                        <Text style={styles.sectionTitle}>{i18n.t('nutrition.dietPlanTitle')}</Text>
                        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginLeft: 8, fontFamily: Typography.fontFamily.medium }}>
                          ({dietPlan?.days?.length || 0}/7 {i18n.t('nutrition.daysReady')})
                        </Text>
                      </View>
                      <Text style={styles.sectionSubtitle}>{i18n.t('nutrition.dietPlanSubtitle')}</Text>
                    </View>
                  </View>


                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                      onPress={handleOpenShoppingList}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderRadius: 12,
                        paddingHorizontal: 8,
                        paddingVertical: 6,
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginRight: 8
                      }}
                    >
                      <Ionicons name="cart-outline" size={14} color="#FFF" />
                      <Text style={{
                        color: '#FFF',
                        fontFamily: Typography.fontFamily.bold,
                        fontSize: 10,
                        marginLeft: 4
                      }}>
                        {i18n.t('nutrition.shoppingListWeek')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handlePrintPdf}
                      disabled={isGeneratingPdf}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderRadius: 12,
                        paddingHorizontal: 8,
                        paddingVertical: 6,
                        flexDirection: 'row',
                        alignItems: 'center',
                        opacity: isGeneratingPdf ? 0.7 : 1
                      }}
                    >
                      {isGeneratingPdf ? (
                        <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 4 }} />
                      ) : (
                        <Ionicons name="share-outline" size={14} color="#FFF" style={{ marginRight: 4 }} />
                      )}

                      <Text style={{
                        color: '#FFF',
                        fontFamily: Typography.fontFamily.bold,
                        fontSize: 10,
                      }}>
                        {i18n.t('nutrition.export')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleRegenerateDietAlert}
                      disabled={loadingDiet}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderRadius: 12,
                        paddingHorizontal: 8,
                        paddingVertical: 6,
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginLeft: 8,
                        opacity: loadingDiet ? 0.7 : 1
                      }}
                    >
                      <Ionicons name="refresh-outline" size={14} color="#FFF" style={{ marginRight: 4 }} />
                      <Text style={{
                        color: '#FFF',
                        fontFamily: Typography.fontFamily.bold,
                        fontSize: 10,
                      }}>
                        {i18n.t('nutrition.regenerate')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {loadingDiet && (!dietPlan || !dietPlan.days || dietPlan.days.length === 0) ? (
                  <LoadingEntertainment message={loadingMessage} />
                ) : dietPlan && dietPlan.days && dietPlan.days.length > 0 ? (
                  <View>
                    {loadingDiet && (
                      <View style={styles.generatingMoreContainer}>
                        <ActivityIndicator size="small" color={Colors.primary} />
                        <Text style={styles.generatingMoreText}>
                          {i18n.t('nutrition.generatingDay', { day: dietPlan.days.length + 1 })}
                        </Text>
                      </View>
                    )}

                    <DietPlanView
                      key={dietPlan.updatedAt || dietPlan.days.length}
                      plan={dietPlan}
                      onSwapMeal={handleSwapRequest}
                      onDailyShoppingList={handleDailyShoppingList}
                    />


                  </View>
                ) : (
                  <View style={styles.generateContainer}>
                    <Text style={styles.generateText}>
                      {i18n.t('nutrition.generatePlanPrompt')}
                    </Text>
                    <TouchableOpacity
                      style={styles.generateButton}
                      onPress={handleGenerateDiet}
                      disabled={loadingDiet}
                    >
                      {loadingDiet ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <>
                          <Ionicons name="sparkles" size={20} color="#FFF" style={{ marginRight: 8 }} />
                          <Text style={styles.generateButtonText}>{i18n.t('nutrition.generateAi')}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </SoftCard>
          </View>

          <View style={{ height: 100 }} />

        </ScrollView >

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
            setFilteredShoppingListPlan(null); // Reset filter on close
          }}
          dietPlan={filteredShoppingListPlan || dietPlan}
        />

        <NewAnalysisModal
          visible={showNewAnalysisModal}
          onClose={() => setShowNewAnalysisModal(false)}
          onConfirm={() => {
            setShowNewAnalysisModal(false);
            const analysisTimestamp = results?.timestamp ? new Date(results.timestamp).getTime() : 0;
            const now = Date.now();
            const isAnalysisFresh = (now - analysisTimestamp) < 60 * 1000; // 1 minute fresh

            if (isAnalysisFresh) {

              handleGenerateDiet(results);
            } else {

              handleFullRegenerate();
            }
          }}
        />

        <MealSwapModal
          visible={swapModalVisible}
          onClose={() => setSwapModalVisible(false)}
          originalMeal={mealToSwap?.meal || null}
          userProfile={profile}
          onSwap={handleConfirmSwap}
        />

        <CustomAlert
          visible={alertVisible}
          onClose={() => setAlertVisible(false)}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          actions={alertConfig.actions}
        />
      </SafeAreaView >
    </ImageBackground >
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  headerTitle: {
    fontSize: 32,
    color: '#FFF',
    fontFamily: Typography.fontFamily.bold,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  sectionContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.regular,
    color: 'rgba(255,255,255,0.8)',
  },

  carouselContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  generateContainer: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  generateText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  generateButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
  },
  regenerateButton: {
    alignSelf: 'center',
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  regenerateButtonText: {
    color: '#FF5252', // Red/Error color to indicate destructive action
    fontSize: 14,
    fontFamily: Typography.fontFamily.medium,
    textDecorationLine: 'underline',
  },
  updatingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFB142',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 100,
  },
  updatingText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: Typography.fontFamily.medium,
  },
  generatingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 10,
  },
  generatingMoreText: {
    marginLeft: 10,
    color: '#FFF',
    fontFamily: Typography.fontFamily.medium,
    fontSize: 14,
  },
  dietPlanCard: {
    marginHorizontal: 4,
    padding: 0,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
  },
  dietPlanContent: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
});
