import React, { useState } from 'react';
import { GlobalStyles } from '../../constants/GlobalStyles';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Platform, Image, ImageBackground } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { analyzeBiomarkers } from '../../services/gemini';
import { useAnalysis } from '../../context/AnalysisContext';
import { AnalysisService } from '../../services/AnalysisService';
import { BlurView } from 'expo-blur';
import { FallingParticles } from '../../components/ui/FallingParticles';
import { AnalysisHistoryModal } from '../../components/ui/AnalysisHistoryModal';
import { QuoteCard } from '../../components/ui/QuoteCard';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { Typography } from '../../constants/Typography';
import { CustomAlert, AlertType } from '../../components/ui/CustomAlert';
import { ChartsCard } from '../../components/ui/ChartsCard';
import { InfoModal } from '../../components/ui/InfoModal';

import { DetailedAnalysisCarousel } from '../../components/ui/DetailedAnalysisCarousel';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { SuccessModal } from '../../components/ui/SuccessModal';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PdfService } from '../../services/PdfService';
import { ProfileService } from '../../services/ProfileService';

export default function BiomarkersScreen() {
  const router = useRouter();
  const { results, setResults, isAnalyzing, setIsAnalyzing } = useAnalysis();
  const params = useLocalSearchParams();
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [isUploadMode, setIsUploadMode] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(!results);

  // Info Modal State
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoTitle, setInfoTitle] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const showInfo = (title: string, message: string) => {
    setInfoTitle(title);
    setInfoMessage(message);
    setInfoModalVisible(true);
  };

  React.useEffect(() => {
    if (params.upload === 'true') {
      setIsUploadMode(true);
      router.setParams({ upload: undefined });
    }
  }, [params.upload]);

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

  React.useEffect(() => {
    const loadLastAnalysis = async () => {
      try {
        const lastAnalysis = await AnalysisService.getLastAnalysis();
        if (lastAnalysis) {
          setResults(lastAnalysis);
        }
      } catch (error) {
        console.error("Failed to load last analysis:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadLastAnalysis();
  }, []);

  const vitalScore = results ? AnalysisService.calculateVitalScore(results) : 0;

  // Gesture Shared Values
  const touchX = useSharedValue(0);
  const isTouching = useSharedValue(false);

  const panGesture = Gesture.Pan()
    .enabled(isAnalyzing)
    .onBegin((e) => {
      isTouching.value = true;
      touchX.value = e.absoluteX;
    })
    .onUpdate((e) => {
      touchX.value = e.absoluteX;
    })
    .onEnd(() => {
      isTouching.value = false;
    })
    .onFinalize(() => {
      isTouching.value = false;
    });

  const handleExportPdf = async () => {
    if (!results) return;
    setIsGeneratingPdf(true);
    try {
      // Small delay for UI update
      await new Promise(resolve => setTimeout(resolve, 100));
      const profile = await ProfileService.getProfile();
      if (profile) {
        const score = AnalysisService.calculateVitalScore(results);
        await PdfService.generateAndShareAnalysisPdf(results, profile, score);
      } else {
        showAlert("Errore", "Impossibile recuperare il profilo utente.", "error");
      }
    } catch (error) {
      showAlert("Errore", "Impossibile generare il PDF. Riprova.", "error");
      console.error(error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCameraUpload = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.granted === false) {
        showAlert("Permesso Negato", "È necessario concedere l'accesso alla fotocamera per scattare foto.", "error");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsAnalyzing(true);
        const asset = result.assets[0];
        const fileData = [{
          base64: asset.base64 || '',
          mimeType: asset.mimeType || 'image/jpeg'
        }];
        // @ts-ignore
        const analysis = await analyzeBiomarkers(fileData);
        await AnalysisService.saveAnalysis(analysis);
        setSuccessModalVisible(true);
        setResults(analysis);
        setIsUploadMode(false);
      }
    } catch (error) {
      showAlert("Errore", "Impossibile scattare la foto. Riprova.", "error");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      setIsAnalyzing(true);
      const readFileAsBase64 = async (asset: any) => {
        let uri = asset.uri;
        const mimeType = asset.mimeType || 'image/jpeg';

        // Compress if it's an image
        if (mimeType.startsWith('image/')) {
          try {
            const manipulated = await ImageManipulator.manipulateAsync(
              uri,
              [{ resize: { width: 1500 } }], // Resize to max 1500px width (maintains aspect ratio)
              { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
            );
            uri = manipulated.uri;
            console.log(`Image compressed: ${uri}`);
          } catch (err) {
            console.warn("Image compression failed, using original:", err);
          }
        }

        if (Platform.OS === 'web') {
          const response = await fetch(uri);
          const blob = await response.blob();
          return new Promise<{ base64: string, mimeType: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve({ base64, mimeType });
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } else {
          try {
            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
            console.log(`File read: ${uri}, Size: ${(base64.length * 0.75 / 1024 / 1024).toFixed(2)} MB`);
            return { base64, mimeType };
          } catch (e: any) {
            console.warn("FileSystem Error:", e);
            throw new Error(`Failed to read file: ${e.message} `);
          }
        }
      };
      const filePromises = result.assets.map(asset => readFileAsBase64(asset));
      const fileData = await Promise.all(filePromises);
      // @ts-ignore
      const analysis = await analyzeBiomarkers(fileData);
      await AnalysisService.saveAnalysis(analysis);
      setSuccessModalVisible(true);
      // Inject timestamp so Nutrition screen can detect it's new
      setResults({ ...analysis, timestamp: new Date().toISOString() });
      setIsUploadMode(false);
    } catch (error) {
      showAlert("Errore", `Impossibile analizzare il documento: ${error instanceof Error ? error.message : String(error)}`, "error");
      console.warn("Upload error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderEmptyState = () => (
    <ImageBackground
      source={require('../../assets/images/custom_bg.jpg')}
      style={styles.emptyStateContainer}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <FallingParticles isActive={isAnalyzing} touchX={touchX} isTouching={isTouching} />
        <View style={styles.headerSection}>
          <View style={[GlobalStyles.headerContainer, { marginBottom: 30 }]}>
            <Text style={GlobalStyles.headerTitle}>Analisi Sangue e Referti</Text>
            <Text style={GlobalStyles.headerSubtitle}>Guida all'interpretazione</Text>
          </View>
          {isAnalyzing ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
              <QuoteCard />
            </View>
          ) : (
            <View style={styles.imageContainer} pointerEvents="none">
              <Image
                source={require('../../assets/images/analisi.png')}
                style={styles.centeredImage}
                resizeMode="contain"
              />
            </View>
          )}
        </View>
        <View style={styles.bottomSheet}>
          <BlurView
            intensity={60}
            tint="dark"
            style={StyleSheet.absoluteFill}
            experimentalBlurMethod='dimezisBlurView'
          />
          <View style={styles.bottomSheetContent}>
            {isAnalyzing ? (
              <View style={{ width: '100%', flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 20 }}>
                <ActivityIndicator size="large" color="#FFB142" style={{ marginBottom: 16 }} />
                <Text style={[styles.actionTitle, { color: '#FFB142', textAlign: 'center', marginBottom: 8 }]}>
                  Caricamento dei documenti in corso
                </Text>
                <Text style={[styles.descriptionText, { textAlign: 'center', color: 'rgba(255, 255, 255, 0.8)' }]}>
                  L'analisi approfondita dei tuoi documenti è in corso. Questa operazione può richiedere anche qualche minuto: è del tutto normale, stiamo elaborando ogni dettaglio per offrirti un report completo.
                </Text>
              </View>
            ) : (
              <>
                {results && (
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setIsUploadMode(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={30} color="rgba(255, 255, 255, 0.5)" />
                  </TouchableOpacity>
                )}
                <View style={styles.uploadActionCard}>
                  <View style={styles.uploadCardHeader}>
                    <View style={styles.cloudIconContainer}>
                      <Ionicons name="cloud-upload-outline" size={32} color="#FFF" />
                    </View>
                    <View style={styles.actionTextContainer}>
                      <Text style={styles.actionTitle}>Carica le tue analisi</Text>
                      <Text style={styles.actionSubtitle}>Supporta JPG, PNG, PDF</Text>
                    </View>
                  </View>
                  <Text style={styles.descriptionText}>
                    Puoi caricare risultati di analisi del sangue, e qualunque altro referto (per esempio marker tumorali, ecografie, TAC, radiografie, risonanza magnetica, ecc..)
                  </Text>
                </View>
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity style={styles.actionButton} onPress={handleCameraUpload}>
                    <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Camera</Text>
                  </TouchableOpacity>
                  <View style={styles.verticalDivider} />
                  <TouchableOpacity style={styles.actionButton} onPress={handleUpload}>
                    <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>File</Text>
                  </TouchableOpacity>
                  <View style={styles.verticalDivider} />
                  <TouchableOpacity style={styles.actionButton} onPress={() => setHistoryModalVisible(true)}>
                    <Ionicons name="archive-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Archivio</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.securityContainer}>
                  <Ionicons name="lock-closed-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={[styles.securityText, { color: '#FFFFFF' }]}>
                    I tuoi dati vengono trasmessi in modo sicuro e crittografato ai server di Google.
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={panGesture}>
        <View style={{ flex: 1 }}>
          {isLoading ? (
            <ImageBackground
              source={require('../../assets/images/custom_bg.jpg')}
              style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
              resizeMode="cover"
            >
              <ActivityIndicator size="large" color={Colors.primary} />
            </ImageBackground>
          ) : (!results || isUploadMode || isAnalyzing) ? (
            renderEmptyState()
          ) : (
            <ImageBackground
              source={require('../../assets/images/custom_bg.jpg')}
              style={{ flex: 1 }}
              resizeMode="cover"
            >
              <SafeAreaView style={styles.container}>
                <FallingParticles isActive={isAnalyzing} touchX={touchX} isTouching={isTouching} />
                <View style={styles.fixedContent}>
                  <View style={[GlobalStyles.headerContainer, { marginBottom: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                    <View>
                      <Text style={GlobalStyles.headerTitle}>Analisi Sangue e Referti</Text>
                      <Text style={GlobalStyles.headerSubtitle}>Guida all'interpretazione</Text>
                    </View>
                  </View>
                  {results && (
                    <View style={styles.resultsContainer}>
                      <View style={{ flex: 1, justifyContent: 'center' }}>
                        <ChartsCard
                          results={results}
                          vitalScore={vitalScore}
                          onVitalInfo={() => showInfo("Vital Score", "Il Vital Score è un indice sintetico del tuo stato di salute (0-100), calcolato analizzando biomarcatori, fattori di rischio e profilo lipidico. Un punteggio alto indica un ottimo stato di salute generale.")}
                          onLipidInfo={() => showInfo("Profilo Lipidico", "Il grafico mostra i tuoi valori di colesterolo (Totale, LDL, HDL) e trigliceridi rispetto ai range ottimali. L'area verde indica i valori ideali per la salute cardiovascolare.")}
                          onRiskInfo={() => showInfo("Rischio Globale", "Indica la presenza e la gravità dei fattori di rischio identificati nelle tue analisi. Include parametri come infiammazione, salute metabolica e cardiovascolare.")}
                        />
                      </View>
                      <View style={{ height: 220, marginBottom: 70 }}>
                        <DetailedAnalysisCarousel
                          results={results}
                          onExport={handleExportPdf}
                          isExporting={isGeneratingPdf}
                        />
                      </View>
                    </View>
                  )}
                </View>
              </SafeAreaView>
            </ImageBackground>
          )}
        </View>
      </GestureDetector>
      <AnalysisHistoryModal
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        onSelect={(analysis) => {
          setResults(analysis);
          setIsUploadMode(false);
          setHistoryModalVisible(false);
        }}
        currentAnalysisId={results?.id}
        onClearCurrentAnalysis={() => setResults(null)}
      />
      <SuccessModal
        visible={successModalVisible}
        onClose={() => setSuccessModalVisible(false)}
        message="Analisi completata con successo!"
      />
      <CustomAlert
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        actions={alertConfig.actions}
      />
      <InfoModal
        visible={infoModalVisible}
        onClose={() => setInfoModalVisible(false)}
        title={infoTitle}
        message={infoMessage}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  emptyStateContainer: {
    flex: 1,
  },
  headerSection: {
    flex: 0.55,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  fixedContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: -50,
    zIndex: 10,
  },
  centeredImage: {
    width: '120%',
    height: '120%',
  },
  bottomSheet: {
    flex: 0.45,
    backgroundColor: 'transparent',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 0,
    paddingTop: 0,
    alignItems: 'center',
    overflow: 'hidden',
    paddingBottom: 80,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  bottomSheetContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    width: '100%',
    alignItems: 'center',
    flex: 1,
  },
  uploadActionCard: {
    width: '100%',
    marginBottom: 24,
  },
  uploadCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  cloudIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFB142',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#FFB142',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 20,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'left',
    lineHeight: 22,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.semiBold,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  verticalDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  securityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 20,
    paddingHorizontal: 10,
    opacity: 0.8,
  },
  securityText: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontFamily: Typography.fontFamily.regular,
    flex: 1,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
});
