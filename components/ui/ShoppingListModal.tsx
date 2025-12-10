import React, { useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { DietPlan } from '../../types/Diet';

import { ShoppingListService, Category } from '../../services/ShoppingListService';
import i18n from '../../config/i18n';

interface ShoppingListModalProps {
    visible: boolean;
    onClose: () => void;
    dietPlan: DietPlan | null;
}

export const ShoppingListModal: React.FC<ShoppingListModalProps> = ({ visible, onClose, dietPlan }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);



    const loadList = useCallback(async () => {
        if (!dietPlan) return;
        setLoading(true);
        try {
            // Pass current language to service
            const list = await ShoppingListService.generateList(dietPlan, i18n.locale);
            setCategories(list);
        } catch (error) {
            console.error("Failed to generate shopping list", error);
        } finally {
            setLoading(false);
        }
    }, [dietPlan]);

    useEffect(() => {
        if (visible && dietPlan) {
            loadList();
        }
    }, [visible, dietPlan, loadList]);

    const toggleIngredient = (categoryIndex: number, itemIndex: number) => {
        const newCategories = [...categories];
        newCategories[categoryIndex].items[itemIndex].checked = !newCategories[categoryIndex].items[itemIndex].checked;
        setCategories(newCategories);
    };

    const [showToast, setShowToast] = useState(false);

    const copyToClipboard = async () => {
        const textToCopy = categories
            .map(cat => `\n${cat.name}:\n` + cat.items.map(ing => `- [${ing.checked ? 'x' : ' '}] ${ing.name}`).join('\n'))
            .join('\n');

        await Clipboard.setStringAsync(textToCopy);

        // Show custom toast logic
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
    };

    return (
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
                                <Ionicons name="cart" size={24} color={Colors.primary} style={{ marginRight: 10 }} />
                                <Text style={styles.title}>{i18n.t('shoppingList.title')}</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.subtitle}>
                            {dietPlan?.days?.length === 1
                                ? i18n.t('shoppingList.subtitleDaily')
                                : i18n.t('shoppingList.subtitleWeekly')}
                        </Text>

                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={Colors.primary} />
                                <Text style={styles.loadingText}>{i18n.t('shoppingList.loading')}</Text>
                            </View>
                        ) : (
                            <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                                {categories.length > 0 ? (
                                    categories.map((category, catIndex) => (
                                        <View key={catIndex} style={styles.categorySection}>
                                            <Text style={styles.categoryTitle}>{category.name}</Text>
                                            {category.items.map((item, itemIndex) => (
                                                <TouchableOpacity
                                                    key={itemIndex}
                                                    style={styles.itemRow}
                                                    onPress={() => toggleIngredient(catIndex, itemIndex)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Ionicons
                                                        name={item.checked ? "checkbox" : "square-outline"}
                                                        size={24}
                                                        color={item.checked ? Colors.primary : Colors.textSecondary}
                                                        style={{ marginRight: 12 }}
                                                    />
                                                    <Text style={[
                                                        styles.itemText,
                                                        item.checked && styles.itemTextChecked
                                                    ]}>
                                                        {item.name}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.emptyText}>{i18n.t('shoppingList.empty')}</Text>
                                )}
                            </ScrollView>
                        )}

                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
                                <Ionicons name="copy-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.copyButtonText}>{i18n.t('shoppingList.copyAll')}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Custom Toast Notification */}
                        {showToast && (
                            <View style={styles.toastContainer}>
                                <BlurView intensity={90} tint="light" style={styles.toastBlur}>
                                    <Ionicons name="checkmark-circle" size={24} color="#4caf50" style={{ marginRight: 8 }} />
                                    <Text style={styles.toastText}>{i18n.t('shoppingList.copied')}</Text>
                                </BlurView>
                            </View>
                        )}
                    </View>
                </BlurView>
            </View>
        </Modal>
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
    listContainer: {
        flex: 1,
        marginBottom: 20,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    itemText: {
        fontSize: 16,
        color: '#FFF',
        fontFamily: Typography.fontFamily.medium,
        flex: 1,
    },
    itemTextChecked: {
        color: Colors.textSecondary,
        textDecorationLine: 'line-through',
    },
    emptyText: {
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 20,
        fontStyle: 'italic',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingTop: 10,
    },
    copyButton: {
        flexDirection: 'row',
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    copyButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: Typography.fontFamily.bold,
    },
    loadingContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        color: Colors.textSecondary,
        fontFamily: Typography.fontFamily.medium,
    },
    categorySection: {
        marginBottom: 20,
    },
    categoryTitle: {
        fontSize: 18,
        color: Colors.primary,
        fontFamily: Typography.fontFamily.bold,
        marginBottom: 10,
        marginTop: 10,
    },
    toastContainer: {
        position: 'absolute',
        bottom: 100,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
    },
    toastBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
    toastText: {
        color: '#333',
        fontFamily: Typography.fontFamily.bold,
        fontSize: 14,
    },
});
