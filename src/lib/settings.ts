// 用户设置（BYOK 多供应商）。存 localStorage，App 内即在设备本地，key 不出设备。
import { byId } from './providers';

export interface Settings {
  providerId: string;
  baseURL: string;
  apiKey: string;
  model: string;
}

const KEY = 'ck:settings';
const DEFAULT: Settings = { providerId: 'zhipu', baseURL: 'https://open.bigmodel.cn/api/paas/v4', apiKey: '', model: 'glm-4-flash' };

export function getSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT };
}

export function saveSettings(s: Settings) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function hasApiKey(): boolean {
  return !!getSettings().apiKey;
}

// 当前供应商是否支持菜谱配图（目前仅智谱）
export function imageSupported(): boolean {
  return byId(getSettings().providerId).supportsImage;
}
