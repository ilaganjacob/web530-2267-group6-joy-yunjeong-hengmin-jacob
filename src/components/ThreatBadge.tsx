import { StyleSheet, Text, View } from "react-native";

import { ThreatLevel } from "../types";

const THREAT_STYLES: Record<
  ThreatLevel,
  {
    label: string;
    backgroundColor: string;
    textColor: string;
    borderColor: string;
  }
> = {
  low: {
    label: "LOW THREAT",
    backgroundColor: "rgba(20, 184, 166, 0.14)",
    textColor: "#99F6E4",
    borderColor: "rgba(20, 184, 166, 0.28)",
  },
  moderate: {
    label: "MODERATE THREAT",
    backgroundColor: "rgba(245, 158, 11, 0.14)",
    textColor: "#FCD34D",
    borderColor: "rgba(245, 158, 11, 0.28)",
  },
  elevated: {
    label: "ELEVATED THREAT",
    backgroundColor: "rgba(249, 115, 22, 0.16)",
    textColor: "#FDBA74",
    borderColor: "rgba(249, 115, 22, 0.3)",
  },
  cosmic: {
    label: "COSMIC THREAT",
    backgroundColor: "rgba(168, 85, 247, 0.18)",
    textColor: "#DDD6FE",
    borderColor: "rgba(168, 85, 247, 0.32)",
  },
};

type ThreatBadgeProps = {
  level: ThreatLevel;
};

export function ThreatBadge({ level }: ThreatBadgeProps) {
  const style = THREAT_STYLES[level];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
        },
      ]}
    >
      <Text style={[styles.label, { color: style.textColor }]}>
        {style.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: "800",
  },
});
