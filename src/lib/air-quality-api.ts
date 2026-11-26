/**
 * @module lib/air-quality-api
 * Open-Meteo integration for resolving city coordinates and retrieving real-time
 * US EPA AQI, key pollutant metrics (PM2.5, PM10, NO2, O3), and weather conditions.
 */

import type { AqiCategory, LiveEnvironmentalData } from "../types/air-quality.ts";

/** Upstream fetch timeout in milliseconds for fast request fail-safe behavior. */
const OPEN_METEO_TIMEOUT_MS = 2000;

/** Next.js fetch cache revalidation interval in seconds (5 minutes). */
const REVALIDATE_SECONDS = 300;

interface GeocodingPlace {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

interface AirQualityCurrent {
  us_aqi?: number;
  pm2_5?: number;
  pm10?: number;
  nitrogen_dioxide?: number;
  ozone?: number;
}

interface WeatherCurrent {
  temperature_2m?: number;
  relative_humidity_2m?: number;
  wind_speed_10m?: number;
}

/**
 * Maps a numeric US EPA AQI value to its standard health risk category.
 *
 * @param aqi - Numeric US EPA Air Quality Index value.
 * @returns Corresponding US EPA {@link AqiCategory}.
 */
export function classifyUsAqi(aqi: number): AqiCategory {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

/**
 * Formats a concise human-readable air & weather condition summary string.
 */
function buildConditionSummary(
  usAqi: number,
  pm25: number,
  windSpeedKmh: number,
  temperatureC: number,
  humidityPercent: number
): string {
  const category = classifyUsAqi(usAqi);
  const windNote =
    windSpeedKmh < 8
      ? `Stagnant air (${windSpeedKmh} km/h wind)`
      : `Moderate/breezy dispersion (${windSpeedKmh} km/h wind)`;

  return `Live US AQI ${usAqi} (${category}) • PM2.5: ${pm25} µg/m³ • ${windNote} • ${temperatureC}°C, ${humidityPercent}% RH`;
}

/**
 * Resolves a city query into geographic coordinates using Open-Meteo Geocoding.
 */
async function resolveCityCoordinates(
  cityName: string
): Promise<GeocodingPlace | null> {
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    cityName
  )}&count=1&language=en&format=json`;

  const geoRes = await fetch(geoUrl, {
    signal: AbortSignal.timeout(OPEN_METEO_TIMEOUT_MS),
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!geoRes.ok) return null;
  const geoJson = (await geoRes.json()) as { results?: GeocodingPlace[] };
  return geoJson.results?.[0] ?? null;
}

/**
 * Fetches air quality and weather snapshots concurrently for given coordinates.
 */
async function fetchWeatherAndAqiSnapshot(
  latitude: number,
  longitude: number
): Promise<{ aqi: AirQualityCurrent; weather: WeatherCurrent } | null> {
  const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone`;
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`;

  const [aqiRes, weatherRes] = await Promise.all([
    fetch(aqiUrl, {
      signal: AbortSignal.timeout(OPEN_METEO_TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS },
    }),
    fetch(weatherUrl, {
      signal: AbortSignal.timeout(OPEN_METEO_TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS },
    }),
  ]);

  if (!aqiRes.ok || !weatherRes.ok) return null;

  const [aqiData, weatherData] = (await Promise.all([
    aqiRes.json(),
    weatherRes.json(),
  ])) as [{ current?: AirQualityCurrent }, { current?: WeatherCurrent }];

  return {
    aqi: aqiData.current ?? {},
    weather: weatherData.current ?? {},
  };
}

/**
 * Fetches real-time geocoding, air quality (US AQI, PM2.5, PM10, NO2, O3),
 * and weather (temperature, humidity, wind) from Open-Meteo with 2s timeouts.
 *
 * @param cityQuery - User-entered city string (e.g., "New Delhi, India").
 * @returns Live environmental telemetry, or `null` if lookup fails/times out.
 */
export async function fetchLiveCityAirAndWeather(
  cityQuery: string
): Promise<LiveEnvironmentalData | null> {
  const cleaned = cityQuery.split(",")[0]?.trim();
  if (!cleaned) return null;

  try {
    const place = await resolveCityCoordinates(cleaned);
    if (!place) return null;

    const { latitude, longitude } = place;
    const resolvedLocation = [place.name, place.admin1, place.country]
      .filter(Boolean)
      .slice(0, 2)
      .join(", ");

    const snapshot = await fetchWeatherAndAqiSnapshot(latitude, longitude);
    if (!snapshot) return null;

    const usAqi = Math.round(snapshot.aqi.us_aqi ?? 0);
    const pm25 = Number((snapshot.aqi.pm2_5 ?? 0).toFixed(1));
    const pm10 = Number((snapshot.aqi.pm10 ?? 0).toFixed(1));
    const no2 = Number((snapshot.aqi.nitrogen_dioxide ?? 0).toFixed(1));
    const o3 = Number((snapshot.aqi.ozone ?? 0).toFixed(1));
    const temperatureC = Number((snapshot.weather.temperature_2m ?? 0).toFixed(1));
    const humidityPercent = Math.round(snapshot.weather.relative_humidity_2m ?? 0);
    const windSpeedKmh = Number((snapshot.weather.wind_speed_10m ?? 0).toFixed(1));

    return {
      resolvedLocation,
      latitude,
      longitude,
      usAqi,
      pm25,
      pm10,
      no2,
      o3,
      temperatureC,
      humidityPercent,
      windSpeedKmh,
      autoConditionSummary: buildConditionSummary(
        usAqi,
        pm25,
        windSpeedKmh,
        temperatureC,
        humidityPercent
      ),
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn(
      "[Open-Meteo Lookup Warning]:",
      err instanceof Error ? err.message : "Unknown lookup error"
    );
    return null;
  }
}
