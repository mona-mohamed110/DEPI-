// قاعدة بيانات وهمية محفوظة في localStorage (للاختبار فقط). بتتصفّر بـ resetMockDb()
import { buildSeed, SEED_VERSION } from './seed.js';

const KEY = 'shefaa_mock_db';
let db = null;

export function getDb() {
  if (!db) {
    try { db = JSON.parse(localStorage.getItem(KEY)); } catch { db = null; }
    if (!db || db.v !== SEED_VERSION) { db = buildSeed(); save(); }
  }
  return db;
}
export function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* التخزين ممتلئ */ } }
export function resetMockDb() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } db = null; return getDb(); }
export const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
// داتا فاضية لحساب جديد
export const bucket = (group, id, make) => { const d = getDb(); if (!d[group][id]) { d[group][id] = make(); save(); } return d[group][id]; };
if (typeof window !== 'undefined') window.resetMockDb = resetMockDb; // للتجربة من الـ console
