import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { View, Text, TouchableOpacity, AppState, AppStateStatus, TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { cancelNotification, ensureNotificationSetup, scheduleRestNotification } from "../lib/notify";

export type RestTimerHandle = { start: (sec?: number) => void };

type Props = {
  defaultSec?: number;
  sound?: any;
};

export default forwardRef<RestTimerHandle, Props>(
  ({ defaultSec = 90, sound }, ref) => {
    const [endAt, setEndAt] = useState<number | null>(null);
    const [notifId, setNotifId] = useState<string | null>(null);
    const [fired, setFired] = useState(false);
    const [, forceTick] = useState(0);
    const tickRef = useRef<any>(null);
    const appState = useRef(AppState.currentState);

    const [customOpen, setCustomOpen] = useState(false);
    const [customSec, setCustomSec] = useState(String(defaultSec));
    const parseCustom = () => {
      const n = Math.max(1, Math.floor(Number(customSec) || 0));
      return isFinite(n) ? n : defaultSec;
    };

    useEffect(() => { ensureNotificationSetup(); }, []);
    useImperativeHandle(ref, () => ({ start: (sec?: number) => begin(sec ?? defaultSec) }));

    useEffect(() => {
      clearInterval(tickRef.current);
      if (endAt == null) return;
      tickRef.current = setInterval(() => forceTick(x => x + 1), 200);
      return () => clearInterval(tickRef.current);
    }, [endAt]);

    useEffect(() => {
      const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
        appState.current = next;
        if (endAt && Date.now() >= endAt && !fired) onFinish();
      });
      return () => sub.remove();
    }, [endAt, fired]);

    async function begin(sec: number) {
      await cancel();
      const target = Date.now() + Math.max(1, Math.floor(sec)) * 1000;
      setEndAt(target);
      setFired(false);
      const id = await scheduleRestNotification(sec);
      setNotifId(id ?? null);
      setCustomOpen(false);
    }

    function add(sec: number) {
      if (endAt == null) return;
      const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000) + sec);
      begin(remaining);
    }

    async function cancel() {
      setEndAt(null);
      setFired(false);
      await cancelNotification(notifId);
      setNotifId(null);
    }

    const remainingSec = endAt ? Math.max(0, Math.ceil((endAt - Date.now()) / 1000)) : 0;
    if (endAt && remainingSec === 0 && !fired) onFinish();

    async function onFinish() {
      setFired(true);
      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      if (sound) {
        try {
          const { sound: snd } = await Audio.Sound.createAsync(sound, { shouldPlay: true, volume: 1.0 });
          snd.setOnPlaybackStatusUpdate((st: any) => { if (st?.didJustFinish) snd.unloadAsync(); });
        } catch {}
      }
    }

    const mm = String(Math.floor(remainingSec / 60)).padStart(2, "0");
    const ss = String(remainingSec % 60).padStart(2, "0");

    return (
      <View style={{ borderTopWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff" }}>
        {endAt ? (
          <LinearGradient colors={["#eef2ff", "#e0f2fe"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontWeight: "900", color: "#111827", fontSize: 16 }}>⏱ 残り {mm}:{ss}</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <SmallBtn label="+30秒" onPress={() => add(30)} />
              <SmallBtn label="停止" onPress={cancel} ghost />
            </View>
          </LinearGradient>
        ) : (
          <View style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
            {customOpen ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontWeight: "800", color: "#111827" }}>カスタム</Text>
                <TextInput
                  value={customSec}
                  onChangeText={setCustomSec}
                  keyboardType="number-pad"
                  placeholder="秒"
                  style={{ width: 80, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 8 }}
                />
                <SmallBtn label="開始" onPress={() => begin(parseCustom())} />
                <SmallBtn label="戻る" onPress={() => setCustomOpen(false)} ghost />
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontWeight: "800", color: "#111827" }}>休憩タイマー</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pill onPress={() => begin(60)}>60秒</Pill>
                  <Pill onPress={() => begin(90)}>90秒</Pill>
                  <Pill onPress={() => begin(120)}>120秒</Pill>
                  <SmallBtn label="…編集" onPress={() => setCustomOpen(true)} ghost />
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    );
  }
);

function Pill({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ borderRadius: 999, overflow: "hidden" }}>
      <LinearGradient colors={["#1976d2", "#42a5f5"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 14, paddingVertical: 8 }}>
        <Text style={{ color: "#fff", fontWeight: "800" }}>{children}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}
function SmallBtn({ label, onPress, ghost }: { label: string; onPress: () => void; ghost?: boolean }) {
  if (ghost) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}
        style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff" }}>
        <Text style={{ fontWeight: "800", color: "#111827" }}>{label}</Text>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}
      style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: "#10b981" }}>
      <Text style={{ fontWeight: "800", color: "#fff" }}>{label}</Text>
    </TouchableOpacity>
  );
}
