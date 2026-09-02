# 会话上下文摘要
更新时间：2026-09-02

## 项目速览
创意厨房 App：输入手上剩余食材 → 推荐能做的菜 + AI 创意改造。
形态为手机端优先的 Web App。目录 `C:\Users\Administrator\creative-kitchen`，非 git 仓库。
当前只有数据层（Node ESM 脚本），前端工程尚未创建。

## 当前目标
已完成：数据层、matcher、iOS 前端、AI 创意生成（Claude opus-5，全链路验证）。
MVP 三个 P0 全部落地，已改造为 Vercel 可部署（待用户执行 vercel 登录+部署）。
部署后下一步 P1：拍照识别 / 收藏账号。

## 关键决策
- **自研，不 fork Mealie/Tandoor/KitchenOwl** — 三者都是"管理已知菜谱"，与"从食材反推"方向相反，
  覆盖度 <30%；且全是 AGPL 系（Tandoor 还叠 Commons Clause 禁止销售），SaaS 化会传染。
- **数据用 HowToCook** (github.com/Anduin2017/HowToCook) — 102k star，**Unlicense 公共领域**，可商用无限制。
- **混合检索，不纯靠 LLM 生成菜谱** — LLM 编火候/时间不可靠，用户翻车一次即流失。
  本地 HowToCook 库负责"真实可做的菜"，LLM 只做创意改造/缺料替代/组合搭配。
- **索引与详情分离** — `index.json` gzip 仅 13KB 可随首屏加载做全部匹配；
  `recipes.json` 全量 gzip 290KB，详情按需拉取。（原估"几百KB全量打包"是错的）
- **调料必须与主料分开计分** — 用户"有盐有葱"不构成能做某道菜的理由，否则几乎全命中。
- 后端仅一个 Serverless Function 代理 LLM（API Key 不可进前端）；MVP 不做数据库和账号。

## 关键位置
- `scripts/parse-recipes.mjs` — markdown → JSON 解析器，同时产出 index.json
- `scripts/normalize.mjs` — 食材归一化（同义词/调料/厨具/分量剥离），匹配质量的命脉
- `scripts/matcher.mjs` — 匹配算法；`scripts/verify-matcher.mjs` — 单测+召回验证（`node scripts/verify-matcher.mjs`）
- `data/recipes.json`(1.4MB) / `data/index.json`(64KB) — 构建产物，368 条
- `.howtocook/dishes/` — sparse-checkout 的上游 md，构建期输入，已 gitignore
- `DATA.md` — 数据来源、License、重建命令、字段说明
- `src/App.tsx` — 主界面（pick/results 两视图 + detail 弹层），plain useState 未上 Zustand
- `src/components/RecipeDetail.tsx` — 详情页，模块级缓存 recipes.json，含 AI 占位按钮（待接入）
- `src/lib/matcher.ts` — matcher.mjs 的 TS 移植；`src/lib/pantry.ts` 快选食材（已验证可匹配）
- `src/index.css` — iOS 系统色板(@theme) + press 按压动效 + 安全区
- `data/` 是唯一构建源 → `scripts/sync-data.mjs` 同步到 `src/data/index.json`(import) 与 `public/recipes.json`(fetch)

## 环境与命令
- 重建数据：`npm run data`（即 `node scripts/parse-recipes.mjs`）
- 拉上游数据见 `DATA.md`（sparse-checkout 只取 dishes，避开图片）
- 开发：`npm run dev`（predev 自动 sync 数据）；构建：`npm run build`
- **dev server 必须绑 127.0.0.1**：默认只绑 [::1](IPv6)，浏览器/curl 走 IPv4 连不上 → vite.config 已加 server.host
- 预览走后台 `npm run dev` + 浏览器 navigate（preview_start 从会话根找 launch.json，路径不符）
- Node v20.19.6 —— 刚好达到 Vite 7 的 20.19 门槛

- **工具过滤靠后缀而非词表** — 中文厨具中心词在末尾（耐热碗/厚底锅/刨丝器），
  按 `(锅|碗|盆|器|机|纸|…)# 会话上下文摘要
更新时间：2026-09-01

## 项目速览
创意厨房 App：输入手上剩余食材 → 推荐能做的菜 + AI 创意改造。
形态为手机端优先的 Web App。目录 `C:\Users\Administrator\creative-kitchen`，非 git 仓库。
当前只有数据层（Node ESM 脚本），前端工程尚未创建。

## 当前目标
已完成：开源调研、数据层（368/368 解析）、归一化、matcher 匹配算法（单测全通过）。
下一步：建 Vite + React + TS 前端骨架。

## 关键决策
- **自研，不 fork Mealie/Tandoor/KitchenOwl** — 三者都是"管理已知菜谱"，与"从食材反推"方向相反，
  覆盖度 <30%；且全是 AGPL 系（Tandoor 还叠 Commons Clause 禁止销售），SaaS 化会传染。
- **数据用 HowToCook** (github.com/Anduin2017/HowToCook) — 102k star，**Unlicense 公共领域**，可商用无限制。
- **混合检索，不纯靠 LLM 生成菜谱** — LLM 编火候/时间不可靠，用户翻车一次即流失。
  本地 HowToCook 库负责"真实可做的菜"，LLM 只做创意改造/缺料替代/组合搭配。
- **索引与详情分离** — `index.json` gzip 仅 13KB 可随首屏加载做全部匹配；
  `recipes.json` 全量 gzip 290KB，详情按需拉取。（原估"几百KB全量打包"是错的）
- **调料必须与主料分开计分** — 用户"有盐有葱"不构成能做某道菜的理由，否则几乎全命中。
- 后端仅一个 Serverless Function 代理 LLM（API Key 不可进前端）；MVP 不做数据库和账号。

## 关键位置
- `scripts/parse-recipes.mjs` — markdown → JSON 解析器，同时产出 index.json
- `scripts/normalize.mjs` — 食材归一化（同义词/调料/厨具/分量剥离），匹配质量的命脉
- `scripts/matcher.mjs` — 匹配算法；`scripts/verify-matcher.mjs` — 单测+召回验证（`node scripts/verify-matcher.mjs`）
- `data/recipes.json`(1.4MB) / `data/index.json`(64KB) — 构建产物，368 条
- `.howtocook/dishes/` — sparse-checkout 的上游 md，构建期输入，已 gitignore
- `DATA.md` — 数据来源、License、重建命令、字段说明

## 环境与命令
- 重建数据：`npm run data`（即 `node scripts/parse-recipes.mjs`）
- 拉上游数据见 `DATA.md`（sparse-checkout 只取 dishes，避开图片）
- Node v20.19.6 —— 刚好达到 Vite 7 的 20.19 门槛

 判定比穷举可靠；"火锅底料""锅巴"不以这些字结尾，不会误伤。
- **食材匹配不能用裸 includes** — "鸡"会命中"鸡蛋"。规则：相等 / 菜谱词以用户词结尾（虾→基围虾）/
  用户词以菜谱词结尾（牛肉→肉）/ 菜谱词=用户词+刀工后缀（土豆→土豆丝）。

## 踩过的坑
- **配图间歇失败=智谱免费额度限并发**：后端连测 4/4 出图正常、图链 HTTP200；失败仅在并发时（curl 与浏览器同时打）。已加固：genImage 失败自动重试 1 次（等 1.2s）。用户看不到图多半是并发限流 or 浏览器旧页面缓存 → 需硬刷新。
- **Vercel 函数不能跨目录相对导入**：`api/suggest.ts` import `../server/*` → 运行时 ERR_MODULE_NOT_FOUND（Vercel 没把外部文件打进函数包），表现为 FUNCTION_INVOCATION_FAILED。本地 Vite 能解析所以不暴露。解法：函数**自包含单文件**（schema+handler 全塞进 api/suggest.ts，零相对导入）；dev 中间件 ssrLoadModule('/api/suggest.ts')、前端 `import type` 同一文件（type-only 不会把 SDK 带进浏览器包，已验证 dist 0 处 anthropic）。
- 查线上函数错误：`vercel logs <deployment-url>`（运行时日志）。
- **Bash heredoc + node -e 多层引号会吃掉一级反斜杠**：模板字面量里 `\s` 退化成字面 `s`，
  正则静默失效（TAIL_QTY 变成 `s+[d.]+`）。解法：正则改用 `[0-9]`/`[ ]` 等不含反斜杠的写法。
- HowToCook 格式统一（368 文件全含 4 个固定 H2），但有三种目录布局，**菜名必须取 H1 而非文件名**。
- 个别文件用 `+` 作 markdown 列表符；107 个文件描述行首是图片语法，需过滤。
- TOOLS 用单字子串匹配会误伤（"袋"杀掉了速冻水饺），必须用多字词表。
- 后缀剥离别碰 `条|丝|片`（"薯条"→"薯"），只剥 `段|末|碎|泥`，其余交给 matcher 子串匹配。
- condiment 类菜谱（糖醋汁/油酥）原料全是调料是**正常的**，别加"必须有主料"的校验。

## BYOK + 多供应商 + 对话（2026-09-02 大改）
- **BYOK**：用户在设置页填自己的 key，存 localStorage(ck:settings)，随请求传给后端；缺省回落服务端 env key（网页版仍可用）。
- **多供应商**：src/lib/providers.ts 预设 7 家（智谱/硅基流动/DeepSeek/Kimi/通义/OpenAI/自定义），均 OpenAI 兼容。后端 chat.ts/suggest.ts 接受 baseURL 参数，一套代码通吃。设置页选供应商→自动带出 baseURL+model(可编辑)+建议chip。
- **配图仅智谱**：imageSupported() 按 providerId 判断；非智谱跳过配图（菜谱/对话正常）。
- **对话**：api/chat.ts（自包含）+ src/components/Chat.tsx（悬浮按钮→全屏对话，多轮）。测试连接=发一句话验证。已实测：3道菜✓、对话✓、供应商切换✓。
- 入口：App 右上齿轮=设置，右下橙色悬浮=AI助手。
- ⚠️ 坑复现：多层 shell 又吃反斜杠，regex /+ 变成 // 注释破坏文件；改用无反斜杠字符类 [/]+$。

## AI 生成层（智谱 BigModel，非 Anthropic）
- **已有菜谱配图**：新增自包含 `api/image.ts`（POST {name,hint}→CogView→{imageUrl}，含重试）。dev 中间件 vite.config 用 mount() 挂 /api/suggest + /api/image 两端点。
- 前端 `fetchDishImage(id,name,hint)`（ai.ts）localStorage 缓存 25 天；RecipeDetail 进页异步取图，三态 loading/ready/failed（骨架→淡入→失败收起，onLoad/onError 驱动）。菜谱文字不被图阻塞。
- ⚠️ 内置测试浏览器在海外，加载智谱国内 CDN(ufileos.com)图极慢/不完整，无法可视化验证；国内真实浏览器正常。端点本身已测出图 ok。
- 从 Anthropic→Gemini→**智谱**（用户要国内直连+免费+图片）。api/suggest.ts 用**原生 fetch**，无 SDK 依赖。
- 文本 **GLM-4-Flash**（免费）出菜谱 JSON（response_format:json_object + prompt 描述 JSON 形状 + zod 校验）；
  配图 **CogView-3-Flash**（免费）`POST /images/generations`→ data[0].url，串行、失败不阻断菜谱。
- 端点 base `https://open.bigmodel.cn/api/paas/v4`，Bearer 鉴权。env: **ZHIPU_API_KEY**（兜底 GLM_API_KEY）。
- 返回 `{ok,recipe,imageUrl?}`；前端 GeneratedRecipeView 顶部展示配图。key 领取：open.bigmodel.cn 注册免费。
- 前端零泄漏已验证（bundle 无 bigmodel/cogview/key 值，仅错误文案含 ZHIPU_API_KEY 变量名，安全）。


## 前端技术栈
Vite 7 + React 19 + TS + Tailwind v4（@tailwindcss/vite 插件，@theme 定义色板，无 tailwind.config）。
食材库 112 种/7 组。构建产物 gzip：JS 79KB + CSS 3.7KB；recipes.json 1.4MB 按需 fetch 不进包。

## 部署（Vercel，已就绪）
- `api/suggest.ts` 是 Vercel serverless 适配器，复用 `server/suggest.ts`（与 dev 中间件同一 handler）。
- `vercel.json` 设 `api/suggest.ts` maxDuration:60（LLM 调用可能 >10s，防默认超时截断）。
- `data/*.json` 已提交=构建输入；`public/recipes.json`/`dist` 由 prebuild+vite 重建，故 gitignore 无妨。
- 已首次部署成功：https://creative-kitchen-seven.vercel.app （scope: frees-projects-ece97251）。匹配功能线上可用。
- key: `vercel env add ZHIPU_API_KEY`（选 Production）后 `vercel --prod`。旧 ANTHROPIC_API_KEY 可删。
- ⚠️ 线上仍是最初坏版本(g6etdzog6)，智谱新代码尚未部署，待用户领 key 后 `vercel --prod`。
- 生产构建已验证：dist 含 index.html+assets+recipes.json；函数 bundle 导入链解析通过。

## 环境提醒
- AI 需 `$env:ANTHROPIC_API_KEY` 后再 `npm run dev`（见 README）；未设只影响 AI，匹配照常。

## ⚠️ 线上未同步
Vercel 线上仍是旧版（单菜谱+无BYOK+无对话）。全部新功能仅本地，待 `vercel --prod` 重部署（但方向已转 App，网页重部署优先级低）。

## App 打包计划（用户已定：自己/朋友用 + 云构建 + GitHub）
- 用 **Capacitor** 把 dist 内置进安卓 App（离线 UI，绕过 vercel.app 国内被墙）。iOS 暂不做。
- **架构变更**：App 无 serverless → 需 ai.ts 双模式：web 版调 /api/*（key 在后端）；**app 版直连智谱**（key 用 VITE_ZHIPU_KEY 构建时内置，仅自己/朋友用可接受）。
- **云构建**：项目需变 git repo 推 GitHub → GitHub Actions 跑 npm build(带 secret)+cap sync+gradle 出 APK→artifact 下载。用户需 GitHub 账号 + 设 VITE_ZHIPU_KEY secret。
- 待用户确认有无 GitHub 账号后开工。

## 待办
- [ ] （可选）清理最后 4 条长尾噪声：`小碗若干`/`厚底煮锅+严丝合缝的锅盖`/`注`/`砵`，各只出现 1 次，不阻塞
- [ ] 浏览器 pane 合成点击会超时（pane 隐藏态），验证交互改用 javascript_tool 触发 DOM 事件
