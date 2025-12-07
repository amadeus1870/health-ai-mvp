import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Typography } from '../../constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { SoftCard } from './SoftCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

interface DietStrategyCardsProps {
    dietType: string;
    onInfoPress: (title: string, message: string) => void;
}

const getDietDetails = (dietType: string) => {
    const normalized = dietType.toLowerCase();
    const baseReasoning = "Questa strategia nutrizionale è stata elaborata analizzando i tuoi biomarcatori e il tuo profilo metabolico. L'obiettivo è ottimizzare i tuoi livelli di energia, migliorare i parametri fuori norma e supportare il tuo benessere a lungo termine, rispettando le tue preferenze alimentari.";

    if (normalized.includes('mediterranea')) {
        return {
            description: "La dieta Mediterranea è considerata una delle più sane al mondo. Si basa su alimenti vegetali, grassi sani (olio d'oliva) e consumo moderato di proteine animali.",
            detailedReasoning: `${baseReasoning}\n\nAbbiamo scelto la Dieta Mediterranea perché è ricca di antiossidanti e grassi monoinsaturi, ideali per migliorare la salute cardiovascolare e ridurre l'infiammazione sistemica evidenziata dalle tue analisi.`,
            allowed: ["Verdura", "Frutta", "Cereali Integrali", "Legumi", "Noci", "Olio d'Oliva", "Pesce"],
            avoided: ["Zuccheri", "Carni lavorate", "Cibi ultra-processati", "Bevande dolci"]
        };
    } else if (normalized.includes('keto') || normalized.includes('chetogenica')) {
        return {
            description: "La dieta Chetogenica riduce drasticamente i carboidrati per spingere il corpo a bruciare grassi come fonte primaria di energia (chetosi).",
            detailedReasoning: `${baseReasoning}\n\nLa Dieta Chetogenica è stata selezionata per migliorare la tua sensibilità insulinica e favorire una rapida ossidazione dei grassi, in linea con i tuoi obiettivi di composizione corporea e i parametri metabolici rilevati.`,
            allowed: ["Carne", "Pesce", "Uova", "Formaggi", "Verdure foglia", "Oli", "Burro", "Avocado"],
            avoided: ["Pane", "Pasta", "Frutta zuccherina", "Legumi", "Patate", "Dolci", "Alcol"]
        };
    } else if (normalized.includes('vegetariana')) {
        return {
            description: "La dieta Vegetariana esclude carne e pesce, concentrandosi su alimenti vegetali, uova e latticini per un apporto bilanciato.",
            detailedReasoning: `${baseReasoning}\n\nAbbiamo optato per un approccio Vegetariano per ridurre il carico di grassi saturi e aumentare l'apporto di fibre e fitonutrienti, essenziali per regolarizzare la funzionalità intestinale e il profilo lipidico.`,
            allowed: ["Verdura", "Legumi", "Soia", "Cereali", "Uova", "Latticini", "Frutta secca"],
            avoided: ["Carne", "Pesce", "Salumi", "Gelatina", "Strutto"]
        };
    } else if (normalized.includes('vegana')) {
        return {
            description: "La dieta Vegana esclude tutti i prodotti di origine animale. È ricca di fibre e antiossidanti, ottima per la salute del cuore.",
            detailedReasoning: `${baseReasoning}\n\nLa scelta Vegana massimizza l'apporto di nutrienti vegetali protettivi. È particolarmente indicata per ridurre lo stress ossidativo e migliorare la salute cardiovascolare, come suggerito dai tuoi biomarcatori.`,
            allowed: ["Legumi", "Tofu", "Tempeh", "Cereali", "Semi", "Frutta", "Verdura", "Latte veg"],
            avoided: ["Carne", "Pesce", "Uova", "Latticini", "Miele", "Derivati animali"]
        };
    } else if (normalized.includes('paleo')) {
        return {
            description: "La dieta Paleo si ispira all'alimentazione dei nostri antenati cacciatori-raccoglitori, escludendo cibi processati e cereali.",
            detailedReasoning: `${baseReasoning}\n\nIl protocollo Paleo è stato scelto per eliminare potenziali allergeni e irritanti intestinali (come glutine e latticini), favorendo un reset metabolico e una riduzione dell'infiammazione cronica.`,
            allowed: ["Carne", "Pesce", "Frutta", "Verdura", "Noci", "Semi", "Oli sani"],
            avoided: ["Cereali", "Legumi", "Latticini", "Zuccheri", "Cibi processati"]
        };
    } else {
        return {
            description: "Un'alimentazione bilanciata personalizzata per supportare il tuo benessere generale e mantenere livelli di energia costanti.",
            detailedReasoning: `${baseReasoning}\n\nAbbiamo strutturato un piano Bilanciato per garantirti un apporto completo di macro e micronutrienti, correggendo le carenze emerse dalle analisi e sostenendo il tuo stile di vita attivo.`,
            allowed: ["Verdure", "Proteine magre", "Carboidrati", "Grassi sani", "Frutta"],
            avoided: ["Zuccheri", "Fritti", "Sale eccessivo", "Alcolici", "Junk food"]
        };
    }
};

import { LinearGradient } from 'expo-linear-gradient';

// ... imports

const DietCard = ({ title, icon, color, children, onInfoPress, gradientColors, gradientLocations }: any) => {
    const Content = () => (
        <>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: gradientColors ? 'rgba(255,255,255,0.2)' : `${color}20` }]}>
                        <Ionicons name={icon} size={24} color={color} />
                    </View>
                    <Text style={styles.cardTitle}>{title}</Text>
                </View>
                {onInfoPress && (
                    <TouchableOpacity onPress={onInfoPress}>
                        <Ionicons name="information-circle-outline" size={24} color="rgba(255,255,255,0.6)" />
                    </TouchableOpacity>
                )}
            </View>
            <View style={styles.body}>
                {children}
            </View>
        </>
    );

    return (
        <SoftCard style={styles.cardContainer}>
            {gradientColors ? (
                <LinearGradient
                    colors={gradientColors}
                    locations={gradientLocations}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardContent}
                >
                    <Content />
                </LinearGradient>
            ) : (
                <BlurView intensity={60} tint="dark" style={styles.cardContent} experimentalBlurMethod='dimezisBlurView'>
                    <Content />
                </BlurView>
            )}
        </SoftCard>
    );
};

export const DietStrategyCards: React.FC<DietStrategyCardsProps> = ({ dietType, onInfoPress }) => {
    const details = getDietDetails(dietType);

    return (
        <>
            {/* Card 1: Explanation */}
            <DietCard
                title="Perché questa dieta?"
                icon="book-outline"
                color="#FFF" // White icon for better contrast on gradient
                gradientColors={['#1e3c72', '#9b59b6', '#fdbb2d']} // Dark Blue, Purple, Yellow (Health Map Style)
                onInfoPress={() => onInfoPress("Strategia Personalizzata", details.detailedReasoning)}
            >
                <Text style={styles.description}>{details.description}</Text>
            </DietCard>

            {/* Card 2: Allowed Foods */}
            <DietCard title="Cibi Consigliati" icon="checkmark-circle-outline" color="#2ecc71">
                <View style={styles.tagsContainer}>
                    {details.allowed.slice(0, 8).map((item, index) => (
                        <View key={index} style={[styles.tag, { backgroundColor: 'rgba(46, 204, 113, 0.15)', borderColor: 'rgba(46, 204, 113, 0.3)' }]}>
                            <Text style={[styles.tagText, { color: '#2ecc71' }]}>{item}</Text>
                        </View>
                    ))}
                </View>
            </DietCard>

            {/* Card 3: Avoided Foods */}
            <DietCard title="Cibi da Evitare" icon="close-circle-outline" color="#e74c3c">
                <View style={styles.tagsContainer}>
                    {details.avoided.slice(0, 8).map((item, index) => (
                        <View key={index} style={[styles.tag, { backgroundColor: 'rgba(231, 76, 60, 0.15)', borderColor: 'rgba(231, 76, 60, 0.3)' }]}>
                            <Text style={[styles.tagText, { color: '#e74c3c' }]}>{item}</Text>
                        </View>
                    ))}
                </View>
            </DietCard>
        </>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        width: CARD_WIDTH,
        height: 240,
        marginRight: 16,
        padding: 0, // Remove default padding to let BlurView fill
        backgroundColor: 'transparent', // Transparent for BlurView
        overflow: 'hidden', // Clip BlurView
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)', // Match AnalysisHistoryModal
        borderRadius: 24, // Match SoftCard radius
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    cardContent: {
        flex: 1,
        padding: 20,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontFamily: Typography.fontFamily.bold,
        color: '#FFF',
    },
    body: {
        flex: 1,
        justifyContent: 'center',
    },
    description: {
        fontSize: 16,
        fontFamily: Typography.fontFamily.medium,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 24,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        alignContent: 'center',
        gap: 8,
    },
    tag: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
    },
    tagText: {
        fontSize: 12,
        fontFamily: Typography.fontFamily.bold,
    },
});
