// lib/dayjs.ts
import dayjs from 'dayjs';
import 'dayjs/locale/ja';
import isoWeek from 'dayjs/plugin/isoWeek';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isoWeek);          // ISO週（週番号/週年、月曜始まり）
dayjs.extend(isSameOrBefore);   // 範囲比較
dayjs.extend(isSameOrAfter);

dayjs.locale('ja');             // 日本語ロケール（曜日表記など）

export default dayjs;
