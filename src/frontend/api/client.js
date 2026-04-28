export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function buildUrl(path, query) {
  const url = new URL(path, API_BASE_URL);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

export async function apiRequest(path, options = {}) {
  const { query, ...requestOptions } = options;
  const response = await fetch(buildUrl(path, query), {
    ...requestOptions,
    headers: {
      ...(requestOptions.body ? { 'Content-Type': 'application/json' } : {}),
      ...requestOptions.headers,
    },
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch {}

  if (!response.ok) {
    const error = new Error(
      payload?.error?.message || `Request failed with ${response.status}`
    );
    error.status = response.status;
    error.code = payload?.error?.code;
    error.payload = payload;
    throw error;
  }

  return payload?.response;
}

export function getPlacesCount() {
  return apiRequest('/api/places/count');
}

export function getPlacePoints(query) {
  return apiRequest('/api/places/points', { query });
}

export function getPlace(id) {
  return apiRequest('/api/places/get', { query: { id } });
}

export function getPlaceFilters() {
  return apiRequest('/api/places/filters');
}

export function getReviews(placeId, query = {}) {
  return apiRequest('/api/reviews/list', {
    query: {
      place_id: placeId,
      limit: 20,
      offset: 0,
      ...query,
    },
  });
}
