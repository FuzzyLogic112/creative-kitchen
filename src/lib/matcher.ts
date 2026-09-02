// 食材 -> 菜谱匹配。index.json 的 mains 已排除调料。
// 与 scripts/matcher.mjs 保持同一套规则（那里有单测覆盖）。
import type { RecipeIndex, MatchResult } from './types';

const CUT = /^(丝|片|块|条|丁|粒|段|末|碎|泥|花|球|馅)$/;

// 中文中心词在后。裸 includes 会让"鸡"命中"鸡蛋"，故按下列规则收紧。
export function ingredientMatches(userWord: string, recipeWord: string): boolean {
  if (!userWord || !recipeWord) return false;
  if (userWord === recipeWord) return true;
  if (recipeWord.endsWith(userWord)) return true;              // 虾 -> 基围虾
  if (userWord.endsWith(recipeWord)) return true;              // 牛肉 -> 肉
  if (recipeWord.startsWith(userWord) && CUT.test(recipeWord.slice(userWord.length))) return true; // 土豆 -> 土豆丝
  return false;
}

export function matchRecipes(
  have: string[],
  index: RecipeIndex[],
  { maxMissing = 2 }: { maxMissing?: number } = {},
): MatchResult[] {
  const results: MatchResult[] = [];
  for (const r of index) {
    if (!r.mains.length) continue;                             // 纯调料配方不作为菜推荐
    const got: string[] = [], missing: string[] = [];
    for (const m of r.mains) {
      (have.some((h) => ingredientMatches(h, m)) ? got : missing).push(m);
    }
    if (missing.length > maxMissing) continue;
    const bonus = (r.optional ?? []).filter((o) => have.some((h) => ingredientMatches(h, o)));
    results.push({
      ...r, got, missing, bonus,
      rate: got.length / r.mains.length,
      score: got.length - missing.length * 3 + bonus.length * 0.5,
    });
  }
  return results.sort((a, b) =>
    a.missing.length - b.missing.length ||
    b.score - a.score ||
    (a.difficulty ?? 9) - (b.difficulty ?? 9));
}

export const CATEGORY_LABELS: Record<string, string> = {
  aquatic: '水产', breakfast: '早餐', condiment: '调料', dessert: '甜点',
  drink: '饮品', meat_dish: '荤菜', 'semi-finished': '半成品',
  soup: '汤羹', staple: '主食', vegetable_dish: '素菜',
};
