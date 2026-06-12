import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  CameraType,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as Haptics from "expo-haptics";

import { ScanningOverlay } from "../components/ScanningOverlay";
import { RootStackParamList } from "../navigation/types";
import { analyzeAura, hasAuraAnalysisEndpoint } from "../services/analyzeAura";

type Props = NativeStackScreenProps<RootStackParamList, "Camera">;

type ProcessedPhoto = {
  uri: string;
  base64: string;
  width: number;
  height: number;
};

export function CameraScreen({ navigation }: Props) {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [processedPhoto, setProcessedPhoto] = useState<ProcessedPhoto | null>(
    null,
  );
  const [isBusy, setIsBusy] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");

  const canShowCamera = permission?.granted && !capturedUri;
  const permissionStatus = permission?.status;
  const analysisMode = hasAuraAnalysisEndpoint()
    ? "Live analysis"
    : "Fallback mode";

  async function handleScan() {
    if (!cameraRef.current || isBusy) {
      return;
    }

    setIsBusy(true);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      if (!photo?.uri) {
        throw new Error("Camera did not return a photo.");
      }

      setCapturedUri(photo.uri);

      const resizedPhoto = await manipulateAsync(
        photo.uri,
        [{ resize: { width: 640 } }],
        {
          compress: 0.78,
          format: SaveFormat.JPEG,
          base64: true,
        },
      );

      if (!resizedPhoto.base64) {
        throw new Error("Photo resize did not return base64 data.");
      }

      setProcessedPhoto({
        uri: resizedPhoto.uri,
        base64: resizedPhoto.base64,
        width: resizedPhoto.width,
        height: resizedPhoto.height,
      });

      const report = await analyzeAura(resizedPhoto.base64);

      navigation.navigate("AuraReport", { report });
    } catch (error) {
      console.error("Camera scan failed:", error);
      Alert.alert(
        "Scan paused",
        "Aura could not capture or prepare this image. Try again and the camera will stay stable.",
      );
      setCapturedUri(null);
      setProcessedPhoto(null);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRequestPermission() {
    try {
      await requestPermission();
    } catch (error) {
      console.error("Permission request failed:", error);
      Alert.alert(
        "Permission issue",
        "Aura could not request camera access right now. Open Settings and allow camera access manually.",
      );
    }
  }

  function handleToggleFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  function handleOpenSettings() {
    Linking.openSettings().catch(() => {
      Alert.alert(
        "Settings unavailable",
        "Open the app settings manually and allow camera access.",
      );
    });
  }

  if (!permission) {
    return (
      <SafeAreaView style={styles.screenShell}>
        <View style={styles.centerState}>
          <ActivityIndicator color="#C4B5FD" />
          <Text style={styles.stateTitle}>Loading camera permissions</Text>
          <Text style={styles.stateBody}>
            Aura is checking camera access before starting the preview.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (permissionStatus === "undetermined") {
    return (
      <SafeAreaView style={styles.screenShell}>
        <View style={styles.permissionCard}>
          <Text style={styles.brand}>AURA</Text>
          <Text style={styles.permissionTitle}>Camera access needed</Text>
          <Text style={styles.permissionBody}>
            To scan an aura, Aura needs the camera. Nothing is saved unless you
            hit Scan.
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={handleRequestPermission}
          >
            <Text style={styles.primaryButtonText}>Allow camera</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("History")}
          >
            <Text style={styles.secondaryButtonText}>View history</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (permissionStatus === "denied") {
    return (
      <SafeAreaView style={styles.screenShell}>
        <View style={styles.permissionCard}>
          <Text style={styles.brand}>AURA</Text>
          <Text style={styles.permissionTitle}>Camera access denied</Text>
          <Text style={styles.permissionBody}>
            Open Settings and allow camera access, then return here.
          </Text>
          <Pressable style={styles.primaryButton} onPress={handleOpenSettings}>
            <Text style={styles.primaryButtonText}>Open Settings</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={handleRequestPermission}
          >
            <Text style={styles.secondaryButtonText}>Try again</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("History")}
          >
            <Text style={styles.secondaryButtonText}>View history</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screenShell}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>DEADPAN CAMERA SCAN</Text>
          <Text style={styles.title}>Point it at anything.</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={({ pressed }) => [
              styles.flipButton,
              pressed && styles.flipButtonPressed,
            ]}
            onPress={() => navigation.navigate("History")}
            disabled={isBusy}
          >
            <Text style={styles.flipButtonText}>History</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.flipButton,
              pressed && styles.flipButtonPressed,
            ]}
            onPress={handleToggleFacing}
            disabled={isBusy || !!capturedUri}
          >
            <Text style={styles.flipButtonText}>
              {facing === "back" ? "Front cam" : "Back cam"}
            </Text>
          </Pressable>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>
              {isBusy ? "Analyzing" : capturedUri ? "Frozen" : "Live"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.previewFrame}>
        {capturedUri ? (
          <Image source={{ uri: capturedUri }} style={styles.previewImage} />
        ) : (
          <CameraView
            ref={cameraRef}
            style={styles.previewImage}
            facing={facing}
            onCameraReady={() => setCameraReady(true)}
          />
        )}

        <View style={styles.overlay}>
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
        </View>

        <View style={styles.infoStrip}>
          <Text style={styles.infoText}>
            {capturedUri
              ? `Prepared ${processedPhoto ? "and resized" : "for resize"}`
              : cameraReady
                ? "Camera ready"
                : "Warming up camera"}
          </Text>
          <Text style={styles.infoTextMuted}>
            {isBusy
              ? analysisMode
              : processedPhoto
                ? `${processedPhoto.width} x ${processedPhoto.height}`
                : "JPEG output pending"}
          </Text>
        </View>

        {isBusy ? <ScanningOverlay /> : null}
      </View>

      <View style={styles.footer}>
        <View style={styles.base64Card}>
          <Text style={styles.base64Label}>BASE64 PREP</Text>
          <Text style={styles.base64Value} numberOfLines={1}>
            {processedPhoto
              ? `${processedPhoto.base64.length} chars`
              : "Not generated yet"}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.scanButton,
            pressed && styles.scanButtonPressed,
            isBusy && styles.scanButtonDisabled,
          ]}
          onPress={handleScan}
          disabled={isBusy || !cameraReady}
        >
          {isBusy ? (
            <View style={styles.scanButtonLoadingRow}>
              <ActivityIndicator color="#05070C" />
              <Text style={styles.scanButtonText}>Analyzing</Text>
            </View>
          ) : (
            <Text style={styles.scanButtonText}>Scan</Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.historyButton,
            pressed && styles.historyButtonPressed,
          ]}
          onPress={() => navigation.navigate("History")}
          disabled={isBusy}
        >
          <Text style={styles.historyButtonText}>View history</Text>
        </Pressable>

        <Text style={styles.caption}>
          Capture freezes the frame and prepares a resized JPEG for the analysis
          step.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenShell: {
    flex: 1,
    backgroundColor: "#05070c",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
  },
  header: {
    gap: 12,
    marginBottom: 14,
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  statusText: {
    color: "#E9D5FF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  previewFrame: {
    flex: 1,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#0B1020",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5, 7, 12, 0.08)",
  },
  cornerTopLeft: {
    position: "absolute",
    top: 18,
    left: 18,
    width: 56,
    height: 56,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: "rgba(255,255,255,0.84)",
    borderTopLeftRadius: 18,
  },
  cornerTopRight: {
    position: "absolute",
    top: 18,
    right: 18,
    width: 56,
    height: 56,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: "rgba(255,255,255,0.84)",
    borderTopRightRadius: 18,
  },
  cornerBottomLeft: {
    position: "absolute",
    bottom: 18,
    left: 18,
    width: 56,
    height: 56,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: "rgba(255,255,255,0.84)",
    borderBottomLeftRadius: 18,
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: 18,
    right: 18,
    width: 56,
    height: 56,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: "rgba(255,255,255,0.84)",
    borderBottomRightRadius: 18,
  },
  flipButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  flipButtonPressed: {
    opacity: 0.7,
  },
  flipButtonText: {
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  infoStrip: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "rgba(7, 10, 18, 0.74)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  infoText: {
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "800",
  },
  infoTextMuted: {
    color: "#C7D2FE",
    fontSize: 12,
    fontWeight: "700",
  },
  footer: {
    paddingTop: 14,
    gap: 12,
  },
  base64Card: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 4,
  },
  base64Label: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  base64Value: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "800",
  },
  scanButton: {
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E9D5FF",
  },
  scanButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  scanButtonDisabled: {
    opacity: 0.7,
  },
  scanButtonText: {
    color: "#05070C",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  scanButtonLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  historyButton: {
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  historyButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  historyButtonText: {
    color: "#E9D5FF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  caption: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  permissionCard: {
    flex: 1,
    justifyContent: "center",
    padding: 22,
    borderRadius: 28,
    backgroundColor: "rgba(10, 14, 26, 0.86)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 14,
  },
  brand: {
    color: "#C4B5FD",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2.2,
  },
  permissionTitle: {
    color: "#F8FAFC",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  permissionBody: {
    color: "#CBD5E1",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  primaryButton: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E9D5FF",
    marginTop: 4,
  },
  primaryButtonText: {
    color: "#05070C",
    fontSize: 15,
    fontWeight: "900",
  },
  secondaryButton: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  secondaryButtonText: {
    color: "#E2E8F0",
    fontSize: 15,
    fontWeight: "800",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  stateTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
  },
  stateBody: {
    color: "#94A3B8",
    fontSize: 14,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 20,
  },
});
