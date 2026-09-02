import { useState, type ReactNode } from 'react';
import { PANTRY } from '../lib/pantry';

interface Props {
  selected: string[];
  onToggle: (name: string) => void;
  onRemove: (name: string) => void;
}

export function IngredientPicker({ selected, onToggle, onRemove }: Props) {
  const [text, setText] = useState('');
  const has = (n: string) => selected.includes(n);

  const add = () => {
    const v = text.trim();
    if (v && !has(v)) onToggle(v);
    setText('');
  };

  return (
    <div className="px-4">
      {/* iOS 搜索/输入栏：填充式圆角 */}
      <div className="mb-5 flex gap-2.5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="添加其它食材"
          className="min-w-0 flex-1 rounded-xl bg-card px-4 py-3 text-[17px] text-label shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none placeholder:text-label3"
        />
        <button
          onClick={add}
          className="press shrink-0 rounded-xl bg-accent px-5 py-3 text-[17px] font-semibold text-white"
        >
          添加
        </button>
      </div>

      {selected.length > 0 && (
        <div className="mb-6">
          <SectionLabel>已选 {selected.length} 样</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {selected.map((n) => (
              <button
                key={n}
                onClick={() => onRemove(n)}
                className="press flex items-center gap-1.5 rounded-full bg-accent py-2 pl-3.5 pr-3 text-[15px] font-medium text-white"
              >
                {n}
                <span className="text-[13px] text-white/70">✕</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {PANTRY.map((sec) => (
        <div key={sec.group} className="mb-6">
          <SectionLabel>{sec.group}</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {sec.items.map((n) => (
              <button
                key={n}
                onClick={() => onToggle(n)}
                className={
                  'press rounded-full px-4 py-2 text-[15px] font-medium ' +
                  (has(n)
                    ? 'bg-accent text-white'
                    : 'bg-card text-label shadow-[0_1px_2px_rgba(0,0,0,0.04)]')
                }
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="mb-2.5 px-1 text-[13px] font-medium text-label2">{children}</div>;
}
