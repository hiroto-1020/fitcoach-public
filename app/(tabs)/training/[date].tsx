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
  Button,
  FlatList,
  TextInput,
  TouchableOpacity,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  useColorScheme,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import dayjs from "dayjs";
import {
  initTrainingDb,
  getOrCreateSession,
  listSetsBySession,
  updateSet,
  deleteSet,
  updateSetWarmup,
  insertSetAtIndex,
  addSet,
  pruneZeroSets,
  getSessionNote,
  updateSessionNote,
} from "../../../lib/training/db";
import SessionMedia from "../../../ui/SessionMedia";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
} catch {}
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
type Group = {
  exerciseId: number;
  exerciseName: string;
  sets: Row[];
};
type Summary = {
  exercises: number;
  sets: number;
  reps: number;
  tonnageT: string;
};

const Header: React.FC<{
  title: string;
  initialNote: string;
  onCommitNote: (t: string) => Promise<void>;
  sessionId: number | null;
  summary: Summary;
  onAddExercise: () => void;
  onUndo: () => void;
  undo: Row | null;
}> = ({
  title,
  initialNote,
  onCommitNote,
  sessionId,
  summary,
  onAddExercise,
  onUndo,
  undo,
}) => {
  const C = usePalette();
  const { t } = useTranslation();
  const [note, setNote] = useState(initialNote);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setNote(initialNote);
    setStatus(initialNote ? "saved" : "idle");
  }, [initialNote, sessionId]);

  const scheduleSave = useCallback(
    (text: string) => {
      setStatus("saving");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        await onCommitNote(text);
        setStatus("saved");
      }, 500);
    },
    [onCommitNote]
  );

  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "bold",
          color: C.text,
        }}
      >
        {title}
      </Text>

      <View
        style={{
          flexDirection: "row",
          gap: 8,
          marginVertical: 8,
          flexWrap: "wrap",
        }}
      >
        {[
          {
            label: t("training.summary.exercises"),
            v: summary.exercises,
          },
          {
            label: t("training.summary.sets"),
            v: summary.sets,
          },
          {
            label: t("training.summary.reps"),
            v: summary.reps,
          },
          {
            label: t("training.summary.tonnage"),
            v: `${summary.tonnageT} t`,
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
              style={{ fontSize: 12, color: C.subtext }}
            >
              {p.label}
            </Text>
          </View>
        ))}
      </View>

      <View
        style={{
          marginTop: 8,
          marginBottom: 12,
          padding: 12,
          borderWidth: 1,
          borderColor: C.border,
          borderRadius: 12,
          backgroundColor: C.card,
        }}
      >
        <Text
          style={{
            fontWeight: "600",
            marginBottom: 6,
            color: C.text,
          }}
        >
          {t("trainingSession.note_title")}
        </Text>
        <TextInput
          value={note}
          onChangeText={(tText) => {
            setNote(tText);
            scheduleSave(tText);
          }}
          onBlur={async () => {
            setStatus("saving");
            await onCommitNote(note);
            setStatus("saved");
          }}
          placeholder={t(
            "trainingSession.note_placeholder"
          )}
          placeholderTextColor={C.subtext}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={{
            minHeight: 90,
            borderWidth: 1,
            borderColor: C.border,
            borderRadius: 8,
            padding: 10,
            backgroundColor: C.card,
            color: C.text,
          }}
        />
        <Text
          style={{
            marginTop: 6,
            fontSize: 12,
            color:
              status === "saving"
                ? C.subtext
                : "#22c55e",
          }}
        >
          {status === "saving"
            ? t("trainingSession.saving")
            : t("trainingSession.saved")}
        </Text>
      </View>

      {sessionId ? (
        <SessionMedia sessionId={sessionId} />
      ) : null}

      <View style={{ height: 8 }} />
      <Button
        title={t("trainingSession.add_exercise")}
        disabled={!sessionId}
        onPress={onAddExercise}
      />

      {undo && (
        <View
          style={{
            marginTop: 12,
            padding: 10,
            borderRadius: 10,
            backgroundColor: "#f5f5f5",
            borderColor: "#e5e5e5",
            borderWidth: 1,
          }}
        >
          <Text
            style={{ marginBottom: 6, color: C.text }}
          >
            {t("trainingSession.deleted_message")}
          </Text>
          <TouchableOpacity
            onPress={onUndo}
            style={{ alignSelf: "flex-start" }}
          >
            <Text
              style={{
                color: "#1976d2",
                fontWeight: "600",
              }}
            >
              {t("trainingSession.undo")}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

function SetRow({
  row,
  onChanged,
  onDeleted,
  onAskEnsureVisible,
}: {
  row: Row;
  onChanged: () => void;
  onDeleted: (r: Row) => void;
  onAskEnsureVisible?: (y: number, h: number) => void;
}) {
  const C = usePalette();
  const { t } = useTranslation();
  const [w, setW] = useState(String(row.weight_kg));
  const [r, setR] = useState(String(row.reps));
  const [warmup, setWarmup] = useState(
    row.is_warmup === 1
  );
  const unit = row.unit ?? "kg";

  const rowRef = useRef<View>(null);
  const ask = () => {
    setTimeout(() => {
      rowRef.current?.measureInWindow?.(
        (x, y, width, height) => {
          onAskEnsureVisible?.(y, height);
        }
      );
    }, 0);
  };

  const save = async () => {
    const weight = Number(w || 0);
    const reps = Number(r || 0);
    await updateSet(row.id, weight, reps);
    onChanged();
  };
  const toggleWarmup = async (val: boolean) => {
    setWarmup(val);
    await updateSetWarmup(row.id, val ? 1 : 0);
    onChanged();
  };
  const del = async () => {
    onDeleted(row);
    await deleteSet(row.id);
    onChanged();
  };

  return (
    <View
      ref={rowRef}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginVertical: 6,
        opacity: warmup ? 0.6 : 1,
      }}
    >
      <Text
        style={{
          width: 28,
          textAlign: "right",
          color: C.text,
        }}
      >
        {row.set_index}
      </Text>

      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TextInput
          value={w}
          onChangeText={setW}
          onBlur={save}
          onFocus={ask}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: C.border,
            borderRadius: 8,
            padding: 8,
            backgroundColor: C.card,
            color: C.text,
          }}
          placeholder={t(
            "trainingSession.weight_placeholder"
          )}
          placeholderTextColor={C.subtext}
        />
        <Text
          style={{
            marginLeft: 6,
            color: C.subtext,
          }}
        >
          {unit}
        </Text>
      </View>

      <Text
        style={{
          width: 18,
          textAlign: "center",
          color: C.subtext,
        }}
      >
        ×
      </Text>

      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TextInput
          value={r}
          onChangeText={setR}
          onBlur={save}
          onFocus={ask}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: C.border,
            borderRadius: 8,
            padding: 8,
            backgroundColor: C.card,
            color: C.text,
          }}
          placeholder={t(
            "trainingSession.reps_placeholder"
          )}
          placeholderTextColor={C.subtext}
        />
        <Text
          style={{
            marginLeft: 6,
            color: C.subtext,
          }}
        >
          {t("trainingSession.reps_suffix")}
        </Text>
      </View>

      <View style={{ alignItems: "center" }}>
        <Text
          style={{
            fontSize: 10,
            color: C.subtext,
          }}
        >
          {t("trainingSession.wu_label")}
        </Text>
        <Switch
          value={warmup}
          onValueChange={toggleWarmup}
        />
      </View>

      <TouchableOpacity onPress={del}>
        <Text style={{ padding: 8, color: "#d33" }}>
          {t("trainingSession.delete_set")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function DayScreen() {
  const C = usePalette();
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const [sessionId, setSessionId] = useState<number | null>(
    null
  );
  const [rows, setRows] = useState<Row[]>([]);
  const [undo, setUndo] = useState<null | Row>(null);
  const undoTimer = useRef<NodeJS.Timeout | null>(null);

  const listRef = useRef<FlatList>(null);
  const scrollY = useRef(0);

  const insets = useSafeAreaInsets();
  const [kbVisible, setKbVisible] = useState(false);
  const [kbHeight, setKbHeight] = useState(0);
  useEffect(() => {
    const onShow = (e: any) => {
      setKbVisible(true);
      setKbHeight(
        e?.endCoordinates?.height ?? 0
      );
    };
    const onHide = () => {
      setKbVisible(false);
      setKbHeight(0);
    };
    const s1 = Keyboard.addListener(
      Platform.OS === "ios"
        ? "keyboardWillShow"
        : "keyboardDidShow",
      onShow
    );
    const s2 = Keyboard.addListener(
      "keyboardDidHide",
      onHide
    );
    return () => {
      s1.remove();
      s2.remove();
    };
  }, []);

  const title = dayjs(String(date)).format(
    "YYYY/MM/DD"
  );

  const refresh = useCallback(async () => {
    if (!sessionId) return;
    const r = await listSetsBySession(sessionId);
    setRows(r as Row[]);
  }, [sessionId]);

  useEffect(() => {
    (async () => {
      await initTrainingDb();
      const id = await getOrCreateSession(
        String(date)
      );
      setSessionId(id);
      const [r, n] = await Promise.all([
        listSetsBySession(id),
        getSessionNote(id),
      ]);
      setRows(r as Row[]);
      setNote(n);
    })();
    return () => {
      if (undoTimer.current)
        clearTimeout(undoTimer.current);
    };
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      return () => {
        if (sessionId)
          pruneZeroSets(sessionId).catch(() => {});
      };
    }, [refresh, sessionId])
  );

  const [note, setNote] = useState("");
  const commitNote = useCallback(
    async (text: string) => {
      if (!sessionId) return;
      await updateSessionNote(sessionId, text);
      setNote(text);
    },
    [sessionId]
  );

  const summary: Summary = useMemo(() => {
    const work = rows.filter(
      (r) => r.is_warmup !== 1
    );
    const exercises = new Set(
      work.map((r) => r.exercise_id)
    ).size;
    const sets = work.length;
    const reps = work.reduce(
      (s, r) => s + (Number(r.reps) || 0),
      0
    );
    const tonnageKg = work.reduce(
      (s, r) =>
        s +
        (Number(r.weight_kg) || 0) *
          (Number(r.reps) || 0),
      0
    );
    const tonnageT = (tonnageKg / 1000).toFixed(1);
    return { exercises, sets, reps, tonnageT };
  }, [rows]);

  const groups = useMemo<Group[]>(() => {
    const map = new Map<number, Group>();
    rows.forEach((r) => {
      const g = map.get(r.exercise_id);
      if (g) g.sets.push(r);
      else
        map.set(r.exercise_id, {
          exerciseId: r.exercise_id,
          exerciseName: r.exercise_name,
          sets: [r],
        });
    });
    return Array.from(map.values()).sort((a, b) =>
      a.exerciseName.localeCompare(
        b.exerciseName,
        "ja"
      )
    );
  }, [rows]);

  const onUndo = async () => {
    if (!undo) return;
    await insertSetAtIndex(
      undo.session_id,
      undo.exercise_id,
      undo.set_index,
      undo.weight_kg,
      undo.reps,
      undo.is_warmup
    );
    setUndo(null);
    await refresh();
  };

  const addEmptySetToExercise = async (
    exerciseId: number
  ) => {
    if (!sessionId) return;
    await addSet(sessionId, exerciseId, 0, 0);
    await refresh();
  };

  const ensureVisible = useCallback(
    (y: number, h: number) => {
      const winH = Dimensions.get(
        "window"
      ).height;
      const visibleBottom =
        winH -
        kbHeight -
        insets.bottom -
        12;
      const bottom = y + h;
      if (bottom > visibleBottom - 6) {
        const delta =
          bottom - visibleBottom + 6;
        const next = Math.max(
          0,
          scrollY.current + delta
        );
        listRef.current?.scrollToOffset({
          offset: next,
          animated: true,
        });
      }
    },
    [kbHeight, insets.bottom]
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={
        Platform.OS === "ios" ? "height" : "height"
      }
      keyboardVerticalOffset={0}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: C.bg,
        }}
      >
        <FlatList
          ref={listRef}
          data={groups}
          keyExtractor={(g) =>
            String(g.exerciseId)
          }
          ListHeaderComponent={
            <Header
              title={title}
              initialNote={note}
              onCommitNote={commitNote}
              sessionId={sessionId}
              summary={summary}
              onAddExercise={() =>
                router.push({
                  pathname:
                    "/training/picker",
                  params: {
                    date: String(date),
                    sessionId: String(
                      sessionId ?? ""
                    ),
                  },
                })
              }
              onUndo={onUndo}
              undo={undo}
            />
          }
          renderItem={({ item: g }) => (
            <View
              style={{
                margin: 12,
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: C.border,
                backgroundColor: C.card,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontWeight: "bold",
                    color: C.text,
                  }}
                >
                  {g.exerciseName}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    addEmptySetToExercise(
                      g.exerciseId
                    )
                  }
                >
                  <Text
                    style={{
                      color: C.primary,
                      fontWeight: "600",
                    }}
                  >
                    {t(
                      "trainingSession.add_set"
                    )}
                  </Text>
                </TouchableOpacity>
              </View>

              {g.sets.map((s) => (
                <SetRow
                  key={s.id}
                  row={s}
                  onChanged={refresh}
                  onDeleted={(deleted) => {
                    setUndo(deleted);
                    if (undoTimer.current)
                      clearTimeout(
                        undoTimer.current
                      );
                    undoTimer.current =
                      setTimeout(
                        () => setUndo(null),
                        5000
                      );
                  }}
                  onAskEnsureVisible={
                    ensureVisible
                  }
                />
              ))}
            </View>
          )}
          ListEmptyComponent={
            <Text
              style={{
                padding: 16,
                color: C.subtext,
              }}
            >
              {t("trainingSession.empty")}
            </Text>
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios"
              ? "interactive"
              : "on-drag"
          }
          ListFooterComponent={
            <View
              style={{
                height: kbVisible
                  ? kbHeight + 24
                  : 24,
              }}
            />
          }
          contentContainerStyle={{
            paddingBottom: 8,
          }}
          style={{ flex: 1 }}
          removeClippedSubviews={false}
          onScroll={(e) => {
            scrollY.current =
              e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
});
