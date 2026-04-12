import { NominatimPlace, reverseNominatim, searchNominatim } from '@/utils/nominatim';

export type CitySearchResult = {
    placeId: number;
    title: string;
    settlement: string;
    region?: string;
    country: string;
    lat: number;
    lon: number;
};

const isRegionTitle = (value?: string) => {
    const text = value?.toLowerCase() ?? '';
    return (
        text.includes('область') ||
        text.includes('обл.') ||
        text.includes('край') ||
        text.includes('республика') ||
        text.includes('автономный округ') ||
        text.includes('авт. округ') ||
        text.includes('округ') ||
        text.includes('федеральный округ')
    );
};

const buildCityResult = (place: NominatimPlace): CitySearchResult | null => {
    const primarySettlement =
        place.address?.city ||
        place.address?.town ||
        place.address?.village ||
        place.address?.hamlet ||
        place.address?.municipality ||
        place.address?.city_district ||
        place.address?.state_district;

    if (!primarySettlement && place.type === 'administrative') {
        return null;
    }

    const fallbackSettlement =
        place.address?.state ||
        place.address?.region ||
        place.address?.country;

    const settlement = primarySettlement || fallbackSettlement;
    if (!settlement || !place.address?.country || isRegionTitle(settlement)) {
        return null;
    }

    const region =
        place.address?.state ||
        place.address?.region ||
        place.address?.state_district ||
        place.address?.country;

    const normalizedSettlement = settlement.toLowerCase();
    const normalizedRegion = region?.toLowerCase();
    const safeRegion = normalizedRegion && normalizedRegion !== normalizedSettlement ? region : undefined;

    const title = [settlement, safeRegion, place.address.country].filter(Boolean).join(', ');

    return {
        placeId: place.place_id,
        settlement,
        region: safeRegion,
        country: place.address.country,
        title,
        lat: parseFloat(place.lat),
        lon: parseFloat(place.lon),
    };
};

const cityTypeRank = (place: NominatimPlace) => {
    const type = place.type ?? '';
    const cls = place.class ?? '';
    if (type === 'city') return 0;
    if (type === 'town') return 1;
    if (type === 'village') return 2;
    if (cls === 'place') return 3;
    if (cls === 'boundary' || type === 'administrative') return 4;
    return 5;
};

export const verifyCityByNominatim = async (
    query: string,
    limit = 6
): Promise<CitySearchResult[]> => {
    const q = query.trim();
    if (q.length < 2) return [];

    const data = await searchNominatim(q, limit);
    if (!data?.length) return [];

    return data
        .slice()
        .sort((a, b) => cityTypeRank(a) - cityTypeRank(b))
        .map((place) => buildCityResult(place))
        .filter((item): item is CitySearchResult => Boolean(item))
        .filter((item, index, all) => {
            const key = item.title.toLowerCase();
            return all.findIndex((entry) => entry.title.toLowerCase() === key) === index;
        });
};

export const reverseGeocodeCityByNominatim = async (
    latitude: number,
    longitude: number
): Promise<CitySearchResult | null> => {
    const data = await reverseNominatim(latitude, longitude, 10);
    if (!data) return null;

    const place: NominatimPlace = {
        place_id: data.place_id ?? Date.now(),
        lat: String(data.lat ?? latitude),
        lon: String(data.lon ?? longitude),
        address: data.address,
    };

    const baseResult = buildCityResult(place);
    if (!baseResult) return null;

    const cityName = data.address?.city;
    if (cityName) {
        const query = data.address?.country ? `${cityName}, ${data.address.country}` : cityName;
        const [cityPlace] = await searchNominatim(query, 1);
        const cityResult = cityPlace ? buildCityResult(cityPlace) : null;
        if (cityResult && cityResult.settlement.toLowerCase() === cityName.toLowerCase()) {
            return cityResult;
        }
    }

    return baseResult;
};
