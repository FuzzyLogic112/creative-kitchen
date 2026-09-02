import { useState } from 'react';
import { getSettings, saveSettings } from '../lib/settings';
import { PROVIDERS, byId } from '../lib/providers';
import { testConnection } from '../lib/ai';

export function Settings({ onClose }: { onClose: () => void }) {
  const init = getSettings();
  const [providerId, setProviderId] = useState(init.providerId);
  const [baseURL, setBaseURL] = useState(init.baseURL);
  const [apiKey, setApiKey] = useState(init.apiKey);
  const [model, setModel] = useState(init.model);
  const [show, setShow] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const provider = byId(providerId);

  const pickProvider = (id: string) => {
    const p = byId(id);
    setProviderId(id);
    setResult(null);
    if (id !== 'custom') {
      setBaseURL(p.baseURL);
      setModel(p.models[0] ?? '');
    }
  };

  const persist = () => saveSettings({ providerId, baseURL: baseURL.trim(), apiKey: apiKey.trim(), model: model.trim() });

  const runTest = async () => {
    persist();
    setTesting(true); setResult(null);
    setResult(await testConnection());
    setTesting(false);
  };

  const save = () => { persist(); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      <header className="flex items-center justify-between border-b border-sep bg-card/80 px-4 py-3 backdrop-blur-xl pt-safe">
        <button onClick={onClose} className="press text-[17px] text-accent">取消</button>
        <span className="text-[16px] font-semibold text-label">设置</span>
        <button onClick={save} className="press text-[17px] font-semibold text-accent">保存</button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5 pb-safe">
        <div className="mx-auto max-w-xl space-y-6">
          <section>
            <label className="mb-2 block px-1 text-[13px] font-medium text-label2">选择供应商</label>
            <div className="overflow-hidden rounded-xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              {PROVIDERS.map((p, i) => (
                <button key={p.id} onClick={() => pickProvider(p.id)}
                  className={'flex w-full items-center justify-between px-4 py-3 text-left ' + (i ? 'border-t border-sep' : '')}>
                  <div>
                    <div className="text-[16px] text-label">{p.label}</div>
                    {p.note && <div className="mt-0.5 text-[12px] text-label3">{p.note}</div>}
                  </div>
                  {providerId === p.id && <span className="ml-2 shrink-0 text-accent">✓</span>}
                </button>
              ))}
            </div>
            {provider.keyUrl && (
              <p className="mt-2 px-1 text-[12px] text-label3">领 Key：{provider.keyUrl}　·　Key 只存本机，不上传</p>
            )}
          </section>

          <section>
            <label className="mb-2 block px-1 text-[13px] font-medium text-label2">接口地址 Base URL</label>
            <input value={baseURL} onChange={(e) => { setBaseURL(e.target.value); setResult(null); }}
              placeholder="https://.../v1"
              className="w-full rounded-xl bg-card px-4 py-3 text-[15px] text-label shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none placeholder:text-label3"
              autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} />
          </section>

          <section>
            <label className="mb-2 block px-1 text-[13px] font-medium text-label2">API Key</label>
            <div className="flex items-center gap-2 rounded-xl bg-card px-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <input type={show ? 'text' : 'password'} value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setResult(null); }}
                placeholder="粘贴你的 API Key"
                className="min-w-0 flex-1 bg-transparent py-3 text-[16px] text-label outline-none placeholder:text-label3"
                autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} />
              <button onClick={() => setShow((v) => !v)} className="press shrink-0 text-[13px] text-label2">{show ? '隐藏' : '显示'}</button>
            </div>
          </section>

          <section>
            <label className="mb-2 block px-1 text-[13px] font-medium text-label2">模型</label>
            <input value={model} onChange={(e) => { setModel(e.target.value); setResult(null); }}
              placeholder="模型名，如 glm-4-flash"
              className="w-full rounded-xl bg-card px-4 py-3 text-[16px] text-label shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none placeholder:text-label3"
              autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} />
            {provider.models.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {provider.models.map((m) => (
                  <button key={m} onClick={() => { setModel(m); setResult(null); }}
                    className={'press rounded-full px-3 py-1.5 text-[13px] ' + (model === m ? 'bg-accent text-white' : 'bg-card text-label2 shadow-[0_1px_2px_rgba(0,0,0,0.04)]')}>
                    {m}
                  </button>
                ))}
              </div>
            )}
            {!provider.supportsImage && (
              <p className="mt-2 px-1 text-[12px] text-label3">注：菜谱配图目前仅智谱支持，其它供应商菜谱与对话正常、无配图。</p>
            )}
          </section>

          <section>
            <button onClick={runTest} disabled={!apiKey.trim() || !baseURL.trim() || testing}
              className="press w-full rounded-xl bg-card py-3 text-[16px] font-medium text-accent shadow-[0_1px_2px_rgba(0,0,0,0.04)] disabled:opacity-40">
              {testing ? '测试中…' : '测试连接'}
            </button>
            {result && (
              <p className={'mt-3 px-1 text-[14px] leading-relaxed ' + (result.ok ? 'text-green' : 'text-accent')}>
                {result.ok ? '✓ ' : '✗ '}{result.message}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
