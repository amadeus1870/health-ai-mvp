import { useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ImageBackground, ActivityIndicator, RefreshControl, Dimensions, TouchableOpacity, Alert } from 'react-native';
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
import { DietPlanView } from '../../components/ui/DietPlanView';
import { DietPlan } from '../../types/Diet';
import { SoftCard } from '../../components/ui/SoftCard';
import { BlurView } from 'expo-blur';
import { ShoppingListModal } from '../../components/ui/ShoppingListModal';
import { NewAnalysisModal } from '../../components/ui/NewAnalysisModal';
import { MealSwapModal } from '../../components/ui/MealSwapModal';
import { Meal } from '../../types/Diet';
import { PdfService } from '../../services/PdfService';
import { LinearGradient } from 'expo-linear-gradient';
import { GlobalStyles } from '../../constants/GlobalStyles';

export default function NutritionScreen() {
  const { isBackgroundUpdating, results, pendingProfileUpdate, setPendingProfileUpdate, setResults } = useAnalysis();
  const isFirstRun = React.useRef(true);

  console.log("NutritionScreen: isBackgroundUpdating =", isBackgroundUpdating);
  const [profile, setProfile] = useState<UserProfile>(initialUserProfile);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [strategy, setStrategy] = useState<any>(null);

  // Diet Plan State
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [loadingDiet, setLoadingDiet] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0); // 0 to 7

  // Info Modal State
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoTitle, setInfoTitle] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  // Shopping List State
  const [shoppingListVisible, setShoppingListVisible] = useState(false);
  const [filteredShoppingListPlan, setFilteredShoppingListPlan] = useState<DietPlan | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Meal Swap State
  const [swapModalVisible, setSwapModalVisible] = useState(false);
  const [mealToSwap, setMealToSwap] = useState<{ meal: Meal, day: number, index: number } | null>(null);

  // New Analysis Modal State
  const [showNewAnalysisModal, setShowNewAnalysisModal] = useState(false);



  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const calculateStrategy = (user: UserProfile, analysis: any) => {
    const heightM = parseFloat(user.height) / 100;
    const weightKg = parseFloat(user.weight);
    let bmi = 0;
    let bmiStatus = "N/A";
    let bmiColor = Colors.text;

    if (heightM > 0 && weightKg > 0) {
      bmi = weightKg / (heightM * heightM);
      if (bmi < 18.5) { bmiStatus = "Sottopeso"; bmiColor = "#3498db"; }
      else if (bmi < 25) { bmiStatus = "Normopeso"; bmiColor = "#2ecc71"; }
      else if (bmi < 30) { bmiStatus = "Sovrappeso"; bmiColor = "#f1c40f"; }
      else { bmiStatus = "Obeso"; bmiColor = "#e74c3c"; }
    }

    let bmr = 10 * weightKg + 6.25 * parseFloat(user.height) - 5 * parseFloat(user.age);
    bmr += user.gender === 'M' ? 5 : -161;

    const activityMultipliers: { [key: string]: number } = {
      'Sedentario': 1.2,
      'Leggermente attivo': 1.375,
      'Moderatamente attivo': 1.55,
      'Molto attivo': 1.725,
      'Estremo': 1.9
    };
    const multiplier = activityMultipliers[user.activityLevel] || 1.2;
    const tdee = bmr * multiplier;

    let goalCalories = tdee;
    let goalType = "Mantenimento";

    if (bmi > 25) {
      goalCalories = tdee - 500;
      goalType = "Perdita Peso";
    } else if (bmi < 18.5) {
      goalCalories = tdee + 300;
      goalType = "Aumento Peso";
    }

    let proteinPct = 30;
    let carbsPct = 40;
    let fatsPct = 30;

    const hasDiabetes = user.conditions.includes("Diabete");
    if (hasDiabetes) {
      carbsPct = 30;
      proteinPct = 35;
      fatsPct = 35;
      goalType += " (Low Carb)";
    }

    setStrategy({
      bmi,
      bmiStatus,
      bmiColor,
      tdee,
      goalCalories,
      goalType,
      macros: { protein: proteinPct, carbs: carbsPct, fats: fatsPct }
    });
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
        calculateStrategy(userProfile, analysis);
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
    setDietPlan({ days: [] }); // Reset plan

    try {
      // Use context analysis if provided (fresh from upload), otherwise fetch last
      const analysis = contextAnalysis || await AnalysisService.getLastAnalysis();

      if (!analysis) {
        throw new Error("Nessuna analisi disponibile per generare il piano.");
      }

      let currentDays: any[] = [];

      // Incremental Generation Loop
      for (let day = 1; day <= 7; day++) {
        // Add delay to avoid hitting Gemini API rate limits (approx 15 RPM)
        if (day > 1) {
          await new Promise(resolve => setTimeout(resolve, 6000));
        }
        try {
          // Calculate strategy to get targets
          const strategy = AnalysisService.calculateNutritionalStrategy(profile);

          // Generate single day with strict targets
          const rawDayPlan = await generateDayDiet(profile, analysis, day, currentDays, strategy.goalCalories, strategy.macros);

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

    } catch (error) {
      console.error("Failed to generate diet plan", error);
      showInfo("Errore", "Impossibile generare il piano nutrizionale al momento. Riprova più tardi.");
    } finally {
      setLoadingDiet(false);
    }
  };

  const handlePrintPdf = async () => {
    if (!dietPlan || !dietPlan.days || dietPlan.days.length === 0) {
      Alert.alert("Nessun Piano", "Genera prima un piano nutrizionale per poterlo stampare.");
      return;
    }
    setIsGeneratingPdf(true);
    try {
      // Small delay to allow UI to render the loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      await PdfService.generateAndShareDietPdf(dietPlan, profile);
    } catch (error) {
      Alert.alert("Errore", "Impossibile generare il PDF. Riprova.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // NEW: Handle both Analysis Update + Diet Gen
  const handleFullRegenerate = async () => {
    setLoadingDiet(true);
    setGenerationProgress(0); // Uses same progress bar, maybe repurpose for "Analysis" phase
    // Phase 1: Update Analysis
    try {
      const lastAnalysis = results || await AnalysisService.getLastAnalysis();
      if (lastAnalysis) {
        // Show some UI feedback for this phase? 
        // Currently LoadingEntertainment just shows "Sto generando..." 
        // We could rely on that generic loading state.

        console.log("FullRegenerate: Re-analyzing...");
        const newAnalysis = await reAnalyzeBiomarkers(lastAnalysis);
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
      showInfo("Errore", "Aggiornamento fallito.");
      setLoadingDiet(false);
    } finally {
      // handleGenerateDiet handles the finally block for itself. 
      // If we crash before that, we need to ensure loading is off?
      // handleGenerateDiet will turn it off. 
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Listen for new analysis results
  useEffect(() => {
    if (results) {
      console.log("NutritionScreen: Analysis results detected.");
      calculateStrategy(profile, results);

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
        console.log("NutritionScreen: New analysis detected (newer than plan), showing modal.");
        setShowNewAnalysisModal(true);
      }
    }
  }, [results, dietPlan?.updatedAt, loadingDiet, loading]);


  // Check for Pending Profile Update (from Profile Screen)
  useFocusEffect(
    useCallback(() => {
      if (pendingProfileUpdate) {
        console.log("NutritionScreen: Pending Profile Update detected. Prompting user.");
        setShowNewAnalysisModal(true);
        setPendingProfileUpdate(false); // Clear flag immediately so we don't loop
      }
    }, [pendingProfileUpdate])
  );

  useFocusEffect(
    useCallback(() => {
      if (isBackgroundUpdating) {
        showInfo(
          "Aggiornamento in Corso",
          "Stiamo analizzando il tuo nuovo profilo e rigenerando il piano nutrizionale su misura per te.\n\nQuesta operazione richiede molta potenza di calcolo e può durare fino a 2 minuti.\n\nPuoi chiudere questa finestra e continuare a usare l'app: la pagina si aggiornerà automaticamente appena finito."
        );
      } else {
        loadData();
      }
    }, [isBackgroundUpdating])
  );

  if (loading) {
    return (
      <ImageBackground source={require('../../assets/images/custom_bg.jpg')} style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require('../../assets/images/custom_bg.jpg')} style={styles.container} resizeMode="cover">
      <SafeAreaView style={{ flex: 1 }}>
        {isBackgroundUpdating && (
          <TouchableOpacity
            style={styles.updatingBanner}
            activeOpacity={0.8}
            onPress={() => showInfo(
              "Aggiornamento in Corso",
              "Stiamo analizzando il tuo nuovo profilo e rigenerando il piano nutrizionale su misura per te.\n\nQuesta operazione richiede molta potenza di calcolo e può durare fino a 2 minuti.\n\nPuoi continuare a usare l'app nel frattempo, la pagina si aggiornerà automaticamente appena finito."
            )}
          >
            <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 10 }} />
            <Text style={styles.updatingText}>Aggiornamento in corso... (Tocca per info)</Text>
          </TouchableOpacity>
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />}
        >

          {/* Header */}
          <View style={GlobalStyles.headerContainer}>
            <Text style={GlobalStyles.headerTitle}>Strategia Nutrizionale</Text>
            <Text style={GlobalStyles.headerSubtitle}>Il tuo piano alimentare personalizzato</Text>
          </View>

          {/* Strategy Section */}
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
                    "Fabbisogno Calorico",
                    "Il TDEE è il tuo dispendio energetico giornaliero totale. Le calorie obiettivo sono calcolate per raggiungere il tuo scopo (es. deficit per dimagrire)."
                  )}
                />
                <MacrosCard
                  protein={strategy.macros.protein}
                  carbs={strategy.macros.carbs}
                  fats={strategy.macros.fats}
                  onInfoPress={() => showInfo(
                    "Ripartizione Macronutrienti",
                    "Indica la percentuale ideale di Proteine, Carboidrati e Grassi nella tua dieta. Questa ripartizione è ottimizzata in base ai tuoi obiettivi e alle tue condizioni fisiche."
                  )}
                />
                <BMICard
                  bmi={strategy.bmi}
                  status={strategy.bmiStatus}
                  color={strategy.bmiColor}
                  onInfoPress={() => showInfo(
                    "Indice di Massa Corporea (BMI)",
                    "Il BMI è un indicatore che mette in relazione peso e altezza. Sebbene non distingua tra massa grassa e magra, è un utile punto di partenza per valutare il peso forma."
                  )}
                />
              </ScrollView>
            )}
          </View>

          {/* Diet Plan Section */}
          <View style={styles.sectionContainer}>
            <SoftCard style={[styles.dietPlanCard, { padding: 0, overflow: 'hidden', borderWidth: 0 }]}>
              <LinearGradient
                colors={['#11998e', '#f2994a', '#f6d365']} // Green, Orange, Yellow
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.dietPlanContent}>
                <View style={{ marginBottom: 16, paddingHorizontal: 20, paddingTop: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                        <Text style={styles.sectionTitle}>Piano Nutrizionale</Text>
                        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginLeft: 8, fontFamily: Typography.fontFamily.medium }}>
                          ({dietPlan?.days?.length || 0}/7 Giorni pronti)
                        </Text>
                      </View>
                      <Text style={styles.sectionSubtitle}>Generato dall'AI su misura per te</Text>
                    </View>
                  </View>

                  {/* Button Row (Pulsantiera) */}
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                      onPress={() => {
                        if (dietPlan && dietPlan.days && dietPlan.days.length > 0) {
                          setFilteredShoppingListPlan(null); // Show full list
                          setShoppingListVisible(true);
                        } else {
                          Alert.alert("Nessun Piano", "Genera prima un piano nutrizionale per vedere la lista della spesa.");
                        }
                      }}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginRight: 10
                      }}
                    >
                      <Ionicons name="cart-outline" size={16} color="#FFF" />
                      <Text style={{
                        color: '#FFF',
                        fontFamily: Typography.fontFamily.bold,
                        fontSize: 12,
                        marginLeft: 6
                      }}>
                        Settimana
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handlePrintPdf}
                      disabled={isGeneratingPdf}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        flexDirection: 'row',
                        alignItems: 'center',
                        opacity: isGeneratingPdf ? 0.7 : 1
                      }}
                    >
                      {isGeneratingPdf ? (
                        <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 6 }} />
                      ) : (
                        <Ionicons name="share-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                      )}

                      <Text style={{
                        color: '#FFF',
                        fontFamily: Typography.fontFamily.bold,
                        fontSize: 12,
                      }}>
                        Esporta
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {loadingDiet && (!dietPlan || !dietPlan.days || dietPlan.days.length === 0) ? (
                  <LoadingEntertainment />
                ) : dietPlan && dietPlan.days && dietPlan.days.length > 0 ? (
                  <View>
                    {loadingDiet && (
                      <View style={styles.generatingMoreContainer}>
                        <ActivityIndicator size="small" color={Colors.primary} />
                        <Text style={styles.generatingMoreText}>
                          Sto generando il giorno {dietPlan.days.length + 1}...
                        </Text>
                      </View>
                    )}

                    <DietPlanView
                      key={dietPlan.updatedAt || dietPlan.days.length}
                      plan={dietPlan}
                      onSwapMeal={handleSwapRequest}
                      onDailyShoppingList={handleDailyShoppingList}
                    />

                    {!loadingDiet && (
                      <TouchableOpacity
                        style={styles.regenerateButton}
                        onPress={() => {
                          Alert.alert(
                            "Rigenera Piano",
                            "Sei sicuro? Il piano attuale verrà sovrascritto.",
                            [
                              { text: "Annulla", style: "cancel" },
                              { text: "Rigenera", style: "destructive", onPress: handleGenerateDiet }
                            ]
                          );
                        }}
                        disabled={loadingDiet}
                      >
                        <Text style={styles.regenerateButtonText}>Rigenera Piano</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View style={styles.generateContainer}>
                    <Text style={styles.generateText}>
                      Genera un piano nutrizionale completo di 7 giorni basato sulle tue analisi e obiettivi.
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
                          <Text style={styles.generateButtonText}>Genera con AI</Text>
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
            // If we came here from Profile Update (pendingProfileUpdate was true -> Modal), we want FULL REGEN
            // If we came here from Context Update (results changed)?
            // Actually, context update happens AFTER re-analysis.
            // So if `pendingProfileUpdate` triggered this, we need `handleFullRegenerate`.
            // If `results` triggered this, we just need `handleGenerateDiet`.
            // BUT we cleared `pendingProfileUpdate` in the effect.
            // We can check if `results` is "fresh" (timestamp very recent).
            // Actually, easiest way: Default to FullRegenerate if we suspect profile change?
            // Better: NewAnalysisModal just confirms "Rigenera".
            // If we are in this flow, re-analyzing again (if results just updated) is wasteful.

            // Logic:
            // 1. If we pressed "Rigenera" because of "New Analysis Detected" (background update finished), we just need Diet Gen.
            // 2. If we pressed "Rigenera" because of "Profile Updated" (pending flag), we need Full Regen (Analysis + Diet).

            // Wait, I cleared `pendingProfileUpdate` immediately. I lost the state.
            // I should reset it ONLY after decision? Or track "why" the modal is open.

            // Let's rely on timestamps?
            // If Analysis is NEW (> diet), we just need Diet.
            // If Analysis is OLD (< now - small buffer) but Profile Changed?
            // The `pendingProfileUpdate` logic handles the case where Analysis is OLD because we skipped background update.
            // So identifying that case is easy: Analysis is older than "now".
            // BUT Analysis might be older than Diet if we haven't updated it yet.

            // Let's assume: If user confirms, run FullRegenerate IF analysis is seemingly old?
            // Safer: Just always run FullRegenerate? 
            // - If analysis IS fresh, re-analyzing is redundant (cost/time).
            // - If analysis IS old, we MUST re-analyze.

            // Check logic:
            const analysisTimestamp = results?.timestamp ? new Date(results.timestamp).getTime() : 0;
            const now = Date.now();
            const isAnalysisFresh = (now - analysisTimestamp) < 60 * 1000; // 1 minute fresh

            if (isAnalysisFresh) {
              console.log("Analysis is fresh, generating diet only.");
              handleGenerateDiet(results);
            } else {
              console.log("Analysis is stale, running full regeneration.");
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
