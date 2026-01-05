import { Redirect } from 'expo-router';

export default function Index() {
  // 起動時は (tabs) グループに飛ばす
  return <Redirect href="/(tabs)/home" />;
}
