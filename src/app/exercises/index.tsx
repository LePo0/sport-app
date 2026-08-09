import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { glowMd } from '../../theme/glow';
import { Exercise } from '../../types/exercise';
import { watchExercises, deleteExerciseById, getProgramsUsingExercise } from '../../db/queries/exerciseDao';
import { MetricType } from '../../types/enums';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { GlowRing } from '../../components/ui/GlowRing';

export default function ExercisesListScreen() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; programNames?: string[] } | null>(null);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        // Ajoute l'écouteur sur la table exercises
        const cleanup = watchExercises((data) => {
            setExercises(data);
            setIsLoading(false);
        });

        // Cleanup synchrone au unmount
        return cleanup;
    }, []);

    const handleDelete = async (id: string, name: string) => {
        const usedIn = await getProgramsUsingExercise(id);
        setDeleteTarget({ id, name, programNames: usedIn.map(p => p.programName) });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteExerciseById(deleteTarget.id);
        } catch (error) {
            console.error(error);
        } finally {
            setDeleteTarget(null);
        }
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
                <ActivityIndicator size="large" color={colors.accentPrimary} />
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
            <ConfirmDialog
                visible={!!deleteTarget}
                title="Supprimer l'exercice"
                message={
                    deleteTarget?.programNames?.length
                        ? `Cet exercice est utilisé dans : ${deleteTarget.programNames.join(', ')}.\nLe supprimer laissera ces étapes sans exercice associé. Continuer ?`
                        : `Supprimer "${deleteTarget?.name}" ? Cette action est irréversible.`
                }
                confirmLabel="Supprimer"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
            <FlatList
                data={exercises}
                keyExtractor={(item) => item.id}
                renderItem={renderExerciseItem}
                contentContainerStyle={[styles.listContent, { paddingBottom: 100 + insets.bottom }]}
            />
            <GlowRing borderRadius={28} size="lg" style={{ position: 'absolute', right: 16 - 7, bottom: (16 + insets.bottom) - 7 }}>
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => router.push('/exercises/new')}
                >
                    <Text style={styles.fabText}>+</Text>
                </TouchableOpacity>
            </GlowRing>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
        paddingHorizontal: 16,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: colors.textSecondary,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 24,
    },
    createButton: {
        backgroundColor: colors.accentPrimary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    createButtonText: {
        color: colors.background,
        fontSize: 14,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
    },
    exerciseCard: {
        backgroundColor: colors.surface,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.borderAccent,
    },
    exerciseContent: {
        flex: 1,
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 6,
    },
    exerciseDetails: {
        flexDirection: 'row',
        gap: 8,
    },
    metricTypeLabel: {
        fontSize: 12,
        color: colors.accentPrimary,
        backgroundColor: colors.background,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.accentPrimary,
    },
    mediaLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        backgroundColor: colors.border,
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
        color: colors.danger,
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.accentPrimary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.30)',
    },
    fabText: {
        color: colors.background,
        fontSize: 28,
        fontWeight: '300',
    },
});
