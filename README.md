# Aura

A deadpan "aura scanner" mobile app built with Expo / React Native. Point the
camera at anything, hit **Scan**, and get back a tongue-in-cheek AI-generated
"aura report" — vibe score, aura color, threat level, a 5-trait radar chart,
a verdict, and a recommendation.

## Tech stack

- **Expo SDK 54** + React Native 0.81 + React 19, TypeScript
- **React Navigation** (native-stack) for screen routing
- **expo-camera** for the live camera preview & capture
- **expo-image-manipulator** to resize/compress captures to a JPEG + base64
- **expo-haptics** for tactile feedback on scan/result
- **react-native-reanimated** + **react-native-svg** for the gauge, radar
  chart, and scanning animations
- **expo-linear-gradient** for screen background treatments
- **@react-native-async-storage/async-storage** for daily-aura history (local)
- **expo-notifications** for optional daily scan reminders
- **Supabase Edge Function** (Deno) as the backend, calling the OpenAI
  Chat Completions API (`gpt-4o-mini` with vision) to generate the aura report

## Project structure

```
App.tsx                          Navigation container & stack setup
src/
  types.ts                       Shared types: AuraReport, DailyAuraRecord, …
  navigation/types.ts            React Navigation param list (Camera, AuraReport, DailyAura)
  screens/
    CameraScreen.tsx             Camera preview, capture, resize, kicks off analysis
    AuraReportScreen.tsx         Animated results screen (gauge, radar, verdict, etc.)
    DailyAuraScreen.tsx          Daily check-in hub: streak, calendar, reminders
  components/
    ScanningOverlay.tsx          Animated "READING AURA" sweep overlay shown while busy
    AuraGauge.tsx                Circular animated "vibe score" gauge (SVG)
    TraitRadar.tsx               5-axis animated radar/spider chart (SVG)
    ThreatBadge.tsx              Color-coded threat-level pill (low/moderate/elevated/cosmic)
  services/
    analyzeAura.ts                Client for the analysis endpoint, with timeout + fallback
    dailyAura.ts                  Daily scan storage, streak, one-scan/day gate, reminders
  data/
    sampleAuraReport.ts           Static sample report used as default AuraReport screen data
    fallbackAuraReports.ts        Pool of canned reports used when the API is unavailable
supabase/
  functions/analyze-aura/
    index.ts                       Edge Function: calls OpenAI vision, falls back on error
    README.md                      Deploy/usage notes for the edge function
```

## App flow

1. **CameraScreen** (`src/screens/CameraScreen.tsx`)
   - Requests camera permission (with dedicated UI for undetermined/denied
     states, including a deep link to Settings).
   - Shows a live `CameraView` with a viewfinder-style overlay (corner
     brackets, status pill showing Live / Frozen / Analyzing).
   - On **Scan**:
     1. Fires a medium haptic.
     2. Captures a photo (`takePictureAsync`).
     3. Freezes the preview on the captured frame.
     4. Resizes/compresses it to a 640px-wide JPEG and gets base64 via
        `expo-image-manipulator`.
     5. Calls `analyzeAura(base64)`.
     6. Navigates to **AuraReport** with the resulting report.
   - Shows a `ScanningOverlay` animation while busy, and an info strip with
     the analysis mode ("Live analysis" vs "Fallback mode") and base64 size.
   - On any failure, shows an alert and resets to the live camera.

2. **analyzeAura service** (`src/services/analyzeAura.ts`)
   - Reads `EXPO_PUBLIC_AURA_ANALYZE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
     from env.
   - POSTs `{ imageBase64 }` to the configured endpoint with a 30s timeout,
     attaching the Supabase anon key as `Authorization`/`apikey` headers if set.
   - Validates/normalizes the response into an `AuraReport` (handles both a
     bare report object and `{ report }` / `{ data: { report } }` wrappers).
   - On any error (no endpoint configured, network failure, bad shape,
     timeout), falls back to a random pick from `FALLBACK_REPORTS`
     (`src/data/fallbackAuraReports.ts`) so the app always produces a result.
   - `hasAuraAnalysisEndpoint()` reports whether a real endpoint is configured
     (drives the "Live analysis" vs "Fallback mode" label on the camera screen).

3. **AuraReportScreen** (`src/screens/AuraReportScreen.tsx`)
   - Receives an `AuraReport` via route params (or falls back to
     `SAMPLE_AURA_REPORT` if opened directly).
   - Fires a success haptic when focused.
   - Renders a gradient background tinted with the report's `aura_color`.
   - Animates each section in with a fade/slide/spring (`FadeSlideIn`),
     staggered by delay:
     - **Hero card**: subject, `ThreatBadge`, `AuraGauge` (vibe score), and
       an aura color swatch.
     - **Trait radar**: `TraitRadar` chart of the 5 traits.
     - **Verdict**: one-sentence absurd assessment.
     - **Recommendation**: one-sentence absurd action item.

## Daily aura

Separate from the main scan flow. One reading per calendar day, saved locally.

**Flow:** Camera → **Daily** → `DailyAuraScreen` → **Scan today's aura** →
`CameraScreen` (`dailyMode: true`) → back to `DailyAuraScreen`.

1. **DailyAuraScreen** (`src/screens/DailyAuraScreen.tsx`)
   - Streak counter (consecutive days with a daily scan).
   - Today's preview, or a scan CTA if not scanned yet.
   - Current-month calendar with aura-color dots on days that have a reading.
   - Tap a day or today's preview to open **AuraReport**.
   - Optional 9:00 AM reminder toggle (`expo-notifications`).

2. **dailyAura service** (`src/services/dailyAura.ts`)
   - Stores history in AsyncStorage (`aura:daily:history`).
   - `hasScannedToday()` — blocks a second daily scan on the same calendar day.
   - `saveDailyReport()` — saves `{ ...AuraReport, is_daily: true, date }`.
   - `computeStreak()` — consecutive-day streak from saved history.
   - `scheduleDailyReminder()` / `cancelDailyReminder()`.

The main camera scan (Camera → AuraReport) is unchanged: unlimited and not
persisted.

## Data model (`src/types.ts`)

```ts
type ThreatLevel = "low" | "moderate" | "elevated" | "cosmic";

type AuraTrait = { label: string; value: number }; // value 0-100

type AuraReport = {
  subject: string;
  aura_color: string;       // hex color, e.g. "#7B6CF6"
  vibe_score: number;       // 0-100
  threat_level: ThreatLevel;
  traits: AuraTrait[];      // exactly 5 entries expected
  verdict: string;
  recommendation: string;
};

type DailyAuraRecord = AuraReport & {
  is_daily: true;
  date: string;             // local calendar date, e.g. "2026-06-10"
};
```

## Backend: `analyze-aura` Supabase Edge Function

`supabase/functions/analyze-aura/index.ts`:

- Deno-based Edge Function with CORS support (handles `OPTIONS`, `POST` only).
- Expects `{ "imageBase64": "..." }` in the request body.
- Calls OpenAI's Chat Completions API (`gpt-4o-mini`, vision content block,
  `detail: "low"`, `response_format: json_object`) with a system prompt that
  forces the exact `AuraReport` JSON shape.
- Requires `OPENAI_API_KEY` to be set as a Supabase function secret.
- If OpenAI fails (no key, network error, bad response shape), deterministically
  picks one of 4 built-in `FALLBACK_REPORTS` based on the input, so the
  function always returns `{ report, source: "openai" | "fallback" }` with a
  200 status.

## Environment variables

Configured in `.env` (gitignored):

- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key, sent as
  `Authorization`/`apikey` headers when calling the analysis function
- `EXPO_PUBLIC_AURA_ANALYZE_URL` — full URL to the deployed `analyze-aura`
  function (`https://<project-ref>.functions.supabase.co/analyze-aura`).
  If unset, the app runs entirely in **fallback mode** using canned reports.

The Edge Function itself needs `OPENAI_API_KEY` set as a Supabase secret
(`supabase secrets set OPENAI_API_KEY=...`).

## Running the app

```bash
npm install
npm run start      # then choose a platform, or:
npm run ios
npm run android
npm run web
```

Deploying the backend function:

```bash
supabase functions deploy analyze-aura
```

## Status / what's implemented so far

- ✅ Navigation shell (Camera → AuraReport)
- ✅ Camera capture flow with permission handling, resize/compress to base64
- ✅ Animated scanning overlay during analysis
- ✅ Analysis client with live/fallback mode detection, timeout, and response
  normalization
- ✅ Local fallback report pool (4 sample auras) for offline/demo use
- ✅ Aura report UI: gauge, radar chart, threat badge, verdict & recommendation,
  staggered entrance animations, color-tinted background
- ✅ Supabase Edge Function scaffold wired to OpenAI vision (`gpt-4o-mini`)
  with its own fallback reports
- ✅ Daily aura: local persistence, streak, calendar, one scan/day, optional reminders
- ⬜ No user accounts/auth
