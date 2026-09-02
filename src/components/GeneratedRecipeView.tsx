import { useEffect, useState, useCallback } from 'react';
import { generateRecipes, fetchDishImage, type GeneratedRecipe, type SuggestRequest } from '../lib/ai';
import { toggleFav, isFav, aiFavKey } from '../lib/favorites';
import { HeartButton } from './HeartButton';

export function GeneratedRecipeView({ request, onClose }: { request: SuggestRequest; onClose: () => void }) {
  const [recipes, setRecipes] = useState<GeneratedRecipe[] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const run = useCallback(() => {
    setLoading(true); setError(null); setRecipes(null); setSelected(null);
    let alive = true;
    generateRecipes(request)
      .then((r) => alive && setRecipes(r))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [request]);

  useEffect(run, [run]);

  const back = () => (selected !== null ? setSelected(null) : onClose());

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      <header className="flex items-center border-b border-sep bg-card/80 px-3 py-3 backdrop-blur-xl pt-safe">
        <button onClick={back} className="press flex items-center text-[17px] text-accent">
          <span className="text-[24px] leading-none">‹</span>{selected !== null ? '换一道' : '返回'}
        </button>
        <span className="ml-1 text-[15px] font-medium text-label2">AI 创作</span>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5 pb-safe">
        <div className="mx-auto max-w-xl">
          {loading && <Loading />}

          {error && (
            <div className="mt-10 text-center">
              <p className="text-[15px] leading-relaxed text-label2">{error}</p>
              <button onClick={run} className="press mt-4 rounded-xl bg-accent px-5 py-2.5 text-[15px] font-semibold text-white">重试</button>
            </div>
          )}

          {recipes && selected === null && (
            <div>
              <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-medium text-accent">✦ AI 为你想了 {recipes.length} 道</div>
              <h1 className="mb-4 text-[26px] font-bold tracking-tight text-label">挑一道来做</h1>
              <div className="space-y-3">
                {recipes.map((r, i) => (
                  <button key={i} onClick={() => setSelected(i)} className="press flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-[17px] font-semibold text-label">{r.name}</h3>
                        <span className="shrink-0 text-[12px] text-label3">{'★'.repeat(Math.max(1, Math.min(5, r.difficulty)))} · {r.timeMinutes}分</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-label2">{r.intro}</p>
                      {r.extraIngredients.length > 0 && (
                        <p className="mt-1.5 text-[12px] text-accent">需补充：{r.extraIngredients.join('、')}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-[20px] font-light text-label3">›</span>
                  </button>
                ))}
              </div>
              <p className="mt-5 text-center text-[12px] text-label3">AI 生成内容仅供参考，请依口味与食材调整</p>
            </div>
          )}

          {recipes && selected !== null && <AiRecipeDetail recipe={recipes[selected]} />}
        </div>
      </div>
    </div>
  );
}

export function AiRecipeDetail({ recipe }: { recipe: GeneratedRecipe }) {
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [imgState, setImgState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [fav, setFav] = useState(() => isFav(aiFavKey(recipe.name)));

  useEffect(() => {
    let alive = true;
    setImgState('loading'); setImageUrl(undefined);
    fetchDishImage('ai:' + recipe.name, recipe.name, recipe.intro?.slice(0, 40))
      .then((u) => { if (alive) { if (u) setImageUrl(u); else setImgState('failed'); } })
      .catch(() => { if (alive) setImgState('failed'); });
    return () => { alive = false; };
  }, [recipe]);

  return (
    <div>
      {imgState !== 'failed' && (
        <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          {imgState !== 'ready' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-accent/25 border-t-accent" />
              <p className="mt-3 text-[13px] text-label3">AI 正在生成配图…</p>
            </div>
          )}
          {imageUrl && (
            <img src={imageUrl} alt={recipe.name} onLoad={() => setImgState('ready')} onError={() => setImgState('failed')}
              className={'h-full w-full object-cover transition-opacity duration-300 ' + (imgState === 'ready' ? 'opacity-100' : 'opacity-0')} />
          )}
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-[28px] font-bold tracking-tight text-label">{recipe.name}</h1>
        <HeartButton active={fav} onClick={() => setFav(toggleFav({ key: aiFavKey(recipe.name), type: 'ai', name: recipe.name, ai: recipe }))} />
      </div>
      <div className="mt-1.5 text-[13px] text-label2">难度 {'★'.repeat(Math.max(1, Math.min(5, recipe.difficulty)))} · 约 {recipe.timeMinutes} 分钟</div>
      <p className="mt-3 text-[15px] leading-relaxed text-label2">{recipe.intro}</p>

      <section className="mt-4 rounded-2xl bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <h4 className="mb-3 text-[17px] font-semibold text-label">原料</h4>
        <div className="flex flex-wrap gap-2">
          {recipe.usedIngredients.map((i, k) => (
            <span key={'u' + k} className="rounded-lg bg-green-soft px-2.5 py-1 text-[14px] font-medium text-green">{i}</span>
          ))}
          {recipe.extraIngredients.map((i, k) => (
            <span key={'e' + k} className="rounded-lg bg-accent-soft px-2.5 py-1 text-[14px] font-medium text-accent">+ {i}</span>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-label3">绿=你有 · 橙=需补充</p>
      </section>

      <section className="mt-4 rounded-2xl bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <h4 className="mb-3 text-[17px] font-semibold text-label">做法</h4>
        <ol className="space-y-4">
          {recipe.steps.map((s, k) => (
            <li key={k} className="flex gap-3">
              <span className="mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-accent text-[14px] font-semibold text-white">{k + 1}</span>
              <p className="pt-0.5 text-[15px] leading-relaxed text-label">{s}</p>
            </li>
          ))}
        </ol>
      </section>

      {recipe.tips.length > 0 && (
        <section className="mt-4 rounded-2xl bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <h4 className="mb-3 text-[17px] font-semibold text-label">小贴士</h4>
          {recipe.tips.map((t, k) => (<p key={k} className="mb-1.5 text-[14px] leading-relaxed text-label2">💡 {t}</p>))}
        </section>
      )}
      <p className="mt-5 text-center text-[12px] text-label3">AI 生成内容仅供参考，请依实际口味与食材调整</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="mt-24 flex flex-col items-center">
      <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-accent/25 border-t-accent" />
      <p className="mt-4 text-[15px] text-label2">AI 正在构思 3 道菜…</p>
      <p className="mt-1 text-[13px] text-label3">几秒钟就好</p>
    </div>
  );
}
