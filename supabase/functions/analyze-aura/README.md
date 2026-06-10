# `analyze-aura`

Supabase Edge Function scaffold for Aura analysis.

## Request

`POST` JSON body:

```json
{
  "imageBase64": "..."
}
```

## Response

```json
{
  "report": {
    "subject": "...",
    "aura_color": "#7B6CF6",
    "vibe_score": 74,
    "threat_level": "moderate",
    "traits": [],
    "verdict": "...",
    "recommendation": "..."
  }
}
```

## Deploy

```bash
supabase functions deploy analyze-aura
```

After deploy, your endpoint will look like:

```text
https://<project-ref>.functions.supabase.co/analyze-aura
```

Set this in your Expo app as:

```bash
EXPO_PUBLIC_AURA_ANALYZE_URL=https://<project-ref>.functions.supabase.co/analyze-aura
```

## Notes

- Handles `OPTIONS` for CORS.
- Returns a report shape immediately so the app stays usable.
- Replace the `chooseReport()` stub with your real model call when ready.
