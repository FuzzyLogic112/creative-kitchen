// 把 HowToCook 的 markdown 菜谱解析成结构化 JSON。
// 源数据：https://github.com/Anduin2017/HowToCook (Unlicense / 公共领域)
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { normalizeIngredient } from './normalize.mjs';

const SRC = 'C:/Users/Administrator/creative-kitchen/.howtocook/dishes';
const OUT = 'C:/Users/Administrator/creative-kitchen/data/recipes.json';

const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { if (e !== 'template') walk(p); }
    else if (e.endsWith('.md')) files.push(p);
  }
})(SRC);

const sectionsOf = (md) => {
  const out = {};
  let cur = null, buf = [];
  for (const line of md.split(/\r?\n/)) {
    const h = line.match(/^##\s+(.+?)\s*$/);
    if (h) { if (cur) out[cur] = buf.join('\n').trim(); cur = h[1]; buf = []; }
    else if (cur) buf.push(line);
  }
  if (cur) out[cur] = buf.join('\n').trim();
  return out;
};

const parseIngredients = (block) => {
  const seen = new Set(), out = [];
  for (const line of block.split(/\r?\n/)) {
    const item = line.match(/^\s*[*+-]\s+(.+?)\s*$/)?.[1];
    if (!item) continue;
    for (const ing of normalizeIngredient(item)) {
      if (ing.isTool || seen.has(ing.name)) continue;
      seen.add(ing.name);
      out.push(ing);
    }
  }
  return out;
};

const parseSteps = (block) => {
  const steps = [];
  for (const line of block.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const num = line.match(/^\s*\d+\.\s+(.+)$/);
    const tip = line.match(/^\s+[-*+]\s+(.+)$/);
    if (num) steps.push({ text: num[1].trim(), tips: [] });
    else if (tip && steps.length) steps[steps.length - 1].tips.push(tip[1].trim());
    else if (steps.length && !/^\s*[-*+]\s/.test(line)) steps[steps.length - 1].text += ' ' + line.trim();
  }
  return steps;
};

const recipes = [], failures = [];
for (const file of files) {
  const md = readFileSync(file, 'utf8');
  const id = relative(SRC, file).split(sep).join('/').replace(/\.md$/, '');
  try {
    const head = md.slice(0, md.indexOf('\n## '));
    const s = sectionsOf(md);
    const r = {
      id,
      name: md.match(/^#\s+(.+?)\s*$/m)?.[1].replace(/的做法$/, '').trim(),
      category: id.split('/')[0],
      description: head.split(/\r?\n/).slice(1).find((l) =>
        l.trim() && !/^预估/.test(l) && !l.trim().startsWith('!' + '['))?.trim() ?? '',
      difficulty: (head.match(/预估烹饪难度：\s*(★+)/)?.[1] ?? '').length || null,
      calories: Number(head.match(/预估卡路里：\s*([\d.]+)/)?.[1]) || null,
      ingredients: parseIngredients(s['必备原料和工具'] ?? ''),
      portion: s['计算'] ?? '',
      steps: parseSteps(s['操作'] ?? ''),
      notes: s['附加内容'] ?? '',
    };
    if (!r.name) throw new Error('缺少菜名 (H1)');
    if (!r.ingredients.length) throw new Error('未解析出原料');
    if (!r.steps.length) throw new Error('未解析出步骤');
    recipes.push(r);
  } catch (err) {
    failures.push({ id, reason: err.message });
  }
}

writeFileSync(OUT, JSON.stringify(recipes, null, 2), 'utf8');

// 匹配索引：只留 matcher 需要的字段，gzip 后约 13KB，可随首屏加载。
// 完整菜谱（步骤/备注）按需拉取，避免为了搜菜就下载 290KB。
const index = recipes.map((r) => ({
  id: r.id,
  name: r.name,
  category: r.category,
  difficulty: r.difficulty,
  calories: r.calories,
  mains: r.ingredients.filter((i) => !i.isSeasoning && !i.optional).map((i) => i.name),
  optional: r.ingredients.filter((i) => !i.isSeasoning && i.optional).map((i) => i.name),
}));
writeFileSync(OUT.replace('recipes.json', 'index.json'), JSON.stringify(index), 'utf8');

const mains = new Map();
for (const r of recipes) for (const i of r.ingredients) if (!i.isSeasoning) mains.set(i.name, (mains.get(i.name) ?? 0) + 1);
console.log(`扫描文件      ${files.length}`);
console.log(`解析成功      ${recipes.length}`);
console.log(`解析失败      ${failures.length}`);
failures.forEach((f) => console.log(`   ✗ ${f.id} — ${f.reason}`));
console.log(`去重主料种类  ${mains.size}`);
console.log(`仅出现1次     ${[...mains.values()].filter((v) => v === 1).length}`);
console.log(`平均主料数    ${(recipes.reduce((a, r) => a + r.ingredients.filter((i) => !i.isSeasoning).length, 0) / recipes.length).toFixed(1)}`);
console.log(`输出          ${OUT}`);
