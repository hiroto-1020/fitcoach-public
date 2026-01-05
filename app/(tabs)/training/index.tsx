
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Animated,
  LayoutChangeEvent,
  useColorScheme,
} from "react-native";
import {
  Calendar,
  DateObject,
  LocaleConfig,
} from "react-native-calendars";
import dayjs from "dayjs";
import {
  Stack,
  useRouter,
  useFocusEffect,
} from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";

type Pal = {
  bg: string;
  card: string;
  text: string;
  subtext: string;
  border: string;
  primary: string;
  primaryText: string;
};
let themeMod: any = null;
try {
  themeMod = require("../../../ui/theme");
} catch {
  themeMod = null;
}

function usePalette(): Pal {
  if (themeMod?.useThemeColors) return themeMod.useThemeColors();
  if (themeMod?.useColors) return themeMod.useColors();
  const scheme = useColorScheme();
  const light: Pal = {
    bg: "#f8fafc",
    card: "#ffffff",
    text: "#0f172a",
    subtext: "#6b7280",
    border: "#e5e7eb",
    primary: "#2563EB",
    primaryText: "#ffffff",
  };
  const dark: Pal = {
    bg: "#0b1220",
    card: "#0f172a",
    text: "#e5e7eb",
    subtext: "#94a3b8",
    border: "#1f2937",
    primary: "#60a5fa",
    primaryText: "#0b1220",
  };
  return scheme === "dark" ? dark : light;
}

LocaleConfig.locales["ja"] = {
  monthNames: [
    "1月",
    "2月",
    "3月",
    "4月",
    "5月",
    "6月",
    "7月",
    "8月",
    "9月",
    "10月",
    "11月",
    "12月",
  ],
  monthNamesShort: [
    "1月",
    "2月",
    "3月",
    "4月",
    "5月",
    "6月",
    "7月",
    "8月",
    "9月",
    "10月",
    "11月",
    "12月",
  ],
  dayNames: [
    "日曜日",
    "月曜日",
    "火曜日",
    "水曜日",
    "木曜日",
    "金曜日",
    "土曜日",
  ],
  dayNamesShort: ["日", "月", "火", "水", "木", "金", "土"],
  today: "今日",
};

LocaleConfig.locales["en"] = {
  monthNames: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  monthNamesShort: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
  dayNames: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
  dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  today: "Today",
};

LocaleConfig.locales["ko"] = {
  monthNames: [
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
  ],
  monthNamesShort: [
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
  ],
  dayNames: [
    "일요일",
    "월요일",
    "화요일",
    "수요일",
    "목요일",
    "금요일",
    "토요일",
  ],
  dayNamesShort: ["일", "월", "화", "수", "목", "금", "토"],
  today: "오늘",
};


type Row = {
  id: number;
  session_id: number;
  exercise_id: number;
  set_index: number;
  weight_kg: number;
  reps: number;
  is_warmup: 0 | 1;
  exercise_name: string;
  unit?: string;
};
type ExGroup = {
  exerciseId: number;
  name: string;
  unit: string;
  workSets: { weight_kg: number; reps: number }[];
  warmupCount: number;
};
type BodyPart = { id: number; name: string; sort_order?: number };

import {
  initTrainingDb,
  listBodyParts,
  listSessionDatesInMonth,
  listSessionDatesInMonthByBodyPart,
  findSessionIdByDate,
  listSetsBySession,
  getSessionNote,
  getMaxWeightRecord,
  getMaxRepsRecord,
  listAllSessionDates,
} from "../../../lib/training/db";

export default function TrainingHome() {
  const C = usePalette();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const today = dayjs().format("YYYY-MM-DD");

  useEffect(() => {
    const lang = i18n.language || "ja";
    if (lang.startsWith("ja")) {
      LocaleConfig.defaultLocale = "ja";
    } else if (lang.startsWith("ko")) {
      LocaleConfig.defaultLocale = "ko";
    } else {
      LocaleConfig.defaultLocale = "en";
    }
  }, [i18n.language]);

  const [ready, setReady] = useState(false);
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [monthMarks, setMonthMarks] = useState<Record<string, any>>({});
  const [selectedDate, setSelectedDate] = useState<string>(today);

  const [parts, setParts] = useState<BodyPart[]>([]);
  const [selectedPartId, setSelectedPartId] = useState<number | null>(null);

  const [loadingDay, setLoadingDay] = useState(false);
  const [dayRows, setDayRows] = useState<Row[]>([]);
  const [dayNote, setDayNote] = useState("");

  const [prWeight, setPrWeight] =
    useState<{
      weight_kg: number;
      reps: number;
      exercise_name: string;
      date: string;
    } | null>(null);
  const [prReps, setPrReps] =
    useState<{
      reps: number;
      weight_kg: number;
      exercise_name: string;
      date: string;
    } | null>(null);
  const [streak, setStreak] = useState<{
    current: number;
    longest: number;
    longestStart?: string;
    longestEnd?: string;
  }>({ current: 0, longest: 0 });
  const [totalDays, setTotalDays] = useState(0);

  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulse]);

  useEffect(() => {
    (async () => {
      await initTrainingDb();
      setReady(true);
    })();
  }, []);

  const loadParts = useCallback(async () => {
    setParts(await listBodyParts());
  }, []);
  useEffect(() => {
    if (ready) loadParts();
  }, [ready, loadParts]);
  useFocusEffect(
    useCallback(() => {
      loadParts();
    }, [loadParts])
  );

  useEffect(() => {
    if (selectedPartId && !parts.find((p) => p.id === selectedPartId))
      setSelectedPartId(null);
  }, [parts, selectedPartId]);

  const loadMonthMarks = useCallback(async () => {
    let rows: { date: string }[] = selectedPartId
      ? await listSessionDatesInMonthByBodyPart(month, selectedPartId)
      : await listSessionDatesInMonth(month);

    const m: Record<string, any> = {};
    rows.forEach((r) => {
      m[r.date] = {
        marked: true,
        dotColor: selectedPartId ? "#F39C12" : C.primary,
      };
    });
    setMonthMarks(m);
  }, [month, selectedPartId, C.primary]);
  useEffect(() => {
    if (ready) loadMonthMarks();
  }, [ready, month, selectedPartId, loadMonthMarks]);
  useFocusEffect(
    useCallback(() => {
      loadMonthMarks();
    }, [loadMonthMarks])
  );

  const loadDay = useCallback(async (dateStr: string) => {
    setLoadingDay(true);
    const sid = await findSessionIdByDate(dateStr);
    if (!sid) {
      setDayRows([]);
      setDayNote("");
      setLoadingDay(false);
      return;
    }
    const [rows, note] = await Promise.all([
      listSetsBySession(sid),
      getSessionNote(sid),
    ]);
    setDayRows(rows as Row[]);
    setDayNote(note);
    setLoadingDay(false);
  }, []);
  useEffect(() => {
    if (ready) loadDay(selectedDate);
  }, [ready, selectedDate, loadDay]);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const [w, r, dates] = await Promise.all([
        getMaxWeightRecord(),
        getMaxRepsRecord(),
        listAllSessionDates(),
      ]);
      setPrWeight(w);
      setPrReps(r);
      setTotalDays(dates.length);

      let longest = 0,
        current = 0;
      let longestStart: string | undefined,
        longestEnd: string | undefined;
      if (dates.length > 0) {
        let run = 1,
          runStart = dates[0];
        for (let i = 1; i < dates.length; i++) {
          const prev = dayjs(dates[i - 1]);
          const cur = dayjs(dates[i]);
          if (cur.diff(prev, "day") === 1) {
            run++;
          } else if (cur.diff(prev, "day") > 1) {
            if (run > longest) {
              longest = run;
              longestStart = runStart;
              longestEnd = dates[i - 1];
            }
            run = 1;
            runStart = dates[i];
          }
        }
        if (run > longest) {
          longest = run;
          longestStart = runStart;
          longestEnd = dates[dates.length - 1];
        }

        const last = dates[dates.length - 1];
        if (last === today) {
          let c = 1;
          for (let i = dates.length - 1; i > 0; i--) {
            const cur = dayjs(dates[i]);
            const prev = dayjs(dates[i - 1]);
            if (cur.diff(prev, "day") === 1) c++;
            else break;
          }
          current = c;
        }
      }
      setStreak({ current, longest, longestStart, longestEnd });
    })();
  }, [ready, today]);

  const markedDates = useMemo(() => {
    const m = { ...monthMarks };
    m[selectedDate] = {
      ...(m[selectedDate] || {}),
      selected: true,
      selectedColor: C.primary,
      selectedTextColor: C.primaryText,
    };
    return m;
  }, [monthMarks, selectedDate, C.primary, C.primaryText]);

  const fmt = (n: number) =>
    Number.isInteger(n) ? String(n) : String(Number(n.toFixed(1)));

  const selectedDateLabel = dayjs(selectedDate).format("YYYY/MM/DD");

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Stack.Screen
        options={{
          headerTitle: t("tabs.training"),
          headerRight: () => (
            <TouchableOpacity
              onPress={() =>
                router.push("/(tabs)/help?section=training")
              }
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                marginRight: 6,
              }}
              accessibilityRole="button"
              accessibilityLabel={t(
                "training.help_accessibility"
              )}
            >
              <Text
                style={{ color: C.text, fontWeight: "700" }}
              >
                {t("training.help_button")}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <FilterBar
          parts={parts}
          selectedId={selectedPartId}
          onChange={(id) => setSelectedPartId(id)}
          onManage={() => router.push("/training/manage")}
        />

        <Calendar
          onDayPress={(d: DateObject) =>
            setSelectedDate(d.dateString)
          }
          onMonthChange={(d) =>
            setMonth(
              `${d.year}-${String(d.month).padStart(2, "0")}`
            )
          }
          markedDates={markedDates}
          enableSwipeMonths
          theme={{
            calendarBackground: C.card,
            textSectionTitleColor: C.subtext,
            dayTextColor: C.text,
            monthTextColor: C.text,
            textMonthFontWeight: "bold",
            arrowColor: C.primary,
            todayTextColor: C.primary,
            selectedDayBackgroundColor: C.primary,
            selectedDayTextColor: C.primaryText,
            textDisabledColor: C.subtext,
          }}
          firstDay={0}
          style={{
            marginHorizontal: 8,
            marginBottom: 4,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: C.border,
          }}
        />

        <View
          style={{
            paddingHorizontal: 12,
            paddingTop: 8,
            paddingBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 6,
              color: C.text,
            }}
          >
            {t("training.day_title", {
              date: selectedDateLabel,
            })}
          </Text>

          {selectedPartId ? (
            <Text
              style={{
                marginBottom: 6,
                color: "#F39C12",
              }}
            >
              {t("training.filter_note", {
                partName:
                  parts.find(
                    (p) => p.id === selectedPartId
                  )?.name ?? "",
              })}
            </Text>
          ) : null}

          {loadingDay ? (
            <View
              style={{
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              <ActivityIndicator />
              <Text
                style={{ marginTop: 6, color: C.subtext }}
              >
                {t("training.loading")}
              </Text>
            </View>
          ) : (
            <>
              {dayRows.length === 0 && !dayNote ? (
                <Text
                  style={{
                    color: C.subtext,
                    marginBottom: 12,
                  }}
                >
                  {t("training.day_empty")}
                </Text>
              ) : (
                <>
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    {[
                      {
                        label: t(
                          "training.summary.exercises"
                        ),
                        v: new Set(
                          dayRows
                            .filter((r) => !r.is_warmup)
                            .map((r) => r.exercise_id)
                        ).size,
                      },
                      {
                        label: t(
                          "training.summary.sets"
                        ),
                        v: dayRows.filter(
                          (r) => !r.is_warmup
                        ).length,
                      },
                      {
                        label: t(
                          "training.summary.reps"
                        ),
                        v: dayRows
                          .filter((r) => !r.is_warmup)
                          .reduce(
                            (a, b) =>
                              a + (b.reps || 0),
                            0
                          ),
                      },
                      {
                        label: t(
                          "training.summary.tonnage"
                        ),
                        v: `${(
                          dayRows
                            .filter((r) => !r.is_warmup)
                            .reduce(
                              (a, b) =>
                                a +
                                (b.weight_kg || 0) *
                                  (b.reps || 0),
                              0
                            ) / 1000
                        ).toFixed(2)} t`,
                      },
                    ].map((p) => (
                      <View
                        key={p.label}
                        style={{
                          padding: 8,
                          borderWidth: 1,
                          borderColor: C.border,
                          borderRadius: 12,
                          backgroundColor: C.card,
                        }}
                      >
                        <Text
                          style={{
                            textAlign: "center",
                            fontWeight: "bold",
                            color: C.text,
                          }}
                        >
                          {p.v}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: C.subtext,
                          }}
                        >
                          {p.label}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <DayExercises rows={dayRows} />

                  {dayNote ? (
                    <View
                      style={{
                        padding: 12,
                        borderWidth: 1,
                        borderColor: C.border,
                        borderRadius: 12,
                        backgroundColor: C.card,
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "600",
                          marginBottom: 4,
                          color: C.text,
                        }}
                      >
                        {t("training.note_label")}
                      </Text>
                      <Text style={{ color: C.text }}>
                        {dayNote}
                      </Text>
                    </View>
                  ) : null}
                </>
              )}
            </>
          )}
        </View>

        <View
          style={{
            paddingHorizontal: 12,
            paddingBottom: 8,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 8,
              color: C.text,
            }}
          >
            {t("training.pr.title")}
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <PRCardDeluxe
              colors={["#FFE259", "#FFA751"]}
              icon="trophy"
              badge={t("training.pr.max_weight_badge")}
              bigLine={
                prWeight
                  ? t("training.pr.max_weight_big", {
                      weight: fmt(prWeight.weight_kg),
                      reps: fmt(prWeight.reps),
                    })
                  : t("training.pr.no_record")
              }
              subLine={
                prWeight
                  ? t("training.pr.entry_line", {
                      name: prWeight.exercise_name,
                      date: dayjs(prWeight.date).format(
                        "YYYY/MM/DD"
                      ),
                    })
                  : ""
              }
            />
            <PRCardDeluxe
              colors={["#7F00FF", "#E100FF"]}
              icon="podium"
              badge={t("training.pr.max_reps_badge")}
              bigLine={
                prReps
                  ? t("training.pr.max_reps_big", {
                      reps: fmt(prReps.reps),
                      weight: fmt(prReps.weight_kg),
                    })
                  : t("training.pr.no_record")
              }
              subLine={
                prReps
                  ? t("training.pr.entry_line", {
                      name: prReps.exercise_name,
                      date: dayjs(prReps.date).format(
                        "YYYY/MM/DD"
                      ),
                    })
                  : ""
              }
            />
            <PRCardDeluxe
              colors={["#00C853", "#00E676"]}
              icon="flame"
              badge={t("training.pr.streak_badge")}
              bigLine={t(
                "training.pr.current_streak_big",
                {
                  days: streak.current,
                }
              )}
              subLine={
                streak.longest > 0 &&
                streak.longestStart &&
                streak.longestEnd
                  ? t("training.pr.longest_streak", {
                      days: streak.longest,
                      start: dayjs(
                        streak.longestStart
                      ).format("YYYY/MM/DD"),
                      end: dayjs(
                        streak.longestEnd
                      ).format("YYYY/MM/DD"),
                    })
                  : t("training.pr.no_longest_data")
              }
            />
            <PRCardDeluxe
              colors={["#00B0FF", "#00E5FF"]}
              icon="ribbon"
              badge={t("training.pr.total_days_badge")}
              bigLine={t("training.pr.total_days_big", {
                days: totalDays,
              })}
              subLine={t("training.pr.total_days_sub")}
              fullWidth
            />
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/(tabs)/training/[date]",
            params: { date: selectedDate },
          })
        }
        activeOpacity={0.85}
        style={{
          position: "absolute",
          right: 16,
          bottom: 24,
          borderRadius: 28,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <LinearGradient
          colors={[C.primary, "#42a5f5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Ionicons
            name="create-outline"
            size={18}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text
            style={{
              color: "#fff",
              fontWeight: "700",
            }}
          >
            {t("training.fab_label")}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function DayExercises({ rows }: { rows: Row[] }) {
  const C = usePalette();
  const { t } = useTranslation();

  const groups = useMemo<ExGroup[]>(() => {
    const map = new Map<number, ExGroup>();
    rows.forEach((r) => {
      const unit = r.unit ?? "kg";
      if (!map.has(r.exercise_id))
        map.set(r.exercise_id, {
          exerciseId: r.exercise_id,
          name: r.exercise_name,
          unit,
          workSets: [],
          warmupCount: 0,
        });
      const g = map.get(r.exercise_id)!;
      if (r.is_warmup) g.warmupCount += 1;
      else
        g.workSets.push({
          weight_kg: r.weight_kg,
          reps: r.reps,
        });
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "ja")
    );
  }, [rows]);

  const fmt = (n: number) =>
    Number.isInteger(n) ? String(n) : String(Number(n.toFixed(1)));

  return (
    <View style={{ marginBottom: 12 }}>
      {groups.map((g) => (
        <View
          key={g.exerciseId}
          style={{
            paddingVertical: 6,
            borderBottomWidth: 1,
            borderBottomColor: C.border,
          }}
        >
          <Text
            style={{
              fontWeight: "600",
              marginBottom: 2,
              color: C.text,
            }}
          >
            {g.name}
          </Text>
          <Text style={{ color: C.text }}>
            {g.workSets.length
              ? g.workSets
                  .map(
                    (s) =>
                      `${fmt(s.weight_kg)} ${g.unit} × ${fmt(
                        s.reps
                      )} ${
                        t("training.set_unit_reps")
                      }`
                  )
                  .join(" / ")
              : t("training.no_work_sets")}
          </Text>
          {g.warmupCount > 0 && (
            <Text
              style={{
                color: C.subtext,
                fontSize: 12,
                marginTop: 2,
              }}
            >
              {t("training.warmup_count", {
                count: g.warmupCount,
              })}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

function FilterBar({
  parts,
  selectedId,
  onChange,
  onManage,
}: {
  parts: BodyPart[];
  selectedId: number | null;
  onChange: (id: number | null) => void;
  onManage: () => void;
}) {
  const C = usePalette();
  const { t } = useTranslation();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: 4,
        gap: 8,
      }}
    >
      <Chip
        label={t("training.filter_all")}
        active={selectedId === null}
        onPress={() => onChange(null)}
      />
      {parts.map((p) => (
        <Chip
          key={p.id}
          label={p.name}
          active={selectedId === p.id}
          onPress={() => onChange(p.id)}
        />
      ))}
      <TouchableOpacity onPress={onManage} activeOpacity={0.85}>
        <LinearGradient
          colors={["#FFB74D", "#FF8A65"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: C.border,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontWeight: "800",
            }}
          >
            {t("training.filter_manage")}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  const C = usePalette();
  const inactive = [C.card, C.card];
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <LinearGradient
        colors={active ? ["#FFB74D", "#FF8A65"] : inactive}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: active ? 0 : 1,
          borderColor: C.border,
          minWidth: 56,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: active ? "#fff" : C.text,
            fontWeight: active ? "800" : "600",
          }}
        >
          {label}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function PRCardDeluxe({
  colors,
  icon,
  badge,
  bigLine,
  subLine,
  fullWidth = false,
}: {
  colors: string[];
  icon: keyof typeof Ionicons.glyphMap;
  badge: string;
  bigLine: string;
  subLine?: string;
  fullWidth?: boolean;
}) {
  const sheen = useRef(new Animated.Value(-1)).current;
  const [dims, setDims] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  const [stars, setStars] = useState<
    Array<{ x: number; y: number; size: number; duration: number }>
  >([]);

  useEffect(() => {
    Animated.loop(
      Animated.timing(sheen, {
        toValue: 1,
        duration: 2600,
        useNativeDriver: true,
      })
    ).start();
  }, [sheen]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setDims({ w: width, h: height });
    const count = 12;
    const arr = Array.from({ length: count }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 6 + Math.random() * 10,
      duration: 900 + Math.floor(Math.random() * 600),
    }));
    setStars(arr);
  };

  const translateX = sheen.interpolate({
    inputRange: [-1, 1],
    outputRange: [-200, 200],
  });

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        flexGrow: 1,
        minWidth: fullWidth ? "100%" : "47%",
        borderRadius: 18,
        overflow: "hidden",
        padding: 16,
        shadowColor: "#000",
        shadowOpacity: 0.28,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      }}
      onLayout={onLayout}
    >
      <Ionicons
        name={icon}
        size={72}
        color="rgba(255,255,255,0.22)"
        style={{ position: "absolute", right: 10, top: 10 }}
      />
      <LinearGradient
        colors={[
          "rgba(255,255,255,0.18)",
          "rgba(255,255,255,0)",
        ]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: "absolute",
          left: -30,
          top: -30,
          width: 140,
          height: 140,
          borderRadius: 80,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
        }}
      >
        {stars.map((s, i) => (
          <StarParticle
            key={`${dims.w}-${dims.h}-${i}`}
            x={s.x}
            y={s.y}
            size={s.size}
            duration={s.duration}
          />
        ))}
      </View>
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -40,
          bottom: -40,
          width: 90,
          transform: [
            { translateX },
            { rotate: "-20deg" },
          ],
          opacity: 0.6,
        }}
      >
        <LinearGradient
          colors={[
            "rgba(255,255,255,0)",
            "rgba(255,255,255,0.55)",
            "rgba(255,255,255,0)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
      <View
        style={{
          alignSelf: "flex-start",
          backgroundColor: "rgba(255,255,255,0.28)",
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 999,
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontWeight: "800",
            fontSize: 12,
          }}
        >
          {badge}
        </Text>
      </View>
      <Text
        style={{
          color: "#fff",
          fontWeight: "900",
          fontSize: 22,
          marginTop: 8,
          textShadowColor: "rgba(0,0,0,0.25)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        }}
      >
        {bigLine}
      </Text>
      {subLine ? (
        <Text
          style={{
            color: "rgba(255,255,255,0.95)",
            marginTop: 6,
          }}
        >
          {subLine}
        </Text>
      ) : null}
    </LinearGradient>
  );
}

function StarParticle({
  x,
  y,
  size,
  duration,
}: {
  x: number;
  y: number;
  size: number;
  duration: number;
}) {
  const opacity = useRef(
    new Animated.Value(Math.random())
  ).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  useEffect(() => {
    const loop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.2,
          duration,
          useNativeDriver: true,
        }),
      ])
    );
    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.15,
          duration: Math.max(400, duration * 0.9),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.85,
          duration: Math.max(400, duration * 0.9),
          useNativeDriver: true,
        }),
      ])
    );
    loop1.start();
    loop2.start();
    return () => {
      loop1.stop();
      loop2.stop();
    };
  }, [duration, opacity, scale]);
  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity,
        transform: [{ scale }],
      }}
    >
      <Ionicons
        name="star"
        size={size}
        color="rgba(255,255,255,0.95)"
      />
    </Animated.View>
  );
}
