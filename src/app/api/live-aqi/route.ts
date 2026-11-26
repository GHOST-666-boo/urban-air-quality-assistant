/**
 * @module api/live-aqi
 * Thin Next.js App Router GET endpoint delegating telemetry lookup and
 * rate limiting to {@link processLiveAqiRequest}.
 */

import { NextRequest, NextResponse } from "next/server";
import { processLiveAqiRequest } from "@/lib/analyze-service";

/**
 * GET /api/live-aqi?city=CityName
 *
 * Delegates live city weather & AQI resolution to {@link processLiveAqiRequest}.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const cityParam = req.nextUrl.searchParams.get("city");
  const result = await processLiveAqiRequest(cityParam, req.headers);
  return NextResponse.json(result.body, {
    status: result.status,
    headers: result.headers,
  });
}
