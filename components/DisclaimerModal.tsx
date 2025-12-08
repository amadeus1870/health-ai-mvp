import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const DISCLAIMER_ACCEPTED_KEY = 'disclaimer_accepted_v2';

export const DisclaimerModal = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        checkDisclaimerStatus();
    }, []);

    const checkDisclaimerStatus = async () => {
        try {
            const accepted = await AsyncStorage.getItem(DISCLAIMER_ACCEPTED_KEY);
            if (accepted !== 'true') {
                setVisible(true);
            }
        } catch (error) {
            console.error("Failed to check disclaimer status", error);
        }
    };

    const handleAccept = async () => {
        try {
            await AsyncStorage.setItem(DISCLAIMER_ACCEPTED_KEY, 'true');
            setVisible(false);
        } catch (error) {
            console.error("Failed to save disclaimer status", error);
        }
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={() => { }} // Prevent closing with back button
        >
            <View style={styles.container}>
                <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

                <View style={styles.card}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="medical" size={40} color="#FF5252" />
                    </View>

                    <Text style={styles.title}>Disclaimer Importante</Text>

                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                        <Text style={styles.text}>
                            Questa applicazione utilizza l'Intelligenza Artificiale per fornire analisi e suggerimenti basati sui dati forniti dall'utente.
                        </Text>

                        <Text style={styles.highlight}>
                            NON È UN DISPOSITIVO MEDICO.
                        </Text>

                        <Text style={styles.text}>
                            Le informazioni fornite sono a scopo puramente informativo e di benessere generale. Non costituiscono in alcun modo una diagnosi medica, un trattamento o una prescrizione.
                        </Text>

                        <Text style={styles.text}>
                            Non sostituire mai il parere del tuo medico curante con le informazioni ottenute da questa app. In caso di dubbi sulla tua salute, consulta sempre un professionista sanitario.
                        </Text>

                        <Text style={styles.text}>
                            Continuando, dichiari di aver letto e compreso che l'uso di questa applicazione è sotto la tua esclusiva responsabilità.
                        </Text>
                    </ScrollView>

                    <TouchableOpacity style={styles.button} onPress={handleAccept} activeOpacity={0.8}>
                        <Text style={styles.buttonText}>Ho capito e Accetto</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 20,
    },
    card: {
        width: width * 0.85,
        maxHeight: height * 0.7,
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 82, 82, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontFamily: Typography.fontFamily.bold,
        color: '#333',
        marginBottom: 16,
        textAlign: 'center',
    },
    scrollView: {
        width: '100%',
        marginBottom: 20,
    },
    scrollContent: {
        paddingVertical: 10,
    },
    text: {
        fontSize: 16,
        fontFamily: Typography.fontFamily.regular,
        color: '#555',
        marginBottom: 16,
        lineHeight: 24,
        textAlign: 'center',
    },
    highlight: {
        fontSize: 16,
        fontFamily: Typography.fontFamily.bold,
        color: '#FF5252',
        marginBottom: 16,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    button: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: Typography.fontFamily.bold,
    }
});
