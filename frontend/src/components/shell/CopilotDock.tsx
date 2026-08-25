/**
 * CopilotDock — the "Ask Energy AI" floating assistant.
 * A deterministic energy analyst that answers from live telemetry, decision
 * history and the derived forecast (see services/copilotEngine.ts).
 */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X, Send } from 'lucide-react';
import { askCopilot, SUGGESTED_QUESTIONS, type CopilotContext } from '../../services/copilotEngine';
import { useCampusMetrics } from '../../context/MetricsContext';
import { useVppData } from '../../context/VppDataContext';
import { useApiStats } from '../../hooks/useApiStats';
import { useCampusForecast } from '../../hooks/useCampusForecast';

interface Message {
  role: 'user' | 'ai';
  text: string;
  time: number;
}

interface CopilotDockProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CopilotDock({ open, onOpenChange }: CopilotDockProps) {
  const m = useCampusMetrics();
  const { latestDecisions, reliability } = useVppData();
  const stats = useApiStats();
  const forecast = useCampusForecast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Escape closes
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const ctx: CopilotContext = {
    metrics: m,
    reliability,
    latestDecisions,
    decisionStats: stats.decisionStats,
    forecast,
  };

  const send = (question: string) => {
    const q = question.trim();
    if (!q) return;
    const userMsg: Message = { role: 'user', text: q, time: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    // Brief "thinking" beat so the reveal feels deliberate
    window.setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: askCopilot(q, ctx), time: Date.now() }]);
    }, 450);
  };

  return (
    <>
      {/* Floating launcher */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 8 }}
            type="button"
            onClick={() => onOpenChange(true)}
            aria-label="Ask Energy AI"
            className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 flex items-center gap-2 pl-3.5 pr-4 py-2.5 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 text-[#241a02] font-bold text-[12px] shadow-ops-cyan-glow hover:brightness-110 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-200"
          >
            <Sparkles size={15} />
            Ask Energy AI
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed z-50 bottom-20 md:bottom-6 right-3 md:right-6 left-3 sm:left-auto sm:w-[380px] max-h-[70vh] flex flex-col rounded-xl border border-ops-line-strong bg-ops-panel/97 backdrop-blur-xl shadow-ops-lg overflow-hidden"
            role="dialog"
            aria-label="Energy AI analyst"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 h-12 border-b border-ops-line bg-gradient-to-r from-amber-600/10 to-transparent">
              <span className="w-7 h-7 rounded-lg grid place-items-center bg-amber-400/15 border border-amber-300/30">
                <Sparkles size={14} className="text-amber-300" />
              </span>
              <div className="min-w-0">
                <div className="text-[12px] font-bold text-white leading-tight">ENERGY AI ANALYST</div>
                <div className="tech-label" style={{ fontSize: '0.52rem' }}>Grounded in live telemetry</div>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close assistant"
                className="ml-auto p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400/60"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto ops-scroll p-3 space-y-2.5 min-h-[180px]">
              {messages.length === 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-white/45 px-1 pb-1">
                    I analyse your live VPP telemetry. Try one of these:
                  </p>
                  {SUGGESTED_QUESTIONS.map(s => (
                    <button
                      key={s.q}
                      type="button"
                      onClick={() => send(s.q)}
                      className="block w-full text-left px-3 py-2 rounded-lg border border-ops-line bg-ops-raised/60 text-[12px] text-white/75 hover:border-amber-300/40 hover:text-white hover:bg-amber-400/5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400/60"
                    >
                      “{s.q}”
                    </button>
                  ))}
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[88%] px-3 py-2 rounded-xl text-[12px] leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-amber-600/90 text-[#241a02] font-medium rounded-br-sm'
                        : 'bg-ops-raised/80 border border-ops-line text-white/85 rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <form
              className="flex items-center gap-2 p-2.5 border-t border-ops-line"
              onSubmit={e => { e.preventDefault(); send(input); }}
            >
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about energy, cost, carbon…"
                aria-label="Ask the energy analyst"
                className="ops-input !py-2"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Send question"
                className="shrink-0 w-9 h-9 grid place-items-center rounded-lg bg-amber-600 text-[#241a02] disabled:opacity-40 hover:bg-amber-400 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-200"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
