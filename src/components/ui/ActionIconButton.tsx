import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface ActionIconButtonProps {
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
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
            <MaterialCommunityIcons
                name={icon}
                size={18}
                style={[
                    styles.icon,
                    isDanger && styles.dangerIcon,
                    disabled && styles.disabledIcon,
                ]}
            />
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
    },
    dangerIcon: {
        color: colors.danger,
    },
    disabledIcon: {
        color: colors.textSecondary,
    },
});
