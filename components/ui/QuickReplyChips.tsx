import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const SUGGESTIONS = [
    { id: '1', text: "🥗 Cosa mangio oggi?", icon: "restaurant-outline" },
    { id: '2', text: "📊 Riepilogo dati", icon: "stats-chart-outline" },
    { id: '3', text: "💊 La mia routine", icon: "medkit-outline" },
    { id: '4', text: "💡 Dammi un consiglio", icon: "bulb-outline" },
];

interface QuickReplyChipsProps {
    onSelect: (text: string) => void;
    visible: boolean;
}

export default function QuickReplyChips({ onSelect, visible }: QuickReplyChipsProps) {
    if (!visible) return null;

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {SUGGESTIONS.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.chip}
                        onPress={() => onSelect(item.text.replace(/^[^\w]+/, '').trim())} // Remove emoji for sending
                        activeOpacity={0.7}
                    >
                        <BlurView intensity={30} tint="light" style={styles.blur} experimentalBlurMethod='dimezisBlurView'>
                            <Ionicons name={item.icon as any} size={16} color="#FFF" style={styles.icon} />
                            <Text style={styles.text}>{item.text}</Text>
                        </BlurView>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 10,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 5,
    },
    chip: {
        marginRight: 10,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    blur: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    icon: {
        marginRight: 6,
    },
    text: {
        color: '#FFF',
        fontSize: 13,
        fontFamily: Typography.fontFamily.medium,
    },
});
