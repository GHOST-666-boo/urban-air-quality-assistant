/**
 * @module api/analyze
 * Thin Next.js App Router POST endpoint delegating business logic to
 * {@link processAnalyzeRequest} and handling JSON body parsing.
 */

import { NextRequest, NextResponse } from "next/server";
import { processAnalyzeRequest } from "@/lib/analyze-service";

/**
 * POST /api/analyze
 *
 * Parses the JSON body and delegates validation, rate limiting, live telemetry
 * grounding, and AI plan generation to {@link processAnalyzeRequest}.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload. Please submit a valid JSON object." },
      { status: 400 }
    );
  }

  const result = await processAnalyzeRequest(rawBody, req.headers);
  return NextResponse.json(result.body, {
    status: result.status,
    headers: result.headers,
  });
}
