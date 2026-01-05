import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { AI_BASE, warmupAnalyzer } from "./ai";

// ── 接続先（既存ロジックを踏襲） ─────────────────────────────────────
function resolveAdviceBase() {
  const raw =
    process.env.EXPO_PUBLIC_AI_ADVICE_URL ||
    (Constants.expoConfig?.extra as any)?.ADVICE_URL ||
    AI_BASE;
  let base = String(raw || "").replace(/\/+$/, "");
  const isPrivate =
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base) ||
    /^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/i.test(base) ||
    /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/i.test(base) ||
    /^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?$/i.test(base);
  if (isPrivate) base = AI_BASE;
  return base;
}
const ADVICE_BASE = resolveAdviceBase();
export const ADVICE_ENDPOINT = `${ADVICE_BASE}/advice`;

// ── ウォームアップ ───────────────────────────────────────────────────
export async function warmupAdvice() {
  try {
    await warmupAnalyzer().catch(() => {});
    await Promise.race([
      fetch(`${ADVICE_BASE}/health`).catch(() => {}),
      new Promise((r) => setTimeout(r, 1200)),
    ]);
    await fetch(`${ADVICE_BASE}/warmup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).catch(() => {});
  } catch {}
}

// ── 便利関数 ─────────────────────────────────────────────────────────
const PER_TRY_TIMEOUT_MS = 60000;
const RETRIES = 3;
const RETRY_BACKOFF_MS = 800;
const sleep = (ms:number)=>new Promise(r=>setTimeout(r,ms));
const withTimeout = <T,>(p:Promise<T>, ms:number)=>
  new Promise<T>((resolve,reject)=>{const id=setTimeout(()=>reject(new Error(`timeout ${ms}ms`)),ms);
    p.then(v=>{clearTimeout(id);resolve(v);}).catch(e=>{clearTimeout(id);reject(e);});});

// ── 直近テーマの記憶（重複回避用） ───────────────────────────────────
const TOPIC_HISTORY_KEY = "ADVICE_TOPICS_HISTORY";
async function loadRecentTopics(): Promise<string[]> {
  try { const v = await AsyncStorage.getItem(TOPIC_HISTORY_KEY); return v ? JSON.parse(v) : []; } catch { return []; }
}
async function saveRecentTopics(keys: string[]) {
  try { await AsyncStorage.setItem(TOPIC_HISTORY_KEY, JSON.stringify(keys.slice(-10))); } catch {}
}

// ── 出力整形（バリエーションはサーバ側に寄せ、クライアントは軽整形） ─────────
function extractTextFromResponse(payload:any):string{
  if(payload==null) return "";
  if(typeof payload==="string") return payload;
  if(typeof payload.text==="string") return payload.text;
  if(typeof payload.result==="string") return payload.result;
  if(typeof payload.output==="string") return payload.output;
  if(typeof payload.advice==="string") return payload.advice;
  const c=payload.choices?.[0]; const t=c?.message?.content ?? c?.delta?.content ?? c?.text;
  if(typeof t==="string") return t;
  for(const k of Object.keys(payload)){const v=(payload as any)[k];
    if(typeof v==="string" && /advice|message|content|output|result|text/i.test(k)) return v;}
  return "";
}
function stripPromptLike(text:string){
  if(!text) return "";
  let s=text.replace(/```[\s\S]*?```/g,"").trim();
  const kill=[/あなたは.*(栄養|コーチ|アシスタント|AI|モデル)/i,/(SYSTEM|システム|ルール|禁止|方針|ポリシー|守って)/i,/(プロンプト|テンプレ|手順|出力形式|次の形式)/i,/(次を.*踏まえて|としてふるまう|に従って)/i,/(出力は|出力だけ|日本語で)/i];
  s=s.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).filter(ln=>!kill.some(re=>re.test(ln))).join("\n").trim();
  return s.replace(/^(System|Assistant|User)\s*:\s*/i,"").trim();
}
export function toCasualWithEmojis(raw:string){
  if(!raw) return "";
  // ここは最小限：サーバ側が充分バリエーションを付ける
  return raw
    .split(/\r?\n/).map(x=>x.trim()).filter(Boolean)
    .map(ln=>{
      if(/kcal|カロリー|摂取量/i.test(ln)) ln+=" 🔥";
      if(/タンパク|P\b/i.test(ln)) ln+=" 🥩";
      if(/脂質|F\b/i.test(ln)) ln+=" 🧈";
      if(/炭水化物|C\b|糖質/i.test(ln)) ln+=" 🍚";
      if(/野菜|食物繊維|フルーツ|果物/i.test(ln)) ln+=" 🥗";
      if(/水|水分|hydration|飲み物/i.test(ln)) ln+=" 💧";
      return ln;
    })
    .join("\n");
}

// ── “10倍データ”の組み立て（今ある情報だけでもOK、無ければ null） ────────
export type AdvicePayload = {
  user: { id?: string; sex?: "male"|"female"|"other"; height?: number; birthYear?: number; };
  goals: { kcalTarget?: number; proteinTarget?: number; fatTarget?: number; carbsTarget?: number; weightGoal?: number; };
  totals: { kcal?: number; p?: number; f?: number; c?: number; };
  meals: Array<{ title?: string; calories?: number; protein?: number; fat?: number; carbs?: number; time?: string; fiber?: number; sodium?: number; sugar?: number; }>;
  latestBody?: { weight?: number; bodyFat?: number; };
  context: { dateISO: string; weekday?: number; isTrainingDay?: boolean; mealsCount?: number; sleepHoursAvg?: number; streakDays?: number; recentTopics?: string[]; };
};

export function buildAdvicePayload(base:{
  totals:{kcal:number;p:number;f:number;c:number};
  goals:{kcalTarget:number;proteinTarget:number;fatTarget:number;carbsTarget:number};
  meals:Array<{title?:string;calories?:number;protein?:number;fat?:number;carbs?:number; time?:string;}>;
}, extras?: Partial<AdvicePayload>): AdvicePayload {
  // 既存データ + 追加分（無ければ undefined のままでOK）
  const dateISO = new Date().toISOString().slice(0,10);
  return {
    user: extras?.user ?? {},
    goals: { ...base.goals, weightGoal: extras?.goals?.weightGoal },
    totals: { kcal: base.totals.kcal, p: base.totals.p, f: base.totals.f, c: base.totals.c },
    meals: base.meals.map(m=>({ ...m })), // fiber/sodium/sugar はUIに来たら足す
    latestBody: extras?.latestBody,
    context: {
      dateISO,
      weekday: new Date(dateISO).getDay(),
      isTrainingDay: extras?.context?.isTrainingDay ?? false,
      mealsCount: base.meals.length,
      sleepHoursAvg: extras?.context?.sleepHoursAvg,
      streakDays: extras?.context?.streakDays,
      recentTopics: extras?.context?.recentTopics ?? [],
    }
  };
}

// ── 本体：/advice へ投げる（topicsUsed を保存 次回の重複回避に） ───────────
export async function requestAdvice(params: {
  totals: { kcal: number; p: number; f: number; c: number };
  goals:  { kcalTarget: number; proteinTarget: number; fatTarget: number; carbsTarget: number };
  meals:  Array<{ title?: string; calories?: number; protein?: number; fat?: number; carbs?: number; fiber?: number; sugar?: number; sodium?: number }>;
  template?: string;
  endpoint?: string;
  extraContext?: any;            // ★ 追加
}): Promise<string> {
  const endpoint = (params.endpoint || ADVICE_ENDPOINT).replace(/\/+$/, "");
  warmupAdvice().catch(() => {});

  // 直近テーマを読み込み   payload.context.recentTopics に反映
  const recent = await loadRecentTopics();
  const payload = buildAdvicePayload(
    { totals: params.totals, goals: params.goals, meals: params.meals },
    { ...(params.extraContext||{}), context: { ...(params.extraContext?.context||{}), recentTopics: recent } }
  );

  let lastErr:any=null;
  for(let attempt=0;attempt<RETRIES;attempt++){
    try{
      const res = await withTimeout(
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totals: params.totals,
          goals:  params.goals,
          meals:  params.meals,
          template: params.template,
          extraContext: params.extraContext || {},   // ★ 追加
        }),
      }),
      PER_TRY_TIMEOUT_MS
    );

      if(!res.ok){
        const body=await res.text().catch(()=> "");
        if([502,503,504].includes(res.status) && attempt+1<RETRIES){ await sleep(RETRY_BACKOFF_MS); continue; }
        throw new Error(`Advice API error: ${res.status} ${body?.slice(0,180)}`);
      }

      const ct=res.headers.get("content-type")||"";
      const data = ct.includes("application/json") ? await res.json() : JSON.parse(await res.text());
      const text = toCasualWithEmojis(stripPromptLike(extractTextFromResponse(data)).trim());

      // 次回の重複回避に topicsUsed を保存
      if (Array.isArray(data?.topicsUsed) && data.topicsUsed.length) {
        await saveRecentTopics([ ...recent, ...data.topicsUsed ]);
      }

      return text || "今日はまだデータが少ないみたい。少し食事を記録してから、もう一回押してね！😊";
    }catch(e:any){
      lastErr=e; const msg=String(e?.message||e||"");
      if(/timeout|Network|Failed to fetch|socket|connect/i.test(msg) && attempt+1<RETRIES){
        await sleep(RETRY_BACKOFF_MS); warmupAdvice().catch(()=>{}); continue;
      }
      break;
    }
  }
  const detail = lastErr?.message ? `\n詳細: ${String(lastErr.message)}` : "";
  throw new Error(`アドバイスAPIに接続できませんでした。接続先: ${ADVICE_BASE}${detail}`);
}

// ── メモ（既存維持） ───────────────────────────────────────────────
const ADVICE_KEY_PREFIX="ADVICE_MEMO:";
export async function saveAdviceMemo(dateISO:string,text:string){ await AsyncStorage.setItem(ADVICE_KEY_PREFIX+dateISO,text); }
export async function loadAdviceMemo(dateISO:string){ return (await AsyncStorage.getItem(ADVICE_KEY_PREFIX+dateISO)) || ""; }
