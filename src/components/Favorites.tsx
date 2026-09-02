import { useState, useEffect } from 'react';
import { getFavorites, type FavRecipe } from '../lib/favorites';
import { RecipeDetail } from './RecipeDetail';
import { AiRecipeDetail } from './GeneratedRecipeView';

interface Props {
  onClose: () => void;
  have: string[];
  onRemix: (base: { name: string; ingredients: string[]; steps: string[] }) => void;
}

export function Favorites({ onClose, have, onRemix }: Props) {
  const [list, setList] = useState<FavRecipe[]>([]);
  const [opened, setOpened] = useState<FavRecipe | null>(null);

  // 每次回到列表都重新读，反映刚才可能的取消收藏
  useEffect(() => { if (!opened) setList(getFavorites()); }, [opened]);

  if (opened?.type === 'library' && opened.libId) {
    return <RecipeDetail id={opened.libId} have={have} onClose={() => setOpened(null)} onRemix={onRemix} />;
  }
  if (opened?.type === 'ai' && opened.ai) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-bg">
        <header className="flex items-center border-b border-sep bg-card/80 px-3 py-3 backdrop-blur-xl pt-safe">
          <button onClick={() => setOpened(null)} className="press flex items-center text-[17px] text-accent">
            <span className="text-[24px] leading-none">‹</span>收藏
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-5 pb-safe">
          <div className="mx-auto max-w-xl"><AiRecipeDetail recipe={opened.ai} /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      <header className="flex items-center border-b border-sep bg-card/80 px-3 py-3 backdrop-blur-xl pt-safe">
        <button onClick={onClose} className="press flex items-center text-[17px] text-accent">
          <span className="text-[24px] leading-none">‹</span>返回
        </button>
        <span className="ml-1 text-[15px] font-medium text-label2">我的收藏</span>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-safe">
        <div className="mx-auto max-w-xl">
          {list.length === 0 ? (
            <div className="mt-24 text-center">
              <p className="text-[15px] text-label2">还没有收藏</p>
              <p className="mt-1 text-[13px] text-label3">在菜谱详情页点右上角 ♥ 即可收藏</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {list.map((f) => (
                <button key={f.key} onClick={() => setOpened(f)}
                  className="press flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-[17px] font-semibold text-label">{f.name}</h3>
                      <span className={'shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium ' + (f.type === 'ai' ? 'bg-accent-soft text-accent' : 'bg-bg text-label3')}>
                        {f.type === 'ai' ? 'AI' : '菜谱'}
                      </span>
                    </div>
                    {f.ai?.intro && <p className="mt-1 line-clamp-1 text-[13px] text-label2">{f.ai.intro}</p>}
                  </div>
                  <span className="shrink-0 text-[20px] font-light text-label3">›</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
