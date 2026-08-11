import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextStyle, ViewStyle } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect, useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { getSessionDates, getSessionsForDate, SessionForDateItem } from '../../db/queries/sessionDao';
import { ListCard } from '../../components/ui/ListCard';

type CalendarMark = {
    customStyles?: {
        container?: ViewStyle;
        text?: TextStyle;
    };
};

function formatDuration(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function CalendarScreen() {
    const router = useRouter();
    const [isLoadingDates, setIsLoadingDates] = useState(true);
    const [isLoadingDay, setIsLoadingDay] = useState(false);
    const [sessionDates, setSessionDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [sessionsForDay, setSessionsForDay] = useState<SessionForDateItem[]>([]);

    const loadDates = useCallback(async () => {
        setIsLoadingDates(true);
        try {
            const dates = await getSessionDates();
            setSessionDates(dates);
        } finally {
            setIsLoadingDates(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadDates().catch(console.error);
        }, [loadDates])
    );

    const markedDates = useMemo(() => {
        const marks: Record<string, CalendarMark> = {};

        for (const date of sessionDates) {
            marks[date] = {
                customStyles: {
                    container: {
                        backgroundColor: colors.accentPrimary,
                        borderRadius: 999,
                    },
                    text: {
                        color: colors.background,
                        fontWeight: '700',
                    },
                },
            };
        }

        if (selectedDate) {
            const hasSession = sessionDates.includes(selectedDate);
            marks[selectedDate] = hasSession
                ? {
                      customStyles: {
                          container: {
                              backgroundColor: colors.accentSecondary,
                              borderRadius: 999,
                              borderWidth: 2,
                              borderColor: colors.accentPrimary,
                          },
                          text: {
                              color: colors.textPrimary,
                              fontWeight: '800',
                          },
                      },
                  }
                : {
                      customStyles: {
                          container: {
                              backgroundColor: colors.surfaceElevated,
                              borderRadius: 999,
                              borderWidth: 1,
                              borderColor: colors.borderAccent,
                          },
                          text: {
                              color: colors.textPrimary,
                              fontWeight: '700',
                          },
                      },
                  };
        }

        return marks;
    }, [selectedDate, sessionDates]);

    const handleDayPress = useCallback(async (day: { dateString: string }) => {
        setSelectedDate(day.dateString);
        setIsLoadingDay(true);
        try {
            const rows = await getSessionsForDate(day.dateString);
            setSessionsForDay(rows);
        } finally {
            setIsLoadingDay(false);
        }
    }, []);

    return (
        <View style={s.container}>
            <Text style={s.title}>Calendrier des séances</Text>
            {isLoadingDates ? (
                <View style={s.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.accentPrimary} />
                    <Text style={s.loadingText}>Chargement des dates...</Text>
                </View>
            ) : (
                <Calendar
                    onDayPress={handleDayPress}
                    markedDates={markedDates}
                    markingType="custom"
                    theme={{
                        calendarBackground: colors.surface,
                        textSectionTitleColor: colors.textSecondary,
                        selectedDayBackgroundColor: colors.surfaceElevated,
                        selectedDayTextColor: colors.textPrimary,
                        todayTextColor: colors.accentPrimary,
                        dayTextColor: colors.textPrimary,
                        textDisabledColor: colors.disabled,
                        dotColor: colors.accentPrimary,
                        selectedDotColor: colors.accentPrimary,
                        monthTextColor: colors.textPrimary,
                        indicatorColor: colors.accentPrimary,
                        arrowColor: colors.accentPrimary,
                    }}
                    style={s.calendar}
                />
            )}

            {selectedDate && !isLoadingDay && sessionsForDay.length > 0 ? (
                <View style={s.listContainer}>
                    <Text style={s.dayTitle}>Séances du {selectedDate}</Text>
                    {sessionsForDay.map((session) => (
                        <ListCard key={session.id}>
                            <TouchableOpacity
                                style={s.sessionRow}
                                onPress={() =>
                                    router.push({
                                        pathname: '/sessions/[id]',
                                        params: { id: session.id },
                                    })
                                }
                            >
                                <View style={s.sessionTextBlock}>
                                    <Text style={s.sessionProgramLabel}>Programme</Text>
                                    <Text style={s.sessionProgram}>{session.programName}</Text>
                                </View>
                                <Text style={s.sessionDuration}>{formatDuration(session.totalDurationSeconds)}</Text>
                            </TouchableOpacity>
                        </ListCard>
                    ))}
                </View>
            ) : null}

            {selectedDate && isLoadingDay ? (
                <View style={s.dayLoadingContainer}>
                    <ActivityIndicator size="small" color={colors.accentPrimary} />
                    <Text style={s.dayLoadingText}>Chargement des séances...</Text>
                </View>
            ) : null}
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 16,
    },
    title: {
        color: colors.accentPrimary,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    calendar: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    loadingContainer: {
        marginTop: 32,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 8,
        color: colors.textSecondary,
        fontSize: 13,
    },
    listContainer: {
        marginTop: 16,
    },
    dayTitle: {
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 10,
    },
    sessionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
    },
    sessionTextBlock: {
        flex: 1,
    },
    sessionProgramLabel: {
        color: colors.textSecondary,
        fontSize: 11,
        marginBottom: 2,
    },
    sessionProgram: {
        color: colors.textPrimary,
        fontSize: 15,
        fontWeight: '700',
    },
    sessionDuration: {
        color: colors.accentPrimary,
        fontSize: 13,
        fontWeight: '700',
    },
    dayLoadingContainer: {
        marginTop: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dayLoadingText: {
        color: colors.textSecondary,
        fontSize: 12,
    },
});
