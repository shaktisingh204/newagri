"use server";

export interface WeatherDaily {
  date: string;
  tMin: number;
  tMax: number;
  precip: number;
}

export interface WeatherSnapshot {
  ok: true;
  currentTemp: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
  weatherDescription: string;
  daily: WeatherDaily[];
  locationLabel: string;
}

export type WeatherResult =
  | WeatherSnapshot
  | { ok: false; reason: string };

// WMO weather interpretation codes -> human strings.
// Reference: https://open-meteo.com/en/docs (WMO Weather interpretation codes)
const WMO_DESCRIPTIONS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

function describeWeather(code: number): string {
  return WMO_DESCRIPTIONS[code] ?? "Unknown";
}

interface GeocodeResult {
  latitude: number;
  longitude: number;
  name: string;
  admin1?: string;
  country?: string;
}

interface GeocodeResponse {
  results?: GeocodeResult[];
}

interface ForecastResponse {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    precipitation?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_sum?: number[];
  };
}

export async function getWeatherForLocation(
  country: string,
  state: string,
  district: string
): Promise<WeatherResult> {
  if (!district) {
    return { ok: false, reason: "No district selected" };
  }

  try {
    const countryCode = country === "India" ? "IN" : country;
    const geocodeUrl =
      "https://geocoding-api.open-meteo.com/v1/search?" +
      new URLSearchParams({
        name: district,
        country: countryCode,
        count: "5",
        language: "en",
        format: "json",
      }).toString();

    const geoRes = await fetch(geocodeUrl, {
      next: { revalidate: 1800 },
    });

    if (!geoRes.ok) {
      return { ok: false, reason: "Geocoding service unavailable" };
    }

    const geoJson = (await geoRes.json()) as GeocodeResponse;
    const candidates = geoJson.results ?? [];

    if (candidates.length === 0) {
      return { ok: false, reason: `Could not locate ${district}` };
    }

    // Prefer a candidate whose admin1 matches the selected state.
    const lowerState = state?.toLowerCase() ?? "";
    const match =
      candidates.find(
        (c) => lowerState && c.admin1?.toLowerCase() === lowerState
      ) ?? candidates[0];

    const { latitude, longitude } = match;

    const forecastUrl =
      "https://api.open-meteo.com/v1/forecast?" +
      new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        current:
          "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
        daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
        timezone: "auto",
        forecast_days: "3",
      }).toString();

    const forecastRes = await fetch(forecastUrl, {
      next: { revalidate: 1800 },
    });

    if (!forecastRes.ok) {
      return { ok: false, reason: "Forecast service unavailable" };
    }

    const data = (await forecastRes.json()) as ForecastResponse;

    const current = data.current ?? {};
    const daily = data.daily ?? {};
    const times = daily.time ?? [];
    const tMax = daily.temperature_2m_max ?? [];
    const tMin = daily.temperature_2m_min ?? [];
    const pSum = daily.precipitation_sum ?? [];

    const dailyOut: WeatherDaily[] = times.map((date, i) => ({
      date,
      tMin: tMin[i] ?? 0,
      tMax: tMax[i] ?? 0,
      precip: pSum[i] ?? 0,
    }));

    const code = current.weather_code ?? 0;

    return {
      ok: true,
      currentTemp: current.temperature_2m ?? 0,
      humidity: current.relative_humidity_2m ?? 0,
      precipitation: current.precipitation ?? 0,
      windSpeed: current.wind_speed_10m ?? 0,
      weatherCode: code,
      weatherDescription: describeWeather(code),
      daily: dailyOut,
      locationLabel: [match.name, match.admin1, match.country]
        .filter(Boolean)
        .join(", "),
    };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
