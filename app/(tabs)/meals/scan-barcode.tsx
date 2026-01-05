import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Linking, Platform, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { PrimaryButton } from "../../../ui/components";
import { colors } from "../../../ui/theme";

export default function ScanBarcodeScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const lockRef = useRef(false);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission, requestPermission]);

  const handleBarCodeScanned = useCallback(
    (e: { data?: string; rawValue?: string }) => {
      if (lockRef.current) return;
      const data = (e.rawValue || e.data || "").toString();
      const normalized = data.replace(/\D/g, "");
      const isLikelyJan = /^\d{8,14}$/.test(normalized);

      if (!isLikelyJan) {
        Alert.alert(
          "未対応のコード",
          `読み取ったコード: ${data}\n対応は JAN/EAN(8〜14桁) です。`
        );
        return;
      }

      lockRef.current = true;
      setScanned(true);
      router.replace({
        pathname: "/(tabs)/meals/add-from-code",
        params: { code: normalized },
      });
    },
    [router]
  );

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>カメラ権限を確認中…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { padding: 16 }]}>
        <Text style={styles.title}>カメラへのアクセスが必要です</Text>
        <Text style={[styles.muted, { textAlign: "center", marginTop: 8 }]}>
          バーコードをスキャンするにはカメラ権限を許可してください。
        </Text>
        <View style={{ height: 12 }} />
        <PrimaryButton
          title="権限を許可する"
          onPress={() => requestPermission()}
        />
        <View style={{ height: 8 }} />
        <PrimaryButton
          title="設定を開く"
          onPress={() => {
            if (Platform.OS === "ios") Linking.openURL("app-settings:");
            else Linking.openSettings();
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      <View style={styles.overlayTop}>
        <Text style={styles.overlayText}>枠内にバーコードを合わせてください</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: "#7e8697" },
  title: { color: colors.text, fontWeight: "800", fontSize: 18 },
  overlayTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
  },
  overlayText: { color: "#fff", fontWeight: "700" },
});
