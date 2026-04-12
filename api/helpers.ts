import type { CityDto, PaginatedResponse } from '@/types/shared';

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
      value.forEach((item) => {
        if (item != null && item !== '') {
          appendValue(params, key, item as Primitive);
        }
      });
      return;
    }

    if (typeof value === 'object') {
      if (isCityDto(value)) {
        if (value.settlement) params.append('citySettlement', value.settlement);
        if (value.region) params.append('cityRegion', value.region);
        if (value.country) params.append('cityCountry', value.country);
      }
      return;
    }

    appendValue(params, key, value as Primitive);
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
