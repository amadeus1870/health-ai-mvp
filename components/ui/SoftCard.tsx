import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors } from '../../constants/Colors';

interface SoftCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    variant?: 'default' | 'elevated';
}

export const SoftCard: React.FC<SoftCardProps> = ({ children, style, variant = 'default' }) => {
    return (
        <View style={[
            styles.card,
            variant === 'elevated' ? styles.elevated : styles.default,
            style
        ]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E1E8ED',
    },
    default: {
        // Base shadow is in card
    },
    elevated: {
        // No extra shadow for elevated, maybe just same style or slightly different border?
        // Let's keep it simple as requested: "bordi netti e puliti"
        borderColor: '#D1D8DD',
    }
});
