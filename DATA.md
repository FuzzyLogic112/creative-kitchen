# 菜谱数据来源

`data/recipes.json` 由 `scripts/parse-recipes.mjs` 从 [HowToCook](https://github.com/Anduin2017/HowToCook)
的 markdown 菜谱构建而来。

- **上游许可**：Unlicense（公共领域），可自由使用、修改、商用，无需署名。本文件仅作事实说明。
- **重建方式**：

  ```
  git clone --depth 1 --filter=blob:none --sparse https://github.com/Anduin2017/HowToCook.git .howtocook
  cd .howtocook && git sparse-checkout set dishes && cd ..
  npm run data
  ```

- `.howtocook/` 是构建期输入，不进版本库；`data/recipes.json` 是构建产物，提交以便前端直接引用。

## 数据结构

每条菜谱：`id / name / category / description / difficulty(1-5) / calories / ingredients[] / portion / steps[] / notes`

`ingredients[]` 每项：`name`（归一化后）、`raw`（原文）、`optional`、`isSeasoning`、`isTool`。

**`isSeasoning` 是匹配算法的关键**：用户"有盐有葱"不构成能做某道菜的理由，
匹配时只计非调料主料，否则几乎所有菜都会命中。
