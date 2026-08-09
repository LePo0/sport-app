import { ViewStyle } from 'react-native';
import { colors } from './colors';

type GlowStyle = Pick<ViewStyle,
    'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

const makeGlow = (color: string, opacity: number, radius: number, elevation: number): GlowStyle => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
});

export const glowSm = (color: string = colors.accentPrimary): GlowStyle =>
    makeGlow(color, 0.6, 6, 5);

export const glowMd = (color: string = colors.accentPrimary): GlowStyle =>
    makeGlow(color, 0.8, 14, 12);

export const glowLg = (color: string = colors.accentPrimary): GlowStyle =>
    makeGlow(color, 1.0, 22, 18);
