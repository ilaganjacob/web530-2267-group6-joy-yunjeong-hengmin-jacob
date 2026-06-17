import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type ScreenHeaderProps = {
  kicker: string;
  title: string;
  subtitle?: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  navRow?: ReactNode;
  /** Home scan screen: title shares the top row with a trailing action. */
  inlineTitle?: boolean;
};

export function ScreenHeader({
  kicker,
  title,
  subtitle,
  leftAction,
  rightAction,
  navRow,
  inlineTitle = false,
}: ScreenHeaderProps) {
  if (inlineTitle) {
    return (
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>{kicker}</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
          {rightAction}
        </View>
        {navRow ? <View style={styles.headerNav}>{navRow}</View> : null}
      </View>
    );
  }

  return (
    <View style={styles.header}>
      {leftAction || rightAction ? (
        <View style={styles.headerTop}>
          <View style={styles.headerSide}>{leftAction}</View>
          <View style={[styles.headerSide, styles.headerSideRight]}>
            {rightAction}
          </View>
        </View>
      ) : null}
      <View style={styles.headerCopy}>
        <Text style={styles.kicker}>{kicker}</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {navRow ? <View style={styles.headerNav}>{navRow}</View> : null}
    </View>
  );
}

type HeaderButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "neutral" | "accent" | "ghost";
};

export function HeaderButton({
  label,
  onPress,
  disabled,
  variant = "neutral",
}: HeaderButtonProps) {
  const isAccent = variant === "accent";
  const isGhost = variant === "ghost";

  return (
    <Pressable
      style={({ pressed }) => [
        isGhost ? styles.ghostButton : styles.navButton,
        isAccent && styles.accentButton,
        pressed && styles.navButtonPressed,
        disabled && styles.navButtonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          isGhost ? styles.ghostButtonText : styles.navButtonText,
          isAccent && styles.accentButtonText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export const screenShellStyles = StyleSheet.create({
  screenShell: {
    flex: 1,
    backgroundColor: "#05070c",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
  },
});

export const headerStyles = StyleSheet.create({
  header: {
    gap: 12,
    marginBottom: 14,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerSide: {
    flex: 1,
    alignItems: "flex-start",
  },
  headerSideRight: {
    alignItems: "flex-end",
  },
  headerCopy: {
    flex: 1,
  },
  headerNav: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  kicker: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    marginTop: 4,
  },
  navButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  accentButton: {
    backgroundColor: "rgba(124, 58, 237, 0.18)",
    borderColor: "rgba(196, 181, 253, 0.35)",
  },
  ghostButton: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  navButtonPressed: {
    opacity: 0.7,
  },
  navButtonDisabled: {
    opacity: 0.45,
  },
  navButtonText: {
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  accentButtonText: {
    color: "#DDD6FE",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  ghostButtonText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },
});

const styles = headerStyles;
