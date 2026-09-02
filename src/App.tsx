import { useMemo, useState, useEffect, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';
import indexData from './data/index.json';
import type { RecipeIndex, MatchResult } from './lib/types';
import { matchRecipes } from './lib/matcher';
import type { SuggestRequest } from './lib/ai';
import { hasApiKey } from './lib/settings';
import { IngredientPicker } from './components/IngredientPicker';
import { RecipeCard } from './components/RecipeCard';
import { RecipeDetail } from './components/RecipeDetail';
import { GeneratedRecipeView } from './components/GeneratedRecipeView';
import { Settings } from './components/Settings';
import { Chat } from './components/Chat';
import { Favorites } from './components/Favorites';

const INDEX = indexData as RecipeIndex[];

export default function App() {
  const [selected, setSelected] = useState<string[]>(() => {
    try { const r = localStorage.getItem('ck:fridge'); if (r) return JSON.parse(r); } catch { /* ignore */ }
    return [];
  });
  const [view, setView] = useState<'pick' | 'results'>('pick');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [aiRequest, setAiRequest] = useState<SuggestRequest | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showFav, setShowFav] = useState(false);
  const [showHint, setShowHint] = useState(() => {
    try { return !hasApiKey() && localStorage.getItem('ck:hint') !== 'x'; } catch { return false; }
  });

  // 记住"我的冰箱"
  useEffect(() => {
    try { localStorage.setItem('ck:fridge', JSON.stringify(selected)); } catch { /* ignore */ }
  }, [selected]);

  // 安卓硬件返回键：关掉最上层弹层，而不是退出 App
  const backRef = useRef<() => void>(() => {});
  backRef.current = () => {
    if (showChat) return setShowChat(false);
    if (showSettings) return setShowSettings(false);
    if (showFav) return setShowFav(false);
    if (aiRequest) return setAiRequest(null);
    if (detailId) return setDetailId(null);
    if (view === 'results') return setView('pick');
    CapApp.exitApp();
  };
  useEffect(() => {
    let handle: { remove: () => void } | undefined;
    CapApp.addListener('backButton', () => backRef.current()).then((h) => { handle = h; });
    return () => { handle?.remove(); };
  }, []);

  const toggle = (n: string) =>
    setSelected((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]));
  const remove = (n: string) => setSelected((s) => s.filter((x) => x !== n));
  const dismissHint = () => { try { localStorage.setItem('ck:hint', 'x'); } catch { /* ignore */ } setShowHint(false); };
  const closeSettings = () => { setShowSettings(false); if (hasApiKey()) setShowHint(false); };

  const results = useMemo(
    () => (selected.length ? matchRecipes(selected, INDEX) : []),
    [selected],
  );
  const ready = results.filter((r) => r.missing.length === 0);
  const almost = results.filter((r) => r.missing.length > 0);

  return (
    <div className="mx-auto min-h-screen max-w-2xl">
      {view === 'pick' ? (
        <>
          <header className="px-4 pt-safe">
            <div className="flex items-start justify-between pt-4">
              <div>
                <h1 className="text-[34px] font-bold tracking-tight text-label">创意厨房</h1>
                <p className="mb-5 mt-1 text-[15px] text-label2">选出现有食材，看看今天能做什么</p>
              </div>
              <div className="mt-1.5 flex shrink-0 gap-2">
                <button onClick={() => setShowFav(true)} aria-label="收藏"
                  className="press flex h-9 w-9 items-center justify-center rounded-full bg-card text-label2 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
                <button onClick={() => setShowSettings(true)} aria-label="设置"
                  className="press flex h-9 w-9 items-center justify-center rounded-full bg-card text-label2 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </button>
              </div>
            </div>
          </header>

          {showHint && (
            <div className="mx-4 mb-3 flex items-center gap-2 rounded-2xl bg-accent-soft p-3">
              <p className="flex-1 text-[13px] leading-snug text-accent">填入你自己的 AI Key，即可用「AI 创作」和「对话助手」</p>
              <button onClick={() => setShowSettings(true)} className="press shrink-0 rounded-lg bg-accent px-3 py-1.5 text-[13px] font-semibold text-white">去设置</button>
              <button onClick={dismissHint} aria-label="关闭" className="press shrink-0 px-1 text-[16px] text-accent/60">✕</button>
            </div>
          )}

          <IngredientPicker selected={selected} onToggle={toggle} onRemove={remove} />
          <div className="h-28" />
          {selected.length > 0 && (
            <div className="fixed inset-x-0 bottom-0 border-t border-sep bg-card/80 px-4 py-3 backdrop-blur-xl pb-safe">
              <div className="mx-auto max-w-2xl">
                <button onClick={() => setView('results')}
                  className="press w-full rounded-2xl bg-accent py-3.5 text-[17px] font-semibold text-white">
                  找菜谱（已选 {selected.length} 样）
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <header className="sticky top-0 z-10 border-b border-sep bg-card/80 backdrop-blur-xl pt-safe">
            <div className="flex items-center gap-1 px-3 py-2.5">
              <button onClick={() => setView('pick')} className="press flex items-center text-[17px] text-accent">
                <span className="text-[24px] leading-none">‹</span>食材
              </button>
            </div>
            <div className="overflow-x-auto no-scrollbar px-4 pb-2.5">
              <div className="flex gap-1.5">
                {selected.map((n) => (
                  <span key={n} className="shrink-0 rounded-full bg-accent-soft px-3 py-1 text-[13px] font-medium text-accent">{n}</span>
                ))}
              </div>
            </div>
          </header>

          <div className="space-y-7 p-4">
            <button
              onClick={() => setAiRequest({ ingredients: selected, mode: 'create' })}
              className="press w-full rounded-2xl bg-gradient-to-br from-accent to-[#ff6b1a] p-4 text-left shadow-[0_4px_16px_rgba(255,140,26,0.25)]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[17px] font-semibold text-white">✦ 让 AI 用这些食材创作菜谱</p>
                  <p className="mt-0.5 text-[13px] text-white/85">一次给你 3 道，缺料还有替代方案</p>
                </div>
                <span className="text-[22px] font-light text-white/70">›</span>
              </div>
            </button>

            <Section title="可直接做" count={ready.length} list={ready} onOpen={setDetailId}
              empty="现有食材还凑不齐库里的整道菜——不如让上面的 AI 直接为你创作一道。" />
            {almost.length > 0 && (
              <Section title="差一点就能做" count={almost.length} list={almost} onOpen={setDetailId} />
            )}
          </div>
          <div className="h-8" />
        </>
      )}

      {detailId && (
        <RecipeDetail id={detailId} have={selected} onClose={() => setDetailId(null)}
          onRemix={(base) => setAiRequest({ ingredients: selected, mode: 'remix', base })} />
      )}
      {aiRequest && <GeneratedRecipeView request={aiRequest} onClose={() => setAiRequest(null)} />}

      {/* 悬浮 AI 助手按钮 */}
      <button
        onClick={() => setShowChat(true)}
        aria-label="AI 助手"
        className={
          'press fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-[0_6px_20px_rgba(255,140,26,0.4)] ' +
          (view === 'pick' && selected.length > 0 ? 'bottom-24' : 'bottom-6')
        }
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </button>

      {showSettings && <Settings onClose={closeSettings} />}
      {showChat && <Chat onClose={() => setShowChat(false)} onOpenSettings={() => { setShowChat(false); setShowSettings(true); }} />}
      {showFav && (
        <Favorites onClose={() => setShowFav(false)} have={selected}
          onRemix={(base) => { setShowFav(false); setAiRequest({ ingredients: selected, mode: 'remix', base }); }} />
      )}
    </div>
  );
}

function Section({
  title, count, list, onOpen, empty,
}: {
  title: string;
  count: number;
  list: MatchResult[];
  onOpen: (id: string) => void;
  empty?: string;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-2 px-1">
        <h2 className="text-[20px] font-bold tracking-tight text-label">{title}</h2>
        <span className="text-[15px] font-medium text-label3">{count}</span>
      </div>
      {list.length === 0 && empty ? (
        <p className="rounded-2xl bg-card p-6 text-center text-[14px] leading-relaxed text-label2 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">{empty}</p>
      ) : (
        <div className="space-y-2.5">
          {list.slice(0, 30).map((r) => (
            <RecipeCard key={r.id} r={r} onClick={() => onOpen(r.id)} />
          ))}
        </div>
      )}
    </section>
  );
}
