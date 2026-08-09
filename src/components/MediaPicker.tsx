import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MediaType } from '../types/enums';
import { colors } from '../theme/colors';

interface MediaPickerProps {
    mediaPath?: string;
    mediaType?: MediaType;
    onRemove: () => void;
}

export const MediaPicker: React.FC<MediaPickerProps> = ({
    mediaPath,
    mediaType,
    onRemove,
}) => {
    return (
        <View style={styles.container}>
            {mediaPath ? (
                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Media</Text>
                    <View style={styles.mediaContainer}>
                        <Text style={styles.mediaInfo}>
                            {mediaType === 'image' ? 'Image' : 'Vidéo'}
                        </Text>
                        <TouchableOpacity
                            style={styles.removeButton}
                            onPress={onRemove}
                        >
                            <Text style={styles.removeButtonText}>Supprimer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : null}

            <View style={styles.fieldGroup}>
                <Text style={styles.label}>Média (optionnel)</Text>
                <View style={styles.placeholder}>
                    <Text style={styles.placeholderText}>
                        Ajout de média bientôt disponible
                    </Text>
                </View>
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
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 8,
    },
    mediaContainer: {
        backgroundColor: colors.surface,
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: colors.border,
    },
    mediaInfo: {
        fontSize: 14,
        color: colors.textPrimary,
    },
    removeButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: colors.background,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.danger,
    },
    removeButtonText: {
        fontSize: 12,
        color: colors.danger,
        fontWeight: '600',
    },
    placeholder: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        borderStyle: 'dashed',
        paddingHorizontal: 16,
        paddingVertical: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});
