import React from 'react';
import { ViewStyle, StyleProp, Platform, StyleSheet, View } from 'react-native';
import { BlurView, BlurViewProps } from 'expo-blur';

interface GlassViewProps extends BlurViewProps {
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
    disableBlurEffect?: boolean;
}

export const GlassView: React.FC<GlassViewProps> = ({
    style,
    intensity = 50,
    tint = 'dark',
    children,
    disableBlurEffect = false,
    ...props
}) => {
    // Android Fallback: Always use static view to prevent freezing
    // The native BlurView is too heavy for ScrollViews/Lists on Android
    if (Platform.OS === 'android' || disableBlurEffect) {
        // Extract BlurView specific props to avoid passing them to View
        const { experimentalBlurMethod, ...viewProps } = props as any;

        return (
            <View
                style={[
                    style,
                    {
                        backgroundColor: tint === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(20, 20, 20, 0.95)',
                        overflow: 'hidden'
                    }
                ]}
                {...viewProps}
            >
                {children}
            </View>
        );
    }

    return (
        <BlurView
            intensity={intensity}
            tint={tint}
            style={[{ backgroundColor: 'transparent' }, style]}
            experimentalBlurMethod='dimezisBlurView'
            {...props}
        >
            {children}
        </BlurView>
    );
};
