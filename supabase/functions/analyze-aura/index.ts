type AuraTrait = { label: string; value: number };
type ThreatLevel = "low" | "moderate" | "elevated" | "cosmic";
type AuraReport = {
  subject: string;
  aura_color: string;
  vibe_score: number;
  threat_level: ThreatLevel;
  traits: AuraTrait[];
  verdict: string;
  recommendation: string;
};

declare const Deno: {
  serve(handler: (req: Request) => Response | Promise<Response>): void;
  env: { get(key: string): string | undefined };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FALLBACK_REPORTS: AuraReport[] = [
  {
    subject: 'That friend who says "I am not making this about me"',
    aura_color: "#7B6CF6",
    vibe_score: 87,
    threat_level: "elevated",
    traits: [
      { label: "Confidence", value: 92 },
      { label: "Mystery", value: 78 },
      { label: "Chaos", value: 84 },
      { label: "Charm", value: 67 },
      { label: "Suspicion", value: 58 },
    ],
    verdict:
      "This aura has the polished menace of a keynote speaker who definitely owns a custom mug.",
    recommendation:
      "Offer it sparkling water and do not let it near a group chat after 9 p.m.",
  },
  {
    subject: "The coworker who always says the spreadsheet is 'almost done'",
    aura_color: "#22D3EE",
    vibe_score: 74,
    threat_level: "moderate",
    traits: [
      { label: "Precision", value: 71 },
      { label: "Patience", value: 63 },
      { label: "Mystery", value: 52 },
      { label: "Chaos", value: 48 },
      { label: "Charm", value: 81 },
    ],
    verdict:
      "A suspiciously calm aura with enough polish to survive three meetings and a recap email.",
    recommendation:
      "Ask for the latest version politely and keep a backup copy of everything.",
  },
  {
    subject: "A karaoke volunteer with unearned confidence",
    aura_color: "#F97316",
    vibe_score: 92,
    threat_level: "cosmic",
    traits: [
      { label: "Confidence", value: 98 },
      { label: "Chaos", value: 96 },
      { label: "Charm", value: 88 },
      { label: "Suspicion", value: 69 },
      { label: "Mystery", value: 75 },
    ],
    verdict:
      "This aura is powered by poor decisions and a microphone that does not know what it is in for.",
    recommendation:
      "Keep nearby for morale, but never hand over the aux cable without supervision.",
  },
  {
    subject: "The silent type in a hoodie with excellent posture",
    aura_color: "#34D399",
    vibe_score: 61,
    threat_level: "low",
    traits: [
      { label: "Confidence", value: 55 },
      { label: "Mystery", value: 89 },
      { label: "Chaos", value: 34 },
      { label: "Charm", value: 62 },
      { label: "Suspicion", value: 44 },
    ],
    verdict:
      "Quiet, green, and mildly intimidating in the way a very organized plant is intimidating.",
    recommendation:
      "Proceed normally and resist the urge to overanalyze the hoodie.",
  },
];

// Uses the Chat Completions API with a vision content block.
// detail:"low" costs ~85 tokens and is fast enough for a live demo.
async function analyzeWithOpenAI(imageBase64: string): Promise<AuraReport> {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY not set");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      // Forces a valid JSON object in the response — no markdown fences to strip.
      response_format: { type: "json_object" },
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content:
            'You are a deadpan aura scanner — a cosmic instrument that reads energy fields with the confidence of a scientist and the wit of a roast comedian. You take yourself completely seriously. Look at the image and identify what is actually there, then produce a report that is grounded in what you see but written with sharp, dry humour. Rules for each field: "subject" must be a punchy character label, not a description — write it like a comedy archetype ("The person who definitely has opinions about coffee grind size", "A chair that has seen things", "The dog who is tired of your excuses"). "verdict" must be one sentence that reads like a deadpan punchline — specific, absurd, and confident. "recommendation" must be one hilariously specific instruction that nobody asked for. "traits" labels should be character-based (e.g. "Main character energy", "Plausible deniability", "Wifi password withholding") not generic metrics. "aura_color" should reflect the vibe — warm, cool, eerie, chaotic, etc. Respond ONLY with a valid JSON object: { "subject": string, "aura_color": string (hex), "vibe_score": number (0-100), "threat_level": "low"|"moderate"|"elevated"|"cosmic", "traits": [{"label": string, "value": number (0-100 integer)}] (exactly 5), "verdict": string, "recommendation": string }.',
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Scan this. Return the AuraReport JSON.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "low",
              },
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI ${res.status}: ${body}`);
  }

  const data = await res.json();
  // Chat Completions response: data.choices[0].message.content
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== "string") throw new Error("OpenAI returned no content");

  const parsed = JSON.parse(text);
  if (
    typeof parsed.subject === "string" &&
    typeof parsed.aura_color === "string" &&
    typeof parsed.vibe_score === "number" &&
    Array.isArray(parsed.traits) &&
    parsed.traits.length === 5
  ) {
    return parsed as AuraReport;
  }
  throw new Error("Response did not match AuraReport shape");
}

function pickFallback(seed: string): AuraReport {
  return (
    FALLBACK_REPORTS[seed.length % FALLBACK_REPORTS.length] ??
    FALLBACK_REPORTS[0]
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const imageBase64 = body?.imageBase64;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(
        JSON.stringify({ error: "imageBase64 is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let report: AuraReport;
    let source: "openai" | "fallback" = "fallback";

    try {
      report = await analyzeWithOpenAI(imageBase64);
      source = "openai";
      console.log("OpenAI analysis succeeded");
    } catch (err) {
      console.error("OpenAI failed, using fallback:", err);
      report = pickFallback(imageBase64);
    }

    return new Response(JSON.stringify({ report, source }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(JSON.stringify({ report: pickFallback("error") }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
