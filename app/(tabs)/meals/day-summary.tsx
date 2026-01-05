// app/(tabs)/meals/day-summary.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Platform, TextInput } from "react-native";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { colors, spacing } from "../../../ui/theme";
import { Card, SectionTitle, PrimaryButton } from "../../../ui/components";

// optional calendar/datetime
let Calendars: any = null;
try { Calendars = require("react-native-calendars"); } catch {}
let DateTimePicker: any = null;
try { DateTimePicker = require("@react-native-community/datetimepicker").default; } catch {}

// ---- 既存データ読取（ストレージ依存に左右されにくいフォールバック） ----
let AsyncStorage: any = null;
try { AsyncStorage = require("@react-native-async-storage/async-storage").default; } catch {}

type Meal = {
  id: string;
  date?: string;      // YYYY-MM-DD
  mealType?: "breakfast"|"lunch"|"dinner"|"snack";
  title?: string;
  brand?: string;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  createdAt?: number;
  updatedAt?: number;
};

const MEALS_KEYS = ["MEALS_V2","meals_v2","meals_v1","meals"];

async function readAllMeals(): Promise<Meal[]> {
  // lib/storage に getAllMeals などがあれば使う
  try {
    const mod = require("../../../lib/storage");
    if (typeof mod.getAllMeals === "function") {
      const arr = await mod.getAllMeals();
      if (Array.isArray(arr)) return arr;
    }
    if (typeof mod.loadMeals === "function") {
      const arr = await mod.loadMeals();
      if (Array.isArray(arr)) return arr;
    }
  } catch {}
  // 直接キーを総当たり
  if (!AsyncStorage) return [];
  for (const k of MEALS_KEYS) {
    try {
      const raw = await AsyncStorage.getItem(k);
      if (!raw) continue;
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr as Meal[];
    } catch {}
  }
  return [];
}

const typeLabel = (t?: string) => t==="breakfast"?"朝食":t==="lunch"?"昼食":t==="dinner"?"夕食":"間食";

export default function DaySummaryScreen() {
  const router = useRouter();
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [openCal, setOpenCal] = useState(false);

  useEffect(() => {
    let on = true;
    (async () => {
      setLoading(true);
      const all = await readAllMeals();
      if (!on) return;
      setMeals(all.filter(m => (m.date||"").startsWith(date)));
      setLoading(false);
    })();
    return () => { on = false; };
  }, [date]);

  const sums = useMemo(() => {
    const init = { kcal:0, p:0, f:0, c:0 };
    const total = { ...init };
    const byType: Record<string, typeof init> = {
      breakfast: { ...init }, lunch: { ...init }, dinner: { ...init }, snack: { ...init },
    };
    for (const m of meals) {
      const k = Number(m.calories||0), p = Number(m.protein||0), f = Number(m.fat||0), c = Number(m.carbs||0);
      total.kcal += k; total.p += p; total.f += f; total.c += c;
      const bucket = byType[m.mealType||"snack"];
      bucket.kcal += k; bucket.p += p; bucket.f += f; bucket.c += c;
    }
    // 四捨五入
    const round = (x:number)=>Math.round(x);
    const rtotal = { kcal: round(total.kcal), p: round(total.p), f: round(total.f), c: round(total.c) };
    const rtype: any = {};
    (["breakfast","lunch","dinner","snack"] as const).forEach(t=>{
      rtype[t] = { kcal: round(byType[t].kcal), p: round(byType[t].p), f: round(byType[t].f), c: round(byType[t].c) };
    });
    return { total: rtotal, byType: rtype };
  }, [meals]);

  return (
    <>
      {/* カレンダーモーダル */}
      <CalendarModal
        open={openCal}
        value={date}
        onClose={()=>setOpenCal(false)}
        onChange={(iso)=>{ setDate(iso); setOpenCal(false); }}
      />

      <ScrollView style={{ flex:1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <Card style={{ padding: spacing.md }}>
          <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
            <SectionTitle>1日の合計栄養素</SectionTitle>
            <TouchableOpacity onPress={()=>setOpenCal(true)} style={{ paddingHorizontal:10, paddingVertical:6, borderRadius:999, borderWidth:1, borderColor: colors.border, backgroundColor:"#fff" }}>
              <Text style={{ fontWeight:"900", color: colors.text }}>📅 {date}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection:"row", gap:10, marginTop:12 }}>
            <TouchableOpacity onPress={()=>setDate(dayjs(date).subtract(1,"day").format("YYYY-MM-DD"))} style={chip()}>
              <Text style={chipText()}>前日</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>setDate(dayjs().format("YYYY-MM-DD"))} style={chip(true)}>
              <Text style={chipText(true)}>今日へ</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>setDate(dayjs(date).add(1,"day").format("YYYY-MM-DD"))} style={chip()}>
              <Text style={chipText()}>翌日</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={{ alignItems:"center", paddingVertical:20 }}>
              <ActivityIndicator />
              <Text style={{ color: colors.subtext, marginTop:8 }}>読み込み中…</Text>
            </View>
          ) : (
            <>
              {/* 合計バッジ */}
              <View style={{ alignItems:"center", marginTop:12 }}>
                <View style={{
                  width: 220, height: 220, borderRadius: 9999,
                  backgroundColor: "#f0f9ff", borderWidth: 2, borderColor: "#bae6fd",
                  alignItems:"center", justifyContent:"center"
                }}>
                  <Text style={{ color:"#0369a1", fontWeight:"900", fontSize:18 }}>合計</Text>
                  <Text style={{ color:"#0c4a6e", fontWeight:"900", fontSize:28, marginTop:4 }}>{sums.total.kcal} kcal</Text>
                  <Text style={{ color:"#0c4a6e", fontWeight:"900", marginTop:6 }}>
                    P {sums.total.p}g / F {sums.total.f}g / C {sums.total.c}g
                  </Text>
                </View>
              </View>

              {/* 食事区分ごとの小計 */}
              <View style={{ marginTop:16, gap:10 }}>
                {(["breakfast","lunch","dinner","snack"] as const).map(t=>(
                  <View key={t} style={{ borderWidth:1, borderColor: colors.border, backgroundColor:"#fff", borderRadius:14, padding:12 }}>
                    <Text style={{ color: colors.text, fontWeight:"900" }}>{typeLabel(t)}</Text>
                    <Text style={{ color: colors.subtext, marginTop:4 }}>
                      {sums.byType[t].kcal} kcal / P {sums.byType[t].p}g / F {sums.byType[t].f}g / C {sums.byType[t].c}g
                    </Text>
                  </View>
                ))}
              </View>

              {/* 記録へショートカット */}
              <View style={{ marginTop:16 }}>
                <PrimaryButton title="この日の記録一覧（検索）を開く" onPress={()=>{
                  // 検索画面で date param を使ってその日のものを優先表示するなどの拡張もOK
                  router.push({ pathname: "/(tabs)/meals/search", params: { date } });
                }} />
              </View>

              {/* データが無いときのヒント */}
              {meals.length === 0 && (
                <Text style={{ color: colors.muted, marginTop:10, textAlign:"center" }}>
                  この日は記録がありません。上の「食事を記録」から追加してください。
                </Text>
              )}
            </>
          )}
        </Card>
      </ScrollView>
    </>
  );
}

function chip(primary=false) {
  return {
    paddingHorizontal:12, paddingVertical:8, borderRadius:999,
    borderWidth:1, borderColor: primary ? "#93c5fd" : colors.border,
    backgroundColor: primary ? "#eff6ff" : "#fff",
  } as const;
}
function chipText(primary=false) {
  return { color: primary ? "#1d4ed8" : colors.text, fontWeight:"900" } as const;
}

/* カレンダーモーダル（new.tsx のと同じ実装） */
function CalendarModal({ open, value, onClose, onChange }:{
  open:boolean; value:string; onClose:()=>void; onChange:(iso:string)=>void;
}) {
  const [local, setLocal] = useState(value);
  useEffect(()=>setLocal(value), [value]);
  const hasCalendars = !!Calendars?.Calendar;
  const hasNative = !!DateTimePicker;

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.4)", justifyContent:"center", padding:20 }}>
        <View style={{ backgroundColor:"#fff", borderRadius:16, padding:16 }}>
          <Text style={{ fontWeight:"900", fontSize:16, color: colors.text, marginBottom:8 }}>日付を選択</Text>
          {hasCalendars ? (
            <Calendars.Calendar
              initialDate={local}
              onDayPress={(d:any)=>setLocal(d.dateString)}
              markedDates={{ [local]: { selected:true } }}
              theme={{
                todayTextColor: "#1d4ed8",
                selectedDayBackgroundColor: "#1d4ed8",
                selectedDayTextColor: "#fff",
              }}
              style={{ borderWidth:1, borderColor:"#e5e7eb", borderRadius:12 }}
            />
          ) : hasNative ? (
            <DateTimePicker
              value={new Date(local || new Date())}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "calendar"}
              onChange={(_, d?:Date)=> d && setLocal(dayjs(d).format("YYYY-MM-DD"))}
            />
          ) : (
            <>
              <Text style={{ color: colors.subtext, marginBottom:8 }}>カレンダー未導入。手入力してください（YYYY-MM-DD）。</Text>
              <TextInput
                value={local}
                onChangeText={setLocal}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.muted}
                style={{
                  borderWidth:1, borderColor:"#e5e7eb", backgroundColor:"#f8fafc",
                  color: colors.text, borderRadius:10, paddingHorizontal:12, paddingVertical:10,
                }}
              />
            </>
          )}
          <View style={{ flexDirection:"row", justifyContent:"flex-end", gap:8, marginTop:12 }}>
            <TouchableOpacity onPress={onClose} style={{ paddingHorizontal:12, paddingVertical:10 }}>
              <Text style={{ color: colors.subtext, fontWeight:"800" }}>キャンセル</Text>
            </TouchableOpacity>
            <PrimaryButton title="決定" onPress={()=>onChange(local)} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
