import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Colors } from '../../constants/Colors';

interface DonutChartProps {
    data: { value: number; color: string; text?: string }[];
    centerLabel?: string;
    radius?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({ data, centerLabel, radius = 70 }) => {
    return (
        <View style={styles.container}>
            <PieChart
                data={data}
                donut
                radius={radius}
                innerRadius={radius - 15}
                centerLabelComponent={() => (
                    <Text style={styles.centerLabel}>{centerLabel}</Text>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerLabel: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
    },
});
