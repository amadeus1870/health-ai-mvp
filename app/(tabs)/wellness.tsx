import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { BodyMap, getOrganCenter } from '../../components/ui/BodyMap';
import { OrganDetailModal } from '../../components/ui/OrganDetailModal';
import { useAnalysis } from '../../context/AnalysisContext';
import { AnalysisService } from '../../services/AnalysisService';
import Svg, { Line, Circle } from 'react-native-svg';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { GlobalStyles } from '../../constants/GlobalStyles';
import { BlurView } from 'expo-blur';
import { SoftCard } from '../../components/ui/SoftCard';

const { width, height } = Dimensions.get('window');

import { WellnessService } from '../../services/WellnessService';
import i18n from '../../config/i18n';
import { useLanguage } from '../../context/LanguageContext';

export default function WellnessScreen() {
  const { language } = useLanguage();
  const { results, setResults } = useAnalysis();
  const [selectedOrgan, setSelectedOrgan] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!results) {

        const lastAnalysis = await AnalysisService.getLastAnalysis();
        if (lastAnalysis) {

          setResults(lastAnalysis);
        } else {

        }
      }
    };
    loadData();
  }, [results]);

  // Helper to map biomarkers to organs
  const organData = useMemo(() => {
    return WellnessService.calculateOrganStatus(results);
  }, [results]);

  const handleOrganPress = (organ: string) => {
    setSelectedOrgan(organ);
    // setModalVisible(true); // Disable modal, show card instead
  };

  const selectedBiomarkers = selectedOrgan ? organData.data?.[selectedOrgan] || [] : [];
  const selectedStatus = selectedOrgan ? organData.status?.[selectedOrgan] : null;

  // Calculate line coordinates
  const mapWidth = width;
  const mapHeight = width * 1.5;
  const organCenter = selectedOrgan ? getOrganCenter(selectedOrgan, mapWidth, mapHeight) : { x: 0, y: 0 };

  // Card position (fixed at top)
  const CARD_TOP = 140;
  const CARD_HEIGHT = 320;
  const cardX = width / 2;

  // Line start (Organ) -> Line end (Card bottom center)
  // Adjust organ Y because map is at bottom
  // Map top Y = Screen Height - Map Height (approx, since marginTop: auto)
  // Actually, we need to know where the map starts.
  // Since it's `marginTop: 'auto'`, it's at the bottom.
  // Let's assume map is at bottom of SafeAreaView.

  // Simplified approach: Render SVG inside the map container? 
  // No, line needs to go out of map container.
  // Render SVG absolute over the whole screen.

  // We need layout measurements.
  const [mapLayout, setMapLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  return (
    // <LinearGradient
    //   colors={Colors.gradients.pastel as any}
    //   start={{ x: 0, y: 0 }}
    //   end={{ x: 1, y: 0.6 }}
    //   style={{ flex: 1 }}
    // >
    <ImageBackground
      key={language}
      source={require('../../assets/images/custom_bg.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.content}>

          <View style={[GlobalStyles.headerContainer, { marginBottom: 30 }]}>
            <Text style={GlobalStyles.headerTitle}>{i18n.t('map.title')}</Text>
            {!results ? (
              <Text style={GlobalStyles.headerSubtitle}>{i18n.t('map.noAnalysis')}</Text>
            ) : (
              <Text style={GlobalStyles.headerSubtitle}>{i18n.t('map.subtitle')}</Text>
            )}
          </View>

          {/* Explanation Card */}
          {selectedOrgan && (
            <Animated.View entering={FadeIn} exiting={FadeOut} style={{ position: 'absolute', top: CARD_TOP, left: 20, right: 20, zIndex: 20, height: CARD_HEIGHT }}>
              <SoftCard style={styles.explanationCard}>
                <BlurView
                  intensity={60}
                  tint="dark"
                  style={StyleSheet.absoluteFill}
                  experimentalBlurMethod='dimezisBlurView'
                />
                {/* Fixed Header: Title & Status */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 }}>
                  <Text style={{ fontSize: 22, fontFamily: Typography.fontFamily.bold, color: '#FFF' }}>
                    {i18n.t(`organs.${selectedOrgan.toLowerCase()}`, { defaultValue: selectedOrgan })}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    fontFamily: Typography.fontFamily.bold,
                    color: selectedStatus === 'critical' ? '#FF5252' :
                      selectedStatus === 'warning' ? '#FFB142' :
                        selectedStatus === 'optimal' ? '#2ecc71' : '#4facfe',
                    letterSpacing: 1
                  }}>
                    {selectedStatus === 'neutral' ? i18n.t('map.toAnalyze') : selectedStatus?.toUpperCase()}
                  </Text>
                </View>

                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
                  showsVerticalScrollIndicator={true}
                  persistentScrollbar={true}
                  indicatorStyle="white"
                >
                  {selectedBiomarkers.length > 0 ? (
                    selectedBiomarkers.map((b: any, i: number) => {
                      const isCritical = b.status === 'critical';
                      const isWarning = b.status === 'warning';
                      const color = isCritical ? '#FF5252' : isWarning ? '#FFB142' : '#2ecc71';

                      return (
                        <View key={i} style={{ marginBottom: 16 }}>
                          <Text style={{
                            fontSize: 10,
                            fontFamily: Typography.fontFamily.bold,
                            color: color,
                            marginBottom: 2,
                            marginLeft: 16
                          }}>
                            {b.status?.toUpperCase()}
                          </Text>

                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 8 }} />
                            <Text style={{ fontFamily: Typography.fontFamily.bold, color: '#FFF', fontSize: 14 }}>
                              {b.name}
                            </Text>
                          </View>

                          <Text style={{
                            fontFamily: Typography.fontFamily.medium,
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: 14,
                            marginTop: 2,
                            marginLeft: 16
                          }}>
                            {b.value} {b.unit}
                          </Text>
                        </View>
                      );
                    })
                  ) : (
                    <Text style={styles.bioText}>
                      {results ? i18n.t('map.noDataOrgan') : i18n.t('map.noData')}
                    </Text>
                  )}
                </ScrollView>
                <View style={{ padding: 20, paddingTop: 0, alignItems: 'flex-end' }}>
                  <TouchableOpacity onPress={() => setSelectedOrgan(null)}>
                    <Text style={styles.closeText}>{i18n.t('common.close')}</Text>
                  </TouchableOpacity>
                </View>
              </SoftCard>
            </Animated.View>
          )}

          <View
            style={styles.mapContainer}
            onLayout={(e) => setMapLayout(e.nativeEvent.layout)}
          >
            <BodyMap
              onOrganPress={handleOrganPress}
              organStatus={organData.status as any}
            />
          </View>

          {/* SVG Overlay for Line */}
          {selectedOrgan && mapLayout.height > 0 && (
            <View style={[StyleSheet.absoluteFill, { zIndex: 15 }]} pointerEvents="none">
              <Svg height="100%" width="100%">
                <Line
                  x1={mapLayout.x + organCenter.x}
                  y1={mapLayout.y + organCenter.y + 10} // Adjusted for BodyMap top: -10 (20 margin - 10 top)
                  x2={width / 2}
                  y2={CARD_TOP + CARD_HEIGHT} // Connect to bottom of card
                  stroke="#FFF"
                  strokeWidth="2"
                  strokeDasharray="5, 5"
                />
                <Circle
                  cx={mapLayout.x + organCenter.x}
                  cy={mapLayout.y + organCenter.y + 10} // Adjusted for BodyMap top: -10
                  r="5"
                  fill="#FFF"
                />
              </Svg>
            </View>
          )}

        </View>
      </SafeAreaView>
    </ImageBackground >
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { flex: 1 },
  header: { paddingHorizontal: 20, marginTop: 20, marginBottom: 10, zIndex: 10 },
  title: { fontSize: 28, color: '#FFF', fontFamily: Typography.fontFamily.bold },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 4, fontFamily: Typography.fontFamily.regular },
  mapContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 'auto',
    width: '100%',
    marginBottom: 40, // Lift map above absolute tab bar (60 - 20 internal margin)
  },
  explanationCard: {
    flex: 1, // Fill the fixed height container
    padding: 0, // Remove default padding to let BlurView fill
    backgroundColor: 'transparent', // Transparent for BlurView
    overflow: 'hidden', // Clip BlurView
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Match AnalysisHistoryModal
    borderRadius: 24, // Match SoftCard radius
  },
  blurContainer: {
    width: '100%',
    height: '100%',
  },
  // cardHeader, cardTitle, cardStatus, cardBody removed
  bioText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)', // Light text
    marginBottom: 4,
    fontFamily: Typography.fontFamily.medium,
  },
  closeCard: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  closeText: {
    color: 'rgba(255, 255, 255, 0.6)', // Light text
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
