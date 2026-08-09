export const colors = {
    // Fonds
    background: '#0a0e12',
    surface: '#12181d',
    surfaceElevated: '#1a2228',

    // Accents néon
    accentPrimary: '#26e6ff',
    accentSecondary: '#4d7fff',

    // Textes
    textPrimary: '#eaf6f8',
    textSecondary: '#7d8f96',

    // États sémantiques — désaturés pour ne pas casser la palette bleue
    success: '#2ed8a3',
    warning: '#f5c542',
    danger: '#ff4d6a',

    // Utilitaires
    border: '#1e2c35',
    borderAccent: 'rgba(38, 230, 255, 0.18)',
    disabled: '#2a3a44',
} as const;

export type Colors = typeof colors;
