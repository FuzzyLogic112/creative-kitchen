// /api/proxy —— 网页版专用的「哑」中转：把请求转发给用户填的模型接口，解决浏览器 CORS。
// App 版不走这里（原生 HTTP 直连）。带域名白名单，避免被当开放代理滥用。
const ALLOW = [
  'open.bigmodel.cn', 'api.deepseek.com', 'api.moonshot.cn',
  'dashscope.aliyuncs.com', 'api.siliconflow.cn', 'api.openai.com',
  'ark.cn-beijing.volces.com', 'api.hunyuan.cloud.tencent.com',
];

export interface ProxyRequest { url: string; apiKey?: string; body: unknown }
export type ProxyResponse = { ok: true; data: unknown } | { ok: false; error: string };

const envKey = () => process.env.ZHIPU_API_KEY || process.env.GLM_API_KEY || '';

export async function handleProxy(req: ProxyRequest): Promise<ProxyResponse> {
  if (!req?.url) return { ok: false, error: 'BAD_REQUEST' };
  let host: string;
  try { host = new URL(req.url).hostname; } catch { return { ok: false, error: 'bad url' }; }
  if (!ALLOW.some((h) => host === h || host.endsWith('.' + h))) return { ok: false, error: 'host not allowed: ' + host };

  const key = req.apiKey || envKey();
  if (!key) return { ok: false, error: 'NO_KEY' };

  try {
    const r = await fetch(req.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(req.body),
    });
    const data = await r.json().catch(() => null);
    if (!r.ok) return { ok: false, error: `${r.status}: ${JSON.stringify(data).slice(0, 200)}` };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') { res.statusCode = 405; return res.end('Method Not Allowed'); }
  try {
    let body: ProxyRequest = req.body;
    if (typeof body === 'string') body = JSON.parse(body || '{}');
    if (!body || typeof body !== 'object') {
      const chunks: Buffer[] = [];
      for await (const c of req) chunks.push(c as Buffer);
      body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    }
    const result = await handleProxy(body);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e) }));
  }
}
