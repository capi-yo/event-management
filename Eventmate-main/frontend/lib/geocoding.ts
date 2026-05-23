export type GeocodedPlace = {
  venue: string;
  display_name: string;
  lat: number;
  lng: number;
  city: string;
  country: string;
};

type NominatimResult = {
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    amenity?: string;
    building?: string;
    shop?: string;
    tourism?: string;
    leisure?: string;
    historic?: string;
    place?: string;
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
};

function parsePlace(result: NominatimResult): GeocodedPlace {
  // Extract specific name of the venue/landmark
  let venueName = result.name || "";

  if (!venueName && result.address) {
    venueName =
      result.address.amenity ||
      result.address.building ||
      result.address.shop ||
      result.address.tourism ||
      result.address.leisure ||
      result.address.historic ||
      result.address.place ||
      "";
  }

  // Fallback to the first comma-separated segment of the full display name
  if (!venueName) {
    venueName = result.display_name.split(",")[0].trim();
  }

  const city =
    result.address?.city ||
    result.address?.town ||
    result.address?.village ||
    result.address?.suburb ||
    result.address?.state ||
    "";

  return {
    venue: venueName,
    display_name: result.display_name,
    lat: Number.parseFloat(result.lat),
    lng: Number.parseFloat(result.lon),
    city,
    country: result.address?.country || "",
  };
}

export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodedPlace[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const response = await fetch(
    `/api/geocode?q=${encodeURIComponent(trimmed)}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(`Geocoding failed (${response.status})`);
  }

  const data = (await response.json()) as NominatimResult[];
  if (!Array.isArray(data)) return [];

  return data.map(parsePlace);
}
