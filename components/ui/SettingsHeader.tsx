import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GlassView } from './GlassView';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../constants/Typography';

interface SettingsHeaderProps {
    title: string;
    showBack?: boolean;
}

export const SettingsHeader = ({ title, showBack = true }: SettingsHeaderProps) => {
    const router = useRouter();

    return (
        <GlassView
            intensity={50}
            tint="dark"
            style={styles.container}
        >
            <View style={styles.content}>
                {showBack && (
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="chevron-back" size={28} color="#FFF" />
                    </TouchableOpacity>
                )}
                <Text style={[styles.title, !showBack && styles.titleNoBack]}>{title}</Text>
            </View>
        </GlassView>
    );
};

const styles = StyleSheet.create({
    container: {
        zIndex: 100,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    content: {
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    backButton: {
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontFamily: Typography.fontFamily.bold,
        color: '#FFF',
        flex: 1,
    },
    titleNoBack: {
        marginLeft: 4,
    }
});
