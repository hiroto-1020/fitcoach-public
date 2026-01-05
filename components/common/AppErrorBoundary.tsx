// components/common/AppErrorBoundary.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export default class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: any) {
    console.warn("[AppErrorBoundary]", error?.message, info?.componentStack);
  }
  reset = () => this.setState({ error: null });
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.wrap}>
        <Text style={styles.ttl}>画面の表示でエラーが発生しました</Text>
        <Text style={styles.msg}>{String(this.state.error?.message ?? "")}</Text>
        <TouchableOpacity onPress={this.reset} style={styles.btn}>
          <Text style={{ color: "#111", fontWeight: "800" }}>もう一度読み込む</Text>
        </TouchableOpacity>
      </View>
    );
  }
}
const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#0b0f1a" },
  ttl: { color: "#fff", fontSize: 16, fontWeight: "800", marginBottom: 8 },
  msg: { color: "#cbd5e1", textAlign: "center" },
  btn: { marginTop: 16, backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }
});
