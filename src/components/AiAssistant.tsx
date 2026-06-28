import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, X, Sparkles, Zap, Heart, Target, Dumbbell } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AiAssistantProps {
  currentUser: { id: string; displayName?: string; name?: string } | null;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const suggestions = [
  { icon: Zap, text: "Como está meu progresso hoje?" },
  { icon: Heart, text: "Dicas de Daimoku" },
  { icon: Target, text: "Minhas metas" },
  { icon: Dumbbell, text: "Treino sugerido" },
  { icon: Sparkles, text: "Mensagem motivacional" },
];

const INITIAL_MESSAGE = "Olá! Sou o Bodhi IA, seu assistente pessoal. Tenho acesso aos seus dados de prática e treino. Como posso ajudar hoje?";

export default function AiAssistant({ currentUser }: AiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", content: INITIAL_MESSAGE, timestamp: Date.now() }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !currentUser) return;
    const userMsg: ChatMessage = { role: "user", content: text.trim(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, message: text.trim(), history })
      });
      const data = await res.json();
      const aiMsg: ChatMessage = { role: "assistant", content: data.reply || "Não consegui processar agora. Tente de novo!", timestamp: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Erro de conexão. Tente novamente.", timestamp: Date.now() }]);
    }
    setLoading(false);
  };

  return (
    <>
      {!isOpen && (
        <button
          id="btn-bodhi-ia-trigger"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-pink-600 text-white shadow-2xl shadow-indigo-950/40 hover:scale-105 active:scale-95 transition-all z-40 flex items-center justify-center cursor-pointer border border-indigo-500/25"
          title="Bodhi IA — Assistente Contextual"
        >
          <Bot className="w-7 h-7" />
        </button>
      )}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="bodhi-ia-chatbox"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-[360px] max-w-[calc(100vw-32px)] h-[520px] max-h-[calc(100vh-120px)] bg-[#0E0616] border border-slate-800/60 rounded-2xl shadow-2xl shadow-slate-950/80 flex flex-col z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-800/60 bg-[#1a0a2e]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-200 font-heading">Bodhi IA</h3>
                  <p className="text-[9px] text-slate-550">{loading ? "Pensando..." : "Assistente Contextual"}</p>
                </div>
              </div>
              <button 
                id="btn-bodhi-ia-close"
                onClick={() => setIsOpen(false)} 
                className="p-1.5 hover:bg-slate-800/60 rounded-lg transition cursor-pointer text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-left">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] p-2.5 rounded-xl text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-600/30 text-slate-100 border border-indigo-500/20 rounded-tr-[4px]"
                      : "bg-slate-900/70 text-slate-200 border border-slate-800/40 rounded-tl-[4px]"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-900/70 text-slate-400 text-xs p-2.5 rounded-xl border border-slate-800/40 rounded-tl-[4px] flex gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>.</span>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
            {messages.length <= 1 && (
              <div className="px-3 pb-2 text-left">
                <p className="text-[8px] text-slate-600 uppercase font-black tracking-wider mb-1.5">Perguntas rápidas</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <button 
                        key={i} 
                        onClick={() => sendMessage(s.text)} 
                        disabled={loading} 
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/70 border border-slate-800/40 hover:bg-slate-800/60 hover:border-slate-700/60 transition text-[9px] text-slate-300 font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Icon className="w-3 h-3 text-indigo-400" />
                        {s.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="p-3 border-t border-slate-800/60 bg-[#1a0a2e]/30">
              <div className="flex gap-2">
                <input
                  id="input-bodhi-ia-message"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                  placeholder="Digite sua pergunta..."
                  disabled={loading}
                  className="flex-1 bg-slate-950 text-xs border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 placeholder-slate-600 outline-none focus:border-indigo-500/40 disabled:opacity-50"
                />
                <button 
                  id="btn-bodhi-ia-send"
                  onClick={() => sendMessage(input)} 
                  disabled={!input.trim() || loading} 
                  className="p-2.5 bg-indigo-650 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
