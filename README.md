# 创意厨房

手机端优先的 Web App：输入现有食材 → 本地菜谱库匹配「能做什么」+ AI 用你的食材现场创作。

## 运行

```bash
npm install
npm run dev        # http://127.0.0.1:5173
```

## 开启 AI 创作（菜谱 + 配图）

匹配功能无需任何配置。AI 用**智谱 BigModel**（GLM-4-Flash 出菜谱 + CogView-3-Flash 出配图，均永久免费）。
到 [bigmodel.cn](https://open.bigmodel.cn) 注册领免费 API key，设进环境变量即可（key 只留在后端，不进前端）：

```powershell
# 本地
$env:ZHIPU_API_KEY = "你的智谱key"
npm run dev
```

生产（Vercel）：`vercel env add ZHIPU_API_KEY` 选 Production，再 `vercel --prod`。
未配置时 AI 页面会提示「AI 尚未配置」，匹配功能不受影响。

## 结构

- `data/` 唯一数据源（`npm run data` 从 HowToCook 重建，见 `DATA.md`）
- `src/lib/matcher.ts` 食材→菜谱匹配　`src/lib/pantry.ts` 快选食材
- `api/suggest.ts` 智谱菜谱生成+配图 handler（GLM-4-Flash + CogView-3-Flash，原生 fetch）
- `vite.config.ts` 本地 `/api/suggest` 中间件；生产部署换成同名 serverless function 即可复用 handler
