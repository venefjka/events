import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Share,
    Platform,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, QrCode, Share2, Scan } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function MyQRScreen() {
    const { currentUser } = useAuth();

    if (!currentUser) {
        router.back();
        return null;
    }

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Мой QR-код WeDo: ${currentUser.qrCode}`,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                        <X size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Мой QR-код</Text>
                    <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                        <Share2 size={20} color="#000" />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <View style={styles.userInfo}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{currentUser.name[0]}</Text>
                        </View>
                        <Text style={styles.userName}>{currentUser.name}</Text>
                        <Text style={styles.userAge}>{currentUser.age} лет</Text>
                    </View>

                    <View style={styles.qrContainer}>
                        <View style={styles.qrPlaceholder}>
                            <QrCode size={200} color="#000" strokeWidth={1.5} />
                            <View style={styles.qrOverlay}>
                                <Text style={styles.qrCode}>{currentUser.qrCode}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.infoCard}>
                        <Text style={styles.infoTitle}>Как использовать</Text>
                        <Text style={styles.infoText}>
                            Покажите этот QR-код организатору события для отметки посещения.
                            Каждый пользователь имеет уникальный статичный QR-код.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.scanButton}
                        onPress={() => router.push('/qr-scan')}
                    >
                        <Scan size={24} color="#fff" />
                        <Text style={styles.scanButtonText}>Сканировать QR код участника</Text>
                    </TouchableOpacity>

                    <View style={styles.codeDisplay}>
                        <Text style={styles.codeLabel}>Код для ручного ввода:</Text>
                        <View style={styles.codeBox}>
                            <Text style={styles.codeText}>{currentUser.qrCode}</Text>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    shareButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    userInfo: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: '700',
        color: '#fff',
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000',
        marginBottom: 4,
    },
    userAge: {
        fontSize: 16,
        color: '#666',
    },
    qrContainer: {
        marginBottom: 32,
    },
    qrPlaceholder: {
        width: 280,
        height: 280,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    qrOverlay: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    qrCode: {
        fontSize: 11,
        fontWeight: '600',
        color: '#666',
        textAlign: 'center',
    },
    infoCard: {
        width: '100%',
        padding: 16,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        marginBottom: 20,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    codeDisplay: {
        width: '100%',
        marginTop: 12,
    },
    codeLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    codeBox: {
        padding: 16,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e5e5',
        borderStyle: 'dashed',
    },
    codeText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        width: '100%',
        backgroundColor: '#000',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 12,
    },
    scanButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
