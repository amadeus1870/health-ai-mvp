import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { AnalysisService } from '../../services/AnalysisService';
import { BlurView } from 'expo-blur';
import i18n from '../../config/i18n';

interface AnalysisHistoryModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (analysis: any) => void;
    currentAnalysisId?: string;
    onClearCurrentAnalysis?: () => void;
}

export const AnalysisHistoryModal = ({ visible, onClose, onSelect, currentAnalysisId, onClearCurrentAnalysis }: AnalysisHistoryModalProps) => {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    useEffect(() => {
        if (visible) {
            loadHistory();
        }
    }, [visible]);

    const loadHistory = async () => {
        setLoading(true);
        const data = await AnalysisService.getHistory();
        setHistory(data);
        setLoading(false);
    };

    const formatDate = (isoString: string) => {
        if (!isoString) return i18n.t('analysis.history.unknownDate');
        const date = new Date(isoString);
        return date.toLocaleDateString(i18n.locale, {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };



    const handleDelete = (id: string) => {
        setConfirmDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!confirmDeleteId) return;

        try {
            setDeletingId(confirmDeleteId);
            setConfirmDeleteId(null); // Close confirmation immediately
            await AnalysisService.deleteAnalysis(confirmDeleteId);

            // If we deleted the current analysis, clear the global state
            if (confirmDeleteId === currentAnalysisId && onClearCurrentAnalysis) {
                onClearCurrentAnalysis();
            }

            // Remove from local list immediately
            setHistory(prev => prev.filter(item => item.id !== confirmDeleteId));
        } catch (error) {
            Alert.alert(i18n.t('common.error'), i18n.t('analysis.history.errorDelete'));
        } finally {
            setDeletingId(null);
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const isCurrent = item.id === currentAnalysisId;
        return (
            <View style={[styles.historyItemWrapper, isCurrent && styles.activeItemWrapper]}>
                <TouchableOpacity
                    style={styles.historyItem}
                    onPress={() => {
                        onSelect(item);
                        onClose();
                    }}
                >
                    <View style={[styles.iconContainer, isCurrent && styles.activeIconContainer]}>
                        <Ionicons
                            name={isCurrent ? "checkmark-circle" : "document-text-outline"}
                            size={24}
                            color="#FFF"
                        />
                    </View>
                    <View style={styles.itemContent}>
                        <Text style={[styles.itemDate, isCurrent && styles.activeText]}>
                            {formatDate(item.timestamp)} {isCurrent && i18n.t('analysis.history.current')}
                        </Text>
                        <Text style={[styles.itemSummary, isCurrent && styles.activeTextSecondary]}>
                            {item.biomarkers?.length || 0} {i18n.t('analysis.history.biomarkers')} • {item.fattoriDiRischio?.length || 0} {i18n.t('analysis.history.risks')}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Delete Button */}
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                >
                    {deletingId === item.id ? (
                        <ActivityIndicator size="small" color="#FF6B6B" />
                    ) : (
                        <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <BlurView
                        intensity={60}
                        tint="dark"
                        style={StyleSheet.absoluteFill}
                        experimentalBlurMethod='dimezisBlurView'
                    />
                    <View style={styles.header}>
                        <Text style={styles.title}>{i18n.t('analysis.history.title')}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#FFB142" />
                        </View>
                    ) : history.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="file-tray-outline" size={48} color="rgba(255,255,255,0.5)" />
                            <Text style={styles.emptyText}>{i18n.t('analysis.history.noAnalysis')}</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={history}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id || Math.random().toString()}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                    )}


                    {/* Confirmation Overlay */}
                    {confirmDeleteId && (
                        <View style={styles.confirmationOverlay}>
                            <BlurView
                                intensity={60}
                                tint="dark"
                                style={StyleSheet.absoluteFill}
                                experimentalBlurMethod='dimezisBlurView'
                            />
                            <View style={styles.confirmationCard}>
                                <BlurView
                                    intensity={80}
                                    tint="dark"
                                    style={StyleSheet.absoluteFill}
                                    experimentalBlurMethod='dimezisBlurView'
                                />
                                <View style={styles.warningIconContainer}>
                                    <Ionicons name="trash-outline" size={32} color="#FF6B6B" />
                                </View>
                                <Text style={styles.confirmationTitle}>{i18n.t('analysis.history.deleteTitle')}</Text>
                                <Text style={styles.confirmationText}>
                                    {confirmDeleteId === currentAnalysisId
                                        ? i18n.t('analysis.history.deleteConfirmCurrent')
                                        : i18n.t('analysis.history.deleteConfirm')
                                    }
                                </Text>
                                <View style={styles.confirmationActions}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => setConfirmDeleteId(null)}
                                    >
                                        <Text style={styles.cancelButtonText}>{i18n.t('analysis.history.cancel')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.confirmButton}
                                        onPress={confirmDelete}
                                    >
                                        <Text style={styles.confirmButtonText}>{i18n.t('analysis.history.delete')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'transparent', // Transparent for BlurView
        borderRadius: 24,
        height: '80%',
        paddingTop: 20,
        overflow: 'hidden', // Ensure blur respects radius
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontFamily: Typography.fontFamily.bold,
        color: '#FFF', // White text
    },
    closeButton: {
        padding: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.6,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        fontFamily: Typography.fontFamily.medium,
        color: 'rgba(255,255,255,0.7)', // Light text
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    historyItemWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)', // Glassy item background
        borderRadius: 16,
        marginBottom: 12,
        paddingRight: 16,
        overflow: 'hidden',
    },
    activeItemWrapper: {
        backgroundColor: 'rgba(255, 177, 66, 0.15)', // Orange tint
        borderWidth: 1,
        borderColor: '#FFB142',
    },
    historyItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    deleteButton: {
        padding: 8,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.1)', // Glassy icon bg
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    activeIconContainer: {
        backgroundColor: '#FFB142',
    },
    activeText: {
        color: '#FFB142', // Orange text
    },
    activeTextSecondary: {
        color: 'rgba(255, 177, 66, 0.8)',
    },

    itemContent: {
        flex: 1,
    },
    itemDate: {
        fontSize: 16,
        fontFamily: Typography.fontFamily.semiBold,
        color: '#FFF', // White text
        marginBottom: 4,
    },
    itemSummary: {
        fontSize: 12,
        fontFamily: Typography.fontFamily.regular,
        color: 'rgba(255,255,255,0.6)', // Light secondary text
    },
    confirmationOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.5)', // Match profile.tsx
    },
    confirmationCard: {
        width: '100%',
        backgroundColor: 'transparent', // Transparent for BlurView
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        overflow: 'hidden', // Needed for BlurView to respect borderRadius
    },
    warningIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    confirmationTitle: {
        fontSize: 20,
        fontFamily: Typography.fontFamily.bold,
        color: '#FFF',
        marginBottom: 8,
    },
    confirmationText: {
        fontSize: 14,
        fontFamily: Typography.fontFamily.regular,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    confirmationActions: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#FFF',
        fontFamily: Typography.fontFamily.semiBold,
        fontSize: 16,
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#FF6B6B',
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#FFF',
        fontFamily: Typography.fontFamily.bold,
        fontSize: 16,
    },
});
