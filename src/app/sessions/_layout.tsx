import { Stack } from 'expo-router';
import { colors } from '../../theme/colors';

const headerTheme = {
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.accentPrimary,
    headerTitleStyle: { fontSize: 18, fontWeight: '600' as const, color: colors.textPrimary },
    headerShadowVisible: false,
};

export default function SessionsLayout() {
    return (
        <Stack screenOptions={{ headerShown: true, headerBackVisible: true, ...headerTheme }}>
            <Stack.Screen
                name="index"
                options={{
                    title: 'Séances',
                    headerBackVisible: false,
                }}
            />
            <Stack.Screen
                name="[id]"
                options={{
                    title: 'Séance',
                }}
            />
        </Stack>
    );
}
