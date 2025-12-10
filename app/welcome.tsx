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
import { LegalModal } from '../components/ui/PrivacyModal';
import { BlurView } from 'expo-blur';
import i18n from '../config/i18n';

export default function WelcomeScreen() {
    const router = useRouter();
    const [hasProfile, setHasProfile] = React.useState<boolean | null>(null);

    const [privacyApproved, setPrivacyApproved] = React.useState(false);
    const [termsApproved, setTermsApproved] = React.useState(false);
    const [disclaimerApproved, setDisclaimerApproved] = React.useState(false);

    const [modalVisible, setModalVisible] = React.useState(false);
    const [modalType, setModalType] = React.useState<'privacy' | 'terms' | 'disclaimer'>('privacy');

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

    const openModal = (type: 'privacy' | 'terms' | 'disclaimer') => {
        setModalType(type);
        setModalVisible(true);
    };

    const handleModalApprove = () => {
        if (modalType === 'privacy') setPrivacyApproved(true);
        if (modalType === 'terms') setTermsApproved(true);
        if (modalType === 'disclaimer') setDisclaimerApproved(true);
        setModalVisible(false);
    };

    const allApproved = privacyApproved && termsApproved && disclaimerApproved;

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
                        {hasProfile ? i18n.t('welcomeScreen.welcomeBackTitle') : i18n.t('welcomeScreen.welcomeTitle')}
                    </Text>

                    <Text style={styles.welcomeText}>
                        {hasProfile
                            ? i18n.t('welcomeScreen.welcomeBackSubtitle')
                            : i18n.t('welcomeScreen.welcomeSubtitle')
                        }
                    </Text>

                    <View style={styles.legalContainer}>
                        {/* Privacy Policy */}
                        <View style={styles.checkboxRow}>
                            <TouchableOpacity onPress={() => setPrivacyApproved(!privacyApproved)}>
                                <Ionicons
                                    name={privacyApproved ? "checkbox" : "square-outline"}
                                    size={24}
                                    color={privacyApproved ? "#FFB142" : "rgba(255, 255, 255, 0.5)"}
                                />
                            </TouchableOpacity>
                            <Text style={styles.checkboxText}>
                                {i18n.t('welcomeScreen.accept')} <Text style={styles.linkText} onPress={() => openModal('privacy')}>{i18n.t('welcomeScreen.privacyPolicy')}</Text>
                            </Text>
                        </View>

                        {/* Terms of Service */}
                        <View style={styles.checkboxRow}>
                            <TouchableOpacity onPress={() => setTermsApproved(!termsApproved)}>
                                <Ionicons
                                    name={termsApproved ? "checkbox" : "square-outline"}
                                    size={24}
                                    color={termsApproved ? "#FFB142" : "rgba(255, 255, 255, 0.5)"}
                                />
                            </TouchableOpacity>
                            <Text style={styles.checkboxText}>
                                {i18n.t('welcomeScreen.accept')} <Text style={styles.linkText} onPress={() => openModal('terms')}>{i18n.t('welcomeScreen.termsOfService')}</Text>
                            </Text>
                        </View>

                        {/* Medical Disclaimer */}
                        <View style={styles.checkboxRow}>
                            <TouchableOpacity onPress={() => setDisclaimerApproved(!disclaimerApproved)}>
                                <Ionicons
                                    name={disclaimerApproved ? "checkbox" : "square-outline"}
                                    size={24}
                                    color={disclaimerApproved ? "#FFB142" : "rgba(255, 255, 255, 0.5)"}
                                />
                            </TouchableOpacity>
                            <Text style={styles.checkboxText}>
                                {i18n.t('welcomeScreen.accept')} <Text style={styles.linkText} onPress={() => openModal('disclaimer')}>{i18n.t('welcomeScreen.medicalDisclaimer')}</Text>
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.primaryButton,
                            !allApproved && { backgroundColor: 'rgba(255, 255, 255, 0.1)', shadowOpacity: 0 }
                        ]}
                        onPress={handleContinue}
                        disabled={!allApproved}
                    >
                        <Text style={[
                            styles.primaryButtonText,
                            !allApproved && { color: 'rgba(255, 255, 255, 0.3)' }
                        ]}>
                            {hasProfile ? i18n.t('welcomeScreen.continue') : i18n.t('welcomeScreen.completeProfile')}
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color={!allApproved ? "rgba(255, 255, 255, 0.3)" : "#FFF"} />
                    </TouchableOpacity>
                </View>
            </View>

            <LegalModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onApprove={handleModalApprove}
                type={modalType}
            />
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeAreaHeader: {
        flex: 0.5,
        paddingHorizontal: 10,
        paddingTop: 20,
        alignItems: 'center',
    },
    logoContainer: {
        width: '100%',
        height: 80,
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
        justifyContent: 'flex-end',
        alignItems: 'center',
        overflow: 'visible',
        marginBottom: -70,
    },
    centeredImage: {
        width: 400,
        height: 400,
        resizeMode: 'contain',
    },
    bottomSheet: {
        flex: 0.5,
        backgroundColor: 'transparent',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: 'hidden',
        borderTopWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    contentContainer: {
        paddingHorizontal: 32,
        paddingTop: 40,
        paddingBottom: 40,
        alignItems: 'center',
        height: '100%',
    },
    welcomeTitle: {
        fontSize: 24,
        fontFamily: Typography.fontFamily.bold,
        color: '#FFFFFF',
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
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    legalContainer: {
        width: '100%',
        marginBottom: 24,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    checkboxText: {
        fontSize: 14,
        fontFamily: Typography.fontFamily.regular,
        color: '#FFFFFF',
        marginLeft: 12,
        flex: 1,
    },
    linkText: {
        textDecorationLine: 'underline',
        fontFamily: Typography.fontFamily.bold,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFB142',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        width: '100%',
        height: 56,
        marginTop: 'auto',
        marginBottom: 20,
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontFamily: Typography.fontFamily.bold,
        marginRight: 8,
    },
});
