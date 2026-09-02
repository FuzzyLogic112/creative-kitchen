import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { chat, type ChatMessage } from '../lib/ai';

const SYSTEM: ChatMessage = {
  role: 'system',
  content: '你是"创意厨房"里的 AI 助手，尤其擅长做饭、食材、菜谱、营养搭配，也能自由聊任何话题。回答简洁友好，用简体中文。',
};

export function Chat({ onClose, onOpenSettings }: { onClose: () => void; onOpenSettings: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: 'user', content: text } as ChatMessage];
    setMessages(next); setInput(''); setBusy(true);
    try {
      const reply = await chat([SYSTEM, ...next]);
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '出错了';
      if (msg.includes('设置')) { onOpenSettings(); return; } // NO_KEY → 去设置填 key
      setMessages([...next, { role: 'assistant', content: '⚠️ ' + msg }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      <header className="flex items-center justify-between border-b border-sep bg-card/80 px-4 py-3 backdrop-blur-xl pt-safe">
        <span className="w-12" />
        <span className="text-[16px] font-semibold text-label">AI 助手</span>
        <button onClick={onClose} className="press w-12 text-right text-[17px] text-accent">完成</button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-xl flex-col gap-3">
          {messages.length === 0 && (
            <div className="mt-20 text-center">
              <p className="text-[15px] text-label2">问我任何关于做饭的问题</p>
              <p className="mt-1 text-[13px] text-label3">比如「三分钟能做什么早餐」「牛肉怎么腌更嫩」</p>
            </div>
          )}
          {messages.filter((m) => m.role !== 'system').map((m, i) => (
            <div key={i} className={'flex ' + (m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={
                'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed ' +
                (m.role === 'user' ? 'bg-accent text-white' : 'bg-card text-label shadow-[0_1px_2px_rgba(0,0,0,0.04)]')
              }>
                {m.role === 'assistant' ? (
                  <div className="[&>*:first-child]:mt-0 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-0.5 [&_p]:mt-2 [&_strong]:font-semibold [&_h1]:mt-2 [&_h1]:font-bold [&_h2]:mt-2 [&_h2]:font-bold [&_h3]:mt-2 [&_h3]:font-semibold [&_code]:rounded [&_code]:bg-bg [&_code]:px-1 [&_code]:text-[13px]">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <span className="whitespace-pre-wrap">{m.content}</span>
                )}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-card px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-label3 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-label3 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-label3" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-sep bg-card/80 px-4 py-3 backdrop-blur-xl pb-safe">
        <div className="mx-auto flex max-w-xl items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="输入消息…"
            rows={1}
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl bg-bg px-4 py-2.5 text-[16px] text-label outline-none placeholder:text-label3"
          />
          <button
            onClick={send}
            disabled={!input.trim() || busy}
            className="press mb-0.5 shrink-0 rounded-full bg-accent px-4 py-2.5 text-[15px] font-semibold text-white disabled:opacity-40"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}
