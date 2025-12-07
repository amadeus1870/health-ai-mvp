import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Ionicons } from '@expo/vector-icons';

export default function DisclaimerScreen() {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.warningBox}>
                <Ionicons name="warning" size={48} color="#FF9F0A" style={{ marginBottom: 10 }} />
                <Text style={styles.warningTitle}>IMPORTANTE</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.heading}>Non è un Dispositivo Medico</Text>
                <Text style={styles.text}>
                    Questa applicazione e i suoi contenuti sono forniti solo a scopo informativo e non costituiscono un parere medico, una diagnosi o un trattamento.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.heading}>Consulta un Medico</Text>
                <Text style={styles.text}>
                    Chiedi sempre il parere del tuo medico o di un altro operatore sanitario qualificato per qualsiasi domanda tu possa avere in merito a una condizione medica.
                    Non trascurare mai il parere medico professionale né ritardare la ricerca di esso a causa di qualcosa che hai letto su questa applicazione.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.heading}>Nessuna Garanzia</Text>
                <Text style={styles.text}>
                    L'intelligenza artificiale utilizzata per generare consigli potrebbe commettere errori. Verifica sempre le informazioni importanti.
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
    section: {
        marginBottom: 24,
    },
    heading: {
        fontSize: 18,
        fontFamily: Typography.fontFamily.bold,
        color: '#FFF',
        marginBottom: 10,
    },
    text: {
        fontSize: 16,
        fontFamily: Typography.fontFamily.regular,
        color: '#EEE',
        lineHeight: 24,
    },
});
