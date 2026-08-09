import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MetricType } from '../types/enums';
import { colors } from '../theme/colors';

interface MetricTypeToggleProps {
    value: MetricType;
    onChange: (value: MetricType) => void;
}

export const MetricTypeToggle: React.FC<MetricTypeToggleProps> = ({ value, onChange }) => {
    return (
        <View style={styles.fieldGroup}>
            <Text style={styles.label}>Type de mesure *</Text>
            <View style={styles.segmentedControl}>
                <TouchableOpacity
                    style={[styles.segment, value === MetricType.REPS && styles.segmentActive]}
                    onPress={() => onChange(MetricType.REPS)}
                >
                    <Text style={[styles.segmentText, value === MetricType.REPS && styles.segmentTextActive]}>
                        Répétitions
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.segment, value === MetricType.TIME && styles.segmentActive]}
                    onPress={() => onChange(MetricType.TIME)}
                >
                    <Text style={[styles.segmentText, value === MetricType.TIME && styles.segmentTextActive]}>
                        Durée
                    </Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
                {value === MetricType.REPS ? 'Mesuré en répétitions' : 'Mesuré en secondes'}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    fieldGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 8,
    },
    segmentedControl: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        overflow: 'hidden',
    },
    segment: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: colors.surface,
    },
    segmentActive: {
        backgroundColor: colors.accentPrimary,
    },
    segmentText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    segmentTextActive: {
        color: colors.background,
    },
    helperText: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 6,
    },
});
