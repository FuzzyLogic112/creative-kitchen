import type { GeneratedRecipe } from './ai';

// 收藏项：库内菜谱只存 id，AI 菜谱存完整数据（因为它是临时生成的）。
export interface FavRecipe {
  key: string;
  type: 'library' | 'ai';
  name: string;
  libId?: string;
  ai?: GeneratedRecipe;
  ts: number;
}

const KEY = 'ck:favorites';

export function getFavorites(): FavRecipe[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function save(list: FavRecipe[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

export function isFav(key: string): boolean {
  return getFavorites().some((f) => f.key === key);
}

// 切换收藏，返回切换后的状态（true=已收藏）
export function toggleFav(item: Omit<FavRecipe, 'ts'>): boolean {
  const list = getFavorites();
  const i = list.findIndex((f) => f.key === item.key);
  if (i >= 0) { list.splice(i, 1); save(list); return false; }
  list.unshift({ ...item, ts: Date.now() });
  save(list);
  return true;
}

export const libFavKey = (id: string) => id;
export const aiFavKey = (name: string) => 'ai:' + name;
