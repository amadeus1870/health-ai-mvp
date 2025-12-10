import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

interface OrganDetailModalProps {
    visible: boolean;
    onClose: () => void;
    organ: string;
    biomarkers: any[];
}

export const OrganDetailModal: React.FC<OrganDetailModalProps> = ({ visible, onClose, organ, biomarkers }) => {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <BlurView
                    intensity={60}
                    style={StyleSheet.absoluteFill}
                    tint="dark"
                   
                />
                <TouchableOpacity style={styles.backdrop} onPress={onClose} />

                <View style={styles.card}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{organ}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content}>
                        {biomarkers.length > 0 ? (
                            biomarkers.map((bio, index) => (
                                <View key={index} style={styles.row}>
                                    <View>
                                        <Text style={styles.bioName}>{bio.name}</Text>
                                        <Text style={styles.bioValue}>{bio.value} <Text style={styles.bioUnit}>{bio.unit}</Text></Text>
                                    </View>
                                    <View style={[styles.badge, { backgroundColor: bio.status === 'optimal' ? Colors.success : bio.status === 'warning' ? Colors.warning : Colors.error }]}>
                                        <Text style={styles.badgeText}>{bio.status.toUpperCase()}</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>Nessun dato specifico disponibile per questo organo.</Text>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    card: {
        backgroundColor: 'transparent',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '60%',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        color: '#FFF',
        fontFamily: Typography.fontFamily.bold,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    bioName: {
        fontSize: 16,
        color: '#FFF',
        fontFamily: Typography.fontFamily.semiBold,
        marginBottom: 4,
    },
    bioValue: {
        fontSize: 18,
        color: '#FFF',
        fontFamily: Typography.fontFamily.bold,
    },
    bioUnit: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: Typography.fontFamily.regular,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
    emptyText: {
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.6)',
        marginTop: 20,
        fontSize: 16,
    },
});
