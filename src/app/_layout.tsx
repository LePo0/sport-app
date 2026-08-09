import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useDatabaseMigrations } from '../hooks/useDatabaseMigrations';

export default function RootLayout() {
    const { isLoading, isSuccess, isError, error } = useDatabaseMigrations();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D1117' }}>
                <ActivityIndicator size="large" color="#00A8FF" />
                <Text style={{ marginTop: 12, fontSize: 14, color: '#7A8BA3' }}>Initialisation...</Text>
            </View>
        );
    }

    if (isError) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D1117', paddingHorizontal: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FF3B5C', marginBottom: 8 }}>
                    Erreur d'initialisation
                </Text>
                <Text style={{ fontSize: 14, color: '#7A8BA3', textAlign: 'center' }}>
                    {error?.message}
                </Text>
            </View>
        );
    }

    if (!isSuccess) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D1117' }}>
                <Text style={{ fontSize: 16, color: '#E8EDF5' }}>Base de données non prête</Text>
            </View>
        );
    }

    // Database is ready, render the app with navigation
    return (
        <Stack screenOptions={{ headerShown: false }} />
    );
}
