import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

interface ListCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

export function ListCard({ children, style }: ListCardProps) {
    return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderAccent,
        borderRadius: 8,
        padding: 14,
        marginBottom: 10,
    },
});
