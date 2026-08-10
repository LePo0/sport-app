import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors } from '../theme/colors';

type Props = {
    mediaPath: string | null;
    mediaType: 'image' | 'video' | null;
    style?: StyleProp<ViewStyle>;
};

export function ExerciseMedia({ mediaPath, mediaType, style }: Props) {
    const videoPlayer = useVideoPlayer(mediaType === 'video' && mediaPath ? mediaPath : null, (player) => {
        player.loop = true;
        player.muted = true;
        player.play();
    });

    if (mediaType === 'image' && mediaPath) {
        return (
            <View style={[s.container, style]}>
                <Image
                    source={{ uri: mediaPath }}
                    contentFit="cover"
                    transition={150}
                    style={s.media}
                />
            </View>
        );
    }

    if (mediaType === 'video' && mediaPath) {
        return (
            <View style={[s.container, style]}>
                <VideoView
                    player={videoPlayer}
                    style={s.media}
                    contentFit="cover"
                    nativeControls={false}
                />
                <View style={s.videoBadge}>
                    <MaterialCommunityIcons name="play-circle-outline" size={16} color={colors.background} />
                    <Text style={s.videoBadgeText}>Video</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[s.container, s.placeholder, style]}>
            <MaterialCommunityIcons name="image-off-outline" size={28} color={colors.accentPrimary} />
            <Text style={s.placeholderTitle}>Aucun media</Text>
            <Text style={s.placeholderText}>Ajoutez une image ou une video pour illustrer l'exercice.</Text>
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        width: '100%',
        height: 220,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.borderAccent,
        backgroundColor: colors.surface,
    },
    media: {
        width: '100%',
        height: '100%',
        backgroundColor: colors.surface,
    },
    placeholder: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 10,
        backgroundColor: colors.surfaceElevated,
    },
    placeholderTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    placeholderText: {
        fontSize: 13,
        lineHeight: 18,
        textAlign: 'center',
        color: colors.textSecondary,
    },
    videoBadge: {
        position: 'absolute',
        right: 10,
        bottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: colors.accentPrimary,
    },
    videoBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.background,
    },
});