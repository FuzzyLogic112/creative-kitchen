import { readFileSync } from 'node:fs';
import { matchRecipes, ingredientMatches } from './matcher.mjs';

const index = JSON.parse(readFileSync('data/index.json', 'utf8'));

console.log('=== 匹配规则单测 ===');
const cases = [
  ['土豆', '土豆丝', true], ['虾', '基围虾', true], ['五花肉', '猪肉', false],
  ['鸡', '鸡蛋', false], ['鸡蛋', '鸡蛋', true], ['牛肉', '肉', true],
  ['西红柿', '鸡蛋', false], ['菜', '白菜', true],
];
let bad = 0;
for (const [u, r, want] of cases) {
  const got = ingredientMatches(u, r);
  if (got !== want) { bad++; console.log(`  ✗ "${u}" vs "${r}" 期望 ${want} 实得 ${got}`); }
  else console.log(`  ✓ "${u}" vs "${r}" = ${got}`);
}
console.log(bad ? `\n${bad} 条未通过\n` : '\n全部通过\n');

for (const have of [
  ['西红柿', '鸡蛋'],
  ['土豆', '青椒', '猪肉'],
  ['豆腐', '白菜', '鸡蛋', '牛奶'],
]) {
  const res = matchRecipes(have, index);
  const ready = res.filter((r) => !r.missing.length);
  const one = res.filter((r) => r.missing.length === 1);
  console.log(`【我有】${have.join(' ')}`);
  console.log(`  可直接做 ${ready.length} 道：${ready.slice(0, 6).map((r) => r.name).join('、') || '（无）'}`);
  console.log(`  差一样 ${one.length} 道：` +
    one.slice(0, 5).map((r) => `${r.name}(缺${r.missing[0]})`).join('、'));
  console.log('');
}
