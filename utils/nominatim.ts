export type NominatimAddress = {
  road?: string;
  street?: string;
  residential?: string;
  pedestrian?: string;
  footway?: string;
  path?: string;
  cycleway?: string;
  highway?: string;
  house_number?: string;
  house?: string;
  building?: string;
  public_building?: string;
  attraction?: string;
  amenity?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  municipality?: string;
  city_district?: string;
  state_district?: string;
  country?: string;
  state?: string;
  region?: string;
  country_code?: string;
};

export type NominatimPlace = {
  place_id: number;
  lat: string;
  lon: string;
  display_name?: string;
  class?: string;
  type?: string;
  address?: NominatimAddress;
};

const DEFAULT_HEADERS = {
  'User-Agent': 'WeDo/1.0 (events@app)',
  'Accept-Language': 'ru',
};

const fetchJson = async <T>(url: string): Promise<T | null> => {
  const res = await fetch(url, { headers: DEFAULT_HEADERS });
  if (!res.ok) return null;
  return (await res.json()) as T;
};

export const searchNominatim = async (
  query: string,
  limit = 1
): Promise<NominatimPlace[]> => {
  const q = query.trim();
  if (!q) return [];
  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?format=json` +
    `&q=${encodeURIComponent(q)}` +
    `&limit=${limit}` +
    `&addressdetails=1`;
  return (await fetchJson<NominatimPlace[]>(url)) ?? [];
};

export const reverseNominatim = async (
  latitude: number,
  longitude: number,
  zoom = 18
): Promise<NominatimPlace | null> => {
  const url =
    `https://nominatim.openstreetmap.org/reverse` +
    `?format=json` +
    `&lat=${latitude}` +
    `&lon=${longitude}` +
    `&zoom=${zoom}` +
    `&addressdetails=1`;
  return await fetchJson<NominatimPlace>(url);
};
