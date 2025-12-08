import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ImageBackground } from 'react-native';
import { Typography } from '../../constants/Typography';
import { BlurView } from 'expo-blur';

export default function PrivacyPolicyScreen() {
    return (
        <ImageBackground
            source={require('../../assets/images/custom_bg.jpg')}
            style={{ flex: 1 }}
            resizeMode="cover"
        >
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.title}>Privacy Policy</Text>
                    <Text style={styles.date}>Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}</Text>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Titolare del Trattamento</Text>
                        <Text style={styles.text}>
                            EARTH'S DREAMS S.R.L.{'\n'}
                            Stradela Carabus Nr. 15, Iasi, 700275, Romania{'\n'}
                            CUI: 38752272 (J22/39/07.01.2019){'\n'}
                            Partita IVA: RO38752272{'\n'}
                            Email: privacy@earthsdreams.com
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>1. Introduzione</Text>
                        <Text style={styles.text}>
                            Benvenuto in Proactive Lab (di seguito "l'Applicazione"). Riconosciamo la natura sensibile dei dati sanitari e ci impegniamo a proteggerli in conformità con il Regolamento Generale sulla Protezione dei Dati (GDPR - UE 2016/679).
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>2. Tipologia di Dati Raccolti</Text>
                        <Text style={styles.text}>
                            <Text style={{ fontWeight: 'bold', color: '#FFF' }}>A. Dati forniti volontariamente:</Text>{'\n'}
                            - Dati del profilo (nome, età, genere, altezza, peso).{'\n'}
                            - Dati sanitari (biomarcatori, sintomi, note mediche).{'\n'}
                            - Immagini (referti medici caricati per l'analisi).{'\n'}{'\n'}
                            <Text style={{ fontWeight: 'bold', color: '#FFF' }}>B. Dati raccolti automaticamente:</Text>{'\n'}
                            - Dati tecnici necessari per la sicurezza e il funzionamento dell'app (es. log di errore anonimi).
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>3. Archiviazione Locale (Local Storage)</Text>
                        <Text style={styles.text}>
                            A differenza di molti servizi cloud, adottiamo un approccio <Text style={{ fontWeight: 'bold', color: '#FFF' }}>"Privacy by Design"</Text>:{'\n'}
                            I tuoi dati personali e sanitari vengono salvati <Text style={{ fontWeight: 'bold', color: '#FFF' }}>esclusivamente nella memoria locale del tuo dispositivo</Text>.
                            Non possediamo un database centrale con i tuoi dati medici. Se disinstalli l'app senza backup, i dati andranno persi.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>4. Intelligenza Artificiale (Google Gemini)</Text>
                        <Text style={styles.text}>
                            Per fornire analisi e suggerimenti, l'Applicazione utilizza le API di Google Gemini (Google Cloud Platform).{'\n'}
                            - I dati strettamente necessari per l'analisi vengono trasmessi in modo sicuro e crittografato.{'\n'}
                            - Secondo i termini "Enterprise" di Google, i tuoi dati <Text style={{ fontWeight: 'bold', color: '#FFF' }}>NON vengono utilizzati per addestrare i loro modelli</Text>.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>5. Disclaimer Medico & AI</Text>
                        <Text style={styles.text}>
                            - <Text style={{ fontWeight: 'bold', color: '#FFF' }}>NON È UN DISPOSITIVO MEDICO:</Text> Le informazioni sono solo a scopo educativo.{'\n'}
                            - <Text style={{ fontWeight: 'bold', color: '#FFF' }}>POSSIBILITÀ DI ERRORE:</Text> L'AI può commettere errori ("allucinazioni"). Verifica sempre i numeri e i consigli.{'\n'}
                            - <Text style={{ fontWeight: 'bold', color: '#FFF' }}>CONSULTO MEDICO:</Text> Non prendere decisioni mediche basate solo sull'app. Consulta sempre un medico.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>6. I Tuoi Diritti (GDPR)</Text>
                        <Text style={styles.text}>
                            Hai il pieno controllo dei tuoi dati. Puoi modificarli o cancellarli integralmente utilizzando la funzione "Elimina tutti i dati" nelle impostazioni dell'app.
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
