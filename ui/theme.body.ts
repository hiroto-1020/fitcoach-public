// ui/theme.body.ts
// ベースの角丸・影は共通テーマから再利用（colors は re-export しない）
export { radius, shadow } from './theme';

//  体組成タブ専用の spacing（好みで調整OK）
export const spacing = {
  xs: 8,
  s: 12,
  m: 20,
  l: 28,
  xl: 36,
};
