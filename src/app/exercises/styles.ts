import { StyleSheet } from 'react-native';

export const exerciseEditStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D1117',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0D1117',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#7A8BA3',
    },
    content: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#E8EDF5',
        marginBottom: 16,
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
    input: {
        backgroundColor: '#161B27',
        borderWidth: 1,
        borderColor: '#1A2332',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#E8EDF5',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        paddingBottom: 32,
    },
    button: {
        flex: 1,
        borderRadius: 8,
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#161B27',
        borderWidth: 1,
        borderColor: '#1A2332',
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#7A8BA3',
    },
    saveButton: {
        backgroundColor: '#00A8FF',
    },
    saveButtonDisabled: {
        backgroundColor: '#1A2332',
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0D1117',
    },
});

export default exerciseEditStyles;