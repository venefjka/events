import type { CityDto, PaginatedResponse } from '@/types/shared';
import { toSnakeCaseKey } from './case';

type Primitive = string | number | boolean;

const appendValue = (params: URLSearchParams, key: string, value: Primitive) => {
  params.append(key, String(value));
};

export const buildQueryString = (query?: Record<string, unknown>) => {
  if (!query) {
    return '';
  }

  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value == null || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      const paramKey = toSnakeCaseKey(key);
      value.forEach((item) => {
        if (item != null && item !== '') {
          appendValue(params, paramKey, item as Primitive);
        }
      });
      return;
    }

    if (typeof value === 'object') {
      if (isCityDto(value)) {
        if (value.settlement) params.append('city_settlement', value.settlement);
        if (value.region) params.append('city_region', value.region);
        if (value.country) params.append('city_country', value.country);
      }
      return;
    }

    appendValue(params, toSnakeCaseKey(key), value as Primitive);
  });

  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
};

const isCityDto = (value: unknown): value is CityDto => {
  return value != null && typeof value === 'object' && 'settlement' in value;
};

export const emptyPaginatedResponse = <T>(): PaginatedResponse<T> => ({
  items: [],
  nextCursor: null,
  hasMore: false,
});
