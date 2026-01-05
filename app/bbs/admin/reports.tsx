import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

//  相対パスは “admin” 配下なので 3 つ戻る
let theme: any = null; try { theme = require("../../../ui/theme"); } catch {}
const C = theme?.colors ?? { bg:"#0a0d0f", card:"#12161a", text:"#e6e8eb", sub:"#9aa4b2", primary:"#6ee7b7", border:"#1f242a" };
import { supabase } from "../../../lib/supabase";

type ReportItem = {
  id: string;
  target_type: "thread"|"post";
  target_id: string;
  reason: string | null;
  created_at: string;
  status?: "open"|"closed";
};

// 端末キー（lib/bbs/api.ts と同等の簡易実装）
async function getDeviceKey() {
  const k = await AsyncStorage.getItem("bbs_device_key");
  if (k) return k;
  const v = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random()*16)|0, out = c === "x" ? r : (r&0x3)|0x8; return out.toString(16);
  });
  await AsyncStorage.setItem("bbs_device_key", v);
  return v;
}

export default function Reports() {
  const router = useRouter();
  const [items, setItems] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const xdk = await getDeviceKey();
      const { data, error } = await supabase.functions.invoke("bbs-admin-reports-list", {
        headers: { "x-device-key": xdk },
      });
      if (error) throw new Error(error.message);
      setItems((data?.items ?? []) as ReportItem[]);
    } catch (e:any) {
      Alert.alert("読み込みエラー", e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function act(reportId: string, action: "dismiss" | "remove") {
    if (workingId) return;
    setWorkingId(reportId);
    try {
      const xdk = await getDeviceKey();
      const { data, error } = await supabase.functions.invoke("bbs-admin-reports-handle", {
        body: { reportId, action },
        headers: { "x-device-key": xdk },
      });
      if (error) throw new Error(error.message);
      // 反映：リストから除外
      setItems(prev => prev.filter(r => r.id !== reportId));
    } catch (e:any) {
      Alert.alert("処理エラー", e?.message ?? String(e));
    } finally {
      setWorkingId(null);
    }
  }

  if (loading) {
    return (
      <SafeAreaView edges={['top','left','right']} style={{ flex:1, backgroundColor: C.bg }}>
        <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top','left','right']} style={{ flex:1, backgroundColor: C.bg }}>
      {/* ヘッダー */}
      <View style={{ paddingHorizontal:16, paddingTop:8, paddingBottom:8, borderBottomWidth:1, borderBottomColor:C.border }}>
        <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between" }}>
          <Text style={{ color: C.text, fontSize: 18, fontWeight: "800" }}>通報キュー（管理）</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal:12, paddingVertical:6 }}>
            <Text style={{ color: C.sub }}>戻る</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* リスト */}
      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
            tintColor={C.sub}
          />
        }
        contentContainerStyle={{ padding:16, paddingBottom:24 }}
        renderItem={({ item }) => (
          <View style={{ backgroundColor:C.card, borderColor:C.border, borderWidth:1, borderRadius:12, padding:12, marginBottom:10 }}>
            <View style={{ flexDirection:"row", justifyContent:"space-between", marginBottom:6 }}>
              <Text style={{ color:C.sub, fontSize:12 }}>{new Date(item.created_at).toLocaleString()}</Text>
              <Text style={{ color:C.sub, fontSize:12 }}>{item.target_type.toUpperCase()}</Text>
            </View>
            <Text style={{ color:C.text, fontWeight:"800", marginBottom:6 }}>理由</Text>
            <Text style={{ color:C.text, marginBottom:10 }}>{item.reason || "(未記入)"}</Text>
            <Text style={{ color:C.sub, fontSize:12, marginBottom:10 }}>target_id: {item.target_id}</Text>

            <View style={{ flexDirection:"row", gap:10, justifyContent:"flex-end" }}>
              <TouchableOpacity
                disabled={workingId === item.id}
                onPress={() => act(item.id, "dismiss")}
                style={{ paddingHorizontal:12, paddingVertical:8, borderRadius:8, backgroundColor:"#1f2937", opacity: workingId===item.id?0.6:1 }}
              >
                <Text style={{ color:"#93c5fd", fontWeight:"800" }}>{workingId===item.id? "処理中…" : "残す（dismiss）"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={workingId === item.id}
                onPress={() => act(item.id, "remove")}
                style={{ paddingHorizontal:12, paddingVertical:8, borderRadius:8, backgroundColor:"#3b0f0f", opacity: workingId===item.id?0.6:1 }}
              >
                <Text style={{ color:"#fca5a5", fontWeight:"800" }}>{workingId===item.id? "処理中…" : "削除（remove）"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color:C.sub, textAlign:"center", marginTop:24 }}>通報はありません</Text>}
      />
    </SafeAreaView>
  );
}
