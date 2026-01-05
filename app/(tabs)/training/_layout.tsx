import { Stack } from "expo-router";

export default function TrainingLayout() {
  return (
    <Stack initialRouteName="index" screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: "トレーニング" }} />
      <Stack.Screen name="[date]" options={{ title: "記録" }} />
      <Stack.Screen name="picker" options={{ title: "種目を選択" }} />
      <Stack.Screen name="manage" options={{ title: "部位・種目の管理" }} />
    </Stack>
  );
}
