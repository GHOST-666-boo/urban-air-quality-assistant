# Urban Air Quality Assistant — PromptWars Main Challenge 06

An interactive, production-ready GenAI web application that transforms a household's daily routine, commute habits, and living environment into a structured, actionable plan for **reducing personal pollution exposure**, **lowering carbon emissions**, and **improving indoor air quality** (especially during winter smog and high-AQI episodes).

---

## Chosen Vertical

**PromptWars Main Challenge 06: Urban Air Quality Assistant**
- **Target Persona**: Urban households (commuters, parents with young children, elderly residents, and individuals with respiratory/cardiovascular sensitivities) navigating seasonal smog, rush-hour particulate spikes, and indoor air infiltration.

---

## Architecture Overview

```mermaid
flowchart LR
    U[User / Family Profile] --> UI[Next.js Dark-Theme UI\nGuided Form & Quick Describe]
    UI -->|GET /api/live-aqi| OM[Open-Meteo Geocoding,\nWeather & Air Quality APIs]
    OM -->|US AQI, PM2.5, PM10,\nNO2, O3, Temp, Wind| UI
    UI -->|POST /api/analyze| API[Next.js App Router API\nValidation & Server Grounding]
    API -->|Auto-fetch if missing| OM
    API --> G{GEMINI_API_KEY\nConfigured?}
    G -->|Yes| GEM[Google GenAI SDK\ngemini-2.5-flash + JSON Schema]
    G -->|No / Error| FB[Deterministic Urban AQI\nFallback Engine]
    GEM -->|Validated JSON| RES[Structured AirQualityPlanResponse]
    FB --> RES
    RES --> DASH[Responsive Dashboard\nAQI Spectrum • Routines • Indoor Hacks • Impact]
```

### Modular Directory Structure
- `src/types/air-quality.ts` — Strong TypeScript interfaces for household inputs, live telemetry, AQI risk summaries, routines, indoor hacks, and impact breakdowns.
- `src/lib/air-quality-api.ts` — Open-Meteo integration (Geocoding + Air Quality + Weather APIs) with timeout guards and US AQI classification.
- `src/lib/gemini.ts` — Google GenAI SDK (`@google/genai`) client with system instructions, live telemetry injection, strict `responseSchema` JSON mode, and runtime shape validation.
- `src/lib/fallback.ts` — Graceful offline/fallback engine that generates city- and sensitivity-aware baseline plans if `GEMINI_API_KEY` is missing or an upstream error occurs.
- `src/app/api/live-aqi/route.ts` — `GET /api/live-aqi?city=...` endpoint for instant condition verification.
- `src/app/api/analyze/route.ts` — `POST /api/analyze` endpoint with input validation, sanitization, and automatic server-side telemetry grounding.
- `src/components/RoutineInputForm.tsx` — Dual-mode input (Guided Form + Quick Describe) with live AQI lookup, dynamic family sensitivity tags, and one-click sample scenarios.
- `src/components/AirQualityDashboard.tsx` — High-contrast dark-theme dashboard displaying AQI risk badges, 0–350+ AQI spectrum bar, live weather/pollutant strip, weekly CO₂ savings, Quick Wins, and tabbed action cards.

---

## Approach, Logic & Prompt Design Strategy

### 1. Grounded Environmental Context (Eliminating Manual Guesswork)
Instead of relying solely on manual user estimates of air quality, the app queries **Open-Meteo** (no API key required) to fetch real-time **US AQI, PM2.5, PM10, NO₂, O₃, temperature, humidity, and wind speed** for the user's city. This telemetry is injected directly into the LLM prompt and fallback engine.

### 2. Prompt Design Strategy
- **System Instruction Persona**: Frames the model as an **Urban Air Quality & Environmental Health Specialist** focused on practical, non-alarmist, budget-conscious advice.
- **Structured Context Injection (`buildUserPrompt`)**: Injects normalized fields (`City`, `Live Open-Meteo Telemetry`, `Home Type`, `Primary Commute Mode`, `Household Members & Sensitivities`, `Daily Schedule`, and `Budget/Constraints`).
- **Strict Structured Output (`responseMimeType: "application/json"` + `responseSchema`)**: Enforces a deterministic JSON contract with 5 top-level keys:
  - `aqiRiskSummary`: Estimated AQI, category enum, primary pollutants, peak inversion windows, and advisory summary.
  - `lowEmissionRoutines`: Habit-by-habit shifts with feasibility tags, weekly kg CO₂ saved, and exposure reduction %.
  - `indoorAirHacks`: Cost-tiered (`Free`, `Low-Cost`, `Moderate`) techniques with `winterSmogSpecific` flags and step-by-step instructions.
  - `impactBreakdown`: Plain-language health and environmental cause-and-effect explanations per recommendation.
  - `quickWins`: Immediate same-day actions.

### 3. How the Solution Works (End-to-End)
1. User enters their city (or picks a one-tap preset) and clicks **Fetch Live AQI** (or submits directly).
2. The frontend sends the household profile to `POST /api/analyze`.
3. The API route validates inputs, fetches live Open-Meteo telemetry if not already attached, and calls Gemini with structured JSON mode.
4. If `GEMINI_API_KEY` is missing or the upstream call fails/returns invalid JSON, the deterministic fallback engine produces a complete, telemetry-grounded plan so the UI never crashes.
5. The dashboard renders the AQI spectrum bar, live weather/pollutant strip, Quick Wins, and tabbed **Low-Emission Routines**, **Indoor Air Hacks**, and **Health & Emission Impact** cards.

---

## Assumptions Made
- **AQI Scale**: Uses the **US EPA AQI** classification (`0–50 Good`, `51–100 Moderate`, `101–150 Unhealthy for Sensitive Groups`, `151–200 Unhealthy`, `201–300 Very Unhealthy`, `301+ Hazardous`).
- **Emission & Exposure Estimates**: Weekly CO₂ savings (kg/week) and exposure reduction percentages are practical estimates based on typical urban commute and indoor infiltration patterns rather than clinical or sensor-calibrated measurements.
- **API Availability**: Open-Meteo is used with a 4.5-second timeout; if unreachable, the app falls back to city/condition heuristics.

---

## Local Setup & Installation

### Prerequisites
- Node.js 18+ (tested on Node v24.4.1)
- npm 9+
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey) *(optional: the app runs with a smart offline baseline if omitted)*

### Steps
```bash
# 1. Navigate to the project directory
cd urban-air-quality-assistant

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local and set GEMINI_API_KEY=your_actual_key

# 4. Run verification checks
npm run lint
npm test

# 5. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
