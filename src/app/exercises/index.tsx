import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Exercise } from '../../types/exercise';
import { watchExercises, deleteExerciseById } from '../../db/queries/exerciseDao';
import { MetricType } from '../../types/enums';

export default function ExercisesListScreen() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Ajoute l'écouteur sur la table exercises
        const cleanup = watchExercises((data) => {
            setExercises(data);
            setIsLoading(false);
        });

        // Cleanup synchrone au unmount
        return cleanup;
    }, []);

    const handleDelete = (id: string, name: string) => {
        Alert.alert('Supprimer', `Supprimer "${name}" ?`, [
            {
                text: 'Annuler',
                onPress: () => { },
                style: 'cancel',
            },
            {
                text: 'Supprimer',
                onPress: async () => {
                    try {
                        await deleteExerciseById(id);
                    } catch (error) {
                        Alert.alert('Erreur', 'Impossible de supprimer l\'exercice');
                        console.error(error);
                    }
                },
                style: 'destructive',
            },
        ]);
    };

    const handleEditExercise = (id: string) => {
        router.push(`/exercises/${id}`);
    };

    const renderExerciseItem = ({ item }: { item: Exercise }) => (
        <TouchableOpacity
            style={styles.exerciseCard}
            onPress={() => handleEditExercise(item.id)}
        >
            <View style={styles.exerciseContent}>
                <Text style={styles.exerciseName}>{item.name}</Text>
                <View style={styles.exerciseDetails}>
                    <Text style={styles.metricTypeLabel}>
                        {item.metricType === MetricType.REPS ? 'Répétitions' : 'Durée'}
                    </Text>
                    {item.mediaPath && (
                        <Text style={styles.mediaLabel}>
                            {item.mediaType === 'image' ? 'Image' : 'Vidéo'}
                        </Text>
                    )}
                </View>
            </View>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id, item.name)}
            >
                <Text style={styles.deleteButtonText}>✕</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.loadingText}>Chargement des exercices...</Text>
            </View>
        );
    }

    if (exercises.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>Aucun exercice</Text>
                <Text style={styles.emptySubText}>Appuyez sur + pour créer votre premier exercice</Text>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => router.push('/exercises/new')}
                >
                    <Text style={styles.createButtonText}>+ Créer un exercice</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={exercises}
                keyExtractor={(item) => item.id}
                renderItem={renderExerciseItem}
                contentContainerStyle={styles.listContent}
            />
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/exercises/new')}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D1117',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0D1117',
        paddingHorizontal: 16,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#7A8BA3',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#E8EDF5',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: '#7A8BA3',
        marginBottom: 24,
    },
    createButton: {
        backgroundColor: '#00A8FF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    createButtonText: {
        color: '#0D1117',
        fontSize: 14,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    exerciseCard: {
        backgroundColor: '#161B27',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1A2332',
    },
    exerciseContent: {
        flex: 1,
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E8EDF5',
        marginBottom: 6,
    },
    exerciseDetails: {
        flexDirection: 'row',
        gap: 8,
    },
    metricTypeLabel: {
        fontSize: 12,
        color: '#00A8FF',
        backgroundColor: '#0A1929',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#00A8FF',
    },
    mediaLabel: {
        fontSize: 12,
        color: '#7A8BA3',
        backgroundColor: '#1A2332',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    deleteButton: {
        padding: 8,
        marginLeft: 12,
    },
    deleteButtonText: {
        fontSize: 18,
        color: '#FF3B5C',
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#00A8FF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#00A8FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    fabText: {
        color: '#0D1117',
        fontSize: 28,
        fontWeight: '300',
    },
});
