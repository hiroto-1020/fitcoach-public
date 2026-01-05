export type BodyPart = { id: number; name: string; sort_order: number };
export type Exercise = { id: number; name: string; body_part_id: number | null; equipment?: string | null; unit: 'kg'|'lb'|'body'; is_default: 0|1; is_archived: 0|1 };
export type Session = { id: number; date: string; total_sets: number; total_reps: number; total_load_kg: number };
export type SetRow = { id: number; session_id: number; exercise_id: number; set_index: number; weight_kg: number; reps: number; is_warmup: 0|1 };
