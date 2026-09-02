// 可接入的模型供应商（均为 OpenAI 兼容的 /chat/completions 接口）。
// baseURL 在设置里可编辑，万一某家改了地址用户能自行修正；不确定的用「自定义」。
export interface Provider {
  id: string;
  label: string;
  baseURL: string;
  models: string[];        // 建议模型（可在设置里改成任意）
  keyUrl: string;          // 领 key 的网址
  supportsImage: boolean;  // 是否支持菜谱配图（目前仅智谱 CogView）
  note?: string;
}

export const PROVIDERS: Provider[] = [
  { id: 'zhipu', label: '智谱 GLM（免费·带配图）', baseURL: 'https://open.bigmodel.cn/api/paas/v4', models: ['glm-4-flash', 'glm-4-plus', 'glm-4-air'], keyUrl: 'open.bigmodel.cn', supportsImage: true, note: 'GLM-4-Flash 与配图 CogView 永久免费，推荐首选' },
  { id: 'siliconflow', label: '硅基流动（送额度·聚合多模型）', baseURL: 'https://api.siliconflow.cn/v1', models: ['Qwen/Qwen2.5-7B-Instruct', 'deepseek-ai/DeepSeek-V3'], keyUrl: 'cloud.siliconflow.cn', supportsImage: false, note: '注册送免费额度' },
  { id: 'deepseek', label: 'DeepSeek 深度求索', baseURL: 'https://api.deepseek.com', models: ['deepseek-chat', 'deepseek-reasoner'], keyUrl: 'platform.deepseek.com', supportsImage: false },
  { id: 'moonshot', label: '月之暗面 Kimi', baseURL: 'https://api.moonshot.cn/v1', models: ['moonshot-v1-8k', 'moonshot-v1-32k'], keyUrl: 'platform.moonshot.cn', supportsImage: false },
  { id: 'qwen', label: '阿里通义千问', baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', models: ['qwen-turbo', 'qwen-plus', 'qwen-max'], keyUrl: 'bailian.console.aliyun.com', supportsImage: false },
  { id: 'openai', label: 'OpenAI（需外网）', baseURL: 'https://api.openai.com/v1', models: ['gpt-4o-mini', 'gpt-4o'], keyUrl: 'platform.openai.com', supportsImage: false, note: '国内直连通常不可用' },
  { id: 'custom', label: '自定义（任意 OpenAI 兼容接口）', baseURL: '', models: [], keyUrl: '', supportsImage: false, note: '手动填 Base URL 与模型名' },
];

export const byId = (id: string) => PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0];
