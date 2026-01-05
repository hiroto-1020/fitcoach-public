import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { createThread, getLocalDisplayName } from "../../lib/bbs/api";

let theme: any = null; try { theme = require("../../ui/theme"); } catch {}
const C = theme?.colors ?? { bg:"#0a0d0f", card:"#12161a", text:"#e6e8eb", sub:"#9aa4b2", primary:"#6ee7b7", border:"#1f242a" };

async function loadBoards(): Promise<Array<{slug:string;name:string}>> {
  try {
    const mod = await import("../../lib/bbs/boards");
    return mod.default;
  } catch {
    return [
      { slug: "general",   name: "総合" },
      { slug: "training",  name: "筋トレ" },
      { slug: "nutrition", name: "栄養" },
      { slug: "chat",      name: "雑談" },
      { slug: "sports",    name: "スポーツ" },
      { slug: "health",    name: "健康" },
    ];
  }
}

export default function BbsNewThread() {
  const router = useRouter();
  const [boards, setBoards] = useState<Array<{slug:string;name:string}>>([]);
  const [selected, setSelected] = useState<string[]>(["general"]);
  const [title, setTitle] = useState("");
  const [body, setBody]   = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadBoards().then(setBoards);
  }, []);

  function toggle(slug: string) {
    setSelected(prev => prev.includes(slug) ? prev.filter(s => s!==slug) : [...prev, slug]);
  }

  async function onCreate() {
    if (!title.trim() || (!body.trim() && selected.length===0)) return;
    setSending(true);
    try {
      const displayName = await getLocalDisplayName();
      const boardSlugs = selected.length ? selected : ["general"];
      const { thread } = await createThread({ title: title.trim(), body, displayName, boardSlugs });
      router.replace(`/bbs/${thread.id}`);
    } catch (e: any) {
      Alert.alert("作成エラー", e?.message ?? String(e));
    } finally { setSending(false); }
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: C.bg }}>
      <View style={{ flex:1, padding:16 }}>
        <Text style={{ color:C.text, fontSize:20, fontWeight:"800", marginBottom:12 }}>新規スレ作成</Text>

        <View style={{ backgroundColor:C.card, borderColor:C.border, borderWidth:1, borderRadius:10, marginBottom:12 }}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="タイトル"
            placeholderTextColor={C.sub}
            style={{ color:C.text, paddingHorizontal:12, paddingVertical:10 }}
          />
        </View>

        <View style={{ backgroundColor:C.card, borderColor:C.border, borderWidth:1, borderRadius:10, marginBottom:12 }}>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="本文"
            placeholderTextColor={C.sub}
            style={{ color:C.text, paddingHorizontal:12, paddingVertical:10, minHeight:140, textAlignVertical:"top" }}
            multiline
          />
        </View>

        <Text style={{ color:C.sub, fontSize:12, marginBottom:8 }}>カテゴリ（複数選択可）</Text>
        <View style={{ flexDirection:"row", flexWrap:"wrap", justifyContent:"space-between", marginBottom:16 }}>
          {boards.map(b => {
            const active = selected.includes(b.slug);
            return (
              <TouchableOpacity
                key={b.slug}
                onPress={() => toggle(b.slug)}
                activeOpacity={0.85}
                style={{
                  flexBasis: "48%", minWidth: 140,
                  paddingVertical: 12, borderRadius: 16, paddingHorizontal: 12,
                  backgroundColor: active ? "rgba(110,231,183,0.18)" : C.card,
                  borderWidth: 1, borderColor: active ? C.primary : C.border,
                  marginBottom: 10
                }}>
                <Text style={{ color: active ? C.primary : C.text, fontWeight:"800", textAlign:"center" }}>{b.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          disabled={sending || !title.trim() || !body.trim()}
          onPress={onCreate}
          style={{ backgroundColor:C.primary, opacity:(sending || !title.trim() || !body.trim())?0.5:1, paddingVertical:14, borderRadius:12, alignItems:"center" }}
        >
          {sending ? <ActivityIndicator /> : <Text style={{ color:"#00140e", fontWeight:"800" }}>スレを立てる</Text>}
        </TouchableOpacity>

        <Text style={{ color:C.sub, fontSize:12, marginTop:10 }}>
          ※ 未選択時は「総合」が自動付与されます
        </Text>
      </View>
    </SafeAreaView>
  );
}
