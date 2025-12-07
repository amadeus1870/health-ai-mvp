import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

export default function PrivacyPolicyScreen() {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Privacy Policy</Text>
            <Text style={styles.date}>Ultimo aggiornamento: 6 Dicembre 2025</Text>

            <View style={styles.section}>
                <Text style={styles.heading}>1. Introduzione</Text>
                <Text style={styles.text}>
                    La tua privacy è fondamentale per noi. Questa applicazione è progettata secondo il principio di "Privacy by Design".
                    In questa informativa spieghiamo come (non) raccogliamo i tuoi dati.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.heading}>2. Archiviazione Locale (Local Storage)</Text>
                <Text style={styles.text}>
                    Tutti i dati inseriti nell'applicazione (inclusi dati biometrici, analisi del sangue, piani nutrizionali e conversazioni chat) vengono salvati **esclusivamente sul tuo dispositivo**.

                    Non abbiamo server cloud, non abbiamo database remoti e non inviamo i tuoi dati a terze parti per scopi di marketing.
                    Se elimini l'app, perdi i dati (a meno che tu non abbia fatto un backup del telefono).
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.heading}>3. Intelligenza Artificiale</Text>
                <Text style={styles.text}>
                    Per fornire il servizio di assistenza intelligente, le tue domande e il contesto strettamente necessario (es. valori nutrizionali, biomarcatori) vengono elaborati da un provider di IA sicuro (Google Gemini).

                    Tali dati vengono trattati in modo effimero solo per generare la risposta e non vengono utilizzati per addestrare i modelli generali.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.heading}>4. Esportazione e Cancellazione</Text>
                <Text style={styles.text}>
                    Hai il controllo totale. Puoi esportare i tuoi report in qualsiasi momento o utilizzare la funzione "Elimina tutti i dati" nelle impostazioni per rimuovere ogni traccia di informazione dall'app.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.heading}>5. Contatti</Text>
                <Text style={styles.text}>
                    Per domande sulla privacy, puoi contattarci tramite lo store di riferimento.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 24,
        fontFamily: Typography.fontFamily.bold,
        color: '#FFF',
        marginBottom: 8,
    },
    date: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        fontFamily: Typography.fontFamily.regular,
        marginBottom: 30,
    },
    section: {
        marginBottom: 24,
    },
    heading: {
        fontSize: 18,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.primary,
        marginBottom: 10,
    },
    text: {
        fontSize: 16,
        fontFamily: Typography.fontFamily.regular,
        color: '#EEE',
        lineHeight: 24,
    },
});
