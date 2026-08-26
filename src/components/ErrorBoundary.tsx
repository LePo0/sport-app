import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
    children: React.ReactNode;
}

interface State {
    error: Error | null;
}

// Filet de sécurité : évite un crash total de l'app sur une erreur de rendu inattendue
export class ErrorBoundary extends React.Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('Erreur non interceptée dans l\'arbre React :', error, info.componentStack);
    }

    render() {
        if (this.state.error) {
            return (
                <View style={s.container}>
                    <Text style={s.title}>Une erreur est survenue</Text>
                    <Text style={s.message}>{this.state.error.message}</Text>
                </View>
            );
        }

        return this.props.children;
    }
}

const s = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, paddingHorizontal: 24 },
    title: { fontSize: 18, fontWeight: '700', color: colors.danger, marginBottom: 8, textAlign: 'center' },
    message: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
});
