import { NextRequest, NextResponse } from "next/server";
import { generateAirQualityPlan } from "@/lib/gemini";
import { fetchLiveCityAirAndWeather } from "@/lib/air-quality-api";
import { RoutineInput } from "@/types/air-quality";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<RoutineInput>;

    const city = body.city?.trim() || "";
    const dailySchedule = body.dailySchedule?.trim() || "";

    if (!city) {
      return NextResponse.json(
        { error: "Please enter your city or metro area." },
        { status: 400 }
      );
    }

    if (!dailySchedule || dailySchedule.length < 10) {
      return NextResponse.json(
        {
          error:
            "Please describe your daily schedule or routine (at least 10 characters) so we can tailor recommendations.",
        },
        { status: 400 }
      );
    }

    const liveTelemetry =
      body.liveTelemetry || (await fetchLiveCityAirAndWeather(city));

    const sanitizedInput: RoutineInput = {
      city,
      conditionContext:
        body.conditionContext?.trim() ||
        liveTelemetry?.autoConditionSummary ||
        "Winter Smog / High AQI",
      homeType: body.homeType || "Apartment (High-Rise)",
      commuteMode: body.commuteMode || "Private Car (Petrol/Diesel)",
      familyMembers: Array.isArray(body.familyMembers)
        ? body.familyMembers
        : [],
      dailySchedule,
      additionalNotes: body.additionalNotes?.trim(),
      liveTelemetry,
    };

    const plan = await generateAirQualityPlan(sanitizedInput);
    return NextResponse.json(plan, { status: 200 });
  } catch (error) {
    console.error("[/api/analyze Error]:", error);
    return NextResponse.json(
      {
        error:
          "Unable to process your request right now. Please check your input and try again.",
      },
      { status: 500 }
    );
  }
}
