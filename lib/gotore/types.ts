
export type Gender = 'male' | 'female' | 'other' | 'unknown';

export type BuddyMode = 'any' | 'male_only' | 'female_only';

export type VerifiedStatus = 'pending' | 'verified' | 'rejected';

export type MatchTarget = 'any' | 'same_gender';

export function labelForSameGender(gender: Gender) {
  if (gender === 'male') return '男同士のみ';
  if (gender === 'female') return '女同士のみ';
  return '同性のみ';
}

export type UserRow = {
  user_id: string;
  gender: Gender;
};

export type SettingsRow = {
  user_id: string;
  buddy_gender_mode: BuddyMode;
};

export type PRLifts = {
  bench?: number | null;
  squat?: number | null;
  dead?: number | null;
};

export type Profile = {
  user_id: string;

  nickname: string | null;
  home_gym_location: string | null;
  preferred_training_tags: string[] | null;

  region?: string | null;
  region_code?: string | null;
  region_label?: string | null;

  updated_at?: string;

  seeking_buddy?: boolean;

  bio?: string | null;
  training_years?: number | null;
  goals?: string | null;
  availability?: string | null;
  height_cm?: number | null;

  training_level?: 'beginner' | 'intermediate' | 'advanced' | null;
  training_frequency?: string | null;
  pr_lifts?: PRLifts | null;
  available_days?: string[] | null;
  preferred_times?: string[] | null;

  photos?: string[] | null;
  avatar_url?: string | null;

  gender?: Gender;

  verified_status?: VerifiedStatus | null;
  verified_person_id?: string | null;
};

export type Candidate = {
  profile: Profile;
  user: UserRow;
  settings: SettingsRow;
};
