// app/(tabs)/gotore/index.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, Dimensions, Pressable, TouchableOpacity, Modal,
  ActivityIndicator, Alert, TextInput, Switch, KeyboardAvoidingView,
  Platform, StyleSheet, Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring, withTiming, runOnJS
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  fetchBuddyFeedWithFilters, FeedFilters, sendLikeWithPrecheck,
  getMyUserAndSettings, getMyProfileAndGender, updateMyBuddyMode, fetchLatestMatchWith
} from '../../../lib/gotore/api';
import type { BuddyMode, Candidate, Gender } from '../../../lib/gotore/types';
import { getFirstProfilePhotoUrl, labelGender, fetchGenderForUser } from '../../../lib/gotore/profile-media';

import { useLikeStatus } from '../../../hooks/useLikeStatus';
import { LikeStatusBar } from '../../../ui/components/LikeStatusBar';
import { OutOfLikesModal } from '../../../ui/components/OutOfLikesModal';
import { fetchReceivedLikesCount, subscribeReceivedLikes } from '../../../lib/gotore/api';

import ComingSoon from "../../../components/gotore/ComingSoon";
import { GOTORE_ENABLED } from "../../../lib/featureFlags";
import { GOTORE_PURCHASE_ENABLED } from '../../../lib/featureFlags';

const { width: W, height: H } = Dimensions.get('window');

/* =========================
   ヘルパー（性別/モード正規化）
   ========================= */
type UIMode = 'any' | 'same_gender';

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <View style={{
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginRight: 8, marginBottom: 6
    }}>
      <Text style={{ color: '#fff', fontWeight: '700' }}>{children}</Text>
    </View>
  );
}

function Fact({ children }: { children: React.ReactNode }) {
  return (
    <View style={{
      backgroundColor: 'rgba(0,0,0,0.35)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 6, marginBottom: 6
    }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{children}</Text>
    </View>
  );
}

function normalizeGender(g?: any): Gender {
  if (g == null) return 'unknown';
  const s = String(g).trim().toLowerCase();
  if (['male','m','man','1','男','男性'].includes(s)) return 'male';
  if (['female','f','woman','2','女','女性'].includes(s)) return 'female';
  if (['other','x','nonbinary','nb','3','その他'].includes(s)) return 'other';
  return ['male','female','other','unknown'].includes(s as any) ? s as Gender : 'unknown';
}

const sameLabel = (g: Gender) =>
  g === 'male' ? '男同士のみ' :
  g === 'female' ? '女同士のみ' : '同性のみ';

// DB保存値   UI2値（male_only / female_only はどちらも same_gender 扱い）
function normalizeMode(raw: BuddyMode, _g: Gender): UIMode {
  return raw === 'any' ? 'any' : 'same_gender';
}

// UI2値   DB保存値（性別に応じて male_only / female_only に割り振り）
function toRawMode(ui: UIMode, g: Gender): BuddyMode {
  if (ui === 'any') return 'any';
  if (g === 'male') return 'male_only';
  if (g === 'female') return 'female_only';
  return 'any'; // 性別不明のときは安全側
}

function getCandidateGender(c: Candidate): Gender {
  const p: any = c.profile ?? {};
  const raw = p.gender ?? (c as any).user?.gender;
  return normalizeGender(raw);
}

/* =========================
   プロフィールカード
   ========================= */
function ProfileCard({ c, height }: { c: Candidate; height: number }) {
  const router = useRouter();
  const p: any = c.profile ?? {};

  const initialGender = (p.gender as any) ?? c.user?.gender ?? 'unknown';
  const [genderNorm, setGenderNorm] =
    useState<'male'|'female'|'other'|'unknown'>(normalizeGender(initialGender));

  useEffect(() => {
    if (genderNorm !== 'unknown') return;
    let alive = true;
    (async () => {
      const g = await fetchGenderForUser(c.profile.user_id);
      if (alive) setGenderNorm(g);
    })();
    return () => { alive = false; };
  }, [genderNorm, c.profile.user_id]);

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const u = await getFirstProfilePhotoUrl(c.profile.user_id);
      if (alive) setPhotoUrl(u);
    })();
    return () => { alive = false; };
  }, [c.profile.user_id]);

  const bio: string | undefined = p.bio;
  const age: number | undefined = p.age;
  const heightCm: number | undefined = p.height_cm;
  const level: string | undefined = p.training_level;
  const freq: string | undefined = p.training_frequency;
  const goals: string | undefined = p.goals;
  const pr = p.pr_lifts || {};
  const days: string[] = p.available_days || [];
  const times: string[] = p.preferred_times || [];
  const tags: string[] = p.preferred_training_tags || [];

  const genderJp = labelGender((p.gender as any) ?? genderNorm ?? 'unknown');
  const regionLabel = p.region_label ?? p.region ?? '—';
  const homeGym = p.home_gym_location ?? '未設定';

  const fallbackRaw: string | undefined =
    (Array.isArray(p.photos) && p.photos[0]) || p.avatar_url;
  const ver = p.updated_at ? new Date(p.updated_at).getTime() : undefined;
  const fallbackPhoto = (() => {
    if (!fallbackRaw) return undefined;
    if (!ver) return fallbackRaw;
    return `${fallbackRaw}${fallbackRaw.includes('?') ? '&' : '?'}v=${ver}`;
  })();
  const displayPhoto = photoUrl ?? fallbackPhoto;

  const photoH = Math.min(height * 0.55, 360);

  return (
    <View
      style={{
        width: W * 0.9,
        height,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#1f2937',
        borderWidth: 1,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 12 },
        elevation: 12,
      }}
    >
      <View
        pointerEvents="none"
        style={{
          ...StyleSheet.absoluteFillObject,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      />

      <View style={{ flex: 1, backgroundColor: '#2b375cff' }}>
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/gotore/users/[userId]",
                  params: { userId: c.profile.user_id },
                })
              }
            >
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900' }}>
                {p.nickname ?? '名無し'}
              </Text>
            </Pressable>
            {/* VerifiedBadge はお使いのまま */}
          </View>

          <Text style={{ color: 'rgba(255,255,255,0.95)', marginTop: 6, fontWeight: '700' }}>
            地域：{regionLabel} ／ ホームジム：{homeGym}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.95)', marginTop: 4 }}>
            性別：{genderJp}
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
            {age ? <Fact>{age}歳</Fact> : null}
            {heightCm ? <Fact>{heightCm}cm</Fact> : null}
            {level ? <Fact>Lv:{level}</Fact> : null}
            {freq ? <Fact>{freq}</Fact> : null}
            {days.length ? <Fact>{days.join('・')}</Fact> : null}
            {times.length ? <Fact>{times.join('・')}</Fact> : null}
            {pr?.bench ? <Fact>BP {pr.bench}kg</Fact> : null}
            {pr?.squat ? <Fact>SQ {pr.squat}kg</Fact> : null}
            {pr?.dead ? <Fact>DL {pr.dead}kg</Fact> : null}
          </View>

          <View
            style={{
              marginTop: 12,
              borderRadius: 12,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              backgroundColor: '#0b1020',
            }}
          >
            {displayPhoto ? (
              <Image
                source={{ uri: displayPhoto }}
                resizeMode="cover"
                style={{ width: '100%', height: photoH }}
              />
            ) : (
              <View
                style={{
                  width: '100%',
                  height: photoH,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#64748B' }}>写真なし</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, paddingBottom: 16, marginTop: 6 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
            {tags.length ? tags.map((t, i) => <Pill key={`${t}-${i}`}>{t}</Pill>) : <Pill>タグ未設定</Pill>}
          </View>
          {goals ? (
            <View style={{ marginBottom: 6 }}>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '800', marginBottom: 2 }}>目標</Text>
              <Text numberOfLines={2} style={{ color: 'rgba(255,255,255,0.95)', lineHeight: 20, fontWeight: '600' }}>{goals}</Text>
            </View>
          ) : null}
          {bio ? (
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '800', marginBottom: 2 }}>自己紹介</Text>
              <Text numberOfLines={3} style={{ color: 'rgba(255,255,255,0.95)', lineHeight: 20, fontWeight: '600' }}>{bio}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

/* =========================
   メイン
   ========================= */
export default function GotoreSwipe() {

  // 🔒 準備中ゲート
  if (!GOTORE_ENABLED) {
    return <ComingSoon />;
  }



  const router = useRouter();
  const insets = useSafeAreaInsets();

  // 受信いいねバッジ
  const [inboxCount, setInboxCount] = useState(0);
  useEffect(() => {
    let unsub: undefined | (() => void);
    (async () => {
      try {
        const n = await (fetchReceivedLikesCount?.() ?? 0);
        setInboxCount(Number(n) || 0);
      } catch {}
      try {
        unsub = await subscribeReceivedLikes?.(async () => {
          try {
            const n2 = await (fetchReceivedLikesCount?.() ?? 0);
            setInboxCount(Number(n2) || 0);
          } catch {}
        });
      } catch {}
    })();
    return () => { if (unsub) unsub(); };
  }, []);

  // ── いいね残数 ─────────────────
  const {
    status: likeStatus,
    timeLeft,
    outOfLikes,
    setOutOfLikes,
    consumeOne,
    reload: reloadLikes,
  } = useLikeStatus();
  const free  = likeStatus?.freeRemaining  ?? 0;
  const paid  = likeStatus?.paidRemaining  ?? 0;
  const total = likeStatus?.totalRemaining ?? 0;

  useEffect(() => {
    if ((timeLeft ?? 0) <= 1000) {
      const t = setTimeout(() => reloadLikes().catch(() => {}), 1200);
      return () => clearTimeout(t);
    }
  }, [timeLeft, reloadLikes]);

  // ── 画面状態 ────────────────
  const [loading, setLoading] = useState(true);
  const [fatal, setFatal] = useState<string | null>(null);
  const [notAuthed, setNotAuthed] = useState(false);
  const [regionMissing, setRegionMissing] = useState(false);

  //  ここが変更点：UIモード/自分の性別/自分のID
  const [uiMode, setUiMode] = useState<UIMode>('any');
  const [myGender, setMyGender] = useState<Gender>('unknown');
  const [myUserId, setMyUserId] = useState<string | null>(null);

  // カードデッキ
  const [deck, setDeck] = useState<Candidate[]>([]);
  const indexRef = useRef(0);
  const [top, setTop] = useState<Candidate | null>(null);
  const [next, setNext] = useState<Candidate | null>(null);

  // 絞り込み
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [gymQuery, setGymQuery] = useState('');
  const [hideLiked, setHideLiked] = useState(true);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // 上部バーの高さ（カード位置調整）
  const [likeBarH, setLikeBarH] = useState(0);

  // レイアウト計算
  const CARD_MIN = 400;
  const CARD_H_FACTOR = 0.65;
  const BOTTOM_SPACE = 160;
  const DECK_TOP_ADJUST = -24;
  const topPadding = Math.max(0, likeBarH + 12 + DECK_TOP_ADJUST);
  const cardHeight = Math.max(
    CARD_MIN,
    Math.min(H * CARD_H_FACTOR, H - topPadding - insets.bottom - BOTTOM_SPACE)
  );

  const currentFilters = useMemo<FeedFilters>(() => ({
    tagsAny: tagsInput.split(',').map(s => s.trim()).filter(Boolean),
    gymQuery: gymQuery.trim() || undefined,
    hideLiked,
    verifiedOnly,
  }), [tagsInput, gymQuery, hideLiked, verifiedOnly]);

  const [celebrate, setCelebrate] =
    useState<{ visible: boolean; matchId?: string | null }>({ visible: false });

  // タイムアウトラッパ
  function withTimeout<T>(p: Promise<T>, ms = 10000) {
    return Promise.race<T>([
      p,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)) as any,
    ]);
  }

  // 読み込み
  const load = useCallback(async () => {
    setLoading(true);
    setFatal(null);
    setRegionMissing(false);
    try {
      const { supabase } = await import('../../../lib/supabase');
      const { data, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      if (!data?.user) {
        setNotAuthed(true);
        setDeck([]); setTop(null); setNext(null);
        return;
      }
      setNotAuthed(false);
      setMyUserId(data.user.id);

      const [{ settings }, { profile }] = await withTimeout(Promise.all([
        getMyUserAndSettings(),
        getMyProfileAndGender(),
      ]));

      // 自分の性別を保持   UIモードへ正規化
      const g = normalizeGender(profile?.gender);
      setMyGender(g);
      setUiMode(normalizeMode(settings.buddy_gender_mode as BuddyMode, g));

      const noRegion = !profile.region;
      setRegionMissing(noRegion);

      if (noRegion) {
        setDeck([]); setTop(null); setNext(null);
      } else {
        const items = await withTimeout(fetchBuddyFeedWithFilters(currentFilters, 60));
        const filtered = (uiMode === 'same_gender' && (g === 'male' || g === 'female'))
          ? items.filter((c: Candidate) => getCandidateGender(c) === g)
          : items;
        indexRef.current = 0;
        setDeck(filtered);
        setTop(filtered[0] ?? null);
        setNext(filtered[1] ?? null);
      }
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      setFatal(msg);
      try { Alert.alert('読み込みエラー', msg); } catch {}
    } finally {
      setLoading(false);
    }
  }, [currentFilters, uiMode, myGender]);

  // 復帰時
  useFocusEffect(useCallback(() => {
    load();
    reloadLikes?.();
  }, [load, reloadLikes]));

  // モード変更（UI2値   DB保存値へ変換して保存）
  const onChangeUIMode = async (m: UIMode) => {
    if (m === uiMode) return;
    try {
      const raw = toRawMode(m, myGender);
      await updateMyBuddyMode(raw);
      setUiMode(m);
      Alert.alert('条件を更新しました');
      load();
    } catch (e: any) {
      Alert.alert('更新エラー', e?.message ?? '不明なエラー');
    }
  };

  // KYCで性別が変わったら自動追従（UIラベルと検索結果、保存値も補正）
  useEffect(() => {
    let ch: any;
    (async () => {
      if (!myUserId) return;
      const { supabase } = await import('../../../lib/supabase');
      ch = supabase
        .channel('me-gender-watch-swipe')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${myUserId}`,
        }, async (payload: any) => {
          const g = normalizeGender(payload.new?.gender);
          setMyGender(g);
          // UIが同性のみなら、保存側も新しい性別に合わせて再保存
          if (uiMode === 'same_gender') {
            try { await updateMyBuddyMode(toRawMode('same_gender', g)); } catch {}
          }
          load();
        })
        .subscribe();
    })();
    return () => { (async () => {
      try {
        if (ch) {
          const { supabase } = await import('../../../lib/supabase');
          supabase.removeChannel(ch);
        }
      } catch {}
    })(); };
  }, [myUserId, uiMode, load]);

  // ── スワイプ ───────────────
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const rot = useSharedValue(0);
  const isFlinging = useSharedValue(0);

  const hapticLight = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  const hapticSuccess = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

  const currentUid = useSharedValue('');
  useEffect(() => { currentUid.value = top?.profile.user_id ?? ''; }, [top]);

  const resetTop = () => {
    'worklet';
    tx.value = withSpring(0);
    ty.value = withSpring(0);
    rot.value = withSpring(0);
  };

  const setByIndex = useCallback((i: number) => {
    const cur = deck[i] ?? null;
    const nxt = deck[i + 1] ?? null;
    setTop(cur);
    setNext(nxt);
  }, [deck]);

  const advanceCard = useCallback(() => {
    indexRef.current += 1;

    const cur = deck[indexRef.current] ?? null;
    const nxt = deck[indexRef.current + 1] ?? null;
    setTop(cur);
    setNext(nxt);

    tx.value = 0; ty.value = 0; rot.value = 0;

    if (!cur && !nxt) {
      setTimeout(() => { load(); }, 50);
    }
  }, [deck, load, tx, ty, rot]);

  const afterRightSwipe = useCallback(async (userId: string) => {
    try {
      await sendLikeWithPrecheck(userId);
      const m = await fetchLatestMatchWith(userId);
      if (m?.id) {
        setCelebrate({ visible: true, matchId: m.id });
        await hapticSuccess();
      } else {
        await hapticLight();
      }
    } catch (e: any) {
      Alert.alert('送信エラー', e?.message ?? '不明なエラー');
    }
  }, []);

  const consumeAndFlingRight = useCallback(async (uid: string) => {
    if (!uid || isFlinging.value) return;
    if (total <= 0) { setOutOfLikes(true); resetTop(); return; }

    const ok = await consumeOne();
    if (!ok) { setOutOfLikes(true); resetTop(); return; }

    await afterRightSwipe(uid);

    isFlinging.value = 1;
    tx.value = withTiming(W * 1.2, { duration: 220 }, () => {
      isFlinging.value = 0;
      runOnJS(advanceCard)();
    });
    ty.value = withTiming(30, { duration: 220 });
    rot.value = withTiming(16, { duration: 220 });
  }, [total, consumeOne, afterRightSwipe, advanceCard, tx, ty, rot, setOutOfLikes]);

  const consumeAndFlingLeft = useCallback(async () => {
    if (isFlinging.value) return;
    if (total <= 0) { setOutOfLikes(true); resetTop(); return; }

    const ok = await consumeOne();
    if (!ok) { setOutOfLikes(true); resetTop(); return; }

    await hapticLight();

    isFlinging.value = 1;
    tx.value = withTiming(-W * 1.2, { duration: 220 }, () => {
      isFlinging.value = 0;
      runOnJS(advanceCard)();
    });
    ty.value = withTiming(30, { duration: 220 });
    rot.value = withTiming(-16, { duration: 220 });
  }, [total, consumeOne, advanceCard, tx, ty, rot, setOutOfLikes]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (isFlinging.value || !top) return;
      tx.value = e.translationX;
      ty.value = e.translationY;
      rot.value = (e.translationX / W) * 18;
    })
    .onEnd((e) => {
      if (isFlinging.value || !top) return;
      const vx = e.velocityX;
      const dx = e.translationX;

      if (dx > W * 0.25 || vx > 900) {
        const uid = currentUid.value;
        runOnJS(consumeAndFlingRight)(uid);
        return;
      }
      if (dx < -W * 0.25 || vx < -900) {
        runOnJS(consumeAndFlingLeft)();
        return;
      }
      resetTop();
    });

  const topStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rot.value}deg` },
      { scale: withSpring(1) },
    ],
  }));

  const nextStyle = useAnimatedStyle(() => ({
    opacity: withTiming(next ? 1 : 0, { duration: 150 }),
    transform: [{ scale: 1 }],
  }));

  const likeLabel = useAnimatedStyle(() => ({
    opacity: withTiming(Math.max(0, Math.min(1, tx.value / (W * 0.25))), { duration: 16 }),
    transform: [{ rotate: '-12deg' }],
  }));
  const nopeLabel = useAnimatedStyle(() => ({
    opacity: withTiming(Math.max(0, Math.min(1, -tx.value / (W * 0.25))), { duration: 16 }),
    transform: [{ rotate: '12deg' }],
  }));

  const tapLike = () => { if (top && !isFlinging.value) consumeAndFlingRight(top.profile.user_id); };
  const tapNope = () => { if (top && !isFlinging.value) consumeAndFlingLeft(); };

  // 未ログイン表示
  if (notAuthed) {
    return (
      <LinearGradient colors={['#0b1220', '#111827']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>合トレを使うにはログインが必要です</Text>
        <Text style={{ color: '#cbd5e1', marginTop: 8, textAlign: 'center' }}>
          「その他 → 設定」からログイン/アカウント作成を行ってください。
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/me')}
          style={{ marginTop: 16, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderRadius: 10 }}
        >
          <Text style={{ color: '#111', fontWeight: '800' }}>設定を開く</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  // ── 画面描画 ───────────────
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#0b1220', '#111827']} style={{ flex: 1 }}>
        {/* 上部：残りいいねバー＋右側に「受信」「条件」 */}
        <View onLayout={e => setLikeBarH(e.nativeEvent.layout.height)} style={{ position: 'relative' }}>
          <LikeStatusBar free={free} paid={paid} total={total} timeLeftMs={timeLeft ?? 0} />

          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/gotore/likes')} style={styles.inboxBtn}>
              <Text style={styles.inboxBtnText}>受信</Text>
              {inboxCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{Math.min(99, inboxCount)}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setFiltersOpen(true)} style={styles.filterBtn}>
              <Text style={styles.filterBtnText}>条件</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* デッキ（同位置・同スケール） */}
        <View style={{ flex: 1, alignItems: 'center', paddingTop: topPadding }}>
          {regionMissing ? (
            <View style={{ alignItems: 'center', paddingHorizontal: 24 }}>
              <View style={{ backgroundColor: '#FEF3C7', borderColor: '#F59E0B', borderWidth: 1, padding: 12, borderRadius: 12 }}>
                <Text style={{ color: '#92400E', fontWeight: '800', marginBottom: 4 }}>地域が未設定です</Text>
                <Text style={{ color: '#92400E' }}>
                  同じ都道府県の人だけ表示します。まずは地域を設定してください（上の「条件」→ 地域設定）。
                </Text>
              </View>
            </View>
          ) : !top ? (
            <View style={{ alignItems: 'center', paddingHorizontal: 24 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' }}>候補がありません</Text>
              <Text style={{ color: '#cbd5e1', marginTop: 8, textAlign: 'center', lineHeight: 20, width: '86%' }}>
                条件を広げるか、しばらくしてから</Text>
              <Text style={{ color: '#cbd5e1', marginTop: 8, textAlign: 'center', lineHeight: 20, width: '86%' }}>
                再度お試しください（上の「条件」から変更できます）。
              </Text>
            </View>
          ) : (
            <View style={{ width: W * 0.9, height: cardHeight, position: 'relative' }}>
              {next && (
                <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, nextStyle]}>
                  <ProfileCard c={next} height={cardHeight} />
                </Animated.View>
              )}

              <GestureDetector gesture={pan}>
                <Animated.View style={[StyleSheet.absoluteFillObject, topStyle]}>
                  <ProfileCard c={top} height={cardHeight} />
                  <Animated.View style={[styles.stampLike, likeLabel]}>
                    <Text style={styles.stampLikeText}>LIKE</Text>
                  </Animated.View>
                  <Animated.View style={[styles.stampNope, nopeLabel]}>
                    <Text style={styles.stampNopeText}>NOPE</Text>
                  </Animated.View>
                </Animated.View>
              </GestureDetector>
            </View>
          )}
        </View>

        {/* 下部アクション */}
        {!regionMissing && top && (
          <View style={{ flexDirection: 'row', gap: 20, justifyContent: 'center', marginBottom: 28 + insets.bottom }}>
            <TouchableOpacity onPress={tapNope} style={[styles.btnNope, total <= 0 && { opacity: 0.5 }]} disabled={total <= 0}>
              <Text style={{ fontSize: 22 }}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={tapLike} style={[styles.btnLike, total <= 0 && { opacity: 0.5 }]} disabled={total <= 0}>
              <Text style={{ fontSize: 22, color: '#fff' }}>♥</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* マッチ祝 */}
        {celebrate.visible && (
          <View style={{ ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' }}>
            <ConfettiCannon count={120} origin={{ x: W / 2, y: -20 }} fadeOut />
            <View style={styles.celebration}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', textAlign: 'center' }}>マッチしました！</Text>
              <View style={{ height: 10 }} />
              <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
                <TouchableOpacity
                  onPress={() => {
                    setCelebrate({ visible: false });
                    if (!next && !top) { load(); }
                  }}
                  style={styles.celeBtnPlain}
                >
                  <Text style={{ color: '#111', fontWeight: '800' }}>あとで</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const id = celebrate.matchId;
                    setCelebrate({ visible: false });
                    if (id) router.push(`/(tabs)/gotore/chat/${id}`);
                  }}
                  style={styles.celeBtnGo}
                >
                  <Text style={{ color: '#fff', fontWeight: '800' }}>チャットへ</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* 条件モーダル */}
        <Modal visible={filtersOpen} transparent animationType="fade" onRequestClose={() => setFiltersOpen(false)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' }} onPress={() => setFiltersOpen(false)}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ marginTop: 'auto' }}>
              <View style={{ backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 12 }}>条件</Text>

                <Text style={{ fontWeight: '800', marginBottom: 6 }}>マッチ対象</Text>
                {(['any','same_gender'] as UIMode[]).map(opt => {
                  const label = opt === 'any' ? '男女問わず' : sameLabel(myGender);
                  const disabled = opt === 'same_gender' && myGender === 'unknown';
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => !disabled && onChangeUIMode(opt)}
                      style={{ paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: disabled ? 0.5 : 1 }}
                    >
                      <Text style={{ fontSize: 16 }}>{label}</Text>
                      <Text>{opt === uiMode ? '✓' : ''}</Text>
                    </Pressable>
                  );
                })}
                {myGender === 'unknown' && (
                  <Text style={{ fontSize: 12, color: '#666' }}>
                    ※ 性別未設定です。本人確認で性別を設定すると「{sameLabel('unknown' as any)}」が選べます。
                  </Text>
                )}

                <View style={{ height: 10 }} />

                <Text style={{ fontWeight: '800', marginBottom: 6 }}>プロフィール設定</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => { setFiltersOpen(false); router.push('/(tabs)/me/account'); }}
                    style={{ paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 10 }}
                  >
                    <Text>地域設定</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { setFiltersOpen(false); router.push('/(tabs)/gotore/profile/edit'); }}
                    style={{ paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 10 }}
                  >
                    <Text>プロフィール編集</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ height: 14 }} />

                <Text style={{ fontWeight: '800', marginBottom: 6 }}>絞り込み</Text>
                <Text style={{ fontWeight: '700' }}>タグ（カンマ区切り）</Text>
                <TextInput value={tagsInput} onChangeText={setTagsInput} placeholder="例: ベンチ, デッド, スクワット" style={styles.input} />

                <View style={{ height: 12 }} />
                <Text style={{ fontWeight: '700' }}>ホームジム（部分一致）</Text>
                <TextInput value={gymQuery} onChangeText={setGymQuery} placeholder="例: 渋谷 / ゴールド" style={styles.input} />

                <View style={{ height: 12 }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: '700' }}>自分が「いいね済み」を隠す</Text>
                  <Switch value={hideLiked} onValueChange={setHideLiked} />
                </View>

                <View style={{ height: 12 }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: '700' }}>本人確認済のみ表示</Text>
                  <Switch value={verifiedOnly} onValueChange={setVerifiedOnly} />
                </View>

                <View style={{ height: 14 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => { setTagsInput(''); setGymQuery(''); setHideLiked(true); setVerifiedOnly(false); }}
                    style={{ paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 10 }}
                  >
                    <Text>リセット</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { setFiltersOpen(false); load(); }}
                    style={{ paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#111', borderRadius: 10 }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800' }}>この条件で表示</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Pressable>
        </Modal>

        {/* 購入モーダル */}
        {GOTORE_PURCHASE_ENABLED ? (
          <OutOfLikesModal
            visible={outOfLikes}
            onClose={() => setOutOfLikes(false)}
            onPurchased={async () => {
              await reloadLikes();
              setOutOfLikes(false);
            }}
          />
        ) : (
          <PurchaseComingSoonModal
            visible={outOfLikes}
            onClose={() => setOutOfLikes(false)}
          />
        )}

        {/* ロード中オーバーレイ */}
        {loading && (
          <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' }}>
            <ActivityIndicator color="#fff" />
            <Text style={{ color: '#ddd', marginTop: 8 }}>読み込み中…</Text>
          </View>
        )}

        {/* エラーバナー */}
        {fatal && (
          <View style={{
            position: 'absolute', left: 12, right: 12, bottom: 24,
            backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', borderWidth: 1,
            borderRadius: 12, padding: 12
          }}>
            <Text style={{ color: '#991B1B', fontWeight: '800' }}>読み込みに失敗しました</Text>
            <Text style={{ color: '#991B1B', marginTop: 4 }} numberOfLines={3}>{fatal}</Text>
          </View>
        )}
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}



function PurchaseComingSoonModal({
  visible,
  onClose,
}: { visible: boolean; onClose: () => void }) {
  if (!visible) return null;
  return (
    <View style={{ position:'absolute', inset:0 }}>
      <Pressable onPress={onClose} style={{ flex:1, backgroundColor:'rgba(0,0,0,0.35)' }} />
      <LinearGradient
        colors={['#0b1220', '#111827']}
        style={{
          position:'absolute', left:0, right:0, bottom:0,
          borderTopLeftRadius:16, borderTopRightRadius:16,
          padding:16, borderTopWidth:1, borderColor:'rgba(255,255,255,0.08)'
        }}
      >
        <Text style={{ color:'#fff', fontSize:18, fontWeight:'900', textAlign:'center' }}>
          いいね購入は現在準備中です
        </Text>
        <Text style={{ color:'#cbd5e1', marginTop:8, textAlign:'center', lineHeight:20 }}>
          初期リリースでは無料枠のみご利用いただけます。利用者の増加に合わせて購入機能を解放予定です。
        </Text>

        <View style={{ flexDirection:'row', justifyContent:'center', gap:10, marginTop:14 }}>
          <TouchableOpacity
            onPress={onClose}
            style={{ paddingHorizontal:14, paddingVertical:10, backgroundColor:'#fff', borderRadius:10 }}
          >
            <Text style={{ color:'#111', fontWeight:'800' }}>OK</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ color:'#94a3b8', marginTop:10, fontSize:12, textAlign:'center' }}>
          通知をONにすると、購入解放時にお知らせします。
        </Text>
      </LinearGradient>
    </View>
  );
}


const styles = StyleSheet.create({
  stampLike: { position: 'absolute', top: 24, left: 24, borderWidth: 4, borderColor: '#22c55e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  stampLikeText: { color: '#22c55e', fontSize: 20, fontWeight: '900' },
  stampNope: { position: 'absolute', top: 24, right: 24, borderWidth: 4, borderColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  stampNopeText: { color: '#ef4444', fontSize: 20, fontWeight: '900' },
  btnNope: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  btnLike: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' },
  celebration: { padding: 16, backgroundColor: 'rgba(17,17,17,0.9)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  celeBtnPlain: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff', borderRadius: 10 },
  celeBtnGo: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#22c55e', borderRadius: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginTop: 6 },
  filterFabText: { color: '#111', fontWeight: '800' },
  headerActions: {
    position: 'absolute',
    right: 12,
    top: 8,
    flexDirection: 'row',
    gap: 8,
  },
  inboxBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#0EA5E9',
  },
  inboxBtnText: { color: '#fff', fontWeight: '800' },
  badge: {
    position: 'absolute',
    top: -6, right: -6,
    minWidth: 18, height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#0b1220',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  filterBtnText: { color: '#111', fontWeight: '800' },
});
