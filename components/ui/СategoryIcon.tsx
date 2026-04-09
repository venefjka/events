import { JSX } from 'react';
import type { ActivityCategory, CategoryIconName } from '@/types';
import {
  CinemaIcon,
  CreativeIcon,
  EducationIcon,
  FoodIcon,
  GamesIcon,
  MusicIcon,
  NatureIcon,
  SportIcon,
} from '@/assets/svg-icons/icons';

const categoryIconMap: Record<CategoryIconName, (size: number) => JSX.Element> = {
  sport: SportIcon,
  creative: CreativeIcon,
  education: EducationIcon,
  games: GamesIcon,
  music: MusicIcon,
  food: FoodIcon,
  nature: NatureIcon,
  cinema: CinemaIcon,
};

export const renderCategoryIcon = (
  category: ActivityCategory,
  size: number,
) => {
  const Icon = categoryIconMap[category.icon];
  return Icon ? Icon(size) : null;
};
