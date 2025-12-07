import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

export default function TermsScreen() {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Termini di Servizio</Text>

            <View style={styles.section}>
                <Text style={styles.heading}>1. Accettazione dei Termini</Text>
                <Text style={styles.text}>
                    Scaricando o utilizzando l'app, accetti automaticamente questi termini. Assicurati di leggerli attentamente prima di utilizzare l'applicazione.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.heading}>2. Uso dell'Applicazione</Text>
                <Text style={styles.text}>
                    L'app è fornita per uso personale. Non è consentito copiare o modificare l'app, alcuna parte dell'app o i nostri marchi in alcun modo.
                    Non è consentito tentare di estrarre il codice sorgente dell'app.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.heading}>3. Limitazione di Responsabilità</Text>
                <Text style={styles.text}>
                    L'app viene fornita "così com'è" e "come disponibile". Non garantiamo che l'app sarà sempre sicura, protetta o priva di errori.
                    Non siamo responsabili per l'accuratezza o l'affidabilità di qualsiasi opinione, consiglio o dichiarazione fatta tramite l'app.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.heading}>4. Modifiche</Text>
                <Text style={styles.text}>
                    Ci impegniamo a garantire che l'app sia il più utile ed efficiente possibile. Per questo motivo, ci riserviamo il diritto di apportare modifiche all'app o di addebitare i suoi servizi, in qualsiasi momento e per qualsiasi motivo.
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
        marginBottom: 20,
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
