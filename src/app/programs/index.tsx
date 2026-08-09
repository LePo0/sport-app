import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { deleteProgram, watchPrograms } from '../../db/queries/programDao';
import { GlowRing } from '../../components/ui/GlowRing';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ActionIconButton } from '../../components/ui/ActionIconButton';
import { ListCard } from '../../components/ui/ListCard';

interface ProgramListItem {
    id: string;
    name: string;
    rounds: number;
    createdAt: number;
}

export default function ProgramsListScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [programs, setPrograms] = useState<ProgramListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState<ProgramListItem | null>(null);

    useEffect(() => {
        const cleanup = watchPrograms((data) => {
            setPrograms(data);
            setIsLoading(false);
        });

        return cleanup;
    }, []);

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteProgram(deleteTarget.id);
        } finally {
            setDeleteTarget(null);
        }
    };

    if (isLoading) {
        return (
            <View style={s.centerContainer}>
                <ActivityIndicator size="large" color={colors.accentPrimary} />
                <Text style={s.loadingText}>Chargement des programmes...</Text>
            </View>
        );
    }

    if (programs.length === 0) {
        return (
            <View style={s.centerContainer}>
                <Text style={s.emptyText}>Aucun programme</Text>
                <Text style={s.emptySubText}>Créez votre premier programme.</Text>
                <TouchableOpacity style={s.createButton} onPress={() => router.push('/programs/new')}>
                    <Text style={s.createButtonText}>+ Créer un programme</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={s.container}>
            <ConfirmDialog
                visible={!!deleteTarget}
                title="Supprimer le programme"
                message={`Supprimer "${deleteTarget?.name}" ? Les étapes associées seront supprimées aussi.`}
                confirmLabel="Supprimer"
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
            <FlatList
                data={programs}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[s.listContent, { paddingBottom: 100 + insets.bottom }]}
                renderItem={({ item }) => (
                    <ListCard>
                        <View style={s.cardHeader}>
                            <TouchableOpacity style={s.cardMain} onPress={() => router.push(`/programs/${item.id}`)}>
                                <Text style={s.name}>{item.name}</Text>
                                <Text style={s.meta}>{item.rounds} tour{item.rounds > 1 ? 's' : ''}</Text>
                            </TouchableOpacity>
                            <View style={s.cardActions}>
                                <ActionIconButton icon="▶" disabled />
                                <ActionIconButton icon="✕" variant="danger" onPress={() => setDeleteTarget(item)} />
                            </View>
                        </View>
                    </ListCard>
                )}
            />
            <GlowRing borderRadius={28} size="lg" style={{ position: 'absolute', right: 16 - 7, bottom: (16 + insets.bottom) - 7 }}>
                <TouchableOpacity style={s.fab} onPress={() => router.push('/programs/new')}>
                    <Text style={s.fabText}>+</Text>
                </TouchableOpacity>
            </GlowRing>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, paddingHorizontal: 16 },
    loadingText: { marginTop: 12, fontSize: 14, color: colors.textSecondary },
    emptyText: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
    emptySubText: { fontSize: 14, color: colors.textSecondary, marginBottom: 24 },
    createButton: { backgroundColor: colors.accentPrimary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
    createButtonText: { color: colors.background, fontSize: 14, fontWeight: '700' },
    listContent: { padding: 16 },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    cardMain: { flex: 1 },
    name: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 4 },
    meta: { color: colors.textSecondary, fontSize: 12 },
    cardActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', paddingTop: 2 },
    fab: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accentPrimary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.30)' },
    fabText: { color: colors.background, fontSize: 28, fontWeight: '300' },
});
