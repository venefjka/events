import { CategoryIconName } from './shared';
import {
  ActivityDetailDto,
  ActivityListItemDto,
  NotificationDto,
  UserActivityFeedEventDto,
  UserProfileDto,
} from './dto';

export type ActivityCardModel = ActivityListItemDto;

export type ActivityDetailModel = ActivityDetailDto;

export interface UserProfile extends Omit<UserProfileDto, 'privacy'> {}

export interface NotificationItem extends Omit<NotificationDto, 'userId'> {}

export type UserActivityFeedItemModel = UserActivityFeedEventDto;

export interface CategoryIconModel {
  id: string;
  name: string;
  icon: CategoryIconName;
}
