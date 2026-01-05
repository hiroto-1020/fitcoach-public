// app/(tabs)/gotore/profile/edit.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Alert,
  ActivityIndicator, Platform, KeyboardAvoidingView, StyleSheet, Pressable
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../../../lib/supabase';

// API（統一版）
import {
  getMyProfileAndGender,
  saveMyProfile,
  saveProfilePhotos,
  updateMyGender,
  uploadProfilePhoto
} from "../../../../lib/gotore/api";

import ReorderablePhotos from "../../../../components/gotore/ReorderablePhotos";
import type { Gender } from '../../../../lib/gotore/types';

// 画像ピッカー（動的 import）
let ImagePicker: any = null; try { ImagePicker = require('expo-image-picker'); } catch {}

const PROFILE_BUCKET = 'profile-photos';
const MAX = 5;

/** 公開URL → object key（Storage削除用） */
function publicUrlToObjectKey(publicUrl: string): string | null {
  const marker = `/object/public/${PROFILE_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.substring(idx + marker.length);
}

/** 文字→数値（最初の整数を抽出） */
const toInt = (v: any) => {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const m = String(v).match(/\d+/);
  return m ? Number(m[0]) : null;
};

export default function ProfileEdit() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // === 入力state ===
  const [gender, setGender] = useState<Gender>('unknown');
  const [nickname, setNickname] = useState('');
  const [homeGym, setHomeGym] = useState('');
  const [region, setRegion] = useState<string | null>(null);
  const [tags, setTags] = useState<string>('');
  const [bio, setBio] = useState('');
  const [trainingYears, setTrainingYears] = useState<string>('');
  const [goal, setGoal] = useState('');               // 新カラム
  const [freqPerWeek, setFreqPerWeek] = useState(''); // 新カラム（数値）
  const [height, setHeight] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);

  // 読み込み
  useEffect(() => {
    (async () => {
      try {
        const { profile, gender: g } = await getMyProfileAndGender();
        setGender((g as Gender) ?? 'unknown');

        setNickname(profile?.nickname ?? '');
        setHomeGym(profile?.home_gym_location ?? '');
        setRegion((profile as any)?.region ?? null);
        setTags(Array.isArray(profile?.preferred_training_tags) ? profile.preferred_training_tags.join(', ') : '');
        setBio(profile?.bio ?? '');
        setTrainingYears(profile?.training_years != null ? String(profile.training_years) : '');

        // 正規化後の新カラム（旧goals/availability/training_frequencyはAPI側で吸収）
        setGoal((profile as any)?.goal ?? '');
        setFreqPerWeek(
          (profile as any)?.training_frequency_per_week != null
            ? String((profile as any).training_frequency_per_week)
            : ''
        );
        setHeight(profile?.height_cm != null ? String(profile.height_cm) : '');
        setPhotos(((profile as any)?.photos ?? []) as string[]);
      } catch (e: any) {
        Alert.alert('読み込みエラー', e?.message ?? '不明なエラー');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /** 写真追加（アップロード→即保存） */
  // /app/(tabs)/gotore/profile/edit.tsx
  // 画像追加（アップロード→DB保存）：位置調整ON & 正方形クロップ
  const pickAndUpload = useCallback(async () => {
    if (!ImagePicker) {
      Alert.alert('画像機能が未導入', 'expo-image-picker を導入してください。\n\nnpx expo install expo-image-picker');
      return;
    }
    if (photos.length >= MAX) return;

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync?.();
    if (perm && perm.status !== 'granted') return;

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: true,   // ← 位置調整（クロップ）を有効化
      aspect: [1, 1],        // ← 正方形トリミング（Androidで有効。iOSはUIで手動調整）
    });
    if (res.canceled) return;

    try {
      const uri = res.assets?.[0]?.uri;
      if (!uri) return;

      const publicUrl = await uploadProfilePhoto(uri);
      const next = [...photos, publicUrl].slice(0, MAX); // 末尾に追加（必要なら先頭追加に変更OK）
      setPhotos(next);
      await saveProfilePhotos(next);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e: any) {
      Alert.alert('アップロードに失敗しました', String(e?.message ?? 'unknown'));
    }
  }, [photos]);


  /** 並び替え/削除後に即保存（削除された画像は Storage からも削除） */
  const onPhotosChange = useCallback(async (next: string[]) => {
    const capped = next.slice(0, MAX);

    // 削除されたURLを検出
    const removed = photos.filter(u => !capped.includes(u));
    if (removed.length) {
      const keys = removed.map(publicUrlToObjectKey).filter((k): k is string => !!k);
      if (keys.length) {
        // Storage からも削除（失敗は握りつぶし）
        await supabase.storage.from(PROFILE_BUCKET).remove(keys).catch(() => {});
      }
    }

    setPhotos(capped);
    try { await saveProfilePhotos(capped); } catch {}
  }, [photos]);

  // 保存（新カラムで保存）
  const onSaveAll = async () => {
    try {
      const payload = {
        nickname: nickname.trim() || null,
        home_gym_location: homeGym.trim() || null,
        preferred_training_tags: tags.split(',').map(s => s.trim()).filter(Boolean),
        region: region && region.trim() ? region.trim() : null,
        bio: bio.trim() || null,
        training_years: trainingYears ? toInt(trainingYears) : null,
        height_cm: height ? toInt(height) : null,
        // ★統一：goal / training_frequency_per_week
        goal: goal.trim() || null,
        training_frequency_per_week: freqPerWeek ? toInt(freqPerWeek) : null,
        photos, // 同時に送ってOK（saveProfilePhotosでも保持）
      } as any;

      await saveMyProfile(payload);
      await updateMyGender(gender); // 性別も保存

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('保存しました', 'プロフィールを更新しました。');
      router.back();
    } catch (e: any) {
      Alert.alert('保存エラー', e?.message ?? '不明なエラー');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>読み込み中…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'プロフィール編集' }} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* 性別（ラジオ/セグメント） */}
        <Text style={styles.label}>性別</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
          {(['male', 'female', 'other'] as Gender[]).map((g) => (
            <Pressable
              key={g}
              onPress={() => setGender(g)}
              style={[styles.segment, gender === g && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, gender === g && styles.segmentTextActive]}>
                {g === 'male' ? '男性' : g === 'female' ? '女性' : 'その他'}
              </Text>
            </Pressable>
          ))}
          {/* 未設定に戻す */}
          <Pressable
            onPress={() => setGender('unknown')}
            style={[styles.segment, gender === 'unknown' && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, gender === 'unknown' && styles.segmentTextActive]}>未設定</Text>
          </Pressable>
        </View>

        {/* 写真：共通部品（←→並び替え／先頭へ／削除／＋追加） */}
        <Text style={styles.label}>写真（最大5枚）</Text>
        <ReorderablePhotos
          photos={photos}
          max={5}
          onChange={onPhotosChange}
          onPick={pickAndUpload}
        />

        <Text style={styles.label}>ニックネーム</Text>
        <TextInput value={nickname} onChangeText={setNickname} style={styles.box} placeholder="例: ヒロト" />

        <Text style={styles.label}>ホームジム</Text>
        <TextInput value={homeGym} onChangeText={setHomeGym} style={styles.box} placeholder="例: エニタイム博多駅南" />

        <Text style={styles.label}>地域（都道府県など）</Text>
        <TextInput value={region ?? ''} onChangeText={(v) => setRegion(v || null)} style={styles.box} placeholder="例: 福岡県" />

        <Text style={styles.label}>得意/希望タグ（カンマ区切り）</Text>
        <TextInput value={tags} onChangeText={setTags} style={styles.box} placeholder="例: ベンチ, 減量, 早朝" />

        <Text style={styles.label}>自己紹介</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          style={[styles.box, { height: 100, textAlignVertical: 'top' }]}
          multiline
          placeholder="初めまして！…"
        />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>トレ歴（年）</Text>
            <TextInput
              value={trainingYears}
              onChangeText={setTrainingYears}
              style={styles.box}
              keyboardType="number-pad"
              placeholder="例: 3"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>身長(cm)</Text>
            <TextInput
              value={height}
              onChangeText={setHeight}
              style={styles.box}
              keyboardType="number-pad"
              placeholder="例: 176"
            />
          </View>
        </View>

        <Text style={styles.label}>目標</Text>
        <TextInput value={goal} onChangeText={setGoal} style={styles.box} placeholder="例: 3ヶ月で-5kg / 大会入賞 など" />

        <Text style={styles.label}>頻度（週あたりの回数）</Text>
        <TextInput
          value={freqPerWeek}
          onChangeText={setFreqPerWeek}
          style={styles.box}
          keyboardType="number-pad"
          placeholder="例: 3"
        />

        <TouchableOpacity onPress={onSaveAll} style={styles.primaryBtn}>
          <Text style={{ color: '#fff', fontWeight: '800' }}>保存する</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontWeight: '700', marginTop: 8 },
  box: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', marginTop: 6
  },
  primaryBtn: {
    marginTop: 16, paddingVertical: 12, backgroundColor: '#111',
    borderRadius: 12, alignItems: 'center'
  },
  // 性別セグメント
  segment: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  segmentActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  segmentText: { color: '#111', fontWeight: '800' },
  segmentTextActive: { color: '#fff' },
});
