import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ImageBackground } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';

export default function WellbeingScreen() {
    return (
        // <LinearGradient
        //     colors={Colors.gradients.pastel as any}
        //     style={styles.container}
        //     start={{ x: 0, y: 0 }}
        //     end={{ x: 1, y: 1 }}
        // >
        <ImageBackground
            source={require('../../assets/images/custom_bg.jpg')}
            style={styles.container}
            resizeMode="cover"
        >
            <SafeAreaView style={styles.safeArea}>
                <Text style={styles.title}>Benessere</Text>
                <Text style={styles.subtitle}>Presto disponibile</Text>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontFamily: Typography.fontFamily.bold,
        color: '#FFF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: Typography.fontFamily.regular,
        color: 'rgba(255,255,255,0.8)',
    },
});
