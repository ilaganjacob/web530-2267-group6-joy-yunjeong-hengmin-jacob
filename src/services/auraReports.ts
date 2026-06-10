/**
 * src/services/auraReports.ts
 *
 * Thin Supabase client for persisting AuraReport records.
 * Uses the same env vars already wired up for the analyze-aura function.
 */

import { AuraReport } from "../types";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

const REPORTS_ENDPOINT = `${SUPABASE_URL}/rest/v1/aura_reports`;

// Row shape expected by the aura_reports table
interface AuraReportRow {
  subject: string;
  aura_color: string;
  vibe_score: number;
  threat_level: string;
  traits: AuraReport["traits"];
  verdict: string;
  recommendation: string;
}

/**
 * Inserts an AuraReport into the `aura_reports` Supabase table.
 *
 * Returns the saved row (with `id` and `created_at`) on success,
 * or throws an Error with a human_readable message on failure.
 */

export async function saveAuraReport(
  report: AuraReport,
): Promise<AuraReportRow & { id: string; create_at: string }> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.",
    );
  }

  const row: AuraReportRow = {
    subject: report.subject,
    aura_color: report.aura_color,
    vibe_score: report.vibe_score,
    threat_level: report.threat_level,
    traits: report.traits,
    verdict: report.verdict,
    recommendation: report.recommendation,
  };

  const response = await fetch(REPORTS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Test PostgREST to return the inserted row
      prefer: "return=representation",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(row),
  });

  if (!response.ok) {
    let detail = response.json();
    try {
      const err = await response.json();
      detail = err?.message ?? err?.error ?? detail;
    } catch {
      // ignore
    }
    throw new Error(`Failed to save aura report: ${detail}`);
  }

  const [saved] = await response.json();
  return saved;
}

// Returns true when Supabase env vars are present (used to conditionally show the Save button).
export function hasSaveEndpoint(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
