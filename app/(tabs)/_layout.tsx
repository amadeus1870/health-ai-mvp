import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { GlassView } from '../../components/ui/GlassView';
import i18n from '../../config/i18n';
import { ProfileService } from '../../services/ProfileService';
import { AnalysisService } from '../../services/AnalysisService';
import { useEffect, useState } from 'react';
import { CustomAlert, AlertType } from '../../components/ui/CustomAlert';

import { useLanguage } from '../../context/LanguageContext';

export default function TabLayout() {
  const { language } = useLanguage();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: AlertType }>({
    title: '',
    message: '',
    type: 'warning'
  });

  const checkPrerequisites = async () => {
    try {
      // 1. Check if Analysis exists (if so, we are good)
      const hasAnalysis = await AnalysisService.getLastAnalysis();
      if (hasAnalysis) return true;

      // 2. Check if Profile is complete
      const profile = await ProfileService.getProfile();
      const isProfileComplete = profile.name && profile.age && profile.gender && profile.height && profile.weight;

      if (isProfileComplete) return true;

      return false;
    } catch (error) {
      console.error("Error checking prerequisites:", error);
      return false;
    }
  };

  const handleTabPress = async (e: any, routeName: string) => {
    e.preventDefault();
    const canNavigate = await checkPrerequisites();

    if (canNavigate) {
      router.push(routeName as any);
    } else {
      setAlertConfig({
        title: i18n.t('userProfile.warning'),
        message: i18n.t('userProfile.incompleteProfile'),
        type: 'warning'
      });
      setAlertVisible(true);
    }
  };

  return (
    <>
      <Tabs
        key={language}
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false, // Hide labels
          tabBarBackground: () => (
            <GlassView
              intensity={95}
              tint="dark"
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: 'rgba(0,0,0,0.8)',
                borderTopWidth: 1,
                borderTopColor: 'rgba(255, 255, 255, 0.2)',
                overflow: 'hidden',
              }}
            />
          ),
          tabBarStyle: {
            position: 'absolute',
            bottom: -10, // Moved down by another 2px
            left: 0,
            right: 0,
            backgroundColor: 'transparent',
            elevation: 0, // Remove elevation to let BlurView handle depth if needed, or keep it low
            borderTopWidth: 0, // Moved border to BlurView
            height: 85, // Compensate for the -5 bottom
            paddingTop: 8,
            paddingHorizontal: 5,
            overflow: 'visible', // Essential for floating button on Android
          },
          tabBarActiveTintColor: '#FFB142',
          tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: i18n.t('tabs.dashboard'),
            tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={28} color={color} />,
          }}
          listeners={{
            tabPress: (e) => handleTabPress(e, '/(tabs)')
          }}
        />
        <Tabs.Screen
          name="biomarkers"
          options={{
            title: i18n.t('tabs.analysis'),
            tabBarIcon: ({ color }) => <Ionicons name="pulse-outline" size={28} color={color} />,
          }}
          listeners={{
            tabPress: (e) => handleTabPress(e, '/(tabs)/biomarkers')
          }}
        />
        <Tabs.Screen
          name="wellness"
          options={{
            title: i18n.t('tabs.map'),
            tabBarIcon: ({ color }) => <Ionicons name="body-outline" size={28} color={color} />,
          }}
          listeners={{
            tabPress: (e) => handleTabPress(e, '/(tabs)/wellness')
          }}
        />

        {/* Custom Upload Button */}
        <Tabs.Screen
          name="upload_placeholder"
          options={{
            title: '',
            tabBarButton: (props) => (
              <TouchableOpacity
                {...(props as any)}
                style={[
                  Platform.select({
                    ios: {
                      top: -30,
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: 10,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                    },
                    android: {
                      top: -20, // Lower position for container
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: 999,
                      elevation: 20,
                      overflow: 'visible',
                    }
                  }),
                  props.style, // Keep original layout props but override positioning
                ]}
                onPress={async () => {
                  const canNavigate = await checkPrerequisites();
                  if (canNavigate) {
                    router.push('/biomarkers?upload=true');
                  } else {
                    setAlertConfig({
                      title: i18n.t('userProfile.warning'),
                      message: i18n.t('userProfile.incompleteProfile'),
                      type: 'warning'
                    });
                    setAlertVisible(true);
                  }
                }}
              >
                <View style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  overflow: 'hidden',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  {Platform.OS === 'android' ? (
                    <View style={{ width: '100%', height: '100%', backgroundColor: 'rgba(30,30,30,0.9)' }} />
                  ) : (
                    <GlassView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                  )}
                  <View style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: '#FFB142', // Orange background
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#FFB142', // Orange shadow
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 5,
                    ...Platform.select({
                      android: { top: -35 }, // Lifted further (-35px) as requested
                      ios: { top: 0 } // Standard position on iOS
                    })
                  }}>
                    <Ionicons name="add" size={36} color="#FFFFFF" />
                  </View>
                </View>
              </TouchableOpacity>
            ),
          }}
        />
        < Tabs.Screen
          name="nutrition"
          options={{
            title: i18n.t('tabs.nutrition'),
            tabBarIcon: ({ color }) => <Ionicons name="nutrition-outline" size={28} color={color} />,
          }}
          listeners={{
            tabPress: (e) => handleTabPress(e, '/(tabs)/nutrition')
          }}
        />
        < Tabs.Screen
          name="chat"
          options={{
            title: i18n.t('tabs.chat'),
            tabBarIcon: ({ color }) => <Ionicons name="chatbubbles-outline" size={28} color={color} />,
          }}
          listeners={{
            tabPress: (e) => handleTabPress(e, '/(tabs)/chat')
          }}
        />
        < Tabs.Screen
          name="profile"
          options={{
            title: i18n.t('tabs.profile'),
            tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={28} color={color} />,
          }}
        />
        < Tabs.Screen
          name="wellbeing"
          options={{
            href: null,
          }}
        />
      </Tabs >
      <CustomAlert
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </>
  );
}
