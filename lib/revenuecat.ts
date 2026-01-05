// lib/revenuecat.ts
import Purchases, {
  Offerings,
  PurchasesPackage,
  PurchasesErrorCode,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

/** ← あなたのキーに差し替え */
const RC_TEST    = 'test_QyBkVQJBqOfyNbYdfNrdMqOTVhy';
const RC_IOS     = 'appl_XXXXXXXXXXXX';
const RC_ANDROID = 'goog_XXXXXXXXXXXX';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

function pickSdkKey(): string {
  if (!isNative) return '';
  // Expo Go では Test Store を使う
  if (Constants?.appOwnership === 'expo') return RC_TEST;
  return Platform.OS === 'ios' ? RC_IOS : RC_ANDROID;
}

let configured = false;

export async function initRevenueCat() {
  try {
    if (!isNative || configured) return;

    const apiKey = pickSdkKey();
    if (!apiKey) return;

    // ※ web で落ちるためデバッグ系は呼ばない
    await Purchases.configure({ apiKey });
    configured = true;

    const { data } = await supabase.auth.getUser();
    const uid = data?.user?.id;
    if (uid) {
      try {
        await Purchases.logIn(uid);
      } catch {
        /* noop */
      }
    }
  } catch {
    /* noop */
  }
}

export const canUsePurchases = () => isNative;

// Test Store でも毎回一意になるよう nonce を必ず付ける
function buildTxId(result: any, pack: number, uid?: string) {
  const base =
    result?.storeTransaction?.transactionIdentifier ??
    result?.customerInfo?.latestTransactionIdentifier ??
    result?.productIdentifier ??
    'local';
  const shortUid = uid ? uid.slice(0, 8) : 'anon';
  const nonce = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
  return `${base}#${pack}#${shortUid}#${nonce}`;
}

export async function purchaseLikesPack(opts: { pack: 10 | 30 | 50 | 100 }) {
  if (!isNative) throw new Error('購入はモバイル端末で行ってください。');

  await initRevenueCat();

  const wantedId = `likes_${opts.pack}`;
  const offerings: Offerings = await Purchases.getOfferings();
  const offering = offerings.current;
  if (!offering) throw new Error('Offering not found');

  const pkg: PurchasesPackage | undefined = offering.availablePackages.find(
    (p: any) => p?.identifier === wantedId || p?.product?.identifier === wantedId
  );
  if (!pkg) throw new Error(`Package "${wantedId}" not found`);

  try {
    const result: any = await Purchases.purchasePackage(pkg);

    const { data } = await supabase.auth.getUser();
    const uid = data?.user?.id;

    const txId = buildTxId(result, opts.pack, uid);

    const { error } = await supabase.rpc('credit_likes', {
      p_amount: opts.pack,
      p_tx: txId,
    });
    if (error) throw error;

    return { txId, ok: true as const };
  } catch (e: any) {
    // ユーザーキャンセルは成功扱いにしないがエラーは投げない
    if (e?.code === PurchasesErrorCode.PurchaseCancelledError) {
      return { cancelled: true as const };
    }
    throw e;
  }
}
