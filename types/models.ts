import { CategoryIconName } from './shared';
import {
  ActivityDetailDto,
  ActivityListItemDto,
  NotificationDto,
  UserProfileDto,
} from './dto';

export type ActivityCardModel = ActivityListItemDto;

export type ActivityDetailModel = ActivityDetailDto;

export interface UserProfile extends UserProfileDto { }

export interface NotificationItem extends NotificationDto { }

export interface CategoryIconModel {
  id: string;
  name: string;
  icon: CategoryIconName;
}
