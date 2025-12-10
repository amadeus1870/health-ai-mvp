import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Platform, KeyboardAvoidingView, Alert, findNodeHandle, UIManager, ImageBackground, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { SoftCard } from '../../components/ui/SoftCard';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { Typography } from '../../constants/Typography';
import { ProfileService } from '../../services/ProfileService';
import { UserProfile, initialUserProfile } from '../../types/Profile';
import { LinearGradient } from 'expo-linear-gradient';
import { SuccessModal } from '../../components/ui/SuccessModal';
import { CustomAlert, AlertType } from '../../components/ui/CustomAlert';
import { BlurView } from 'expo-blur';
import { reAnalyzeBiomarkers, generateDietPlan } from '../../services/gemini';
import { AnalysisService } from '../../services/AnalysisService';
import { ActivityIndicator } from 'react-native';
import { useAnalysis } from '../../context/AnalysisContext';
import i18n from '../../config/i18n';

type SelectionOption = { label: string; value: string };

import {
  GENDER_OPTIONS,
  ACTIVITY_LEVELS,
  DIET_TYPES,
  DIETARY_RESTRICTIONS,
  CONDITIONS,
  SYMPTOMS,
  HABITS,
  SUPPLEMENTS,
  PHYSICAL_DESCRIPTIONS,
  SLEEP_QUALITY,
  STRESS_LEVELS,
  SMOKE_OPTS,
  ALCOHOL_OPTS,
  COFFEE_OPTS,
  MEALS_PER_DAY,
  SNACKS_PER_DAY
} from '../../constants/ProfileConstants';

// Helper for Glass Card
const GlassCard = ({ children, style }: { children: React.ReactNode, style?: any }) => (
  <SoftCard style={[styles.card, style]}>
    <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
    <View style={styles.cardContent}>
      {children}
    </View>
  </SoftCard>
);

import { useLanguage } from '../../context/LanguageContext';

export default function ProfileScreen() {
  const { language } = useLanguage(); // Trigger re-render on language change




  const router = useRouter();
  const { setResults, setIsBackgroundUpdating, setPendingProfileUpdate } = useAnalysis();
  const scrollViewRef = useRef<ScrollView>(null);
  const fieldRefs = useRef<{ [key: string]: View | null }>({});
  const [formData, setFormData] = useState<UserProfile>(initialUserProfile);
  const [originalProfile, setOriginalProfile] = useState<UserProfile>(initialUserProfile);
  const [errors, setErrors] = useState<Partial<Record<keyof UserProfile, boolean>>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type: AlertType;
    actions?: { text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }[];
  }>({ title: '', message: '', type: 'info' });

  const showAlert = (title: string, message: string, type: AlertType = 'info') => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await ProfileService.getProfile();
      if (profile) {
        setFormData(profile);
        setOriginalProfile(profile);
      }
    } catch (error) {
      console.error("Failed to load profile", error);
    }
  };

  const handleSave = async () => {
    // Validation
    const newErrors: Partial<Record<keyof UserProfile, boolean>> = {};
    if (!formData.name) newErrors.name = true;
    if (!formData.age) newErrors.age = true;
    if (!formData.gender) newErrors.gender = true;
    if (!formData.height) newErrors.height = true;
    if (!formData.weight) newErrors.weight = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showAlert(i18n.t('userProfile.warning'), i18n.t('userProfile.fillRequired'), "warning");

      // Auto-scroll to first error
      const firstErrorField = Object.keys(newErrors)[0];
      const ref = fieldRefs.current[firstErrorField];

      if (ref && scrollViewRef.current) {
        const handle = findNodeHandle(ref);
        const scrollHandle = findNodeHandle(scrollViewRef.current);

        if (handle && scrollHandle) {
          UIManager.measureLayout(
            handle,
            scrollHandle,
            () => { }, // Error callback
            (x, y, w, h) => { // Success callback
              scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
            }
          );
        }
      }
      return;
    }

    try {
      await ProfileService.saveProfile(formData);

      // Check if analysis exists (New User Flow)
      const hasAnalysis = await AnalysisService.getLastAnalysis();

      if (!hasAnalysis) {
        // Direct redirect for new users, but pass flag to show success message there
        router.push('/(tabs)/biomarkers?upload=true&profileSaved=true');
        return;
      }

      // Check if profile actually changed (excluding profile picture)
      const { profilePicture: newPic, ...newProfileData } = formData;
      const { profilePicture: oldPic, ...oldProfileData } = originalProfile;

      const hasSignificantChanges = JSON.stringify(newProfileData) !== JSON.stringify(oldProfileData);
      const hasPictureChange = newPic !== oldPic;

      if (hasSignificantChanges) {


        // Notify context that profile changed
        setPendingProfileUpdate(true);

        // Go directly to Nutrition
        setOriginalProfile(formData);
        router.navigate('/(tabs)/nutrition');

      } else {
        // No significant changes (maybe just picture)
        setOriginalProfile(formData);
        setSuccessMessage(i18n.t('userProfile.success'));
        setShowSuccessModal(true);
      }

    } catch (error) {
      showAlert(i18n.t('common.error'), i18n.t('userProfile.errorSave'), "error");
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64Image = `data:image/jpeg;base64,${asset.base64}`;
        updateField('profilePicture', base64Image);
      }
    } catch (error) {
      showAlert(i18n.t('common.error'), i18n.t('userProfile.errorImage'), "error");
    }
  };

  const toggleSelection = (field: keyof UserProfile, item: string) => {
    setFormData(prev => {
      const list = prev[field] as string[];
      if (list.includes(item)) {
        return { ...prev, [field]: list.filter(i => i !== item) };
      } else {
        return { ...prev, [field]: [...list, item] };
      }
    });
  };

  const updateField = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  const renderSectionTitle = (title: string, icon: keyof typeof Ionicons.glyphMap) => (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={20} color="#FFB142" style={{ marginRight: 8 }} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const renderInput = (label: string, field: keyof UserProfile, placeholder: string, keyboardType: 'default' | 'numeric' = 'default', required = false, multiline = false) => (
    <View
      style={styles.inputContainer}
      ref={(el) => { fieldRefs.current[field] = el; }}
      onLayout={() => { }} // Necessary for measureLayout to work reliably on Android sometimes
    >
      <Text style={styles.label}>{label} {required && <Text style={styles.required}>*</Text>}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && { height: 120, textAlignVertical: 'top' },
          errors[field] && { borderColor: Colors.error, borderWidth: 1.5 }
        ]}
        placeholder={placeholder}
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        value={(formData as any)[field]}
        onChangeText={(text) => updateField(field, text)}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
      />
    </View>
  );

  const renderSegmentedControl = (label: string, field: keyof UserProfile, options: string[], translationPrefix?: string) => (
    <View
      style={styles.inputContainer}
      ref={(el) => { fieldRefs.current[field] = el; }}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={[
        styles.segmentContainer,
        errors[field] && { borderColor: Colors.error, borderWidth: 1.5 }
      ]}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[
              styles.segmentButton,
              (formData as any)[field] === opt && styles.segmentButtonActive
            ]}
            onPress={() => updateField(field, opt)}
          >
            <Text style={[
              styles.segmentText,
              (formData as any)[field] === opt && styles.segmentTextActive
            ]}>{translationPrefix ? i18n.t(`${translationPrefix}.${opt}`, { locale: language }) : opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCheckboxList = (list: string[], field: 'conditions' | 'symptoms' | 'habits' | 'supplements' | 'dietaryRestrictions', translationPrefix: string) => (
    <View style={styles.checkboxContainer}>
      {list.map((item) => {
        const isSelected = formData[field].includes(item);
        return (
          <TouchableOpacity
            key={item}
            style={[styles.checkboxItem, isSelected && styles.checkboxItemActive]}
            onPress={() => toggleSelection(field, item)}
          >
            <Ionicons
              name={isSelected ? "checkbox" : "square-outline"}
              size={24}
              color={isSelected ? "#FFB142" : "rgba(255, 255, 255, 0.6)"}
            />
            <Text style={[styles.checkboxLabel, isSelected && styles.checkboxLabelActive]}>
              {i18n.t(`${translationPrefix}.${item}`, { locale: language })}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <ImageBackground
      key={language}
      source={require('../../assets/images/custom_bg.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
          >


            <Text style={styles.headerTitle}>{i18n.t('userProfile.title')}</Text>
            <Text style={styles.headerSubtitle}>{i18n.t('userProfile.subtitle')}</Text>

            {/* Profile Picture */}
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <TouchableOpacity onPress={handlePickImage} style={styles.profileImageContainer}>
                {formData.profilePicture ? (
                  <Image source={{ uri: formData.profilePicture }} style={styles.profileImage} />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Ionicons name="person" size={40} color="rgba(255, 255, 255, 0.5)" />
                  </View>
                )}
                <View style={styles.editIconContainer}>
                  <Ionicons name="camera" size={16} color="#FFF" />
                </View>
              </TouchableOpacity>
              <Text style={styles.changePhotoText}>{i18n.t('userProfile.changePhoto')}</Text>
            </View>

            {/* DATI PERSONALI */}
            <GlassCard>
              {renderSectionTitle(i18n.t('userProfile.personalInfo'), "person")}
              {renderInput(i18n.t('userProfile.name'), "name", i18n.t('userProfile.namePlaceholder'), "default", true)}
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  {renderInput(i18n.t('userProfile.age'), "age", i18n.t('userProfile.agePlaceholder'), "numeric", true)}
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  {renderSegmentedControl(i18n.t('userProfile.gender'), "gender", GENDER_OPTIONS, "profileOptions.gender")}
                </View>
              </View>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  {renderInput(i18n.t('userProfile.height'), "height", i18n.t('userProfile.heightPlaceholder'), "numeric", true)}
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  {renderInput(i18n.t('userProfile.weight'), "weight", i18n.t('userProfile.weightPlaceholder'), "numeric", true)}
                </View>
              </View>
              <View style={[styles.row, { marginTop: 0 }]}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  {renderInput(i18n.t('userProfile.waist'), "waistCircumference", i18n.t('userProfile.waistPlaceholder'), "numeric")}
                </View>
                <View style={{ flex: 1, marginLeft: 8 }} />
              </View>
            </GlassCard>

            {/* DESCRIZIONE FISICA */}
            <GlassCard>
              {renderSectionTitle(i18n.t('userProfile.physicalDescription'), "body")}
              <View style={styles.wrapContainer}>
                {PHYSICAL_DESCRIPTIONS.map((desc) => (
                  <TouchableOpacity
                    key={desc}
                    style={[
                      styles.chip,
                      { width: '100%', marginBottom: 8 },
                      formData.physicalDescription === desc && styles.chipActive
                    ]}
                    onPress={() => updateField("physicalDescription", desc)}
                  >
                    <Text style={[styles.chipText, formData.physicalDescription === desc && styles.chipTextActive]}>
                      {i18n.t(`profileOptions.physical.${desc}`, { locale: language })}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </GlassCard>

            {/* STILE DI VITA */}
            <GlassCard>
              {renderSectionTitle(i18n.t('userProfile.lifestyle'), "leaf")}
              {renderSegmentedControl(i18n.t('userProfile.smoke'), "smoke", SMOKE_OPTS, "profileOptions.smoke")}
              {renderSegmentedControl(i18n.t('userProfile.alcohol'), "alcohol", ALCOHOL_OPTS, "profileOptions.alcohol")}
              {renderSegmentedControl(i18n.t('userProfile.coffee'), "coffee", COFFEE_OPTS, "profileOptions.coffee")}

              <Text style={[styles.label, { marginTop: 12 }]}>{i18n.t('userProfile.activityLevel')}</Text>
              <View style={styles.activityContainer}>
                {ACTIVITY_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.activityItem,
                      formData.activityLevel === level && styles.activityItemActive
                    ]}
                    onPress={() => updateField("activityLevel", level)}
                  >
                    {formData.activityLevel === level && (
                      <Ionicons name="checkmark" size={18} color="#FFF" style={{ marginRight: 8 }} />
                    )}
                    <Text style={[
                      styles.activityText,
                      formData.activityLevel === level && styles.activityTextActive
                    ]}>{i18n.t(`profileOptions.activity.${level}`, { locale: language })}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { marginTop: 12 }]}>{i18n.t('userProfile.sleepQuality')}</Text>
              <View style={styles.wrapContainer}>
                {SLEEP_QUALITY.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.chip, formData.sleep === opt && styles.chipActive]}
                    onPress={() => updateField("sleep", opt)}
                  >
                    <Text style={[styles.chipText, formData.sleep === opt && styles.chipTextActive]}>
                      {i18n.t(`profileOptions.sleep.${opt}`, { locale: language })}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { marginTop: 12 }]}>{i18n.t('userProfile.stressLevel')}</Text>
              <View style={styles.wrapContainer}>
                {STRESS_LEVELS.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.chip, formData.stress === opt && styles.chipActive]}
                    onPress={() => updateField("stress", opt)}
                  >
                    <Text style={[styles.chipText, formData.stress === opt && styles.chipTextActive]}>
                      {i18n.t(`profileOptions.stress.${opt}`, { locale: language })}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </GlassCard>

            {/* ABITUDINI */}
            <GlassCard>
              {renderSectionTitle(i18n.t('userProfile.habits'), "fitness")}
              {renderCheckboxList(HABITS, "habits", "profileOptions.habits")}
            </GlassCard>

            {/* DIETA E NUTRIZIONE */}
            <GlassCard>
              {renderSectionTitle(i18n.t('userProfile.dietNutrition'), "restaurant")}

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  {renderSegmentedControl(i18n.t('userProfile.mealsPerDay'), "mealsPerDay", MEALS_PER_DAY)}
                </View>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  {renderSegmentedControl(i18n.t('userProfile.snacksPerDay'), "snacksPerDay", SNACKS_PER_DAY)}
                </View>
              </View>

              <Text style={[styles.label, { marginTop: 12 }]}>{i18n.t('userProfile.dietType')}</Text>
              <View style={styles.wrapContainer}>
                {DIET_TYPES.map((diet) => (
                  <TouchableOpacity
                    key={diet}
                    style={[
                      styles.chip,
                      formData.dietType === diet && styles.chipActive
                    ]}
                    onPress={() => updateField("dietType", diet)}
                  >
                    <Text style={[styles.chipText, formData.dietType === diet && styles.chipTextActive]}>
                      {i18n.t(`profileOptions.diet.${diet}`, { locale: language })}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { marginTop: 16, marginBottom: 8 }]}>{i18n.t('userProfile.dietaryRestrictionsQuestion')}</Text>
              {renderCheckboxList(DIETARY_RESTRICTIONS, "dietaryRestrictions", "profileOptions.restrictions")}
              {formData.dietaryRestrictions.includes("other") && (
                renderInput(i18n.t('userProfile.other'), "otherDietaryRestriction", i18n.t('userProfile.describe'))
              )}

              <View style={{ marginTop: 16 }}>
                {renderInput(i18n.t('userProfile.typicalDay'), "dailyDiet", i18n.t('userProfile.typicalDayPlaceholder'), "default", false, true)}
              </View>
            </GlassCard>

            {/* INTEGRATORI */}
            <GlassCard>
              {renderSectionTitle(i18n.t('userProfile.supplements'), "nutrition")}
              {renderCheckboxList(SUPPLEMENTS, "supplements", "profileOptions.supplements")}
              {renderInput(i18n.t('userProfile.other'), "otherSupplement", i18n.t('userProfile.describe'))}
            </GlassCard>

            {/* CONDIZIONI NOTE */}
            <GlassCard>
              {renderSectionTitle(i18n.t('userProfile.conditions'), "medical")}
              {renderCheckboxList(CONDITIONS, "conditions", "profileOptions.conditions")}
              {formData.conditions.includes("other") && (
                renderInput(i18n.t('userProfile.other'), "otherCondition", i18n.t('userProfile.describe'))
              )}
            </GlassCard>

            {/* SINTOMI */}
            <GlassCard>
              {renderSectionTitle(i18n.t('userProfile.symptoms'), "warning")}
              {renderCheckboxList(SYMPTOMS, "symptoms", "profileOptions.symptoms")}
            </GlassCard>

            {/* FARMACI */}
            <GlassCard>
              {renderSectionTitle(i18n.t('userProfile.medications'), "medkit")}
              <View style={styles.switchRow}>
                <Text style={styles.label}>{i18n.t('userProfile.medicationsQuestion')}</Text>
                <Switch
                  value={formData.medications}
                  onValueChange={(val) => updateField("medications", val)}
                  trackColor={{ false: "#3e3e3e", true: "#FFB142" }}
                  thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : (formData.medications ? '#FFFFFF' : '#f4f3f4')}
                  ios_backgroundColor="#3e3e3e"
                />
              </View>
              {formData.medications && (
                renderInput(i18n.t('userProfile.medicationsList'), "medicationsList", i18n.t('userProfile.medicationsPlaceholder'))
              )}
            </GlassCard>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>{i18n.t('userProfile.saveButton')}</Text>
            </TouchableOpacity>

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
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Loading Modal for Analysis Update */}


      <SuccessModal
        visible={showSuccessModal}
        message={successMessage}
        onClose={() => {
          setShowSuccessModal(false);
          router.replace('/');
        }}
      />
      <CustomAlert
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { padding: 20 },
  headerTitle: {
    fontSize: 28,
    color: '#FFF',
    marginBottom: 8,
    fontFamily: Typography.fontFamily.bold,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    marginBottom: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  card: {
    marginBottom: 20,
    padding: 0, // Removed padding for BlurView
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fallback for BlurView
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cardContent: {
    padding: 20,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: {
    fontSize: 18,
    color: '#FFFFFF', // White
    fontFamily: Typography.fontFamily.bold,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  inputContainer: { marginBottom: 16 },
  label: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)', // White transparent
    marginBottom: 8,
    fontFamily: Typography.fontFamily.medium,
  },
  required: { color: '#FF6B6B' }, // Red
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Glass input
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF', // White text
    fontFamily: Typography.fontFamily.regular,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  row: { flexDirection: 'row' },

  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  segmentButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  segmentButtonActive: {
    backgroundColor: '#FFB142', // Orange
    shadowColor: '#FFB142',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3
  },
  segmentText: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600', fontFamily: Typography.fontFamily.medium },
  segmentTextActive: { color: '#FFFFFF', fontWeight: '700', fontFamily: Typography.fontFamily.bold },

  checkboxContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  checkboxItem: { flexDirection: 'row', alignItems: 'center', width: '50%', marginBottom: 16, paddingRight: 8 },
  checkboxItemActive: {},
  checkboxLabel: { marginLeft: 12, fontSize: 14, color: '#FFFFFF' },
  checkboxLabelActive: { color: '#FFB142', fontWeight: '600' },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },

  wrapContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  chipActive: {
    backgroundColor: '#FFB142', // Orange
    borderColor: '#FFB142',
    shadowColor: '#FFB142',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4
  },
  chipText: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', fontFamily: Typography.fontFamily.medium },
  chipTextActive: { color: '#FFFFFF', fontWeight: '700', fontFamily: Typography.fontFamily.bold },

  saveButton: { backgroundColor: '#FFB142', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10, shadowColor: '#FFB142', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },

  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible', // Allow edit icon to overflow
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFB142',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000', // Or match background color if possible, but black adds contrast
  },
  changePhotoText: {
    marginTop: 8,
    color: '#FFB142',
    fontSize: 14,
    fontFamily: Typography.fontFamily.medium,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // Removed overlay color
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: 'transparent', // Transparent for glass effect
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    overflow: 'hidden', // Required for BlurView
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  loadingTitle: {
    color: '#FFB142',
    fontSize: 22,
    fontFamily: Typography.fontFamily.bold,
    textAlign: 'center',
    marginBottom: 16,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
    lineHeight: 24,
  },
  activityContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activityItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  activityItemActive: {
    backgroundColor: '#FFB142', // Orange to match app theme
  },
  activityText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Typography.fontFamily.medium,
  },
  activityTextActive: {
    color: '#FFFFFF',
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
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: Typography.fontFamily.medium,
    textDecorationLine: 'underline',
  },
});
