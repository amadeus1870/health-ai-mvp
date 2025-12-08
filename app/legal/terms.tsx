import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ImageBackground } from 'react-native';
import { Typography } from '../../constants/Typography';
import { BlurView } from 'expo-blur';

export default function TermsOfServiceScreen() {
    return (
        <ImageBackground
            source={require('../../assets/images/custom_bg.jpg')}
            style={{ flex: 1 }}
            resizeMode="cover"
        >
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.title}>Termini di Servizio</Text>
                    <Text style={styles.date}>Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}</Text>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>1. Accettazione dei Termini</Text>
                        <Text style={styles.text}>
                            Scaricando o utilizzando l'app, accetti automaticamente questi termini. Assicurati di leggerli attentamente prima di utilizzare l'applicazione.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>2. Uso dell'Applicazione</Text>
                        <Text style={styles.text}>
                            L'app è destinata esclusivamente a scopi informativi e di benessere personale. Non è consentito utilizzare l'app per scopi illegali o non autorizzati.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>3. Disclaimer Medico</Text>
                        <Text style={styles.text}>
                            Questa applicazione NON è un dispositivo medico e NON fornisce diagnosi mediche. Le informazioni fornite non sostituiscono il parere di un medico professionista. Consulta sempre un medico per qualsiasi problema di salute.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>4. Limitazione di Responsabilità</Text>
                        <Text style={styles.text}>
                            L'app viene fornita "così com'è" e "come disponibile". Non garantiamo che l'app sarà sempre sicura, protetta o priva di errori. Non siamo responsabili per l'accuratezza o l'affidabilità di qualsiasi opinione, consiglio o dichiarazione fatta tramite l'app.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>5. Modifiche ai Termini</Text>
                        <Text style={styles.text}>
                            Ci riserviamo il diritto di modificare questi termini in qualsiasi momento. Le modifiche saranno efficaci immediatamente dopo la pubblicazione.
                        </Text>
                    </View>

                    <View style={{ height: 50 }} />
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20 },
    title: {
        fontSize: 28,
        fontFamily: Typography.fontFamily.bold,
        color: '#FFF',
        marginBottom: 8,
        marginTop: 60, // Space for header
    },
    date: {
        fontSize: 14,
        fontFamily: Typography.fontFamily.regular,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 30,
    },
    section: { marginBottom: 24 },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Typography.fontFamily.bold,
        color: '#FFB142',
        marginBottom: 8,
    },
    text: {
        fontSize: 16,
        fontFamily: Typography.fontFamily.regular,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 24,
    },
});
