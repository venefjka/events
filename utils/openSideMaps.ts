import { Alert, Linking, Platform } from 'react-native';

interface OpenExternalMapOptions {
  latitude: number;
  longitude: number;
  address: string;
  name?: string;
  fallbackLabel: string;
}

export function openExternalMap({
  latitude,
  longitude,
  address,
  name,
  fallbackLabel,
}: OpenExternalMapOptions) {
  const label = name || address || fallbackLabel;
  const encodedLabel = encodeURIComponent(label);
  const encodedAddress = encodeURIComponent(address || label);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  const nativeUrl =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?ll=${latitude},${longitude}&q=${encodedLabel}`
      : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedAddress})`;

  Alert.alert('Открыть в картах', 'Перейти к локации во внешнем приложении?', [
    { text: 'Отмена', style: 'cancel' },
    {
      text: 'Открыть',
      onPress: async () => {
        const supportedNative = await Linking.canOpenURL(nativeUrl);
        if (supportedNative) {
          await Linking.openURL(nativeUrl);
          return;
        }

        const supportedWeb = await Linking.canOpenURL(googleMapsUrl);
        if (supportedWeb) {
          await Linking.openURL(googleMapsUrl);
        }
      },
    },
  ]);
}
