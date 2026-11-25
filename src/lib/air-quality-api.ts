import type { AqiCategory, LiveEnvironmentalData } from "../types/air-quality.ts";

export function classifyUsAqi(aqi: number): AqiCategory {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

export async function fetchLiveCityAirAndWeather(
  cityQuery: string
): Promise<LiveEnvironmentalData | null> {
  const cleaned = cityQuery.split(",")[0]?.trim();
  if (!cleaned) return null;

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      cleaned
    )}&count=1&language=en&format=json`;

    const geoRes = await fetch(geoUrl, {
      signal: AbortSignal.timeout(2000),
      next: { revalidate: 300 },
    });

    if (!geoRes.ok) return null;
    const geoJson = (await geoRes.json()) as {
      results?: Array<{
        name: string;
        country?: string;
        admin1?: string;
        latitude: number;
        longitude: number;
      }>;
    };

    const place = geoJson.results?.[0];
    if (!place) return null;

    const { latitude, longitude } = place;
    const resolvedLocation = [place.name, place.admin1, place.country]
      .filter(Boolean)
      .slice(0, 2)
      .join(", ");

    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone`;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`;

    const [aqiRes, weatherRes] = await Promise.all([
      fetch(aqiUrl, {
        signal: AbortSignal.timeout(2000),
        next: { revalidate: 300 },
      }),
      fetch(weatherUrl, {
        signal: AbortSignal.timeout(2000),
        next: { revalidate: 300 },
      }),
    ]);

    if (!aqiRes.ok || !weatherRes.ok) return null;

    const aqiData = (await aqiRes.json()) as {
      current?: {
        us_aqi?: number;
        pm2_5?: number;
        pm10?: number;
        nitrogen_dioxide?: number;
        ozone?: number;
      };
    };

    const weatherData = (await weatherRes.json()) as {
      current?: {
        temperature_2m?: number;
        relative_humidity_2m?: number;
        wind_speed_10m?: number;
      };
    };

    const usAqi = Math.round(aqiData.current?.us_aqi ?? 0);
    const pm25 = Number((aqiData.current?.pm2_5 ?? 0).toFixed(1));
    const pm10 = Number((aqiData.current?.pm10 ?? 0).toFixed(1));
    const no2 = Number((aqiData.current?.nitrogen_dioxide ?? 0).toFixed(1));
    const o3 = Number((aqiData.current?.ozone ?? 0).toFixed(1));
    const temperatureC = Number(
      (weatherData.current?.temperature_2m ?? 0).toFixed(1)
    );
    const humidityPercent = Math.round(
      weatherData.current?.relative_humidity_2m ?? 0
    );
    const windSpeedKmh = Number(
      (weatherData.current?.wind_speed_10m ?? 0).toFixed(1)
    );

    const category = classifyUsAqi(usAqi);
    const windNote =
      windSpeedKmh < 8
        ? `Stagnant air (${windSpeedKmh} km/h wind)`
        : `Moderate/breezy dispersion (${windSpeedKmh} km/h wind)`;

    const autoConditionSummary = `Live US AQI ${usAqi} (${category}) • PM2.5: ${pm25} µg/m³ • ${windNote} • ${temperatureC}°C, ${humidityPercent}% RH`;

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
      autoConditionSummary,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn("[Open-Meteo Lookup Warning]:", err);
    return null;
  }
}
