import { AuraReport } from "../types";

export const FALLBACK_REPORTS: AuraReport[] = [
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
