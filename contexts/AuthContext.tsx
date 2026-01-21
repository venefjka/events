import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { User } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<User[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const queryClient = useQueryClient();

  const authQuery = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      const [userJson, accountsJson] = await Promise.all([
        AsyncStorage.getItem('currentUser'),
        AsyncStorage.getItem('accounts'),
      ]);
      
      const user = userJson ? JSON.parse(userJson) : null;
      const storedAccounts = accountsJson ? JSON.parse(accountsJson) : [];
      
      return { user, accounts: storedAccounts };
    },
  });

  useEffect(() => {
    if (authQuery.data) {
      setCurrentUser(authQuery.data.user);
      setAccounts(authQuery.data.accounts);
      setIsAuthReady(true);
    } else if (authQuery.isError || authQuery.isSuccess) {
      setIsAuthReady(true);
    }
  }, [authQuery.data, authQuery.isError, authQuery.isSuccess]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const accountsJson = await AsyncStorage.getItem('accounts');
      const existingAccounts: User[] = accountsJson ? JSON.parse(accountsJson) : [];
      
      const user = existingAccounts.find(
        (acc) => acc.email === email && acc.password === password
      );
      
      if (!user) {
        throw new Error('Неверный email или пароль');
      }
      
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));
      return user;
    },
    onSuccess: (user) => {
      setCurrentUser(user);
      queryClient.invalidateQueries({ queryKey: ['userActivities', user.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: Omit<User, 'id' | 'qrCode' | 'rating' | 'createdEventsCount' | 'joinedEventsCount' | 'reviews' | 'attendanceHistory'>) => {
      const accountsJson = await AsyncStorage.getItem('accounts');
      const existingAccounts: User[] = accountsJson ? JSON.parse(accountsJson) : [];
      
      const emailExists = existingAccounts.some((acc) => acc.email === userData.email);
      if (emailExists) {
        throw new Error('Email уже используется');
      }
      
      const newUser: User = {
        ...userData,
        id: `user-${Date.now()}`,
        qrCode: `qr-${Date.now()}`,
        rating: 4.5,
        createdEventsCount: 0,
        joinedEventsCount: 0,
        reviews: [],
        attendanceHistory: {
          attended: 0,
          missed: 0,
          cancelled: 0,
        },
      };
      
      const updatedAccounts = [...existingAccounts, newUser];
      
      await Promise.all([
        AsyncStorage.setItem('currentUser', JSON.stringify(newUser)),
        AsyncStorage.setItem('accounts', JSON.stringify(updatedAccounts)),
      ]);
      
      return { user: newUser, accounts: updatedAccounts };
    },
    onSuccess: ({ user, accounts: updatedAccounts }) => {
      setCurrentUser(user);
      setAccounts(updatedAccounts);
      queryClient.invalidateQueries({ queryKey: ['userActivities', user.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem('currentUser');
    },
    onSuccess: () => {
      setCurrentUser(null);
      queryClient.clear();
    },
  });

  const switchAccountMutation = useMutation({
    mutationFn: async (user: User) => {
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));
      return user;
    },
    onSuccess: (user) => {
      setCurrentUser(user);
      queryClient.invalidateQueries({ queryKey: ['userActivities', user.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
    },
  });

  return {
    currentUser,
    accounts,
    isAuthReady,
    login: (email: string, password: string) => loginMutation.mutate({ email, password }),
    register: (userData: Omit<User, 'id' | 'qrCode' | 'rating' | 'createdEventsCount' | 'joinedEventsCount' | 'reviews' | 'attendanceHistory'>) => registerMutation.mutate(userData),
    logout: () => logoutMutation.mutate(),
    switchAccount: (user: User) => switchAccountMutation.mutate(user),
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    loginError: loginMutation.error?.message,
    registerError: registerMutation.error?.message,
  };
});
