import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
    visible: boolean;
    onAdd: (durationSeconds: number) => void;
    onCancel: () => void;
}

export function AddRestStepModal({ visible, onAdd, onCancel }: Props) {
    const [duration, setDuration] = useState('');

    useEffect(() => { if (!visible) setDuration(''); }, [visible]);

    const secs = parseInt(duration);
    const canAdd = secs > 0;

    return (
        <Modal transparent animationType="slide" visible={visible} onRequestClose={onCancel}>
            <View style={s.overlay}>
                <View style={s.sheet}>
                    <Text style={s.title}>Ajouter une pause</Text>
                    <Text style={s.label}>Durée (secondes)</Text>
                    <TextInput
                        style={s.input}
                        keyboardType="numeric"
                        value={duration}
                        onChangeText={setDuration}
                        placeholder="ex : 60"
                        placeholderTextColor={colors.textSecondary}
                        autoFocus
                    />
                    <View style={s.actions}>
                        <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
                            <Text style={s.cancelLabel}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.addBtn, !canAdd && s.addBtnDisabled]} onPress={() => onAdd(secs)} disabled={!canAdd}>
                            <Text style={s.addLabel}>Ajouter</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: colors.surfaceElevated, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 },
    title: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
    input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.textPrimary, marginBottom: 20 },
    actions: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
    cancelLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
    addBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: colors.accentPrimary, alignItems: 'center' },
    addBtnDisabled: { opacity: 0.4 },
    addLabel: { fontSize: 14, fontWeight: '700', color: colors.background },
});
