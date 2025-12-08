import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ImageBackground } from 'react-native';
import { Typography } from '../../constants/Typography';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

export default function DisclaimerScreen() {
    return (
        <ImageBackground
            source={require('../../assets/images/custom_bg.jpg')}
            style={{ flex: 1 }}
            resizeMode="cover"
        >
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.title}>Disclaimer Medico</Text>

                    <View style={styles.warningBox}>
                        <Ionicons name="warning" size={48} color="#FF9F0A" style={{ marginBottom: 10 }} />
                        <Text style={styles.warningTitle}>IMPORTANTE</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Non è un Dispositivo Medico</Text>
                        <Text style={styles.text}>
                            Questa applicazione e i suoi contenuti sono forniti solo a scopo informativo e non costituiscono un parere medico, una diagnosi o un trattamento.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Consulta un Medico</Text>
                        <Text style={styles.text}>
                            Chiedi sempre il parere del tuo medico o di un altro operatore sanitario qualificato per qualsiasi domanda tu possa avere in merito a una condizione medica.
                            Non trascurare mai il parere medico professionale né ritardare la ricerca di esso a causa di qualcosa che hai letto su questa applicazione.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Nessuna Garanzia</Text>
                        <Text style={styles.text}>
                            L'intelligenza artificiale utilizzata per generare consigli potrebbe commettere errori. Verifica sempre le informazioni importanti.
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
        marginBottom: 24,
        marginTop: 60, // Space for header
        textAlign: 'center',
    },
    warningBox: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(255, 159, 10, 0.1)',
        borderRadius: 16,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(255, 159, 10, 0.3)',
    },
    warningTitle: {
        fontSize: 20,
        fontFamily: Typography.fontFamily.bold,
        color: '#FF9F0A',
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
