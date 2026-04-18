import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/Card';
import { MapPin } from '@/components/ui/MapPin';
import { useTheme } from '@/themes/useTheme';
import type { Theme } from '@/themes/theme';
import type { Activity } from '@/types';
import { darkMapStyle } from '@/constants/mapStyles';

interface LocationSectionProps {
  activity: Activity;
  onPress: () => void;
}

export function LocationSection({ activity, onPress }: LocationSectionProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <Card variant="default" padding="none" style={styles.locationCard}>
        <View style={styles.locationMapWrap}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.locationMap}
            customMapStyle={theme.isDark ? darkMapStyle : undefined}
            pointerEvents="none"
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            toolbarEnabled={false}
            initialRegion={{
              latitude: activity.location.latitude + 0.0002,
              longitude: activity.location.longitude,
              latitudeDelta: 0.001,
              longitudeDelta: 0.001,
            }}
          >
            <MapPin
              coordinate={{
                latitude: activity.location.latitude,
                longitude: activity.location.longitude,
              }}
              category={activity.category}
            />
          </MapView>
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.04)', 'rgba(0, 0, 0, 0.16)']}
            style={styles.locationMapOverlay}
          />
        </View>

        <View style={styles.locationCardBody}>
          <View style={styles.infoTextWrap}>
            <Text style={{ color: theme.colors.text, ...theme.typography.bodyBold }}>
              {activity.location.address}
            </Text>
            <Text style={{ color: theme.colors.textSecondary, ...theme.typography.caption }}>
              {activity.location.name ||
                [activity.location.settlement, activity.location.country].filter(Boolean).join(', ')}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    locationCard: {
      overflow: 'hidden',
    },
    locationMapWrap: {
      height: 100,
      position: 'relative',
    },
    locationMap: {
      ...StyleSheet.absoluteFillObject,
    },
    locationMapOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    locationCardBody: {
      padding: theme.spacing.lg,
    },
    infoTextWrap: {
      flex: 1,
      gap: theme.spacing.xs,
    },
  });
