import React from 'react';
import { Asterisk, Flower2, Sprout, TreeDeciduous, MapPin, Monitor } from 'lucide-react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';

export type GenderOption = 'any' | 'male' | 'female';
export type LevelOption = 'any' | 'beginner' | 'intermediate' | 'advanced';
export type ApprovalOption = 'yes' | 'no';
export type ApprovalFilterOption = 'any' | ApprovalOption;

export const getGenderItems = () => [
  {
    id: 'any' as const,
    label: 'Любой',
    renderIcon: ({ color, size }: { color: string; size: number }) => (
      <Asterisk size={size * 1.2} color={color} />
    ),
  },
  {
    id: 'male' as const,
    label: 'Мужской',
    renderIcon: ({ color, size }: { color: string; size: number }) => (
      <Ionicons name="male" size={size} color={color} />
    ),
  },
  {
    id: 'female' as const,
    label: 'Женский',
    renderIcon: ({ color, size }: { color: string; size: number }) => (
      <Ionicons name="female" size={size} color={color} />
    ),
  },
];

export const getLevelItems = () => [
  {
    id: 'any' as const,
    label: 'Любой',
    renderIcon: ({ color, size }: { color: string; size: number }) => (
      <Asterisk size={size * 1.2} color={color} />
    ),
  },
  {
    id: 'beginner' as const,
    label: 'Новички',
    renderIcon: ({ color, size }: { color: string; size: number }) => (
      <Sprout size={size} color={color} />
    ),
  },
  {
    id: 'intermediate' as const,
    label: 'Любители',
    renderIcon: ({ color, size }: { color: string; size: number }) => (
      <Flower2 size={size} color={color} />
    ),
  },
  {
    id: 'advanced' as const,
    label: 'Профи',
    renderIcon: ({ color, size }: { color: string; size: number }) => (
      <TreeDeciduous size={size} color={color} />
    ),
  },
];

export const getApprovalItems = () => [
  {
    id: 'yes' as const,
    label: 'По заявке',
    renderIcon: ({ color, size }: { color: string; size: number }) => (
      <Feather name="lock" size={size} color={color} />
    ),
  },
  {
    id: 'no' as const,
    label: 'Свободная',
    renderIcon: ({ color, size }: { color: string; size: number }) => (
      <Feather name="unlock" size={size} color={color} />
    ),
  },
];

export const getApprovalFilterItems = () => [
  {
    id: 'any' as const,
    label: 'Любой',
    renderIcon: ({ color, size }: { color: string; size: number }) => (
      <Asterisk size={size * 1.2} color={color} />
    ),
  },
  ...getApprovalItems(),
];

export const parseMaxParticipantsInput = (text: string, maxDigits = 5) => {
  const numeric = text.replace(/\D/g, '').slice(0, maxDigits);
  if (!numeric) return null;
  return parseInt(numeric, 10) || null;
};


export const getFormatItems = () => [
  {
    id: 'offline' as const,
    label: 'Оффлайн',
    renderIcon: ({ color, size }: { color: string; size: number }) => (
      <MapPin size={size} color={color} />
    ),
  },
  {
    id: 'online' as const,
    label: 'Онлайн',
    renderIcon: ({ color, size }: { color: string; size: number }) => (
      <Monitor size={size} color={color} />
    ),
  },
];
