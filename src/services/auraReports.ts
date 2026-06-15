import { FALLBACK_REPORTS } from "../data/fallbackAuraReports";
import { AuraReport, SavedAuraReport } from "../types";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
const REPORTS_TABLE_URL = SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/aura_reports`
  : "";

let fallbackReports = FALLBACK_REPORTS.map((report, index) =>
  toSavedReport(report, index),
);

function toSavedReport(report: AuraReport, index: number): SavedAuraReport {
  const createdAt = new Date(Date.now() - index * 86400000).toISOString();

  return {
    ...report,
    id: `fallback-${index + 1}`,
    created_at: createdAt,
    is_favorite: index === 0,
  };
}

function getHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (ANON_KEY) {
    headers.Authorization = `Bearer ${ANON_KEY}`;
    headers.apikey = ANON_KEY;
  }

  return headers;
}

function isSavedAuraReport(value: unknown): value is SavedAuraReport {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<SavedAuraReport>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.created_at === "string" &&
    typeof candidate.is_favorite === "boolean" &&
    typeof candidate.subject === "string" &&
    typeof candidate.aura_color === "string" &&
    typeof candidate.vibe_score === "number" &&
    typeof candidate.threat_level === "string" &&
    Array.isArray(candidate.traits) &&
    typeof candidate.verdict === "string" &&
    typeof candidate.recommendation === "string"
  );
}

function normalizeReports(payload: unknown): SavedAuraReport[] {
  if (!Array.isArray(payload)) {
    throw new Error("Saved reports response was not a list.");
  }

  return payload.filter(isSavedAuraReport);
}

export async function getReports(): Promise<SavedAuraReport[]> {
  if (!REPORTS_TABLE_URL || !ANON_KEY) {
    return fallbackReports;
  }

  try {
    const response = await fetch(
      `${REPORTS_TABLE_URL}?select=*&order=created_at.desc`,
      { headers: getHeaders() },
    );

    if (!response.ok) {
      throw new Error(`Saved reports failed with status ${response.status}.`);
    }

    return normalizeReports(await response.json());
  } catch (error) {
    console.warn("Saved reports fallback engaged:", error);
    return fallbackReports;
  }
}

export function hasSaveEndpoint(): boolean {
  return Boolean(REPORTS_TABLE_URL && ANON_KEY);
}

export async function saveAuraReport(
  report: AuraReport,
): Promise<SavedAuraReport> {
  if (!REPORTS_TABLE_URL || !ANON_KEY) {
    throw new Error(
      "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.",
    );
  }

  const response = await fetch(REPORTS_TABLE_URL, {
    method: "POST",
    headers: {
      ...getHeaders(),
      Prefer: "return=representation",
    },
    body: JSON.stringify(report),
  });

  if (!response.ok) {
    throw new Error(`Failed to save aura report: ${response.status}.`);
  }

  const [saved] = normalizeReports(await response.json());

  if (!saved) {
    throw new Error("Save succeeded but no report was returned.");
  }

  return saved;
}

export async function toggleFavorite(
  reportId: string,
  nextValue: boolean,
): Promise<SavedAuraReport | null> {
  if (!REPORTS_TABLE_URL || !ANON_KEY || reportId.startsWith("fallback-")) {
    fallbackReports = fallbackReports.map((report) =>
      report.id === reportId ? { ...report, is_favorite: nextValue } : report,
    );

    return fallbackReports.find((report) => report.id === reportId) ?? null;
  }

  const response = await fetch(`${REPORTS_TABLE_URL}?id=eq.${reportId}`, {
    method: "PATCH",
    headers: {
      ...getHeaders(),
      Prefer: "return=representation",
    },
    body: JSON.stringify({ is_favorite: nextValue }),
  });

  if (!response.ok) {
    throw new Error(`Favorite update failed with status ${response.status}.`);
  }

  const [updatedReport] = normalizeReports(await response.json());
  return updatedReport ?? null;
}
