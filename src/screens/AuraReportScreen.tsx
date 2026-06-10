import { useState, useCallback, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { saveAuraReport, hasSaveEndpoint } from "../services/auraReports";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { AuraGauge } from "../components/AuraGauge";
import { ThreatBadge } from "../components/ThreatBadge";
import { TraitRadar } from "../components/TraitRadar";
import { SAMPLE_AURA_REPORT } from "../data/sampleAuraReport";
import { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "AuraReport">;

// Each card fades in and slides up from 24px below its final position.
// delay controls when each card's animation starts (ms after screen focus).
type FadeSlideInProps = { delay: number; children: React.ReactNode };

function FadeSlideIn({ delay, children }: FadeSlideInProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(80);
  const scale = useSharedValue(0.88);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) }),
    );
    // Low stiffness + low damping = travels far, bounces slightly before settling
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 13, stiffness: 60, mass: 1.2 }),
    );
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 13, stiffness: 60, mass: 1.2 }),
    );
  }, [delay]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return <Animated.View style={animStyle}>{children}</Animated.View>;
}

function hexToRgba(hexColor: string, alpha: number) {
  const normalized = hexColor.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function AuraReportScreen({ route }: Props) {
  const { width } = useWindowDimensions();
  const report = route.params?.report ?? SAMPLE_AURA_REPORT;
  const chartWidth = Math.max(220, Math.min(320, width - 48));
  const auraTint = hexToRgba(report.aura_color, 0.32);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Fire a success haptic the moment the report screen comes into focus
  useFocusEffect(
    useCallback(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, []),
  );

  const handleSave = async () => {
    if (saved || saving) return;
    try {
      await saveAuraReport(report);
      setSaved(true);
    } catch (err) {
      Alert.alert(
        "Save Failed",
        err instanceof Error ? err.message : "Could not save this aura report.",
        [{ text: "OK" }],
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient
      colors={[auraTint, "#090D16", "#05070C"]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.background}
    >
      <View style={[styles.topGlow, { backgroundColor: report.aura_color }]} />
      <View style={styles.bottomGlow} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <FadeSlideIn delay={0}>
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={styles.kickerPill}>
                <Text style={styles.kickerText}>AURA SCAN</Text>
              </View>
              <ThreatBadge level={report.threat_level} />
            </View>

            <Text style={styles.subjectLabel}>SUBJECT</Text>
            <Text style={styles.subjectText}>{report.subject}</Text>

            <View style={styles.heroRow}>
              <View style={styles.scoreBlock}>
                <AuraGauge
                  value={report.vibe_score}
                  color={report.aura_color}
                />
              </View>
              <View style={styles.colorCard}>
                <Text style={styles.colorLabel}>AURA COLOR</Text>
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: report.aura_color },
                  ]}
                />
                <Text style={styles.colorHex}>
                  {report.aura_color.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={300}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>TRAIT RADAR</Text>
              <Text style={styles.sectionNote}>
                Five-point diagnostic sweep
              </Text>
            </View>
            <TraitRadar
              traits={report.traits}
              color={report.aura_color}
              size={chartWidth}
            />
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={600}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>VERDICT</Text>
            <Text style={styles.bodyText}>{report.verdict}</Text>
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={900}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>RECOMMENDATION</Text>
            <Text style={styles.bodyText}>{report.recommendation}</Text>
          </View>
        </FadeSlideIn>

        {hasSaveEndpoint() && (
          <FadeSlideIn delay={600}>
            <TouchableOpacity
              style={[saveStyles.button, saved && saveStyles.buttonSaved]}
              onPress={handleSave}
              disabled={saving || saved}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={saveStyles.label}>
                  {saved ? "✓ Aura Saved" : "Save Aura"}
                </Text>
              )}
            </TouchableOpacity>
          </FadeSlideIn>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  topGlow: {
    position: "absolute",
    top: -120,
    right: -100,
    width: 260,
    height: 260,
    borderRadius: 260,
    opacity: 0.18,
  },
  bottomGlow: {
    position: "absolute",
    bottom: -140,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 300,
    backgroundColor: "rgba(123, 108, 246, 0.10)",
    opacity: 0.8,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 72,
    paddingBottom: 40,
    gap: 16,
  },
  heroCard: {
    backgroundColor: "rgba(10, 14, 26, 0.84)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 28,
    padding: 18,
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kickerPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  kickerText: {
    color: "#C7D2FE",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  subjectLabel: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "800",
  },
  subjectText: {
    color: "#F8FAFC",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  scoreBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
  },
  colorCard: {
    width: 104,
    alignSelf: "stretch",
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  colorLabel: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    textAlign: "center",
  },
  colorSwatch: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  colorHex: {
    color: "#E5E7EB",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.9,
  },
  sectionCard: {
    backgroundColor: "rgba(10, 14, 26, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 24,
    padding: 18,
    gap: 16,
  },
  sectionTitleRow: {
    gap: 4,
  },
  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  sectionNote: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 12,
    fontWeight: "600",
  },
  bodyText: {
    color: "#E2E8F0",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
});

const saveStyles = StyleSheet.create({
  button: {
    alignSelf: "center",
    marginTop: 24,
    marginBottom: 40,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.45)",
  },
  buttonSaved: {
    backgroundColor: "rgba(100,220,140,0.25)",
    borderColor: "rgba(100,220,140,0.7)",
  },
  label: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
