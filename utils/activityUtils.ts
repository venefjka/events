import { PersonSummary } from '@/components/activity-detail/PeopleSummarySection';
import { categories } from '@/constants/categories';
import { ActivityCategory, UserSnippetDto } from '@/types';
import { getFileUrl } from './files';

export const IMPORT_ORGANIZER_ID = 'import';

export const isImportedActivity = (activity: any): boolean => {
  return Boolean(activity?.organizer?.id === IMPORT_ORGANIZER_ID);
};

export const toPersonSummary = (user: UserSnippetDto): PersonSummary => ({
  id: user.id,
  name: user.name,
  avatarUrl: getFileUrl(user.avatarFileId),
  rating: user.rating,
  isDeleted: user.isDeleted,
});

export const getAgeRangeLabel = (ageFrom?: number | null, ageTo?: number | null) => {
  if (ageFrom == null && ageTo == null) return null;
  if (ageFrom != null && ageTo != null) return `${ageFrom}-${ageTo} лет`;
  if (ageFrom != null) return `от ${ageFrom} лет`;
  return `до ${ageTo} лет`;
};

export const getActivityCategory = (activity?: { categoryId?: string | null } | null): ActivityCategory => {
  return categories.find((category) => category.id === activity?.categoryId) ?? categories[0];
};
