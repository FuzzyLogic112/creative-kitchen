import { useEffect, useState, type ReactNode } from 'react';
import type { Recipe } from '../lib/types';
import { ingredientMatches, CATEGORY_LABELS } from '../lib/matcher';
import { fetchDishImage } from '../lib/ai';

// recipes.json 全量 1.4MB，只在首次打开详情时拉取，之后缓存复用。
let cache: Recipe[] | null = null;
async function loadRecipes(): Promise<Recipe[]> {
  if (cache) return cache;
  const res = await fetch(import.meta.env.BASE_URL + 'recipes.json');
  cache = await res.json();
  return cache!;
}

interface Props {
  id: string;
  have: string[];
  onClose: () => void;
  onRemix: (base: { name: string; ingredients: string[]; steps: string[] }) => void;
}

export function RecipeDetail({ id, have, onClose, onRemix }: Props) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [imgState, setImgState] = useState<'loading' | 'ready' | 'failed'>('loading');

  useEffect(() => {
    let alive = true;
    loadRecipes()
      .then((all) => alive && setRecipe(all.find((r) => r.id === id) ?? null))
      .catch(() => alive && setError(true));
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    if (!recipe) return;
    let alive = true;
    setImgState('loading');
    setImageUrl(undefined);
    fetchDishImage(recipe.id, recipe.name, recipe.description?.slice(0, 40))
      .then((u) => { if (alive) { if (u) setImageUrl(u); else setImgState('failed'); } })
      .catch(() => { if (alive) setImgState('failed'); });
    return () => { alive = false; };
  }, [recipe]);

  const owned = (name: string) => have.some((h) => ingredientMatches(h, name));

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      <header className="flex items-center gap-2 border-b border-sep bg-card/80 px-3 py-3 backdrop-blur-xl pt-safe">
        <button onClick={onClose} className="press flex items-center text-[17px] text-accent">
          <span className="text-[24px] leading-none">‹</span>返回
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5 pb-safe">
        {error && <p className="text-label2">加载失败，请重试。</p>}
        {!recipe && !error && <p className="text-label3">加载中…</p>}

        {recipe && (
          <div className="mx-auto max-w-xl">
            {imgState !== 'failed' && (
              <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                {imgState !== 'ready' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-accent/25 border-t-accent" />
                    <p className="mt-3 text-[13px] text-label3">AI 正在生成配图…</p>
                  </div>
                )}
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={recipe.name}
                    onLoad={() => setImgState('ready')}
                    onError={() => setImgState('failed')}
                    className={'h-full w-full object-cover transition-opacity duration-300 ' + (imgState === 'ready' ? 'opacity-100' : 'opacity-0')}
                  />
                )}
              </div>
            )}
            <h1 className="text-[28px] font-bold tracking-tight text-label">{recipe.name}</h1>
            <div className="mt-1.5 text-[13px] text-label2">
              {CATEGORY_LABELS[recipe.category] ?? recipe.category}
              {recipe.difficulty ? ' · 难度 ' + '★'.repeat(recipe.difficulty) : ''}
              {recipe.calories ? ' · ' + recipe.calories + ' 大卡' : ''}
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-label2">{recipe.description}</p>

            <Card>
              <CardTitle>原料</CardTitle>
              <div className="flex flex-wrap gap-2">
                {recipe.ingredients.filter((i) => !i.isTool).map((i, k) => (
                  <span
                    key={k}
                    className={
                      'rounded-lg px-2.5 py-1 text-[14px] font-medium ' +
                      (i.isSeasoning
                        ? 'bg-bg text-label3'
                        : owned(i.name)
                          ? 'bg-green-soft text-green'
                          : 'bg-accent-soft text-accent')
                    }
                  >
                    {i.name}{i.optional ? ' (可选)' : ''}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[12px] text-label3">绿=你有 · 橙=需购买 · 灰=调料</p>
            </Card>

            <Card>
              <CardTitle>做法</CardTitle>
              <ol className="space-y-4">
                {recipe.steps.map((s, k) => (
                  <li key={k} className="flex gap-3">
                    <span className="mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-accent text-[14px] font-semibold text-white">
                      {k + 1}
                    </span>
                    <div className="pt-0.5">
                      <p className="text-[15px] leading-relaxed text-label">{s.text}</p>
                      {s.tips.map((t, j) => (
                        <p key={j} className="mt-1.5 text-[14px] leading-relaxed text-label2">💡 {t}</p>
                      ))}
                    </div>
                  </li>
                ))}
              </ol>
            </Card>

            <button
              onClick={() => onRemix({
                name: recipe.name,
                ingredients: recipe.ingredients.filter((i) => !i.isTool).map((i) => i.name),
                steps: recipe.steps.map((s) => s.text),
              })}
              className="press mt-4 w-full rounded-2xl bg-accent-soft p-4 text-center"
            >
              <p className="text-[15px] font-semibold text-accent">✦ 用我的食材改造这道菜</p>
              <p className="mt-0.5 text-[12px] text-label3">AI 结合你现有食材给出改良版</p>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <section className="mt-4 rounded-2xl bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">{children}</section>;
}
function CardTitle({ children }: { children: ReactNode }) {
  return <h4 className="mb-3 text-[17px] font-semibold text-label">{children}</h4>;
}
