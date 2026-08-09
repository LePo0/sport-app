import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

interface GlowRingProps {
    children: React.ReactNode;
    color?: string;
    borderRadius: number;
    size?: 'sm' | 'md' | 'lg';
    style?: ViewStyle;
}

// Halo néon cross-platform via couches semi-transparentes (shadow* = iOS only)
export function GlowRing({
    children,
    color = colors.accentPrimary,
    borderRadius,
    size = 'md',
    style,
}: GlowRingProps) {
    const spread = size === 'sm' ? 4 : size === 'md' ? 7 : 12;

    return (
        <View style={[{ borderRadius: borderRadius + spread, backgroundColor: hexToRgba(color, 0.10), padding: spread }, style]}>
            <View style={{ borderRadius: borderRadius + spread / 2, backgroundColor: hexToRgba(color, 0.18), padding: Math.ceil(spread / 2) }}>
                {children}
            </View>
        </View>
    );
}

// Convertit un hex 6 chars en rgba sans dépendance externe
function hexToRgba(hex: string, alpha: number): string {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}
