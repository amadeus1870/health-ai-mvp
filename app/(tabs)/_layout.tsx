import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // Hide labels
        tabBarBackground: () => (
          <BlurView
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
        },
        tabBarActiveTintColor: '#FFB142',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="biomarkers"
        options={{
          title: 'Analisi',
          tabBarIcon: ({ color }) => <Ionicons name="pulse-outline" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wellness"
        options={{
          title: 'Mappa',
          tabBarIcon: ({ color }) => <Ionicons name="body-outline" size={28} color={color} />,
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
                {
                  top: -30, // Float higher
                  justifyContent: 'center',
                  alignItems: 'center',
                },
                props.style, // Keep original layout props but override positioning
              ]}
              onPress={() => router.push('/biomarkers?upload=true')}
            >
              <View style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                overflow: 'hidden',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
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
                }}>
                  <Ionicons name="add" size={36} color="#FFFFFF" />
                </View>
              </View>
            </TouchableOpacity>
          ),
        }}
      />

      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrizione',
          tabBarIcon: ({ color }) => <Ionicons name="nutrition-outline" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat AI',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubbles-outline" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profilo',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wellbeing"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
