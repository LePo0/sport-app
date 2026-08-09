import React from 'react';
import {
    TouchableOpacity,
    Text,
    ActivityIndicator,
    StyleSheet,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { colors } from '../../theme/colors';
import { glowMd } from '../../theme/glow';

interface ButtonProps {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', loading = false, disabled = false, style }: ButtonProps) {
    const isActive = !disabled && !loading;

    return (
        <TouchableOpacity
            style={[
                styles.base,
                styles[variant],
                isActive && variant === 'secondary' && glowMd(),
                (disabled || loading) && styles.disabledOverlay,
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.75}
        >
            {loading ? (
                <ActivityIndicator size="small" color={variant === 'primary' ? colors.background : colors.accentPrimary} />
            ) : (
                <Text style={[styles.label, labelStyles[variant]]}>{label}</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    base: {
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primary: {
        backgroundColor: colors.accentPrimary,
        borderWidth: 0,
    },
    secondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.accentPrimary,
    },
    ghost: {
        backgroundColor: 'transparent',
        borderWidth: 0,
    },
    danger: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.danger,
    },
    disabledOverlay: {
        opacity: 0.4,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});

const labelStyles: Record<NonNullable<ButtonProps['variant']>, TextStyle> = {
    primary: { color: colors.background },
    secondary: { color: colors.accentPrimary },
    ghost: { color: colors.textSecondary },
    danger: { color: colors.danger },
};
