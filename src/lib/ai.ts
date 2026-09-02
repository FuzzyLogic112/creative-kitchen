import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { getSettings, imageSupported } from './settings';

// ===== 类型（原来在 api/*.ts，现收进前端统一维护）=====
export interface GeneratedRecipe {
  name: string;
  intro: string;
  usedIngredients: string[];
  extraIngredients: string[];
  difficulty: number;
  timeMinutes: number;
  steps: string[];
  tips: string[];
}
export interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }
export interface SuggestRequest {
  ingredients: string[];
  mode?: 'create' | 'remix';
  base?: { name: string; ingredients: string[]; steps: string[] };
}

const NO_KEY_MSG = 'AI 尚未配置。请点右上角「设置」填入你的 API Key。';

// ===== 传输层：App 原生直连（绕 CORS，key 不出设备）；网页走哑代理 =====
async function providerPost(url: string, apiKey: string, body: object): Promise<any> {
  if (Capacitor.isNativePlatform()) {
    if (!apiKey) throw new Error(NO_KEY_MSG);
    const res = await CapacitorHttp.post({
      url,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      data: body,
    });
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`${res.status}: ${JSON.stringify(res.data).slice(0, 200)}`);
    }
    return typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
  }
  // 网页：/api/proxy 转发（apiKey 空时服务端回落 env key，保住网页 demo）
  const r = await fetch(import.meta.env.BASE_URL + 'api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, apiKey, body }),
  });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error === 'NO_KEY' ? NO_KEY_MSG : (j.error || 'AI 调用失败'));
  return j.data;
}

// 对 chat/completions 的通用调用
async function chatCompletion(messages: ChatMessage[], opts?: { jsonMode?: boolean; temperature?: number }): Promise<string> {
  const { apiKey, baseURL, model } = getSettings();
  const url = baseURL.replace(/[/]+$/, '') + '/chat/completions';
  const body: Record<string, unknown> = { model, messages, temperature: opts?.temperature ?? 0.7 };
  if (opts?.jsonMode) body.response_format = { type: 'json_object' };
  const data = await providerPost(url, apiKey, body);
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) throw new Error('AI 返回为空');
  return reply;
}

// ===== 菜谱：一次 3 道 =====
const RECIPE_SYSTEM = `你是一位擅长家常菜和"清冰箱"创意料理的中餐厨师。
根据用户现有食材，一次创作 3 道各有特色、风味或做法明显不同的菜供挑选：
- 优先用用户已有的食材；额外食材尽量少且为家庭常备品。
- 3 道要有区分度（快手家常 / 稍讲究 / 换口味），别雷同。
- 步骤具体到火候、时间、分量，别用"适量""少许"。
请严格输出 JSON，不要多余文字：
{"recipes":[{"name":"菜名","intro":"一句话介绍","usedIngredients":["现有食材"],"extraIngredients":["需补充"],"difficulty":1到5整数,"timeMinutes":分钟整数,"steps":["步骤"],"tips":["贴士"]},{第二道},{第三道}]}`;

function parseRecipes(text: string): GeneratedRecipe[] {
  const obj = JSON.parse(text.replace(/^```json\s*|\s*```$/g, ''));
  const arr = Array.isArray(obj) ? obj : obj.recipes;
  if (!Array.isArray(arr)) throw new Error('格式异常');
  return arr.map((r: any): GeneratedRecipe => ({
    name: String(r?.name ?? ''),
    intro: String(r?.intro ?? ''),
    usedIngredients: Array.isArray(r?.usedIngredients) ? r.usedIngredients.map(String) : [],
    extraIngredients: Array.isArray(r?.extraIngredients) ? r.extraIngredients.map(String) : [],
    difficulty: Number(r?.difficulty) || 2,
    timeMinutes: Number(r?.timeMinutes) || 15,
    steps: Array.isArray(r?.steps) ? r.steps.map(String) : [],
    tips: Array.isArray(r?.tips) ? r.tips.map(String) : [],
  })).filter((r) => r.name && r.steps.length);
}

export async function generateRecipes(req: SuggestRequest): Promise<GeneratedRecipe[]> {
  const ask = req.mode === 'remix' && req.base
    ? `我想在这道菜基础上做创意改造，现有食材：${req.ingredients.join('、')}。原菜谱《${req.base.name}》，原料：${req.base.ingredients.join('、')}。请给 3 个不同的改良方向，缺的给替代方案。`
    : `我冰箱里现有食材：${req.ingredients.join('、')}。请用它们（可少量补充常见调料）创作 3 道不同的菜。`;
  const text = await chatCompletion(
    [{ role: 'system', content: RECIPE_SYSTEM }, { role: 'user', content: ask }],
    { jsonMode: true, temperature: 0.9 },
  );
  const recipes = parseRecipes(text);
  if (!recipes.length) throw new Error('AI 没返回有效菜谱，再试一次');
  return recipes;
}

// ===== 对话 =====
export async function chat(messages: ChatMessage[]): Promise<string> {
  return chatCompletion(messages);
}

// ===== 测试连接 =====
export async function testConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    await chatCompletion([{ role: 'user', content: '回复"ok"' }], { temperature: 0 });
    return { ok: true, message: '连接成功，模型可用 ✓' };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : '连接失败' };
  }
}

// ===== 配图（仅智谱 CogView）=====
const IMG_TTL = 25 * 24 * 3600 * 1000;
export async function fetchDishImage(id: string, name: string, hint?: string): Promise<string | undefined> {
  if (!imageSupported()) return undefined;
  const cacheKey = 'ck:img:' + id;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      const { url, ts } = JSON.parse(raw);
      if (url && Date.now() - ts < IMG_TTL) return url;
    }
  } catch { /* ignore */ }

  const { apiKey, baseURL } = getSettings();
  const url = baseURL.replace(/[/]+$/, '') + '/images/generations';
  const prompt = `一道"${name}"的中餐家常菜成品照片${hint ? '，' + hint : ''}，摆盘精致，暖色调自然光，俯拍视角，专业美食摄影，高清细腻`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (attempt) await new Promise((r) => setTimeout(r, 1200));
      const data = await providerPost(url, apiKey, { model: 'cogview-3-flash', prompt, size: '1024x1024' });
      const imgUrl = data?.data?.[0]?.url;
      if (imgUrl) {
        try { localStorage.setItem(cacheKey, JSON.stringify({ url: imgUrl, ts: Date.now() })); } catch { /* ignore */ }
        return imgUrl;
      }
    } catch { /* 重试 */ }
  }
  return undefined;
}
