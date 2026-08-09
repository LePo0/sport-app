import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface ActionIconButtonProps {
    icon: string;
    onPress?: () => void;
    disabled?: boolean;
    variant?: 'default' | 'danger';
}

export function ActionIconButton({
    icon,
    onPress,
    disabled = false,
    variant = 'default',
}: ActionIconButtonProps) {
    const isDanger = variant === 'danger';

    return (
        <TouchableOpacity
            style={[
                styles.base,
                isDanger && styles.danger,
                disabled && styles.disabled,
            ]}
            onPress={onPress}
            disabled={disabled}
        >
            <Text
                style={[
                    styles.icon,
                    isDanger && styles.dangerIcon,
                    disabled && styles.disabledIcon,
                ]}
            >
                {icon}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    base: {
        width: 38,
        height: 38,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
    },
    danger: {
        borderColor: colors.danger,
        backgroundColor: colors.background,
    },
    disabled: {
        opacity: 0.45,
    },
    icon: {
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: '700',
    },
    dangerIcon: {
        color: colors.danger,
    },
    disabledIcon: {
        color: colors.textSecondary,
    },
});
