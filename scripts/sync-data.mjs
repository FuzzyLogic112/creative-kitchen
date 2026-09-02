// 把 data/ 的构建产物同步到前端能直接引用的位置。
// index.json 小(64KB) -> src/data/ 供构建期 import；recipes.json 大(1.4MB) -> public/ 按需 fetch。
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';

if (!existsSync('data/index.json')) {
  console.error('缺少 data/index.json，请先运行 node scripts/parse-recipes.mjs');
  process.exit(1);
}
mkdirSync('src/data', { recursive: true });
mkdirSync('public', { recursive: true });
copyFileSync('data/index.json', 'src/data/index.json');
copyFileSync('data/recipes.json', 'public/recipes.json');
console.log('已同步: src/data/index.json, public/recipes.json');
