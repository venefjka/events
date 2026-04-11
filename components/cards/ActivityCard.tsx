import React, { useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    ImageBackground,
    StyleProp,
    ViewStyle,
    Dimensions,
} from 'react-native';
import { Activity } from '../../types';
import { Card } from '../ui/Card';
import { Chip } from '../ui/Chip';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { X, MapPin, Clock, Users, Sprout, Flower2, TreeDeciduous, Monitor, Image as ImageIcon } from 'lucide-react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../themes/useTheme';
import { renderCategoryIcon } from '@/components/ui/CategoryIcon';
import { formatActivityDate, formatDateOnly, formatTimeOnly, formatTimeZoneOffset } from '../../utils/date';
import { router } from 'expo-router';

type Mode = 'map' | 'list';

interface ActivityCardProps {
    activity: Activity;
    onPress?: () => void;
    onClose?: () => void;
    mode?: Mode;
    showCTA?: boolean;
    absolute?: boolean;
    style?: StyleProp<ViewStyle>;
    photoUriOverride?: string;
}

const prefetchedUris = new Set<string>();

export const ActivityCard: React.FC<ActivityCardProps> = ({
    activity,
    onPress,
    onClose,
    mode = 'map',
    showCTA = mode === 'map',
    absolute = mode === 'map',
    style,
    photoUriOverride,
}) => {
    const theme = useTheme();
    const photoUri = photoUriOverride || activity.photoUrls?.[0];
    const [photoFailed, setPhotoFailed] = React.useState(false);
    const hasPhoto = Boolean(photoUri) && !photoFailed;
    React.useEffect(() => {
        if (!photoUri || prefetchedUris.has(photoUri)) return;
        prefetchedUris.add(photoUri);
        Image.prefetch(photoUri);
    }, [photoUri]);
    const timeZone = activity.timeZone;
    const startLabel = formatActivityDate(activity.startAt, timeZone);
    const endLabel = activity.endAt ? formatActivityDate(activity.endAt, timeZone) : '';
    const sameDate = activity.endAt
        ? formatDateOnly(activity.startAt, timeZone) === formatDateOnly(activity.endAt, timeZone)
        : false;
    const endLabelDisplay = activity.endAt
        ? sameDate
            ? formatTimeOnly(activity.endAt, timeZone)
            : endLabel
        : '';
    const timeZoneLabel = formatTimeZoneOffset(activity.startAt, timeZone);

    const maxParticipants = activity.preferences?.maxParticipants ?? 0;
    const participantsText = maxParticipants > 0
        ? `${activity.currentParticipants.length}/${maxParticipants}`
        : `${activity.currentParticipants.length}/∞`;
    const placeTitle = activity.location.name || activity.location.address;
    const ageLabel = useMemo(() => {
        const ageFrom = activity.preferences?.ageFrom;
        const ageTo = activity.preferences?.ageTo;
        if (ageFrom == null && ageTo == null) return null;
        if (ageFrom != null && ageTo != null) return `от ${ageFrom} до ${ageTo}`;
        if (ageFrom != null) return `от ${ageFrom}`;
        return `до ${ageTo}`;
    }, [activity.preferences?.ageFrom, activity.preferences?.ageTo]);

    const badges = useMemo(() => {
        const res: Array<{
            label: string;
            variant?: 'default' | 'bw';
            icon?: React.ReactNode;
        }> = [];

        const categoryLabel = activity.subcategory?.name ?? activity.category.name;
        res.push({
            label: categoryLabel,
            variant: 'bw',
            icon: renderCategoryIcon(activity.category, theme.spacing.iconSizeSmall - 2),
        });

        if (activity.price === 0) res.push({ label: 'Бесплатно', variant: 'default' });
        else res.push({ label: `${activity.price} ₽`, variant: 'default' });

        if (activity.requiresApproval) res.push({ label: 'По заявке', variant: 'default' });

        if (activity.preferences?.gender) {
            const iconName = activity.preferences.gender === 'male' ? 'male' : 'female';
            res.push({
                label: '',
                variant: 'default',
                icon: <Ionicons name={iconName} size={14} color={theme.colors.text} />,
            });
        }
        if (ageLabel) res.push({ label: ageLabel, variant: 'default' });

        if (activity.preferences?.level) {
            const LevelIcon =
                activity.preferences.level === 'beginner'
                    ? Sprout
                    : activity.preferences.level === 'intermediate'
                        ? Flower2
                        : TreeDeciduous;
            res.push({
                label: '',
                variant: 'default',
                icon: <LevelIcon size={14} color={theme.colors.text} />,
            });
        }

        return res;
    }, [activity, ageLabel, theme.colors.text]);

    const orderedBadges = useMemo(() => {
        const screenWidth = Dimensions.get('window').width;
        const contentPadding = theme.spacing.md * 2;
        const sidePadding = theme.spacing.screenPaddingHorizontal * 2;
        const maxRowWidth = Math.max(160, screenWidth - contentPadding - sidePadding);
        const gap = 8;
        const iconSize = 14;
        const charWidth = 7;

        const estimateWidth = (badge: { label: string; icon?: React.ReactNode }) => {
            const hasLabel = badge.label.trim().length > 0;
            const labelWidth = hasLabel ? badge.label.length * charWidth : 0;
            const iconWidth = badge.icon ? iconSize : 0;
            const iconGap = badge.icon && hasLabel ? theme.spacing.xs : 0;
            const paddingX = theme.spacing.sm * 2;
            return paddingX + labelWidth + iconWidth + iconGap;
        };

        const rest = [...badges];
        const firstRow: typeof badges = [];
        let used = 0;

        while (rest.length > 0) {
            const index = rest.findIndex((b) => used + estimateWidth(b) <= maxRowWidth);
            if (index === -1) break;
            const next = rest.splice(index, 1)[0];
            used += estimateWidth(next) + gap;
            firstRow.push(next);
        }

        return [...firstRow, ...rest];
    }, [badges, theme.spacing]);

    const handleDefaultPress = () => router.push(`/activity/${activity.id}`);
    const handlePress = onPress ?? handleDefaultPress;

    const cardStyle = [
        absolute ? styles.previewCardAbsolute : styles.previewCardList,
        {
            backgroundColor: theme.colors.background,
            borderRadius: theme.spacing.radius,
        },
        style,
    ];

    const content = (
        <Card variant={mode === 'map' ? "elevated" : "outlined"} padding="none" style={cardStyle}>
            {/* PHOTO */}
            <View
                style={[
                    styles.photoWrap,
                    { borderTopLeftRadius: theme.spacing.radius, borderTopRightRadius: theme.spacing.radius },
                ]}
            >
                {hasPhoto ? (
                    <ImageBackground
                        source={{ uri: photoUri }}
                        style={styles.photo}
                        resizeMode="cover"
                        onError={() => setPhotoFailed(true)}
                    >
                        {/* top bar */}
                        <View style={styles.photoTopRow}>
                            <Chip
                                label={activity.organizer.name}
                                variant="bw"
                                size="xs"
                                icon={
                                    <Avatar
                                        name={activity.organizer.name}
                                        size="xs"
                                        imageUrl={activity.organizer.avatar}
                                        style={styles.organizerAvatar}
                                    />
                                }
                                style={styles.organizerChip}
                                textStyle={{ color: '#fff' }}
                            />

                            {/* CloseButton for map */}
                            {mode === 'map' && onClose ? (
                                <TouchableOpacity
                                    onPress={onClose}
                                    style={[
                                        styles.closeButton,
                                        { backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: theme.spacing.radiusRound },
                                    ]}
                                    hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
                                >
                                    <X size={16} color="#fff" />
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </ImageBackground>
                ) : (
                    <LinearGradient
                        colors={[theme.colors.border, theme.colors.surface]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.photo, styles.photoPlaceholder]}
                    >
                        {/* top bar */}
                        <View style={styles.photoTopRow}>
                            <Chip
                                label={activity.organizer.name}
                                variant="bw"
                                size="xs"
                                icon={
                                    <Avatar
                                        name={activity.organizer.name}
                                        size="xs"
                                        imageUrl={activity.organizer.avatar}
                                        style={styles.organizerAvatar}
                                    />
                                }
                                style={styles.organizerChip}
                                textStyle={{ color: '#fff' }}
                            />

                            {/* CloseButton for map */}
                            {mode === 'map' && onClose ? (
                                <TouchableOpacity
                                    onPress={onClose}
                                    style={[
                                        styles.closeButton,
                                        { backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: theme.spacing.radiusRound },
                                    ]}
                                    hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
                                >
                                    <X size={16} color="#fff" />
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </LinearGradient>
                )}
            </View>

            {/* CONTENT */}
            <View style={{ padding: theme.spacing.md }}>
                {/* title */}
                <Text
                    numberOfLines={2}
                    style={{ ...theme.typography.bodyLargeBold, color: theme.colors.text }}
                >
                    {activity.title}
                </Text>

                {/* badges */}
                <View style={[styles.badgesRow, { marginTop: theme.spacing.sm }]}>
                    {orderedBadges.map((badge, idx) => (
                        <Chip
                            key={`${badge.label}-${idx}`}
                            label={badge.label}
                            variant={badge.variant || 'default'}
                            size="xs"
                            selected={badge.variant === 'bw'}
                            icon={badge.icon}
                        />
                    ))}
                </View>

                {/* time */}
                <View style={[styles.metaRow, { marginTop: theme.spacing.md }]}>
                    <Clock size={16} color={theme.colors.textSecondary} />
                    <Text
                        numberOfLines={1}
                        style={[styles.metaText, { ...theme.typography.caption, color: theme.colors.textSecondary }]}
                    >
                        {startLabel}
                        {endLabelDisplay ? ` — ${endLabelDisplay}` : ''}
                    </Text>
                    {timeZoneLabel ? (
                        <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary, paddingHorizontal: theme.spacing.sm }}>
                            {timeZoneLabel}
                        </Text>
                    ) : null}
                </View>

                {/* place */}
                <View style={[styles.metaRow, {
                    marginTop: theme.spacing.xs,
                    width: "100%"
                }]}>
                    {activity.format === 'online'
                        ? <Monitor size={16} color={theme.colors.textSecondary} />
                        : <MapPin size={16} color={theme.colors.textSecondary} />
                    }
                    <Text
                        numberOfLines={1}
                        style={[
                            styles.metaText,
                            {
                                ...theme.typography.caption,
                                color: theme.colors.textSecondary,
                            },
                        ]}
                    >
                        {placeTitle}
                    </Text>

                    {/* participants */}
                    <Chip
                        label={participantsText}
                        variant="bw"
                        size="xs"
                        icon={<Users size={16} color={theme.colors.textSecondary} />}
                        style={styles.participantsChip}
                    />
                </View>

                {/* CTA */}
                {showCTA ? (
                    <View style={{ marginTop: theme.spacing.md }}>
                        <Button
                            title="Подробнее"
                            onPress={handleDefaultPress}
                            variant="primary"
                            size="small"
                            fullWidth
                        />
                    </View>
                ) : null}
            </View>
        </Card>
    );

    if (mode === 'list') {
        return (
            <TouchableOpacity activeOpacity={1} onPress={handlePress} style={style}>
                {content}
            </TouchableOpacity>
        );
    }

    return content;
};

const styles = StyleSheet.create({
    previewCardAbsolute: {
        position: 'absolute',
        bottom: 60,
        left: 16,
        right: 16,
        overflow: 'hidden',
    },
    previewCardList: {
        overflow: 'hidden',
        marginBottom: 12,
        width: '100%',
    },

    photoWrap: { overflow: 'hidden' },
    photo: { height: 80, width: '100%', justifyContent: 'space-between' },
    photoPlaceholder: {
        backgroundColor: 'rgba(0,0,0,0.08)',
    },
    photoPlaceholderAccent: {
        position: 'absolute',
        right: -20,
        top: -30,
        width: 120,
        height: 120,
        borderRadius: 999,
        backgroundColor: 'rgba(0,0,0,0.06)',
    },
    photoPlaceholderCenter: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoTopRow: {
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    organizerChip: {
        backgroundColor: 'rgba(0,0,0,0.35)',
        borderWidth: 0,
        paddingRight: 10,
        paddingLeft: 6,
    },
    organizerAvatar: { marginRight: 4, marginLeft: 0 },

    closeButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },

    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    metaText: { flex: 1 },

    badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

    participantsChip: { borderWidth: 0 },

    addressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 12,
        width: '100%',
    },
    addressLeft: {
        width: '70%',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        flexWrap: 'wrap',
    },
    addressText: {
        flexShrink: 1,
        flexGrow: 1,
        minWidth: 0,
        lineHeight: 18,
    },
    addressRight: {
        width: '30%',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
    },
});

