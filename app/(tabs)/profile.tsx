import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Settings, 
  Star, 
  LogOut, 
  Users, 
  QrCode, 
  UserCheck,
  Lock,
  Bell,
  Palette,
  HelpCircle,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { currentUser, logout, accounts, switchAccount } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  if (!currentUser) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Профиль</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettings(true)}>
          <Settings size={22} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{currentUser.name[0]}</Text>
          </View>
          <Text style={styles.name}>{currentUser.name}</Text>
          <Text style={styles.age}>{currentUser.age} лет</Text>

          <View style={styles.rating}>
            <Star size={16} color="#000" fill="#000" />
            <Text style={styles.ratingText}>{currentUser.rating.toFixed(1)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push(`/user/${currentUser.id}`)}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuItemIcon}>
                <Users size={20} color="#000" />
              </View>
              <Text style={styles.menuItemText}>Мой профиль</Text>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/my-qr')}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuItemIcon}>
                <QrCode size={20} color="#000" />
              </View>
              <Text style={styles.menuItemText}>Мой QR</Text>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/subscriptions')}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuItemIcon}>
                <UserCheck size={20} color="#000" />
              </View>
              <Text style={styles.menuItemText}>Мои подписки</Text>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Настройки</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuItemIcon}>
                <Lock size={20} color="#000" />
              </View>
              <Text style={styles.menuItemText}>Конфиденциальность</Text>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuItemIcon}>
                <Bell size={20} color="#000" />
              </View>
              <Text style={styles.menuItemText}>Уведомления</Text>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuItemIcon}>
                <Palette size={20} color="#000" />
              </View>
              <Text style={styles.menuItemText}>Оформление</Text>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Помощь</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuItemIcon}>
                <HelpCircle size={20} color="#000" />
              </View>
              <Text style={styles.menuItemText}>Справка</Text>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showSettings}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSettings(false)}
        >
          <View style={styles.settingsModal}>
            <Text style={styles.settingsTitle}>Настройки</Text>

            {accounts.length > 1 && (
              <TouchableOpacity
                style={styles.settingsOption}
                onPress={() => {
                  setShowSettings(false);
                  Alert.alert(
                    'Сменить аккаунт',
                    'Выберите аккаунт',
                    [
                      ...accounts
                        .filter((acc) => acc.id !== currentUser.id)
                        .map((account) => ({
                          text: `${account.name} (${account.age} лет)`,
                          onPress: () => switchAccount(account),
                        })),
                      { text: 'Отмена', style: 'cancel' },
                    ]
                  );
                }}
              >
                <Users size={20} color="#000" />
                <Text style={styles.settingsOptionText}>Сменить аккаунт</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.settingsOption}
              onPress={() => {
                setShowSettings(false);
                Alert.alert(
                  'Выход',
                  'Вы уверены, что хотите выйти из аккаунта?',
                  [
                    { text: 'Отмена', style: 'cancel' },
                    {
                      text: 'Выйти',
                      style: 'destructive',
                      onPress: logout,
                    },
                  ]
                );
              }}
            >
              <LogOut size={20} color="#f00" />
              <Text style={[styles.settingsOptionText, styles.settingsOptionDanger]}>Выйти</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsCancelButton}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.settingsCancelText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 8,
    borderBottomColor: '#f5f5f5',
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
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  age: {
    fontSize: 15,
    color: '#666',
    marginBottom: 12,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  section: {
    paddingVertical: 8,
    borderBottomWidth: 8,
    borderBottomColor: '#f5f5f5',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  settingsModal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  settingsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
  },
  settingsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    marginBottom: 12,
    gap: 12,
  },
  settingsOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  settingsOptionDanger: {
    color: '#f00',
  },
  settingsCancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  settingsCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});
