import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MediaType } from '../types/enums';

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
        color: '#7A8BA3',
        marginBottom: 8,
    },
    mediaContainer: {
        backgroundColor: '#161B27',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#1A2332',
    },
    mediaInfo: {
        fontSize: 14,
        color: '#E8EDF5',
    },
    removeButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#1A0A0F',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#FF3B5C',
    },
    removeButtonText: {
        fontSize: 12,
        color: '#FF3B5C',
        fontWeight: '600',
    },
    placeholder: {
        backgroundColor: '#161B27',
        borderWidth: 1,
        borderColor: '#1A2332',
        borderRadius: 8,
        borderStyle: 'dashed',
        paddingHorizontal: 16,
        paddingVertical: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        fontSize: 12,
        color: '#7A8BA3',
        textAlign: 'center',
    },
});
