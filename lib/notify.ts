import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let setupDone = false;
export async function ensureNotificationSetup() {
  if (setupDone) return;
  setupDone = true;

  const perm = await Notifications.getPermissionsAsync();
  if (perm.status !== "granted") {
    await Notifications.requestPermissionsAsync();
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("rest-timer", {
      name: "Rest Timer",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 300, 200, 300],
      enableVibrate: true,
      sound: "default",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}

export async function scheduleRestNotification(
  seconds: number,
  title = "レスト終了",
  body = "次のセットいきましょう💪"
) {
  try {
    await ensureNotificationSetup();
    const secs = Math.max(1, Math.floor(seconds));
    const when = new Date(Date.now() + secs * 1000);

    const trigger: any = Platform.OS === "android"
      ? { date: when, channelId: "rest-timer", allowWhileIdle: true }
      : { date: when };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: Platform.OS === "ios" ? "default" : undefined,
      },
      trigger,
    });
    return id;
  } catch {
    return null;
  }
}

export async function cancelNotification(id?: string | null) {
  if (!id) return;
  try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
}
