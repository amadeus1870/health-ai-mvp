import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

interface AccordionCardProps {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

export const AccordionCard: React.FC<AccordionCardProps> = ({
    title,
    icon,
    color,
    children,
    defaultOpen = false
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const toggleOpen = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsOpen(!isOpen);
    };

    return (
        <View style={[styles.container, { borderColor: color + '40', backgroundColor: '#FFF' }]}>
            {/* Background Icon Watermark */}
            <View style={styles.watermarkContainer}>
                <Ionicons
                    name={icon}
                    size={140}
                    color={color}
                    style={{ opacity: 0.15, transform: [{ rotate: '15deg' }] }}
                />
            </View>

            <TouchableOpacity
                style={styles.header}
                onPress={toggleOpen}
                activeOpacity={0.7}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.title}>{title}</Text>
                </View>
                <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={24}
                    color={color}
                />
            </TouchableOpacity>

            {isOpen && (
                <View style={styles.content}>
                    {children}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
        position: 'relative', // Ensure absolute positioning works relative to this
    },
    watermarkContainer: {
        position: 'absolute',
        left: -40,
        top: -30,
        zIndex: -1, // Ensure it's behind everything
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingVertical: 18,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: 10,
    },
    title: {
        fontSize: 15,
        color: '#2D3436',
        letterSpacing: 0.5,
        fontFamily: Typography.fontFamily.bold,
        flexShrink: 1,
    },
    content: {
        padding: 20,
        paddingTop: 0,
    },
});
