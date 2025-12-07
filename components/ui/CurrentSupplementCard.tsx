import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../constants/Typography';

interface CurrentSupplement {
    name: string;
    action: 'Conferma' | 'Sospendi';
    reason: string;
}

export const CurrentSupplementCard: React.FC<{ supplement: CurrentSupplement, textColor?: string }> = ({ supplement, textColor }) => {
    const isConfirmed = supplement.action === 'Conferma';
    const statusColor = isConfirmed ? Colors.success : Colors.error;
    const iconName = isConfirmed ? 'checkmark-circle' : 'close-circle';

    const nameColor = textColor || Colors.primary;
    const reasonColor = textColor || '#636E72';
    const borderColor = textColor ? 'rgba(255,255,255,0.1)' : '#F0F2F5';

    const containerStyle = textColor ? {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: statusColor,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    } : {
        borderBottomWidth: 1,
        borderBottomColor: '#F0F2F5',
        marginBottom: 16,
        paddingBottom: 16,
    };

    return (
        <View style={containerStyle}>
            <View style={styles.header}>
                <Text style={[styles.name, { color: nameColor }]}>{supplement.name}</Text>
                <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
                    <Ionicons name={iconName} size={16} color={statusColor} style={{ marginRight: 4 }} />
                    <Text style={[styles.badgeText, { color: statusColor }]}>{supplement.action}</Text>
                </View>
            </View>
            <Text style={[styles.reason, { color: reasonColor }]}>{supplement.reason}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        // Default container styles if needed, mostly overridden by inline styles
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    name: {
        fontSize: 16,
        color: Colors.primary,
        fontFamily: Typography.fontFamily.semiBold,
        flex: 1,
        marginRight: 8,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontFamily: Typography.fontFamily.bold,
        textTransform: 'uppercase',
    },
    reason: {
        fontSize: 14,
        color: '#636E72',
        lineHeight: 20,
        fontFamily: Typography.fontFamily.regular,
    },
});
