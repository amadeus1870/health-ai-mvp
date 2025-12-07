import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Meal } from '../../types/Diet';
import { generateAlternativeMeals } from '../../services/gemini';
import { UserProfile } from '../../types/Profile';
import { CustomAlert } from './CustomAlert';

interface MealSwapModalProps {
    visible: boolean;
    onClose: () => void;
    originalMeal: Meal | null;
    userProfile: UserProfile;
    onSwap: (newMeal: Meal) => void;
}

export const MealSwapModal: React.FC<MealSwapModalProps> = ({ visible, onClose, originalMeal, userProfile, onSwap }) => {
    const [loading, setLoading] = useState(true);
    const [alternatives, setAlternatives] = useState<Meal[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Confirmation Alert State
    const [confirmationVisible, setConfirmationVisible] = useState(false);
    const [pendingMeal, setPendingMeal] = useState<Meal | null>(null);

    useEffect(() => {
        if (visible && originalMeal) {
            loadAlternatives();
        } else {
            // Reset state when closed
            setAlternatives([]);
            setLoading(true);
            setError(null);
        }
    }, [visible, originalMeal]);

    const loadAlternatives = async () => {
        if (!originalMeal) return;

        setLoading(true);
        setError(null);
        try {
            const results = await generateAlternativeMeals(originalMeal, userProfile);
            setAlternatives(results);
        } catch (err: any) {
            console.error("Failed to load alternatives", err);
            if (err.name === 'AbortError' || err.message?.includes('Aborted')) {
                setError("Tempo scaduto. La connessione è lenta, riprova.");
            } else {
                setError("Impossibile generare alternative al momento. Riprova.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (meal: Meal) => {
        setPendingMeal(meal);
        setConfirmationVisible(true);
    };

    const confirmSwap = () => {
        if (pendingMeal) {
            onSwap(pendingMeal);
            onClose();
        }
        setConfirmationVisible(false);
        setPendingMeal(null);
    };

    const cancelSwap = () => {
        setConfirmationVisible(false);
        setPendingMeal(null);
    };

    if (!originalMeal) return null;

    return (
        <>
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={onClose}
            >
                <View style={styles.overlay}>
                    <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
                        <View style={styles.contentContainer}>
                            <View style={styles.header}>
                                <View style={styles.titleRow}>
                                    <Ionicons name="swap-horizontal" size={24} color={Colors.primary} style={{ marginRight: 10 }} />
                                    <Text style={styles.title}>Sostituisci Pasto</Text>
                                </View>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <Ionicons name="close" size={24} color="#FFF" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.subtitle}>
                                Scegli un'alternativa per: <Text style={{ color: '#FFF', fontFamily: Typography.fontFamily.bold }}>{originalMeal.name}</Text>
                            </Text>

                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={Colors.primary} />
                                    <Text style={styles.loadingText}>L'AI sta cercando alternative...</Text>
                                </View>
                            ) : error ? (
                                <View style={styles.errorContainer}>
                                    <Ionicons name="alert-circle-outline" size={48} color="#FF5252" />
                                    <Text style={styles.errorText}>{error}</Text>
                                    <TouchableOpacity style={styles.retryButton} onPress={loadAlternatives}>
                                        <Text style={styles.retryButtonText}>Riprova</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                                    {alternatives.map((meal, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.card}
                                            onPress={() => handleSelect(meal)}
                                            activeOpacity={0.8}
                                        >
                                            <View style={styles.cardHeader}>
                                                <Text style={styles.cardTitle}>{meal.name}</Text>
                                                <View style={styles.caloriesBadge}>
                                                    <Text style={styles.caloriesText}>{meal.calories} kcal</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.cardDescription}>{meal.description}</Text>
                                            <View style={styles.macrosRow}>
                                                <Text style={styles.macroText}>P: {meal.macros.protein}g</Text>
                                                <Text style={styles.macroText}>C: {meal.macros.carbs}g</Text>
                                                <Text style={styles.macroText}>G: {meal.macros.fats}g</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    </BlurView>
                </View>
            </Modal>

            <CustomAlert
                visible={confirmationVisible}
                onClose={cancelSwap}
                title="Conferma Sostituzione"
                message={`Vuoi sostituire "${originalMeal?.name}" con "${pendingMeal?.name}"?`}
                type="info"
                actions={[
                    { text: "Annulla", onPress: cancelSwap, style: "cancel" },
                    { text: "Sostituisci", onPress: confirmSwap, style: "default" }
                ]}
            />
        </>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    blurContainer: {
        width: '100%',
        maxHeight: '80%',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    contentContainer: {
        padding: 24,
        backgroundColor: 'rgba(30, 30, 30, 0.6)',
        height: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        color: '#FFF',
        fontFamily: Typography.fontFamily.bold,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontFamily: Typography.fontFamily.regular,
        marginBottom: 20,
    },
    closeButton: {
        padding: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 200,
    },
    loadingText: {
        color: Colors.textSecondary,
        marginTop: 16,
        fontFamily: Typography.fontFamily.medium,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 200,
    },
    errorText: {
        color: '#FF5252',
        marginTop: 16,
        marginBottom: 20,
        fontFamily: Typography.fontFamily.medium,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: 'rgba(255, 82, 82, 0.1)',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FF5252',
        fontFamily: Typography.fontFamily.bold,
    },
    listContainer: {
        flex: 1,
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 16,
        color: '#FFF',
        fontFamily: Typography.fontFamily.bold,
        flex: 1,
        marginRight: 10,
    },
    caloriesBadge: {
        backgroundColor: 'rgba(231, 76, 60, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    caloriesText: {
        color: '#e74c3c',
        fontSize: 12,
        fontFamily: Typography.fontFamily.bold,
    },
    cardDescription: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontFamily: Typography.fontFamily.regular,
        marginBottom: 12,
    },
    macrosRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingTop: 8,
    },
    macroText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        fontFamily: Typography.fontFamily.medium,
    },
});
