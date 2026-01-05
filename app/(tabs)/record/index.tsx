
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  ScrollView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

let AsyncStorage: any = null;
try {
  AsyncStorage =
    require("@react-native-async-storage/async-storage").default;
} catch {}
let Haptics: any = null;
try {
  Haptics = require("expo-haptics");
} catch {}
let LinearGradient: any = null;
try {
  LinearGradient = require("expo-linear-gradient").LinearGradient;
} catch {}

let theme: any = null;
try {
  theme = require("../../../ui/theme");
} catch {}
const colors =
  theme?.colors ?? {
    bg: "#0a0d12",
    card: "#101621",
    text: "#f5f9ff",
    sub: "#bfccdd",
    primary: "#5ac8fa",
    border: "#1f2b3a",
  };

type Fortune = "大吉" | "中吉" | "吉" | "小吉" | "末吉";
type FortuneKey =
  | "daikichi"
  | "chuukichi"
  | "kichi"
  | "shoukichi"
  | "suekichi";

type MuscleId =
  | "chest"
  | "back"
  | "legs"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "core";

type OmikujiSeed = {
  dateKey: string;
  muscleId: MuscleId;
  fortune: Fortune;
  meigenIdx: number;
  kotowazaIdx: number;
  formIdx: number;
  recoveryIdx: number;
  challengeIdx: number;
  luckyItemIdx: number;
  luckySetIdx: number;
  luckyColorIdx: number;
  tempoIdx: number;
};

type OmikujiResult = {
  dateKey: string;
  muscleId: MuscleId;
  muscleName: string;
  fortune: Fortune;
  message: string;
  meigen: string;
  kotowaza: string;
  formTip: string;
  recovery: string;
  challenge: string;
  luckyItem: string;
  luckyColor: string;
  luckySet: string;
  luckyTempo: string;
};

function todayKey() {
  const d = new Date();
  const mm = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
function storageKey() {
  return `omikuji:${todayKey()}`;
}
function msUntilMidnight() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}
function fmtHMS(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

const FORTUNE_STYLE: Record<
  Fortune,
  {
    grad: [string, string, string];
    accent: string;
    border: string;
    confetti: string[];
    intensity: 1 | 2 | 3;
  }
> = {
  大吉: {
    grad: ["#091833", "#0b3a74", "#1b9fff"],
    accent: "#ffea00",
    border: "#2bf0ff",
    confetti: [
      "#ffea00",
      "#2bf0ff",
      "#ff6b6b",
      "#51cf66",
      "#845ef7",
      "#ffd43b",
      "#22b8cf",
      "#f783ac",
    ],
    intensity: 3,
  },
  中吉: {
    grad: ["#0a1428", "#112f5c", "#2383ff"],
    accent: "#40f4a2",
    border: "#40f4a2",
    confetti: [
      "#40f4a2",
      "#4dabf7",
      "#ffd43b",
      "#b197fc",
      "#ffa8a8",
      "#63e6be",
    ],
    intensity: 2,
  },
  吉: {
    grad: ["#0b1222", "#15294b", "#3f66d5"],
    accent: "#64d2ff",
    border: "#64d2ff",
    confetti: [
      "#64d2ff",
      "#51cf66",
      "#ffd43b",
      "#ffa8a8",
      "#b197fc",
    ],
    intensity: 2,
  },
  小吉: {
    grad: ["#101522", "#1a2642", "#334d88"],
    accent: "#94d82d",
    border: "#94d82d",
    confetti: [
      "#94d82d",
      "#ffd43b",
      "#66d9e8",
      "#ffa8a8",
    ],
    intensity: 1,
  },
  末吉: {
    grad: ["#121219", "#1e1f2e", "#343557"],
    accent: "#ff922b",
    border: "#ff922b",
    confetti: [
      "#ff922b",
      "#ffd43b",
      "#b197fc",
    ],
    intensity: 1,
  },
};

const FORTUNE_KEY_MAP: Record<Fortune, FortuneKey> = {
  大吉: "daikichi",
  中吉: "chuukichi",
  吉: "kichi",
  小吉: "shoukichi",
  末吉: "suekichi",
};

const MUSCLES: { id: MuscleId; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "chest",     icon: "barbell-outline" },
  { id: "shoulders", icon: "body-outline" },
  { id: "triceps",   icon: "flash-outline" },
  { id: "back",      icon: "analytics-outline" },
  { id: "biceps",    icon: "hand-left-outline" },
  { id: "legs",      icon: "walk-outline" },
  { id: "core",      icon: "aperture-outline" },
];
const FORTUNES: Fortune[] = ["大吉", "中吉", "吉", "小吉", "末吉"];
const FORTUNE_WEIGHTS = [25, 24, 23, 16, 12];

const LUCKY_COLORS = [
  "#5ac8fa",
  "#64d2ff",
  "#40c057",
  "#ffd43b",
  "#ff922b",
  "#ff6b6b",
  "#845ef7",
  "#22b8cf",
  "#94d82d",
  "#fcc419",
  "#a9e34b",
  "#66d9e8",
  "#4dabf7",
  "#b197fc",
  "#e599f7",
  "#ffa8a8",
  "#f783ac",
  "#63e6be",
  "#ffe066",
  "#ffd8a8",
  "#eebefa",
  "#d0bfff",
  "#c0eb75",
  "#b2f2bb",
  "#00f5d4",
  "#00bbf9",
  "#fee440",
  "#f15bb5",
  "#9b5de5",
];

const LUCKY_ITEMS = { /* 省略: 元コードのまま */ };
const RECOVERY_TIPS = [ /* 省略: 元コードのまま */ ];
const CHALLENGES = [ /* 省略: 元コードのまま */ ];
const LUCKY_SETS: Record<MuscleId, string[]> = { /* 省略: 元コードのまま */ };

const TEMPOS = ["3-1-1", "2-1-2", "4-1-1", "2-0-2", "3-0-1", "5-1-0"];

function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^ (h >>> 16)) >>> 0;
  };
}
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeRng(seedStr: string) {
  const seed = xmur3(seedStr)();
  return mulberry32(seed);
}
function pickWeighted<T>(
  rng: () => number,
  items: T[],
  weights: number[]
) {
  const sum = weights.reduce((a, b) => a + b, 0);
  let r = rng() * sum,
    acc = 0;
  for (let i = 0; i < items.length; i++) {
    acc += weights[i];
    if (r <= acc) return items[i];
  }
  return items[items.length - 1];
}
function pickIdx(rng: () => number, len: number) {
  return Math.floor(rng() * len);
}

function buildOmikujiResultFromSeed(
  seed: OmikujiSeed,
  t: (key: string, options?: any) => any
): OmikujiResult {
  const muscleName = t(
    `record.omikuji.muscles.${seed.muscleId}.name`
  ) as string;
  const focus = t(
    `record.omikuji.muscles.${seed.muscleId}.focus`
  ) as string;

  const fortuneKey = FORTUNE_KEY_MAP[seed.fortune];
  const message = t(
    `record.omikuji.fortuneMessages.${fortuneKey}`,
    { muscleName, focus }
  ) as string;

  const meigenPoolRaw = t(
    `record.omikuji.meigen.${seed.muscleId}`,
    { returnObjects: true }
  ) as unknown;
  const meigenList = Array.isArray(meigenPoolRaw)
    ? (meigenPoolRaw as string[])
    : [String(meigenPoolRaw ?? "")];
  const meigen =
    meigenList.length > 0
      ? meigenList[seed.meigenIdx % meigenList.length]
      : "";

  const kotowazaPoolRaw = t(
    "record.omikuji.kotowaza.generic",
    { muscleName, returnObjects: true }
  ) as unknown;
  const kotowazaList = Array.isArray(kotowazaPoolRaw)
    ? (kotowazaPoolRaw as string[])
    : [String(kotowazaPoolRaw ?? "")];
  const kotowaza =
    kotowazaList.length > 0
      ? kotowazaList[seed.kotowazaIdx % kotowazaList.length]
      : "";

  const formPoolRaw = t(
    `record.omikuji.form.${seed.muscleId}`,
    { returnObjects: true }
  ) as unknown;
  const formList = Array.isArray(formPoolRaw)
    ? (formPoolRaw as string[])
    : [String(formPoolRaw ?? "")];
  const formTip =
    formList.length > 0
      ? formList[seed.formIdx % formList.length]
      : "";

  const recoveryPoolRaw = t(
    "record.omikuji.recoveryTipsPool",
    { returnObjects: true }
  ) as unknown;
  const recoveryList = Array.isArray(recoveryPoolRaw)
    ? (recoveryPoolRaw as string[])
    : [String(recoveryPoolRaw ?? "")];
  const recovery =
    recoveryList.length > 0
      ? recoveryList[seed.recoveryIdx % recoveryList.length]
      : "";

  const challengePoolRaw = t(
    "record.omikuji.challengePool",
    { returnObjects: true }
  ) as unknown;
  const challengeList = Array.isArray(challengePoolRaw)
    ? (challengePoolRaw as string[])
    : [String(challengePoolRaw ?? "")];
  const challenge =
    challengeList.length > 0
      ? challengeList[seed.challengeIdx % challengeList.length]
      : "";

  const luckyItemsPoolRaw = t(
    `record.omikuji.luckyItemsPool.${seed.muscleId}`,
    { returnObjects: true }
  ) as unknown;
  const luckyItemsList = Array.isArray(luckyItemsPoolRaw)
    ? (luckyItemsPoolRaw as string[])
    : [String(luckyItemsPoolRaw ?? "")];
  const luckyItem =
    luckyItemsList.length > 0
      ? luckyItemsList[seed.luckyItemIdx % luckyItemsList.length]
      : "";

  const luckySetsPoolRaw = t(
    `record.omikuji.luckySetsPool.${seed.muscleId}`,
    { returnObjects: true }
  ) as unknown;
  const luckySetsList = Array.isArray(luckySetsPoolRaw)
    ? (luckySetsPoolRaw as string[])
    : [String(luckySetsPoolRaw ?? "")];
  const luckySet =
    luckySetsList.length > 0
      ? luckySetsList[seed.luckySetIdx % luckySetsList.length]
      : "";

  const luckyColor =
    LUCKY_COLORS[seed.luckyColorIdx % LUCKY_COLORS.length];
  const luckyTempo = TEMPOS[seed.tempoIdx % TEMPOS.length];

  return {
    dateKey: seed.dateKey,
    muscleId: seed.muscleId,
    muscleName,
    fortune: seed.fortune,
    message,
    meigen,
    kotowaza,
    formTip,
    recovery,
    challenge,
    luckyItem,
    luckyColor,
    luckySet,
    luckyTempo,
  };
}

const { width: W, height: H } = Dimensions.get("window");

function ConfettiOverlay({
  show,
  palette,
  power = 1,
  onEnd,
}: {
  show: boolean;
  palette: string[];
  power?: number;
  onEnd: () => void;
}) {
  const safePower =
    typeof power === "number" && isFinite(power) && power > 0 ? power : 1;
  const pieces = Math.floor(44 * safePower);

  const anims = useRef(
    [...Array(pieces)].map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (!show) return;
    if (anims.length === 0) return;

    Animated.stagger(
      12,
      anims.map((v) =>
        Animated.timing(v, {
          toValue: 1,
          duration: 1000 + Math.random() * 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      )
    ).start(() => {
      onEnd?.();
      anims.forEach((v) => v.setValue(0));
    });
  }, [show]);

  if (!show || anims.length === 0) return null;

  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", left: 0, top: 0, width: W, height: H }}
    >
      {anims.map((v, i) => {
        const startX = Math.random() * W;
        const endX = startX + (Math.random() * 160 - 80);
        const size = 6 + Math.random() * 10;
        const bg = palette[i % palette.length];
        const translateY = v.interpolate({
          inputRange: [0, 1],
          outputRange: [-40, H * 0.7 + Math.random() * H * 0.2],
        });
        const translateX = v.interpolate({
          inputRange: [0, 1],
          outputRange: [startX, endX],
        });
        const opacity = v.interpolate({
          inputRange: [0, 0.1, 1],
          outputRange: [0, 1, 0.95],
        });
        const rotateZ = `${Math.random() * 720 - 360}deg`;
        return (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              width: size,
              height: size * 0.55,
              backgroundColor: bg,
              borderRadius: Math.random() > 0.5 ? 2 : size / 2,
              transform: [{ translateX }, { translateY }, { rotate: rotateZ }],
              opacity,
              shadowColor: bg,
              shadowOpacity: 0.9,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 0 },
              elevation: 3,
            }}
          />
        );
      })}
    </View>
  );
}

function ShimmerOverlay({ active }: { active: boolean }) {
  const x = useRef(new Animated.Value(-W)).current;
  useEffect(() => {
    if (!active || !LinearGradient) return;
    x.setValue(-W);
    Animated.timing(x, {
      toValue: W * 1.2,
      duration: 1500,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [active]);

  if (!active || !LinearGradient) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        height: "100%",
        width: "100%",
        transform: [{ translateX: x }],
      }}
    >
      <LinearGradient
        colors={[
          "rgba(255,255,255,0)",
          "rgba(255,255,255,0.22)",
          "rgba(255,255,255,0)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          width: W * 0.45,
          height: "100%",
          transform: [{ skewY: "-10deg" }],
        }}
      />
    </Animated.View>
  );
}

function useShake(active: boolean) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    Animated.sequence([
      Animated.timing(t, {
        toValue: 1,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(t, {
        toValue: -1,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(t, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [active]);
  const translateX = t.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-2, 0, 2],
  });
  const rotate = t.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-0.6deg", "0deg", "0.6deg"],
  });
  return { transform: [{ translateX }, { rotate }] };
}

function GlitchText({ text, active }: { text: string; active: boolean }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    const loop = () => {
      Animated.sequence([
        Animated.timing(a, {
          toValue: 1,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.timing(a, {
          toValue: 0,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.delay(600),
      ]).start(loop);
    };
    loop();
  }, [active]);
  const dx1 = a.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1.5],
  });
  const dx2 = a.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1.5],
  });
  return (
    <View>
      <Text style={omikujiStyles.sectionText}>{text}</Text>
      <Animated.Text
        style={[
          omikujiStyles.sectionText,
          {
            position: "absolute",
            left: 0,
            top: 0,
            color: "#ff3b3b",
            opacity: 0.25,
            transform: [{ translateX: dx1 }],
          },
        ]}
      >
        {text}
      </Animated.Text>
      <Animated.Text
        style={[
          omikujiStyles.sectionText,
          {
            position: "absolute",
            left: 0,
            top: 0,
            color: "#00e1ff",
            opacity: 0.25,
            transform: [{ translateX: dx2 }],
          },
        ]}
      >
        {text}
      </Animated.Text>
    </View>
  );
}

function MuscleOmikujiCard() {
  const { t } = useTranslation();
  const [seed, setSeed] = useState<OmikujiSeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [remaining, setRemaining] = useState(msUntilMidnight());
  const [confetti, setConfetti] = useState<{
    show: boolean;
    palette: string[];
    power: number;
  }>({ show: false, palette: [], power: 1 });

  useEffect(() => {
    (async () => {
      try {
        if (AsyncStorage) {
          const raw = await AsyncStorage.getItem(storageKey());
          if (raw) {
            const parsed = JSON.parse(raw);
            if (
              parsed &&
              typeof parsed.dateKey === "string" &&
              typeof parsed.muscleId === "string" &&
              typeof parsed.fortune === "string" &&
              typeof parsed.meigenIdx === "number"
            ) {
              setSeed(parsed as OmikujiSeed);
            } else {
              await AsyncStorage.removeItem(storageKey());
            }
          }
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      const left = msUntilMidnight();
      setRemaining(left);
      if (left <= 0) {
        setSeed(null);
        setExpanded(true);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const result = seed ? buildOmikujiResultFromSeed(seed, t) : null;

  const fortune: Fortune = result?.fortune ?? "吉";
  const st = FORTUNE_STYLE[fortune];
  const shakeStyle = useShake(fortune === "大吉");

  const fortuneLabel = t(
    `record.omikuji.fortuneLabels.${FORTUNE_KEY_MAP[fortune]}`
  );

  const draw = async () => {
    if (seed) return;

    try {
      Haptics?.notificationAsync?.(
        Haptics.NotificationFeedbackType.Success
      );
    } catch {}

    const date = todayKey();
    const rng = makeRng(`${date}::fitcoach::omikuji::once`);

    const muscle = MUSCLES[pickIdx(rng, MUSCLES.length)];
    const muscleId = muscle.id as MuscleId;
    const fortuneDrawn = pickWeighted(rng, FORTUNES, FORTUNE_WEIGHTS);

    const newSeed: OmikujiSeed = {
      dateKey: date,
      muscleId,
      fortune: fortuneDrawn,
      meigenIdx: pickIdx(rng, 9999),
      kotowazaIdx: pickIdx(rng, 9999),
      formIdx: pickIdx(rng, 9999),
      recoveryIdx: pickIdx(rng, 9999),
      challengeIdx: pickIdx(rng, 9999),
      luckyItemIdx: pickIdx(rng, 9999),
      luckySetIdx: pickIdx(rng, 9999),
      luckyColorIdx: pickIdx(rng, LUCKY_COLORS.length),
      tempoIdx: pickIdx(rng, TEMPOS.length),
    };

    setSeed(newSeed);
    try {
      if (AsyncStorage) {
        await AsyncStorage.setItem(storageKey(), JSON.stringify(newSeed));
      }
    } catch {}

    const styleForFortune = FORTUNE_STYLE[fortuneDrawn];
    setConfetti({
      show: true,
      palette: styleForFortune.confetti,
      power: styleForFortune.intensity,
    });
    if (styleForFortune.intensity === 3) {
      setTimeout(
        () =>
          setConfetti({
            show: true,
            palette: styleForFortune.confetti,
            power: 3,
          }),
        350
      );
    }
  };

  const CardShell = ({ children }: { children: React.ReactNode }) => {
    const inner = (
      <View
        style={[omikujiStyles.cardInner, { borderColor: st.border }]}
      >
        <View style={omikujiStyles.glass} />
        {children}
        <ShimmerOverlay active={fortune === "大吉"} />
      </View>
    );
    if (LinearGradient) {
      return (
        <Animated.View style={shakeStyle}>
          <LinearGradient
            colors={st.grad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[omikujiStyles.card, { shadowColor: st.accent }]}
          >
            {inner}
          </LinearGradient>
        </Animated.View>
      );
    }
    return (
      <Animated.View
        style={[
          omikujiStyles.card,
          { backgroundColor: st.grad[0], shadowColor: st.accent },
          shakeStyle,
        ]}
      >
        {inner}
      </Animated.View>
    );
  };

  return (
    <View>
      <CardShell>
        <View style={omikujiStyles.cardHeader}>
          <View style={{ flex: 1 }}>
            {result && (
              <View
                style={[
                  omikujiStyles.timerBadgeTop,
                  { backgroundColor: "#ffd43b" },
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={"#0b0f17"}
                />
                <Text style={omikujiStyles.timerText}>
                  {t("record.omikuji.reset_in", {
                    time: fmtHMS(remaining),
                  })}
                </Text>
              </View>
            )}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginTop: 6,
              }}
            >
              <Ionicons
                name="sparkles-outline"
                size={20}
                color={st.accent}
              />
              <Text style={omikujiStyles.title}>
                {t("record.omikuji.title")}
              </Text>
            </View>
          </View>

          {result && (
            <TouchableOpacity
              onPress={() => setExpanded((v) => !v)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[
                omikujiStyles.chevronBtn,
                { backgroundColor: st.accent, borderColor: st.border },
              ]}
              activeOpacity={0.9}
            >
              <Ionicons
                name={expanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={"#0b0f17"}
              />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <Text style={[omikujiStyles.sub, { marginTop: 8 }]}>
            {t("record.omikuji.loading")}
          </Text>
        ) : result ? (
          <View style={{ gap: 12 }}>
            <View style={omikujiStyles.row}>
              <Badge
                icon="barbell-outline"
                label={result.muscleName}
                accent={st.accent}
              />
              <Badge
                icon="planet-outline"
                label={fortuneLabel}
                accent={st.accent}
              />
              <Badge
                icon="calendar-outline"
                label={result.dateKey}
                accent={st.accent}
              />
            </View>

            <Text style={omikujiStyles.message}>{result.message}</Text>

            {expanded && (
              <>
                <Section title={t("record.omikuji.section_meigen")}>
                  <GlitchText
                    text={`「${result.meigen}」`}
                    active={fortune !== "末吉"}
                  />
                </Section>
                <Section
                  title={t("record.omikuji.section_kotowaza")}
                  text={`「${result.kotowaza}」`}
                />
                <Section
                  title={t("record.omikuji.section_form")}
                  text={result.formTip}
                />
                <Section
                  title={t("record.omikuji.section_recovery")}
                  text={result.recovery}
                />
                <Section
                  title={t("record.omikuji.section_challenge")}
                  text={result.challenge}
                />

                <View
                  style={[omikujiStyles.section, { marginTop: 4 }]}
                >
                  <Text style={omikujiStyles.sectionLabel}>
                    {t("record.omikuji.section_lucky_guide")}
                  </Text>
                  <View style={{ gap: 10 }}>
                    <Row
                      label={t("record.omikuji.label_lucky_item")}
                      value={result.luckyItem}
                      icon="gift-outline"
                      accent={st.accent}
                    />
                    <Row
                      label={t("record.omikuji.label_lucky_color")}
                      value={result.luckyColor}
                      icon="color-palette-outline"
                      colorDot={result.luckyColor}
                      accent={st.accent}
                    />
                    <Row
                      label={t("record.omikuji.label_lucky_set")}
                      value={result.luckySet}
                      icon="barbell-outline"
                      accent={st.accent}
                    />
                    <Row
                      label={t("record.omikuji.label_lucky_tempo")}
                      value={result.luckyTempo}
                      icon="timer-outline"
                      accent={st.accent}
                    />
                  </View>
                </View>
              </>
            )}

            <Text style={omikujiStyles.note}>
              {t("record.omikuji.note")}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            <Text style={omikujiStyles.sub}>
              {t("record.omikuji.empty_lead")}
            </Text>
            <TouchableOpacity
              style={[
                omikujiStyles.button,
                { backgroundColor: st.accent },
              ]}
              onPress={draw}
              activeOpacity={0.95}
            >
              <Ionicons
                name="hand-left-outline"
                size={16}
                color={"#0b0f17"}
              />
              <Text
                style={[
                  omikujiStyles.buttonText,
                  { color: "#0b0f17" },
                ]}
              >
                {t("record.omikuji.draw_button")}
              </Text>
            </TouchableOpacity>
            <Text style={omikujiStyles.hint}>
              {t("record.omikuji.draw_hint")}
            </Text>
          </View>
        )}
      </CardShell>

      <ConfettiOverlay
        show={confetti.show}
        palette={
          confetti.palette.length > 0 ? confetti.palette : st.confetti
        }
        power={confetti.power}
        onEnd={() => setConfetti((c) => ({ ...c, show: false }))}
      />
    </View>
  );
}

function Section({
  title,
  text,
  children,
}: {
  title: string;
  text?: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={omikujiStyles.section}>
      <Text style={omikujiStyles.sectionLabel}>{title}</Text>
      {text ? (
        <Text style={omikujiStyles.sectionText}>{text}</Text>
      ) : (
        children
      )}
    </View>
  );
}

function Row({
  label,
  value,
  icon,
  colorDot,
  accent,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  colorDot?: string;
  accent: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <Ionicons name={icon} size={16} color={accent} />
      <Text
        style={[omikujiStyles.sectionLabel, { width: 120 }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {colorDot ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: colorDot,
              borderWidth: 2,
              borderColor: "rgba(255,255,255,0.9)",
            }}
          />
          <Text style={omikujiStyles.sectionText}>{value}</Text>
        </View>
      ) : (
        <Text style={omikujiStyles.sectionText}>{value}</Text>
      )}
    </View>
  );
}

function Badge({
  icon,
  label,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  accent: string;
}) {
  return (
    <View
      style={[
        omikujiStyles.badge,
        { borderColor: accent, backgroundColor: "rgba(255,255,255,0.06)" },
      ]}
    >
      <Ionicons name={icon} size={14} color={accent} />
      <Text
        style={[omikujiStyles.badgeText, { color: accent }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export default function RecordHub() {
  const r = useRouter();
  const { t } = useTranslation();

  const [active, setActive] = useState<
    "training" | "meals" | "body"
  >("training");

  const Chip = ({
    id,
    label,
    icon,
  }: {
    id: "training" | "meals" | "body";
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }) => {
    const sel = active === id;
    return (
      <TouchableOpacity
        onPress={() => {
          setActive(id);
          r.replace(`/(tabs)/${id}`);
        }}
        style={[
          styles.chip,
          sel && {
            backgroundColor: "rgba(90,200,250,0.15)",
            borderColor: "rgba(90,200,250,0.85)",
          },
        ]}
        activeOpacity={0.9}
      >
        <Ionicons
          name={icon}
          size={16}
          color={sel ? colors.primary : colors.text}
        />
        <Text
          style={[
            styles.chipText,
            sel && { color: colors.primary },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.wrap}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        bounces
        showsVerticalScrollIndicator={false}
      >
        <View style={{ padding: 16 }}>
          <View style={styles.row}>
            <Chip
              id="training"
              label={t("tabs.training")}
              icon="fitness-outline"
            />
            <Chip
              id="meals"
              label={t("tabs.meals")}
              icon="restaurant-outline"
            />
            <Chip
              id="body"
              label={t("tabs.body")}
              icon="barbell-outline"
            />
          </View>
          <Text style={{ color: colors.sub, marginTop: 12 }}>
            {t("record.switch_hint")}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          <View style={{ marginTop: 12 }}>
            <TouchableOpacity
              onPress={() => r.push("/bbs")}
              activeOpacity={0.9}
              accessibilityRole="imagebutton"
              accessibilityLabel={t("record.bbs_open_label")}
            >
              <View style={styles.bbsBannerFrame}>
                <Image
                  source={require("../../../image/筋肉掲示板.png")}
                  style={{
                    width: "100%",
                    height: undefined,
                    aspectRatio: 973 / 550,
                    borderRadius: 16,
                  }}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ height: 12 }} />
          <MuscleOmikujiCard />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: "row", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { color: colors.text, fontWeight: "800" },
  bbsBannerFrame: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.card,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
});

const omikujiStyles = StyleSheet.create({
  card: {
    borderWidth: 0,
    padding: 10,
    borderRadius: 18,
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  cardInner: {
    borderWidth: 2,
    borderRadius: 18,
    padding: 16,
    gap: 12,
    overflow: "hidden",
  },
  glass: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,10,18,0.38)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 18,
    letterSpacing: 0.3,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sub: { color: "rgba(255,255,255,0.82)", fontSize: 13 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  badgeText: { fontSize: 13, fontWeight: "900" },
  message: {
    color: "#f7fbff",
    fontSize: 15,
    lineHeight: 22,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  section: { gap: 6, marginTop: 6 },
  sectionLabel: {
    color: "#deebff",
    fontSize: 12.5,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  sectionText: {
    color: "#ffffff",
    opacity: 0.96,
    fontSize: 14.5,
    lineHeight: 21,
    flexShrink: 1,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  note: { color: "rgba(255,255,255,0.8)", fontSize: 11 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 11,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  buttonText: { fontWeight: "900", letterSpacing: 0.5 },
  hint: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    textAlign: "center",
  },
  timerBadgeTop: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  timerText: {
    color: "#0b0f17",
    fontWeight: "900",
    fontSize: 12.5,
  },
  chevronBtn: {
    width: 36,
    height: 36,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});
