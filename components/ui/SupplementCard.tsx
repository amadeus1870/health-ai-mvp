import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { SoftCard } from './SoftCard';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../constants/Typography';

interface Supplement {
    name: string;
    reason: string;
    dosage: string;
}

export const SupplementCard: React.FC<{ supplement: Supplement, textColor?: string }> = ({ supplement, textColor }) => {
    const mainTextColor = textColor || Colors.primary;
    const bodyTextColor = textColor || '#636E72';
    const dosageTextColor = textColor || Colors.primary;

    const dosageBgColor = textColor ? 'rgba(255,255,255,0.1)' : '#F4F6FA';
    const borderColor = textColor ? 'rgba(255,255,255,0.1)' : '#F0F2F5';

    const statusColor = Colors.success; // Green for recommendations

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
            <Text style={[styles.name, { color: mainTextColor }]}>{supplement.name}</Text>
            <Text style={[styles.reason, { color: bodyTextColor }]}>{supplement.reason}</Text>
            <View style={[styles.dosageContainer, { backgroundColor: dosageBgColor }]}>
                <Ionicons name="time-outline" size={14} color={dosageTextColor} />
                <Text style={[styles.dosage, { color: dosageTextColor }]}>{supplement.dosage}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        // Default styles
    },
    name: {
        fontSize: 15,
        color: Colors.primary, // Light blue
        fontFamily: Typography.fontFamily.semiBold,
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    reason: {
        fontSize: 16,
        color: '#636E72', // Body text color
        marginBottom: 10,
        lineHeight: 24, // Increased line height for better readability with larger font
        fontFamily: Typography.fontFamily.regular,
    },
    dosageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4F6FA', // Lighter background
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    dosage: {
        fontSize: 12,
        color: Colors.primary,
        marginLeft: 6,
        fontFamily: Typography.fontFamily.medium,
    },
});
