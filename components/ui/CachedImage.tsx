import React, { useEffect, useState } from 'react';
import { type ImageStyle, StyleProp } from 'react-native';
import { Image } from 'expo-image';
import { API_BASE_URL } from '@/api/client';
import { authRepository } from '@/repositories/authRepository';

interface CachedImageProps {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  onError?: () => void;
}

export function CachedImage({ uri, style, contentFit = 'cover', onError }: CachedImageProps) {
  const shouldUseAuth = Boolean(uri?.startsWith(API_BASE_URL));
  const [authToken, setAuthToken] = useState<string | null | undefined>(
    shouldUseAuth ? undefined : null
  );

  useEffect(() => {
    let isMounted = true;

    if (!shouldUseAuth) {
      setAuthToken(null);
      return;
    }

    setAuthToken(undefined);
    authRepository.getAccessToken()
      .then((token) => {
        if (isMounted) {
          setAuthToken(token);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAuthToken(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [shouldUseAuth, uri]);

  if (!uri) return null;
  if (shouldUseAuth && authToken === undefined) return null;

  const source = {
    uri,
    headers: shouldUseAuth && authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
  };

  return (
    <Image
      source={source}
      style={style}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      transition={120}
      onError={onError}
    />
  );
}
