import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert, Platform } from 'react-native';

const IMAGES_DIR = `${FileSystem.documentDirectory}images`;

async function ensureImagesDir() {
  try {
    await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
  } catch {}
}

function guessExt(uri: string) {
  const clean = uri.split(/[?#]/)[0] ?? '';
  const ext = (clean.split('.').pop() || '').toLowerCase();
  if (ext === 'jpeg') return 'jpg';
  return ext || 'jpg';
}

async function processAndCopy(uri: string) {
  await ensureImagesDir();

  let out = { uri } as { uri: string };
  try {
    out = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1280 } }],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
  } catch (e) {
    console.warn('[image] manipulate failed, use original:', e);
  }

  const ext = guessExt(out.uri || uri);
  const dest = `${IMAGES_DIR}/${Date.now()}.${ext}`;
  await FileSystem.copyAsync({ from: out.uri || uri, to: dest });
  return dest;
}

function getImagesMediaType(): any | undefined {
  const mt = (ImagePicker as any).MediaType;
  if (mt && typeof mt.Images !== 'undefined') return mt.Images;
  const mto = (ImagePicker as any).MediaTypeOptions;
  if (mto && typeof mto.Images !== 'undefined') return mto.Images;
  console.warn('[image-picker] MediaType が見つからないためデフォルトを使用します。');
  return undefined;
}

export async function pickImageAndCopy(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('写真アクセスが必要です', '設定 > プライバシー > 写真 から許可してください。');
    return null;
  }

  const mediaTypes = getImagesMediaType();
  const result = await ImagePicker.launchImageLibraryAsync({
    ...(mediaTypes !== undefined ? { mediaTypes } : {}),
    allowsEditing: true,
    quality: Platform.OS === 'ios' ? 1 : 1,
    exif: false,
  });

  if (result.canceled || !result.assets?.[0]?.uri) return null;
  return processAndCopy(result.assets[0].uri);
}

export async function takePhotoAndCopy(): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('カメラ権限が必要です', '設定でカメラのアクセスを許可してください。');
    return null;
  }

  const mediaTypes = getImagesMediaType();
  const result = await ImagePicker.launchCameraAsync({
    ...(mediaTypes !== undefined ? { mediaTypes } : {}),
    allowsEditing: true,
    quality: Platform.OS === 'ios' ? 1 : 1,
    exif: false,
  });

  if (result.canceled || !result.assets?.[0]?.uri) return null;
  return processAndCopy(result.assets[0].uri);
}
