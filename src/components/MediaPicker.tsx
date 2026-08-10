import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MediaType } from '../types/enums';
import { colors } from '../theme/colors';
import { ExerciseMedia } from './ExerciseMedia';

interface MediaPickerProps {
    mediaPath: string | null;
    mediaType: MediaType | null;
    isBusy?: boolean;
    onPick: () => void;
    onRemove: () => void;
}

export const MediaPicker: React.FC<MediaPickerProps> = ({
    mediaPath,
    mediaType,
    isBusy = false,
    onPick,
    onRemove,
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.fieldGroup}>
                <Text style={styles.label}>Média (optionnel)</Text>
                <ExerciseMedia mediaPath={mediaPath} mediaType={mediaType} style={styles.preview} />
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.pickButton, isBusy && styles.disabledButton]}
                        onPress={onPick}
                        disabled={isBusy}
                    >
                        {isBusy ? (
                            <ActivityIndicator size="small" color={colors.background} />
                        ) : (
                            <Text style={styles.pickButtonText}>{mediaPath ? 'Remplacer le média' : 'Choisir un média'}</Text>
                        )}
                    </TouchableOpacity>
                    {mediaPath ? (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.removeButton, isBusy && styles.disabledButton]}
                            onPress={onRemove}
                            disabled={isBusy}
                        >
                            <Text style={styles.removeButtonText}>Supprimer le média</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
                <Text style={styles.helperText}>Un seul média par exercice. Image ou vidéo, stockée localement sur l'appareil.</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    fieldGroup: {
        marginBottom: 20,
    },
    preview: {
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 8,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 10,
    },
    actionButton: {
        flex: 1,
        minHeight: 44,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    pickButton: {
        backgroundColor: colors.accentPrimary,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    pickButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.background,
    },
    removeButton: {
        backgroundColor: colors.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.danger,
    },
    removeButtonText: {
        fontSize: 13,
        color: colors.danger,
        fontWeight: '700',
    },
    disabledButton: {
        opacity: 0.6,
    },
    helperText: {
        fontSize: 12,
        color: colors.textSecondary,
        lineHeight: 18,
    },
});
