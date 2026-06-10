export type ThreatLevel = "low" | "moderate" | "elevated" | "cosmic";

export type AuraTrait = {
  label: string;
  value: number;
};

export type AuraReport = {
  subject: string;
  aura_color: string;
  vibe_score: number;
  threat_level: ThreatLevel;
  traits: AuraTrait[];
  verdict: string;
  recommendation: string;
};
