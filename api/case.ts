const camelToSnake = (value: string) =>
  value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

const snakeToCamel = (value: string) =>
  value.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());

const shouldKeepAsIs = (value: unknown) => {
  return (
    value == null ||
    typeof value !== 'object' ||
    value instanceof Date ||
    isFormData(value) ||
    isBlob(value)
  );
};

const convertKeys = (value: unknown, convertKey: (key: string) => string): unknown => {
  if (shouldKeepAsIs(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => convertKeys(item, convertKey));
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      convertKey(key),
      convertKeys(item, convertKey),
    ])
  );
};

const isFormData = (value: unknown): value is FormData => {
  return typeof FormData !== 'undefined' && value instanceof FormData;
};

const isBlob = (value: unknown): value is Blob => {
  return typeof Blob !== 'undefined' && value instanceof Blob;
};

export const toSnakeCaseKeys = <T = unknown>(value: unknown): T => {
  return convertKeys(value, camelToSnake) as T;
};

export const toCamelCaseKeys = <T = unknown>(value: unknown): T => {
  return convertKeys(value, snakeToCamel) as T;
};

export const toSnakeCaseKey = camelToSnake;
