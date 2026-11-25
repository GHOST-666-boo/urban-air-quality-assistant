import { NextRequest, NextResponse } from "next/server";
import { fetchLiveCityAirAndWeather } from "@/lib/air-quality-api";

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city")?.trim() || "";

  if (!city) {
    return NextResponse.json(
      { error: "City query parameter is required." },
      { status: 400 }
    );
  }

  const telemetry = await fetchLiveCityAirAndWeather(city);
  if (!telemetry) {
    return NextResponse.json(
      {
        error:
          "Could not fetch live weather/AQI for that city. You can still enter conditions manually.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json(telemetry, { status: 200 });
}
