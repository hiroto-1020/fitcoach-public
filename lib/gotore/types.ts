// lib/gotore/types.ts

/** 性別 */
export type Gender = 'male' | 'female' | 'other' | 'unknown';

/** マッチ対象モード */
export type BuddyMode = 'any' | 'male_only' | 'female_only';

/** 本人確認ステータス */
export type VerifiedStatus = 'pending' | 'verified' | 'rejected';

export type MatchTarget = 'any' | 'same_gender';

export function labelForSameGender(gender: Gender) {
  if (gender === 'male') return '男同士のみ';
  if (gender === 'female') return '女同士のみ';
  return '同性のみ';
}

/** users テーブルの最小行 */
export type UserRow = {
  user_id: string;
  gender: Gender; // users.gender
};

/** settings テーブルの最小行 */
export type SettingsRow = {
  user_id: string;
  buddy_gender_mode: BuddyMode;
};

/** PR（ベンチ・スクワット・デッド） */
export type PRLifts = {
  bench?: number | null;
  squat?: number | null;
  dead?: number | null;
};

/** プロフィール（アプリで参照する可能性がある列を包括的に定義） */
export type Profile = {
  user_id: string;

  // 基本
  nickname: string | null;
  home_gym_location: string | null;
  preferred_training_tags: string[] | null;

  // 地域（どちらかの設計でも型エラーにならないよう両方許容）
  region?: string | null;               // 現行実装で使用
  region_code?: string | null;          // 旧設計で使用
  region_label?: string | null;         // 旧設計で使用

  // 表示用メタ
  updated_at?: string;                  // 画像キャッシュバスター等に利用

  // 合トレ可否
  seeking_buddy?: boolean;

  // プロフィール拡張（任意項目）
  bio?: string | null;
  training_years?: number | null;
  goals?: string | null;
  availability?: string | null;
  height_cm?: number | null;

  // トレ情報（任意）
  training_level?: 'beginner' | 'intermediate' | 'advanced' | null;
  training_frequency?: string | null;   // 例: '週2-3'
  pr_lifts?: PRLifts | null;
  available_days?: string[] | null;     // ['Mon','Wed',...]
  preferred_times?: string[] | null;    // ['morning','evening',...]

  // 画像
  photos?: string[] | null;             // 先頭がメイン
  avatar_url?: string | null;           // 旧フィールドのフォールバック

  // 性別（プロフィール側に持つ設計もあるため任意で併記）
  gender?: Gender;

  // 本人確認（KYC）
  verified_status?: VerifiedStatus | null;
  verified_person_id?: string | null;
};

/** 候補カードで使う束ね型 */
export type Candidate = {
  profile: Profile;
  user: UserRow;
  settings: SettingsRow;
};
