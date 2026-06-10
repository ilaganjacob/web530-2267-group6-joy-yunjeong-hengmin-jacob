import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Polygon, Text as SvgText, Line } from "react-native-svg";

import { AuraTrait } from "../types";

type TraitRadarProps = {
  traits: AuraTrait[];
  color: string;
  size?: number;
};

type Point = {
  x: number;
  y: number;
};

export function TraitRadar({ traits, color, size = 260 }: TraitRadarProps) {
  const chart = useMemo(() => {
    const center = size / 2;
    const radius = (size - 72) / 2;
    const longestLabel = traits.reduce(
      (longest, trait) => Math.max(longest, trait.label.length),
      0,
    );
    const labelRadius = radius + (longestLabel > 8 ? 2 : 6);

    const pointsForLevel = (level: number) => {
      return traits
        .map((_, index) =>
          polarPoint(index, level * radius, traits.length, center),
        )
        .map(pointToString)
        .join(" ");
    };

    const traitPoints = traits
      .map((trait, index) =>
        polarPoint(index, (trait.value / 100) * radius, traits.length, center),
      )
      .map(pointToString)
      .join(" ");

    const axisLines = traits.map((_, index) => {
      const end = polarPoint(index, radius, traits.length, center);
      return { key: index, end };
    });

    return {
      center,
      radius,
      labelRadius,
      pointsForLevel,
      traitPoints,
      axisLines,
    };
  }, [size, traits]);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {[0.25, 0.5, 0.75, 1].map((level) => (
          <Polygon
            key={level}
            points={chart.pointsForLevel(level)}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
        ))}

        {chart.axisLines.map(({ key, end }) => (
          <Line
            key={key}
            x1={chart.center}
            y1={chart.center}
            x2={end.x}
            y2={end.y}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={1}
          />
        ))}

        <Polygon
          points={chart.traitPoints}
          fill={`${color}33`}
          stroke={color}
          strokeWidth={2.2}
          strokeLinejoin="round"
        />

        {traits.map((trait, index) => {
          const labelPoint = polarPoint(
            index,
            chart.labelRadius,
            traits.length,
            chart.center,
          );
          const labelAdjust = getLabelAdjustments(trait.label);
          const labelX = clamp(labelPoint.x + labelAdjust.x, 12, size - 12);
          const labelY = labelPoint.y + labelAdjust.y;
          const textAnchor =
            labelAdjust.anchor ??
            (labelPoint.x >= chart.center ? "end" : "start");

          // Convert polar coordinates back to x/y for each label around the ring.
          return (
            <SvgText
              key={trait.label}
              x={labelX}
              y={labelY}
              fill="rgba(255,255,255,0.72)"
              fontSize="8"
              fontWeight="600"
              textAnchor={textAnchor}
              alignmentBaseline={
                labelPoint.y > chart.center ? "hanging" : "baseline"
              }
            >
              {trait.label.toUpperCase()}
            </SvgText>
          );
        })}

        <Circle cx={chart.center} cy={chart.center} r={5} fill={color} />
      </Svg>

      <View style={styles.legend}>
        {traits.map((trait) => (
          <View key={trait.label} style={styles.legendRow}>
            <Text style={styles.legendLabel}>{trait.label}</Text>
            <Text style={styles.legendValue}>{trait.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function polarPoint(
  index: number,
  radius: number,
  total: number,
  center: number,
): Point {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius,
  };
}

function pointToString(point: Point) {
  return `${point.x},${point.y}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getLabelAdjustments(label: string) {
  const normalized = label.toLowerCase();

  if (normalized === "confidence" || normalized === "precision") {
    return { x: 4, y: -2, anchor: "middle" as const };
  }

  if (normalized === "chaos") {
    return { x: 12, y: 8 };
  }

  if (normalized === "mystery") {
    return { x: 8, y: 8 };
  }

  if (normalized === "suspicion") {
    return { x: -16, y: 0 };
  }

  if (normalized === "charm") {
    return { x: -10, y: 0 };
  }

  if (normalized === "patience") {
    return { x: -2, y: 0 };
  }

  return { x: 0, y: 0 };
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  legend: {
    gap: 8,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingBottom: 8,
  },
  legendLabel: {
    color: "#E8EEF9",
    fontSize: 13,
    fontWeight: "700",
  },
  legendValue: {
    color: "#A5B4FC",
    fontSize: 13,
    fontWeight: "800",
  },
});
