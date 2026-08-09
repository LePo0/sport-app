import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useFonts, Orbitron_400Regular, Orbitron_600SemiBold, Orbitron_700Bold } from '@expo-google-fonts/orbitron';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabaseMigrations } from '../hooks/useDatabaseMigrations';
import { colors } from '../theme/colors';

function AppTabs() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.surfaceElevated,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    height: 60 + insets.bottom,
                    paddingTop: 8,
                    paddingBottom: Math.max(insets.bottom, 8),
                },
                tabBarActiveTintColor: colors.accentPrimary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '700',
                },
                sceneStyle: {
                    backgroundColor: colors.background,
                },
            }}
        >
            <Tabs.Screen
                name="exercises"
                options={{
                    title: 'Exercices',
                    tabBarIcon: ({ color }) => (
                        <MaterialCommunityIcons name="arm-flex" size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="programs"
                options={{
                    title: 'Programmes',
                    tabBarIcon: ({ color }) => (
                        <MaterialCommunityIcons name="clipboard-list-outline" size={22} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}

export default function RootLayout() {
    const [fontsLoaded] = useFonts({ Orbitron_400Regular, Orbitron_600SemiBold, Orbitron_700Bold });
    const { isLoading, isSuccess, isError, error } = useDatabaseMigrations();
    if (!fontsLoaded || isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.accentPrimary} />
                <Text style={{ marginTop: 12, fontSize: 14, color: colors.textSecondary }}>Initialisation...</Text>
            </View>
        );
    }

    if (isError) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, paddingHorizontal: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.danger, marginBottom: 8 }}>
                    Erreur d'initialisation
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
                    {error?.message}
                </Text>
            </View>
        );
    }

    if (!isSuccess) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <Text style={{ fontSize: 16, color: colors.textPrimary }}>Base de données non prête</Text>
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <AppTabs />
        </SafeAreaProvider>
    );
}
