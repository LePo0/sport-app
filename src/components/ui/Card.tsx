import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { glowSm } from '../../theme/glow';

interface CardProps {
    children: React.ReactNode;
    elevated?: boolean;
    accent?: boolean;
    style?: ViewStyle;
}

// elevated = surface au-dessus d'une autre carte
// accent = bordure néon visible (pour les éléments actifs/sélectionnés)
export function Card({ children, elevated = false, accent = false, style }: CardProps) {
    return (
        <View
            style={[
                styles.base,
                elevated && styles.elevated,
                accent && styles.accent,
                accent && glowSm(),
                style,
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    base: {
        backgroundColor: colors.surface,
        borderRadius: 10,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.borderAccent,
    },
    elevated: {
        backgroundColor: colors.surfaceElevated,
    },
    accent: {
        borderColor: colors.accentPrimary,
    },
});
