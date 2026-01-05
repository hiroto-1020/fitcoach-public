// app/(tabs)/gotore/likes/index.tsx
//もらったいいね一覧
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert,
  RefreshControl, Image, StyleSheet
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import dayjs from 'dayjs';
import 'dayjs/locale/ja';
dayjs.locale('ja');

import {
  fetchReceivedLikes,
  acceptReceivedLike,
  fetchLatestMatchWith,
  subscribeReceivedLikes,
  dismissReceivedLike,
  ReceivedLike,
} from '../../../../lib/gotore/api';

import { getFirstProfilePhotoUrl, fetchGenderForUser, labelGender } from '../../../../lib/gotore/profile-media';



function timeAgo(iso: string) {
  const d = dayjs(iso);
  const min = dayjs().diff(d, 'minute');
  if (min < 60) return `${min}分前`;
  const h = dayjs().diff(d, 'hour');
  if (h < 24) return `${h}時間前`;
  const dd = dayjs().diff(d, 'day');
  if (dd < 7) return `${dd}日前`;
  return d.format('YYYY/MM/DD');
}

function LikeRow({
  item,
  busy,
  onAccept,
  onSkip,
}: {
  item: ReceivedLike;
  busy: boolean;
  onAccept: (uid: string) => void;
  onSkip: (uid: string) => void;
}) {
  const router = useRouter();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [gender, setGender] = useState<string>(item.gender ?? 'unknown');

  // 1枚目のプロフィール写真を取得
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const url = await getFirstProfilePhotoUrl(item.from_user_id);
        if (alive) setPhotoUrl(url ?? null);
      } catch {
        if (alive) setPhotoUrl(null);
      }
    })();
    return () => { alive = false; };
  }, [item.from_user_id]);

  // 性別が unknown ならユーザー側から取得して正規化
  useEffect(() => {
    if (gender && gender !== 'unknown') return;
    let alive = true;
    (async () => {
      try {
        const g = await fetchGenderForUser(item.from_user_id); // 'male' | 'female' | 'other' | 'unknown'
        if (alive) setGender(g ?? 'unknown');
      } catch {
        if (alive) setGender('unknown');
      }
    })();
    return () => { alive = false; };
  }, [item.from_user_id, gender]);

  const genderLabel = labelGender(gender as any);

  return (
    <View style={styles.card}>
      {/* 左：サムネイル（筋トレ感のアクセントリング） */}
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/(tabs)/gotore/users/[userId]', params: { userId: item.from_user_id } })}
        style={styles.thumbWrap}
        disabled={busy}
      >
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Text style={{ color: '#94a3b8', fontSize: 18 }}>🏋️</Text>
          </View>
        )}
        <View style={styles.thumbRing} />
      </TouchableOpacity>

      {/* 右：テキスト＆操作 */}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/(tabs)/gotore/users/[userId]', params: { userId: item.from_user_id } })}
          disabled={busy}
        >
          <Text style={styles.name} numberOfLines={1}>
            {item.nickname ?? '名無し'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.meta} numberOfLines={1}>
          受信：{timeAgo(item.created_at)}　/　性別：{genderLabel}
        </Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => onAccept(item.from_user_id)}
            disabled={busy}
            style={[styles.primaryBtn, busy && { opacity: 0.7 }]}
          >
            {busy ? <ActivityIndicator color="#0b1120" /> : <Text style={styles.primaryBtnText}>承認してマッチ</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onSkip(item.from_user_id)} style={styles.ghostBtn} disabled={busy}>
            <Text style={styles.ghostBtnText}>今回はスキップ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function LikesInboxScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ReceivedLike[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchReceivedLikes();
      setItems(list);
    } catch (e: any) {
      Alert.alert('取得エラー', e?.message ?? '不明なエラー');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Realtime：新規/削除/更新があれば再取得
  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      try {
        unsub = await subscribeReceivedLikes?.(async () => {
          const list = await fetchReceivedLikes();
          setItems(list);
        });
      } catch {
        // サブスク非対応 or 失敗は無視
      }
    })();
    return () => { if (unsub) unsub(); };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const list = await fetchReceivedLikes();
      setItems(list);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const accept = useCallback(async (userId: string) => {
    if (busyId) return;
    setBusyId(userId);
    try {
      const { sent, match_id } = await acceptReceivedLike(userId);
      if (!sent) {
        Alert.alert('承認できません', '条件不一致またはブロック関係のため承認できません。');
        return;
      }
      // 楽観更新
      setItems(prev => prev.filter(i => i.from_user_id !== userId));

      // 既に相互成立ならチャットへ
      let mid = match_id ?? null;
      if (!mid) {
        await new Promise(r => setTimeout(r, 400));
        const m = await fetchLatestMatchWith(userId);
        mid = m?.id ?? null;
      }
      if (mid) {
        Alert.alert('マッチしました！', '', [
          { text: 'チャットへ', onPress: () => router.push(`/(tabs)/gotore/chat/${mid}`) },
          { text: 'OK' },
        ]);
      } else {
        Alert.alert('承認しました', '相手もあなたを承認するとマッチします。');
      }
    } catch (e: any) {
      Alert.alert('エラー', e?.message ?? '承認に失敗しました。');
    } finally {
      setBusyId(null);
    }
  }, [busyId, router]);

  const skip = useCallback(async (userId: string) => {
    setItems(prev => prev.filter(i => i.from_user_id !== userId));
    try { await dismissReceivedLike(userId); } catch {}
  }, []);

  if (loading) {
    return (
      <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color="#fff" />
        <Text style={{ color: '#cbd5e1', marginTop: 8 }}>読み込み中…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '受け取ったいいね',
          headerStyle: { backgroundColor: '#0b1120' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '800' },
        }}
      />

      <FlatList
        data={items}
        keyExtractor={(it) => it.from_user_id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#e5e7eb' }}>新しい「いいね」はありません</Text>
            <Text style={{ color: '#94a3b8', marginTop: 8, textAlign: 'center' }}>
              「探す」で条件を広げると出会いやすくなります。
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <LikeRow
            item={item}
            busy={busyId === item.from_user_id}
            onAccept={accept}
            onSkip={skip}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b1120' }, // ダーク基調（筋トレアプリの世界観）
  card: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#0f172a', // Slate-900
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.15)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  thumbWrap: { width: 64, height: 64, position: 'relative' },
  thumb: { width: 64, height: 64, borderRadius: 12 },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b1020' },
  // ダンベル色のアクセントリング
  thumbRing: {
    position: 'absolute',
    inset: -2,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#22c55e',
    opacity: 0.9,
  },
  name: { color: '#fff', fontSize: 16, fontWeight: '900' },
  meta: { color: '#93c5fd', marginTop: 4, fontWeight: '700' }, // 青みアクセント
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  primaryBtn: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10,
    minWidth: 130,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#0b1120', fontWeight: '900' },
  ghostBtn: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(148,163,184,0.35)',
    backgroundColor: 'rgba(148,163,184,0.08)',
  },
  ghostBtnText: { color: '#e5e7eb', fontWeight: '800' },
});
