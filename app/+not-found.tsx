import { Link, Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Страница не найдена' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Страница не найдена</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>На главную</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  link: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#000',
    borderRadius: 8,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
