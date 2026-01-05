// lib/sqlite/bootstrap.tsx
import React, { useEffect } from 'react';
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DB_NAME = 'app.db';
const SEED_FLAG = 'db_seed_v1_done';

const BODY_PARTS = [
  // 好きな名称に調整可
  '胸', '背中', '肩', '腕', '脚', 'お腹',
];

export function SqliteBootstrap() {
  useEffect(() => {
    let mounted = true;

    (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);

      // スキーマ作成（UNIQUE 制約）
      await db.execAsync(`
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS body_parts (
          id   INTEGER PRIMARY KEY NOT NULL,
          name TEXT NOT NULL UNIQUE
        );
      `);

      // 既にシード済みならスキップ
      const seeded = await AsyncStorage.getItem(SEED_FLAG);
      if (seeded === '1') return;

      // テーブルが空かざっくり確認（空でない場合でも OR IGNORE を入れているので二重でもOK）
      const row = await db.getFirstAsync<{ c: number }>(
        'SELECT COUNT(1) AS c FROM body_parts;'
      );
      const isEmpty = !row || !row.c;

      // 重複安全に投入（INSERT OR IGNORE）
      await db.withTransactionAsync(async () => {
        for (const name of BODY_PARTS) {
          await db.runAsync(
            'INSERT OR IGNORE INTO body_parts (name) VALUES (?);',
            name
          );
        }
      });

      // 空だった場合のみフラグを立てる（任意）
      if (mounted && isEmpty) {
        await AsyncStorage.setItem(SEED_FLAG, '1');
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return null;
}
