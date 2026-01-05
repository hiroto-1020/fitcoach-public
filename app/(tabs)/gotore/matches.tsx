import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl,
  Image, Animated, Easing
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchMatchesWithUnread, type MatchRow } from '../../../lib/gotore/api';
import { supabase } from '../../../lib/supabase';
import { getFirstProfilePhotoUrl } from '../../../lib/gotore/profile-media';


import ComingSoon from '../../../components/gotore/ComingSoon';
import { GOTORE_ENABLED } from '../../../lib/featureFlags';

export default function MatchesScreen() {

  if (!GOTORE_ENABLED) {
    return <ComingSoon />;
  }



  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notAuthed, setNotAuthed] = useState(false);
  const [items, setItems] = useState<MatchRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        setNotAuthed(true);
        setItems([]);
        return;
      }
      setNotAuthed(false);
      const rows = await fetchMatchesWithUnread();
      setItems(rows);
    } catch (e: any) {
      Alert.alert('読み込みエラー', e?.message ?? '不明なエラー');
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const rows = await fetchMatchesWithUnread();
      setItems(rows);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(React.useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <LinearGradient colors={['#0b1220', '#111827']} style={{ flex: 1, alignItems:'center', justifyContent:'center' }}>
        <ActivityIndicator color="#fff" />
        <Text style={{ marginTop: 8, color:'#cbd5e1' }}>読み込み中…</Text>
      </LinearGradient>
    );
  }

  if (notAuthed) {
    return (
      <LinearGradient colors={['#0b1220', '#111827']} style={{ flex:1, alignItems:'center', justifyContent:'center', padding:16 }}>
        <Text style={{ fontSize:16, fontWeight:'700', color:'#fff' }}>マッチ一覧を表示するにはログインが必要です</Text>
        <Text style={{ color:'#cbd5e1', marginTop:8, textAlign:'center' }}>
          「その他 → 設定」からログイン/アカウント作成を行ってください。
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/me')}
          style={{ marginTop:16, paddingHorizontal:16, paddingVertical:10, backgroundColor:'#fff', borderRadius:10 }}
        >
          <Text style={{ color:'#111', fontWeight:'800' }}>設定を開く</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0b1220', '#111827']} style={{ flex:1 }}>
      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding:12, paddingBottom:24 }}
        ListHeaderComponent={
          <Text style={{ color:'#cbd5e1', opacity:0.9, marginVertical:8, marginLeft:4, fontWeight:'700' }}>
            マッチ {items.length} 件
          </Text>
        }
        ListEmptyComponent={
          <View style={{ alignItems:'center', marginTop:40 }}>
            <Text style={{ fontSize:16, fontWeight:'700', color:'#fff' }}>マッチはまだありません</Text>
            <Text style={{ color:'#94a3b8', marginTop:8 }}>「探す」で相互いいねになると表示されます。</Text>
          </View>
        }
        renderItem={({ item }) => (
          <MatchCard
            item={item}
            onPress={() => router.push(`/(tabs)/gotore/chat/${item.id}`)}
          />
        )}
      />
    </LinearGradient>
  );
}

function MatchCard({ item, onPress }: { item: MatchRow; onPress: () => void }) {
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const uid = (item as any).other_user_id as string | undefined;
    if (!uid) { setPhoto(null); return; }
    (async () => {
      try {
        const url = await getFirstProfilePhotoUrl(uid);
        if (alive) setPhoto(url ?? null);
      } catch { if (alive) setPhoto(null); }
    })();
    return () => { alive = false; };
  }, [item]);

  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();

  const unread = item.unread_count > 0;

  return (
    <Animated.View style={{
      transform: [{ scale }],
      marginBottom: 12,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
    }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={onPress}
      >
        <LinearGradient
          colors={['#1f2937', '#2b375c']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ padding: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <View style={{ flexDirection:'row', alignItems:'center' }}>
            <View style={{ marginRight: 12 }}>
              <Avatar photo={photo} name={item.other_nickname} glow={unread} />
            </View>

            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={{ flexDirection:'row', alignItems:'center' }}>
                <Text
                  numberOfLines={1}
                  style={{ color:'#fff', fontSize:16, fontWeight:'900', maxWidth:'78%' }}
                >
                  {item.other_nickname ?? '名無し'}
                </Text>

                {unread && (
                  <View style={{
                    marginLeft: 8, paddingHorizontal:8, height:22, borderRadius:11,
                    backgroundColor:'#ef4444', alignItems:'center', justifyContent:'center'
                  }}>
                    <Text style={{ color:'#fff', fontWeight:'800', fontSize:12 }}>{item.unread_count}</Text>
                  </View>
                )}
              </View>

              <Text style={{ color:'#cbd5e1', marginTop: 4 }}>
                最終更新：{item.last_message_at ? formatTime(item.last_message_at) : '—'}
              </Text>

              <Text
                numberOfLines={1}
                style={{ marginTop: 6, color: unread ? '#ffffff' : '#e2e8f0', opacity: unread ? 1 : 0.85, fontWeight: unread ? '800' as const : '600' as const }}
              >
                {unread ? '新着メッセージがあります' : 'チャットを開く ›'}
              </Text>
            </View>

            <Text style={{ color:'#cbd5e1', fontSize:20, marginLeft: 4 }}>›</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

function Avatar({ photo, name, glow }: { photo: string | null; name?: string | null; glow?: boolean }) {
  const initials = (name ?? '').trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(s => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  return (
    <LinearGradient
      colors={glow ? ['#ef4444', '#f59e0b'] : ['#475569', '#334155']}
      style={{ width: 56, height: 56, borderRadius: 28, alignItems:'center', justifyContent:'center' }}
    >
      <View style={{
        width: 52, height: 52, borderRadius: 26, overflow:'hidden',
        backgroundColor: '#0b1020', alignItems:'center', justifyContent:'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'
      }}>
        {photo ? (
          <Image source={{ uri: photo }} style={{ width: 52, height: 52 }} resizeMode="cover" />
        ) : (
          <Text style={{ color:'#cbd5e1', fontWeight:'900' }}>{initials}</Text>
        )}
      </View>
    </LinearGradient>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}/${m}/${day} ${hh}:${mm}`;
}
