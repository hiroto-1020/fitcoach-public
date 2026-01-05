import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, SafeAreaView, Modal, Pressable, Image, Animated, Dimensions
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import ImageView from 'react-native-image-viewing';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';

import {
  fetchMessages, fetchMessagesPage, sendMessage, markReadAll, subscribeMessages,
  sendImageMessage, getMe, ChatMessage, getMatchOtherUser, blockUser, unmatch,
  deleteMyMessage
} from '../../../../lib/gotore/api';
import { getFirstProfilePhotoUrl } from '../../../../lib/gotore/profile-media';


import ComingSoon from "../../../../components/gotore/ComingSoon";
import { GOTORE_ENABLED } from "../../../../lib/featureFlags";

let ImagePicker: any = null;
let Manipulator: any = null;
let FileSystem: any = null;
let MediaLibrary: any = null;
let Sharing: any = null;
try { ImagePicker   = require('expo-image-picker'); } catch {}
try { Manipulator   = require('expo-image-manipulator'); } catch {}
try { FileSystem    = require('expo-file-system'); } catch {}
try { MediaLibrary  = require('expo-media-library'); } catch {}
try { Sharing       = require('expo-sharing'); } catch {}

type SendState = 'idle' | 'sending' | 'sending_image';
const INPUT_BAR_HEIGHT = 56;

export default function ChatScreen() {


  if (!GOTORE_ENABLED) {
    return <ComingSoon />;
  }




  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const mid = String(matchId);

  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [meId, setMeId] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerPhoto, setPartnerPhoto] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sendState, setSendState] = useState<SendState>('idle');
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const focusedRef = useRef(true);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  const [contextOpen, setContextOpen] = useState(false);
  const [ctxTarget, setCtxTarget] = useState<ChatMessage | null>(null);

  const oldestAt = useMemo(() => messages[0]?.created_at, [messages]);
  const [hasMore, setHasMore] = useState(false);
  const PAGE_SIZE = 30;

  const [atBottom, setAtBottom] = useState(true);

  useEffect(() => { (async () => {
    const me = await getMe(); setMeId(me?.id ?? null);
    const other = await getMatchOtherUser(mid).catch(() => null);
    setPartnerId(other ?? null);
    if (other) {
      try {
        const url = await getFirstProfilePhotoUrl(other);
        setPartnerPhoto(url ?? null);
      } catch {}
    }
  })(); }, [mid]);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchMessages(mid);
      setMessages(rows);
      setHasMore(rows.length >= PAGE_SIZE);
      scrollToEnd();
      await markReadAll(mid);
    } catch (e: any) {
      Alert.alert('読み込みエラー', e?.message ?? '不明なエラー');
    } finally { setLoading(false); }
  }, [mid, scrollToEnd]);

  useEffect(() => {
    focusedRef.current = true;
    loadInitial();
    return () => { focusedRef.current = false; };
  }, [loadInitial]);

  useEffect(() => {
    if (!mid) return;
    const unsub = subscribeMessages(
      mid,
      async (msg) => {
        setMessages((prev) => [...prev, msg]);
        if (atBottom) scrollToEnd();
        if (focusedRef.current && meId && msg.from_user !== meId) {
          await markReadAll(mid);
        }
      },
      (msg) => setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)))
    );
    return () => unsub();
  }, [mid, meId, atBottom, scrollToEnd]);

  const onSend = useCallback(async () => {
    const body = (text ?? '').trim();
    if (!body || !mid || sendState !== 'idle') return;
    setSendState('sending');
    try {
      await sendMessage(mid, body);
      setText('');
      scrollToEnd();
    } catch (e: any) {
      Alert.alert('送信エラー', e?.message ?? '不明なエラー');
    } finally { setSendState('idle'); }
  }, [text, mid, sendState, scrollToEnd]);

  const onSendImage = useCallback(async () => {
    if (!ImagePicker) {
      Alert.alert('画像機能が未導入', 'expo-image-picker を導入してください。\n\nnpx expo install expo-image-picker');
      return;
    }
    if (!mid || sendState !== 'idle') return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync?.();
      if (perm && perm.status !== 'granted') return;

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: false,
        copyToCacheDirectory: true,
      });
      if (res?.canceled) return;

      const asset = res.assets?.[0];
      if (!asset?.uri) return;

      let uploadUri = asset.uri;

      if (Manipulator) {
        const maxDim = 1600;
        const w = asset.width || 0;
        const h = asset.height || 0;
        const scale = w && h ? Math.min(1, maxDim / Math.max(w, h)) : 1;
        const target = (w && h && scale < 1)
          ? { width: Math.round(w * scale), height: Math.round(h * scale) }
          : undefined;

        const manipulated = await Manipulator.manipulateAsync(
          asset.uri,
          target ? [{ resize: target }] : [],
          { compress: 0.8, format: Manipulator.SaveFormat.JPEG }
        );
        uploadUri = manipulated.uri;
      }

      setSendState('sending_image');
      await sendImageMessage(mid, uploadUri);
      scrollToEnd();
    } catch (e: any) {
      Alert.alert('画像送信エラー', e?.message ?? '不明なエラー');
    } finally { setSendState('idle'); }
  }, [mid, sendState, scrollToEnd]);

  const loadOlder = useCallback(async () => {
    if (!oldestAt) return;
    try {
      const rows = await fetchMessagesPage(mid, oldestAt, PAGE_SIZE);
      if (rows.length === 0) { setHasMore(false); return; }
      setMessages((prev) => [...rows, ...prev]);
      setHasMore(rows.length >= PAGE_SIZE);
    } catch (e: any) { Alert.alert('取得エラー', e?.message ?? '不明なエラー'); }
  }, [mid, oldestAt]);

  const onCopy = useCallback(async (str?: string | null) => {
    const s = (str ?? '').trim();
    if (!s) return;
    try { await Clipboard.setStringAsync(s); Alert.alert('コピーしました'); } catch {}
  }, []);

  const ensureMediaPermission = useCallback(async () => {
    if (!MediaLibrary) return false;
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  }, []);

  const saveImageToLibrary = useCallback(async (url: string) => {
    if (!FileSystem || !MediaLibrary) return;
    const ok = await ensureMediaPermission();
    if (!ok) { Alert.alert('保存できません', '写真へのアクセスを許可してください。'); return; }
    const fileUri = FileSystem.cacheDirectory + `chat_${Date.now()}.jpg`;
    const { uri } = await FileSystem.downloadAsync(url, fileUri);
    await MediaLibrary.saveToLibraryAsync(uri);
    Alert.alert('保存しました');
  }, [ensureMediaPermission]);

  const shareImage = useCallback(async (url: string) => {
    if (!FileSystem) return;
    const fileUri = FileSystem.cacheDirectory + `share_${Date.now()}.jpg`;
    const { uri } = await FileSystem.downloadAsync(url, fileUri);
    if (Sharing && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(uri);
    } else {
      Alert.alert('共有できません', 'この端末では共有が利用できません。');
    }
  }, []);

  const openContext = useCallback((msg: ChatMessage) => { setCtxTarget(msg); setContextOpen(true); }, []);
  const closeContext = useCallback(() => { setContextOpen(false); setCtxTarget(null); }, []);
const { width: W } = Dimensions.get('window');

const BUBBLE_MAX = Math.min(420, Math.round(W * 0.78));
  const renderItem = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      const mine = item.from_user === meId;
      const imgUrl = item.attachments?.images?.[0]?.url as string | undefined;

      const isLastOfBlock = (() => {
        const next = messages[index + 1];
        return !next || next.from_user !== item.from_user;
      })();

      return (
        <View style={{ paddingHorizontal: 12, marginTop: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
            {!mine && isLastOfBlock ? (
              <View style={{ marginRight: 8 }}>
                <Avatar size={28} photo={partnerPhoto} />
              </View>
            ) : !mine ? <View style={{ width: 36 }} /> : null}

            <View style={{ maxWidth: BUBBLE_MAX, flexShrink: 1 }}>
              {imgUrl ? (
                <TouchableOpacity activeOpacity={0.9} onPress={() => setPreviewUrl(imgUrl)} onLongPress={() => openContext(item)}>
                  <View style={mine ? styles.myImageWrap : styles.otherImageWrap}>
                    <Image source={{ uri: imgUrl }} style={{ width: 220, height: 220, borderRadius: 12 }} resizeMode="cover" />
                  </View>
                </TouchableOpacity>
              ) : mine ? (
                <LinearGradient
                  colors={['#1f2937', '#2b375c']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.myBubble}
                >
                  <TouchableOpacity activeOpacity={0.85} onLongPress={() => openContext(item)}>
                    <Text style={{ color: '#fff', lineHeight: 20 }}>{item.text ?? ''}</Text>
                    {item.read_at && <Text style={styles.readMark}>既読</Text>}
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <View style={styles.otherBubble}>
                  <TouchableOpacity activeOpacity={0.85} onLongPress={() => openContext(item)}>
                    <Text style={{ color: '#0b1220', lineHeight: 20 }}>{item.text ?? ''}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      );
    },
    [meId, messages, openContext, partnerPhoto]
  );

  const doBlock = useCallback(async () => {
    try {
      setActionBusy(true);
      const otherId = await getMatchOtherUser(mid);
      await blockUser(otherId);
      Alert.alert('ブロックしました', '今後この相手からは表示・連絡されません。');
    } catch (e: any) {
      Alert.alert('エラー', e?.message ?? 'ブロックに失敗しました。');
    } finally { setActionBusy(false); setMenuOpen(false); }
  }, [mid]);

  const doUnmatch = useCallback(async () => {
    try {
      setActionBusy(true);
      await unmatch(mid);
      Alert.alert('マッチを解除しました');
    } catch (e: any) {
      Alert.alert('エラー', e?.message ?? 'マッチ解除に失敗しました。');
    } finally { setActionBusy(false); setMenuOpen(false); }
  }, [mid]);

  const doCopyCtx = useCallback(async () => {
    if (!ctxTarget?.text) { closeContext(); return; }
    await onCopy(ctxTarget.text);
    closeContext();
  }, [ctxTarget, onCopy, closeContext]);

  const doForwardPrep = useCallback(() => {
    Alert.alert('転送準備', 'このメッセージを転送するUIは次のスプリントで実装予定です。');
    closeContext();
  }, [closeContext]);

  const doDeleteCtx = useCallback(async () => {
    if (!ctxTarget) return;
    const id = ctxTarget.id;
    closeContext();
    Alert.alert('削除しますか？', 'この操作は取り消せません。', [
      { text: 'キャンセル' },
      {
        text: '削除する', style: 'destructive', onPress: async () => {
          try {
            await deleteMyMessage(id);
            setMessages(prev => prev.filter(m => m.id !== id));
          } catch (e: any) {
            Alert.alert('削除できません', e?.message ?? '権限がないか、既に削除されています。');
          }
        }
      }
    ]);
  }, [ctxTarget, closeContext]);

  const doSaveImage = useCallback(async () => {
    const url = ctxTarget?.attachments?.images?.[0]?.url as string | undefined;
    if (!url) { closeContext(); return; }
    try { await saveImageToLibrary(url); } catch {}
    closeContext();
  }, [ctxTarget, saveImageToLibrary, closeContext]);

  const doShareImage = useCallback(async () => {
    const url = ctxTarget?.attachments?.images?.[0]?.url as string | undefined;
    if (!url) { closeContext(); return; }
    try { await shareImage(url); } catch {}
    closeContext();
  }, [ctxTarget, shareImage, closeContext]);

  const onScroll = useCallback((e: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const bottomGap = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    setAtBottom(bottomGap < 40);
  }, []);

  if (loading) {
    return (
      <LinearGradient colors={['#0b1220', '#111827']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#fff" />
        <Text style={{ marginTop: 8, color:'#cbd5e1' }}>読み込み中…</Text>
      </LinearGradient>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'チャット',
          headerRight: () => (
            <TouchableOpacity onPress={() => setMenuOpen(true)} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
              <Text style={{ fontSize: 18 }}>⋯</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <LinearGradient colors={['#0b1220', '#111827']} style={{ flex: 1 }}>
        {hasMore && (
          <TouchableOpacity
            onPress={loadOlder}
            style={styles.loadMore}
          >
            <Text style={{ color:'#0b1220', fontWeight:'800' }}>過去のメッセージを読み込む</Text>
          </TouchableOpacity>
        )}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: INPUT_BAR_HEIGHT + insets.bottom + 12 }}
          onContentSizeChange={() => atBottom && scrollToEnd()}
          onScroll={onScroll}
          scrollEventThrottle={16}
        />

        {!atBottom && (
          <TouchableOpacity
            onPress={scrollToEnd}
            activeOpacity={0.9}
            style={styles.scrollFab}
          >
            <Text style={{ color:'#fff', fontWeight:'900' }}>↓</Text>
          </TouchableOpacity>
        )}

        <View style={{
          padding: 8,
          paddingBottom: Math.max(8, insets.bottom),
          borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
          backgroundColor: 'rgba(10,14,28,0.9)',
          flexDirection: 'row', alignItems: 'center',
        }}>
          <TouchableOpacity
            onPress={onSendImage}
            disabled={sendState !== 'idle'}
            style={{ padding: 10, marginRight: 6, opacity: sendState === 'idle' ? 1 : 0.5 }}
          >
            <Text style={{ fontWeight: '900', color:'#cbd5e1' }}>＋</Text>
          </TouchableOpacity>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="メッセージを入力"
            placeholderTextColor="#94a3b8"
            multiline
            style={{
              flex: 1,
              minHeight: INPUT_BAR_HEIGHT - 8,
              maxHeight: 120,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
              borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
              backgroundColor: 'rgba(255,255,255,0.04)',
              color: '#fff'
            }}
            returnKeyType="send"
            onSubmitEditing={onSend}
          />
          <TouchableOpacity
            onPress={onSend}
            disabled={sendState !== 'idle' || !text.trim()}
            style={{
              marginLeft: 8, paddingHorizontal: 16, height: INPUT_BAR_HEIGHT - 8,
              backgroundColor: '#22c55e', borderRadius: 12,
              alignItems: 'center', justifyContent: 'center',
              opacity: sendState !== 'idle' || !text.trim() ? 0.6 : 1,
              shadowColor: '#22c55e', shadowOpacity: 0.7, shadowRadius: 10, shadowOffset:{width:0,height:4}, elevation: 6
            }}
          >
            <Text style={{ color: '#0b1220', fontWeight: '900' }}>
              {sendState === 'sending' ? '送信中…' : sendState === 'sending_image' ? '画像中…' : '送信'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' }} onPress={() => setMenuOpen(false)}>
          <View style={{ marginTop: 'auto', backgroundColor: '#fff', padding: 12, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
            <TouchableOpacity onPress={doBlock} disabled={actionBusy} style={{ paddingVertical: 12, opacity: actionBusy ? 0.6 : 1 }}>
              <Text>ブロックする</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={doUnmatch} disabled={actionBusy} style={{ paddingVertical: 12, opacity: actionBusy ? 0.6 : 1 }}>
              <Text>マッチを解除</Text>
            </TouchableOpacity>
            <View style={{ height: 6 }} />
          </View>
        </Pressable>
      </Modal>

      <Modal visible={contextOpen} transparent animationType="fade" onRequestClose={closeContext}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' }} onPress={closeContext}>
          <View style={{ marginTop: 'auto', backgroundColor: '#fff', padding: 12, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
            {ctxTarget?.attachments?.images?.[0]?.url ? (
              <>
                <TouchableOpacity onPress={doSaveImage} style={{ paddingVertical: 12 }}>
                  <Text>画像を保存</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={doShareImage} style={{ paddingVertical: 12 }}>
                  <Text>画像を共有</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={doCopyCtx} style={{ paddingVertical: 12 }}>
                  <Text>コピー</Text>
                </TouchableOpacity>
                {ctxTarget?.from_user === meId && (
                  <>
                    <TouchableOpacity onPress={doForwardPrep} style={{ paddingVertical: 12 }}>
                      <Text>転送（準備）</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={doDeleteCtx} style={{ paddingVertical: 12 }}>
                      <Text style={{ color: '#b91c1c' }}>削除</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
            <View style={{ height: 6 }} />
          </View>
        </Pressable>
      </Modal>

      <ImageView
        images={previewUrl ? [{ uri: previewUrl }] : []}
        imageIndex={0}
        visible={!!previewUrl}
        onRequestClose={() => setPreviewUrl(null)}
        swipeToCloseEnabled
        doubleTapToZoomEnabled
      />
    </KeyboardAvoidingView>
  );
}

function Avatar({ photo, size = 28 }: { photo: string | null, size?: number }) {
  return (
    <LinearGradient
      colors={['#475569', '#334155']}
      style={{ width: size+8, height: size+8, borderRadius: (size+8)/2, alignItems:'center', justifyContent:'center' }}
    >
      <View style={{
        width: size, height: size, borderRadius: size/2, overflow:'hidden',
        backgroundColor: '#0b1020', alignItems:'center', justifyContent:'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'
      }}>
        {photo ? (
          <Image source={{ uri: photo }} style={{ width: size, height: size }} resizeMode="cover" />
        ) : (
          <Text style={{ color:'#cbd5e1', fontWeight:'900', fontSize: 10 }}>?</Text>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = {
  myBubble: {
    maxWidth: '100%',
    flexShrink: 1,
    padding: 10,
    borderRadius: 14,
    marginVertical: 4,
    alignSelf: 'flex-end' as const,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  otherBubble: {
    maxWidth: '100%',
    flexShrink: 1,
    padding: 10,
    borderRadius: 14,
    marginVertical: 4,
    alignSelf: 'flex-start' as const,
    backgroundColor: '#E8EEF7',
    borderWidth: 1,
    borderColor: '#D6DFEE',
  },
  myImageWrap: {
    alignSelf: 'flex-end' as const,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'
  },
  otherImageWrap: {
    alignSelf: 'flex-start' as const,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1, borderColor: '#D6DFEE'
  },
  readMark: { color:'#cbd5e1', fontSize:10, marginTop:4 },
  loadMore: {
    alignSelf:'center',
    marginTop: 10, marginBottom: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor:'#FCD34D',
    borderRadius: 999,
    borderWidth: 1, borderColor:'#F59E0B'
  },
  scrollFab: {
    position:'absolute' as const, right:16, bottom: 100,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor:'#0EA5E9',
    alignItems:'center', justifyContent:'center',
    shadowColor:'#0EA5E9', shadowOpacity:0.7, shadowRadius:10, shadowOffset:{width:0,height:6}, elevation:10
  }
} as const;
