// LAYOUT FROZEN: Do not modify image alignment or flex ratios without user permission.
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { ProfileService } from '../services/ProfileService';
import { PrivacyModal } from '../components/ui/PrivacyModal';
import { BlurView } from 'expo-blur';

export default function WelcomeScreen() {
    const router = useRouter();
    const [hasProfile, setHasProfile] = React.useState<boolean | null>(null);
    const [privacyApproved, setPrivacyApproved] = React.useState(false);
    const [privacyModalVisible, setPrivacyModalVisible] = React.useState(false);

    useFocusEffect(
        React.useCallback(() => {
            const checkProfile = async () => {
                const exists = await ProfileService.hasProfileLocal();
                setHasProfile(exists);
            };
            checkProfile();
        }, [])
    );

    const handleContinue = () => {
        if (hasProfile) {
            router.replace('/(tabs)');
        } else {
            router.push('/profile');
        }
    };

    if (hasProfile === null) return null; // Or loading spinner

    return (
        <ImageBackground
            source={require('../assets/images/custom_bg.jpg')}
            style={styles.container}
            resizeMode="cover"
        >
            <SafeAreaView style={styles.safeAreaHeader}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../assets/images/logo.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                </View>



                <View style={styles.imageContainer}>
                    <Image
                        source={require('../assets/images/dott_e_dottssa.png')}
                        style={styles.centeredImage}
                        resizeMode="contain"
                    />
                </View>
            </SafeAreaView>

            <View style={styles.bottomSheet}>
                <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.contentContainer}>
                    <Text style={styles.welcomeTitle}>
                        {hasProfile ? "Bentornato in\nmy Proactive Lab" : "Benvenuto in\nmy Proactive Lab"}
                    </Text>

                    <Text style={styles.welcomeText}>
                        {hasProfile
                            ? "La tua salute è al centro di tutto. Continua a monitorare i tuoi progressi e scopri nuovi insight personalizzati."
                            : "Inserisci i dati del tuo profilo per permettermi di aiutarti meglio nelle analisi e offrirti consigli più specifici. Potrai modificare i tuoi dati in qualunque momento."
                        }
                    </Text>

                    <View style={styles.privacyContainer}>
                        <View style={styles.privacyRow}>
                            <TouchableOpacity onPress={() => setPrivacyApproved(!privacyApproved)}>
                                <Ionicons
                                    name={privacyApproved ? "checkbox" : "square-outline"}
                                    size={24}
                                    color={privacyApproved ? "#FFB142" : "rgba(255, 255, 255, 0.5)"}
                                />
                            </TouchableOpacity>
                            <Text style={styles.privacyText}>
                                <Text onPress={() => setPrivacyApproved(!privacyApproved)}>Accetto la </Text>
                                <Text
                                    style={{ textDecorationLine: 'underline', fontFamily: Typography.fontFamily.bold }}
                                    onPress={() => setPrivacyModalVisible(true)}
                                >
                                    Privacy Policy
                                </Text>
                            </Text>
                            {!privacyApproved && <Ionicons name="alert-circle" size={20} color="#FF6B6B" style={{ marginLeft: 8 }} />}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.primaryButton,
                            !privacyApproved && { backgroundColor: 'rgba(255, 255, 255, 0.1)', shadowOpacity: 0 }
                        ]}
                        onPress={handleContinue}
                        disabled={!privacyApproved}
                    >
                        <Text style={[
                            styles.primaryButtonText,
                            !privacyApproved && { color: 'rgba(255, 255, 255, 0.3)' }
                        ]}>
                            {hasProfile ? "Continua" : "Completa Profilo"}
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color={!privacyApproved ? "rgba(255, 255, 255, 0.3)" : "#FFF"} />
                    </TouchableOpacity>
                </View>
            </View>

            <PrivacyModal
                visible={privacyModalVisible}
                onClose={() => setPrivacyModalVisible(false)}
                onApprove={() => {
                    setPrivacyApproved(true);
                    setPrivacyModalVisible(false);
                }}
            />
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeAreaHeader: {
        flex: 0.5, // Balanced
        paddingHorizontal: 10,
        paddingTop: 20,
        alignItems: 'center',
    },
    logoContainer: {
        width: '100%',
        height: 80, // Reduced height
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },

    logoImage: {
        width: '100%',
        height: '100%',
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'flex-end', // Align to bottom
        alignItems: 'center',
        overflow: 'visible',
        marginBottom: -70, // Increased overlap to ensure it rests on card
    },
    centeredImage: {
        width: 400,
        height: 400,
        resizeMode: 'contain',
    },
    bottomSheet: {
        flex: 0.5, // Balanced
        // marginTop: 52, // Removed margin top
        backgroundColor: 'transparent', // Transparent for BlurView
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: 'hidden',
        borderTopWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    contentContainer: {
        paddingHorizontal: 32,
        paddingTop: 40,
        paddingBottom: 120, // Increased padding to lift button
        alignItems: 'center',
        height: '100%',
    },
    welcomeTitle: {
        fontSize: 24,
        fontFamily: Typography.fontFamily.bold,
        color: '#FFFFFF', // White
        marginBottom: 16,
        textAlign: 'center',
        lineHeight: 32,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    welcomeText: {
        fontSize: 16,
        fontFamily: Typography.fontFamily.regular,
        color: 'rgba(255, 255, 255, 0.8)', // White transparent
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFB142', // Orange
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        width: '100%',
        shadowColor: '#FFB142',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
        marginTop: 'auto',
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontFamily: Typography.fontFamily.bold,
        marginRight: 8,
    },
    privacyContainer: {
        width: '100%',
        marginBottom: 24,
    },
    privacyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    privacyText: {
        fontSize: 14,
        fontFamily: Typography.fontFamily.regular,
        color: '#FFFFFF', // White
        marginLeft: 8,
    },
});
