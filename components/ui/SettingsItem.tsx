import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';


interface SettingsItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
    isDestructive?: boolean;
    isSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
    color?: string;
}

export default function SettingsItem({
    icon,
    label,
    value,
    onPress,
    isDestructive = false,
    isSwitch = false,
    switchValue,
    onSwitchChange,
    color,
    rightElement
}: SettingsItemProps & { rightElement?: React.ReactNode }) {
    const itemColor = isDestructive ? '#FF453A' : (color || '#FFF');

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={isSwitch ? undefined : onPress}
            activeOpacity={isSwitch ? 1 : 0.7}
            disabled={!onPress && !isSwitch}
        >
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: isDestructive ? 'rgba(255, 69, 58, 0.2)' : 'rgba(255,255,255,0.1)' }]}>
                    <Ionicons name={icon} size={20} color={itemColor} />
                </View>

                <View style={styles.textContainer}>
                    <Text style={[styles.label, { color: itemColor }]}>{label}</Text>
                </View>

                {isSwitch ? (
                    <Switch
                        value={switchValue}
                        onValueChange={onSwitchChange}
                        trackColor={{ true: Colors.primary, false: '#333' }}
                        thumbColor="#FFF"
                    />
                ) : (
                    <View style={styles.rightContainer}>
                        {rightElement}
                        {value && <Text style={styles.value}>{value}</Text>}
                        {onPress && <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />}
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 2, // Reduced from 10
        borderRadius: 12,
        overflow: 'hidden',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12, // Reduced from 16
        // backgroundColor: 'rgba(255,255,255,0.05)', // Removed as requested
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    label: {
        fontSize: 16,
        fontFamily: Typography.fontFamily.medium,
        textShadowColor: 'transparent', // Ensure no shadow "alone"
        textShadowRadius: 0,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    value: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        fontFamily: Typography.fontFamily.regular,
        marginRight: 8,
    },
});
