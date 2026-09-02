// 食材 -> 菜谱匹配。输入用户手上的食材，输出能做/差一点就能做的菜。
// index.json 的 mains 已排除调料：用户"有盐有葱"不构成能做某道菜的理由。

// 刀工/形态后缀。用户说"土豆"应当命中菜谱里的"土豆丝"。
const CUT = /^(丝|片|块|条|丁|粒|段|末|碎|泥|花|球|馅)$/;

// 单向 includes 太宽——"鸡"会命中"鸡蛋"。中文中心词在后，据此收紧：
export function ingredientMatches(userWord, recipeWord) {
  if (!userWord || !recipeWord) return false;
  if (userWord === recipeWord) return true;
  // "虾" -> "基围虾"；"肉" -> "五花肉"：菜谱词是用户词的更具体形式
  if (recipeWord.endsWith(userWord)) return true;
  // "五花肉" -> "肉"：用户给的更具体，菜谱要的更宽泛
  if (userWord.endsWith(recipeWord)) return true;
  // "土豆" -> "土豆丝"：只多出一个刀工后缀才算，避免"鸡"命中"鸡蛋"
  if (recipeWord.startsWith(userWord) && CUT.test(recipeWord.slice(userWord.length))) return true;
  return false;
}

export function matchRecipes(have, index, { maxMissing = 2 } = {}) {
  const results = [];
  for (const r of index) {
    if (!r.mains.length) continue;                       // 纯调料配方（糖醋汁等），不作为菜推荐
    const got = [], missing = [];
    for (const m of r.mains) {
      (have.some((h) => ingredientMatches(h, m)) ? got : missing).push(m);
    }
    if (missing.length > maxMissing) continue;
    const bonus = (r.optional ?? []).filter((o) => have.some((h) => ingredientMatches(h, o)));
    results.push({
      ...r,
      got, missing, bonus,
      rate: got.length / r.mains.length,
      // 同样缺 N 样时，用上的自有食材越多越值得做
      score: got.length - missing.length * 3 + bonus.length * 0.5,
    });
  }
  return results.sort((a, b) =>
    a.missing.length - b.missing.length ||
    b.score - a.score ||
    (a.difficulty ?? 9) - (b.difficulty ?? 9));
}
