
import "react-native-gesture-handler";
import "react-native-reanimated";
import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated, Text, Image, Platform } from "react-native";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Asset } from "expo-asset";
import { useFonts } from "expo-font";

import { AppPrefsProvider } from "../lib/app-prefs";
import { PushBootstrap } from "../lib/gotore/push";
import { SqliteBootstrap } from "../lib/sqlite/bootstrap";

import { initRevenueCat } from "../lib/revenuecat";
import { supabase } from "../lib/supabase";
import AppErrorBoundary from "../components/common/AppErrorBoundary";
import "../lib/i18n";

const LOGO = require("../image/fitcoach.png");
const FONT_FILE = require("../assets/fonts/Caveat-VariableFont_wght.ttf");

const DISPLAY_MS = 2500;
const FADE_MS = 250;
const MAX_WAIT_MS = 1500;

export default function RootLayout() {
  useEffect(() => {
    initRevenueCat().catch(() => {});
  }, []);
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      initRevenueCat().catch(() => {});
    });
    return () => subscription.unsubscribe();
  }, []);

  const [fontsLoaded] = useFonts({ FitTitle: FONT_FILE });

  const [showSplash, setShowSplash] = useState(true);
  const [readyToShow, setReadyToShow] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const overlayScale = useRef(new Animated.Value(1.04)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (fontsLoaded) {
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  }, [fontsLoaded, titleOpacity]);

  useEffect(() => {
    let mounted = true;
    let safetyTimer: ReturnType<typeof setTimeout> | null = null;

    (async () => {
      try {
        await Asset.loadAsync(LOGO);
      } catch (e: any) {
        if (mounted) setLogoError(String(e?.message ?? "asset load failed"));
      } finally {
        if (mounted) setReadyToShow(true);
      }
    })();

    safetyTimer = setTimeout(() => {
      if (mounted) setReadyToShow(true);
    }, MAX_WAIT_MS);

    return () => {
      mounted = false;
      if (safetyTimer) clearTimeout(safetyTimer);
    };
  }, []);

  useEffect(() => {
    if (!readyToShow) return;
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: FADE_MS,
          useNativeDriver: true,
        }),
        Animated.timing(overlayScale, {
          toValue: 1.0,
          duration: FADE_MS,
          useNativeDriver: true,
        }),
      ]).start(() => setShowSplash(false));
    }, DISPLAY_MS);
    return () => clearTimeout(t);
  }, [readyToShow, overlayOpacity, overlayScale]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppPrefsProvider>
          <SqliteBootstrap />
          <PushBootstrap />

          <View style={{ flex: 1 }}>
            <AppErrorBoundary>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen
                  name="(tabs)"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="+not-found"
                  options={{ headerShown: false }}
                />
              </Stack>
            </AppErrorBoundary>

            {showSplash && (
              <Animated.View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  styles.overlay,
                  {
                    opacity: overlayOpacity,
                    transform: [{ scale: overlayScale }],
                  },
                ]}
                accessibilityLabel="FitGear splash"
              >
                <View style={styles.centerStack}>
                  <View style={styles.logoFrame}>
                    <Image
                      source={LOGO}
                      style={styles.logo}
                      resizeMode="contain"
                      {...(Platform.OS === "android" ? { fadeDuration: 0 } : {})}
                      onError={(e) =>
                        setLogoError(
                          e?.nativeEvent?.error || "logo load error"
                        )
                      }
                    />
                  </View>

                  <Animated.Text
                    style={[
                      styles.appTitle,
                      {
                        opacity: fontsLoaded ? titleOpacity : 0,
                        fontFamily: fontsLoaded ? "FitTitle" : undefined,
                      },
                    ]}
                  >
                    FitGear
                  </Animated.Text>

                  {!!logoError && (
                    <Text style={styles.errText}>{logoError}</Text>
                  )}
                </View>
              </Animated.View>
            )}
          </View>
        </AppPrefsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "#0B0F1A",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    elevation: 10,
  },
  centerStack: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoFrame: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logo: {
    width: 180,
    height: 180,
  },
  appTitle: {
    marginTop: 20,
    color: "#FFFFFF",
    fontSize: 42,
    letterSpacing: 1,
    lineHeight: 40,
    minHeight: 30,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  errText: {
    marginTop: 8,
    color: "#ff9aa2",
    fontSize: 12,
    opacity: 0.8,
  },
});
