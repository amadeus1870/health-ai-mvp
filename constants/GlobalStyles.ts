import { StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { Colors } from './Colors';

export const GlobalStyles = StyleSheet.create({
    headerContainer: {
        marginTop: 50,
        marginBottom: 10,
        paddingHorizontal: 20,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 28,
        color: '#FFF',
        fontFamily: Typography.fontFamily.bold,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 0,
        fontFamily: Typography.fontFamily.regular,
    },
});
