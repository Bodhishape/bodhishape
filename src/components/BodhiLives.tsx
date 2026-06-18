import React, { useState, useEffect, useRef } from "react";
import { Video, Heart, Send, Users, Wifi, RefreshCw, MessageSquare, Flame } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "../types";

interface LiveChatMsg {
  id: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  badge?: string;
}

interface FloatingHeart {
  id: number;
  x: number; // Percentage offset
  color: string;
  size: number;
}

export default function BodhiLives({ currentUser }: { currentUser: User | null }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [viewers, setViewers] = useState(14);
  const [commentInput, setCommentInput] = useState("");
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const heartIdCounter = useRef(0);

  // Initial live chat state
  const [comments, setComments] = useState<LiveChatMsg[]>([]);

  // Simple static interaction hook without fake user spamming
  useEffect(() => {
    // Add a welcomed static message from system moderator once
    const introMsg: LiveChatMsg = {
      id: "system-moderator-intro",
      userName: "Moderador BodhiShape",
      userAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=SystemMod",
      content: "Seja bem-vindo(a) ao canal de transmissão! Envie suas mensagens abaixo para interagir em tempo real.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      badge: "Staff"
    };
    setComments([introMsg]);
  }, []);

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !currentUser) return;

    const newMsg: LiveChatMsg = {
      id: `user-live-${Date.now()}`,
      userName: currentUser.displayName || currentUser.name,
      userAvatar: currentUser.avatar,
      content: commentInput,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setComments(prev => [...prev, newMsg]);
    setCommentInput("");
    triggerHeart();
  };

  const triggerHeart = () => {
    const colors = ["#FF4B72", "#FF8D3B", "#FFCA4B", "#EC4899", "#8B5CF6", "#3B82F6"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomOffset = Math.random() * 50 + 25; // Keep centralized in lower player section
    const randomSize = Math.random() * 15 + 15; // Width range

    const newHeart: FloatingHeart = {
      id: heartIdCounter.current++,
      x: randomOffset,
      color: randomColor,
      size: randomSize
    };

    setFloatingHearts(prev => [...prev, newHeart]);

    // Clean up heart after animation ends (2.5s)
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 2500);
  };

  return (
    <div className="space-y-6" id="bodhi-live-broadcast-room">
      
      {/* TRANSMISSION DETAILS CONTAINER */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#1F172C]/40 p-5 rounded-2xl border border-slate-850 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-rose-500/10 border border-rose-500/25 p-2 rounded-xl text-rose-450 shrink-0 flex items-center justify-center animate-pulse">
            <Wifi className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-rose-650 text-white font-black text-[9px] uppercase tracking-wider py-0.5 px-2 rounded font-sans flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                AO VIVO
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                {viewers} assistindo agora
              </span>
            </div>
            <h2 className="text-base font-black font-heading text-slate-100 mt-1">
              Estudo Geral de Incentivo aos Bodhishapers - Recife Centro
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setViewers(v => v + 3)}
          className="text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-950/50 hover:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-850 flex items-center gap-1.5 transition self-start md:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar Força
        </button>
      </div>

      {/* COMPACT PLAYER GRID SYSTEM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="live-broadcast-layout">
        
        {/* VIDEO DISPLAY AREA */}
        <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-850 overflow-hidden relative min-h-[300px] sm:min-h-[411px] flex flex-col items-center justify-center group shadow-2xl">
          {isPlaying ? (
            <div className="absolute inset-0 w-full h-full">
              {/* Premium generic video loop showcasing peaceful environment / temple / gym focus */}
              <iframe
                src="https://www.youtube.com/embed/5qap5aO4i9A?autoplay=1&mute=1&playlist=5qap5aO4i9A&loop=1&controls=0&showinfo=0&rel=0"
                title="Soka Shape Live Stream Backdrop Loop"
                className="w-full h-full object-cover border-0 filter opacity-65 scale-102 pointer-events-none"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            </div>
          ) : (
            <div className="z-10 p-6 text-center space-y-3">
              <span className="text-3xl block">📺</span>
              <h4 className="text-sm font-bold text-slate-300">Transmissão pausada</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">Sua conexão com o transmissor Soka está garantida. Clique abaixo para restabelecer o sinal secundário.</p>
              <button
                onClick={() => setIsPlaying(true)}
                className="px-4 py-1.5 bg-rose-650 hover:bg-rose-600 text-white rounded-xl text-xs font-black shadow-lg"
              >
                Retomar Transmissão
              </button>
            </div>
          )}

          {/* User video floating details overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent z-10 pointer-events-none">
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-850 backdrop-blur-md max-w-sm">
              <p className="text-[10px] font-black font-sans uppercase text-rose-450 tracking-wider">PALESTRA ONLINE DO DIA</p>
              <p className="text-xs font-black text-slate-100 font-heading mt-1 leading-tight">"Vencendo de forma Inabalável: O Mantra e a Força Física"</p>
              <p className="text-[10px] text-slate-450 mt-1 lines-clamp-2 leading-relaxed">Conexão direta com oradores convidados relatando a comprovação de sua revolução humana.</p>
            </div>

            {/* floating reactions container inside player bounds */}
            <div className="relative w-24 h-64 select-none">
              <AnimatePresence>
                {floatingHearts.map((heart) => (
                  <motion.div
                    key={heart.id}
                    initial={{ opacity: 0, scale: 0.1, y: 150, x: `${heart.x}%` }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      scale: [0.2, 1, 1.3, 0.4],
                      y: [150, 60, -30, -90],
                      x: [
                        `${heart.x}%`,
                        `${heart.x + (Math.random() * 20 - 10)}%`,
                        `${heart.x + (Math.random() * 40 - 20)}%`,
                        `${heart.x + (Math.random() * 10 - 5)}%`
                      ]
                    }}
                    transition={{ duration: 2.2, ease: "easeOut" }}
                    className="absolute text-xl pointer-events-none"
                    style={{ fontSize: `${heart.size}px` }}
                  >
                    ❤️
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Control widgets */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-800/80 text-[10px] text-rose-450 font-mono font-bold flex items-center gap-1.5 z-10">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            SINAL HD • 1080P
          </div>
        </div>

        {/* LIVE STREAM CHAT CONSOLE */}
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-4.5 flex flex-col h-[400px] sm:h-[411px] justify-between shadow-xl relative" id="live-chat-panel">
          
          <div className="border-b border-slate-850 pb-2.5 mb-2 flex items-center justify-between text-xs font-bold text-slate-350">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              Diálogos do Grupo Soka (Ao Vivo)
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-450 animate-ping inline-block shrink-0" />
          </div>

          {/* Scrolling Messages container */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 py-1.5 scrollbar-thin max-h-[300px]">
            {comments.map((comm) => (
              <div key={comm.id} className="flex gap-2.5 items-start text-xs text-left leading-relaxed">
                <img
                  src={comm.userAvatar}
                  alt={comm.userName}
                  className="w-7 h-7 rounded-full object-cover shrink-0 bg-slate-950 border border-slate-805"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-[#95B2FF] font-sans text-[11px]">{comm.userName}</span>
                    {comm.badge && (
                      <span className="bg-amber-500/10 text-amber-400 text-[8px] font-black uppercase px-1 rounded border border-amber-500/20 font-mono scale-95">
                        {comm.badge}
                      </span>
                    )}
                    <span className="text-[8px] text-slate-550 font-mono ml-auto">{comm.timestamp}</span>
                  </div>
                  <p className="text-slate-300 font-light mt-0.5 max-w-[210px] break-words">{comm.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Writing comment box section */}
          <form onSubmit={handleSendComment} className="pt-3 border-t border-slate-850 flex flex-col gap-2">
            <div className="flex gap-1.5 items-center">
              <button
                type="button"
                onClick={triggerHeart}
                className="p-1 px-3 bg-rose-950/30 border border-rose-900/35 hover:bg-rose-950/50 hover:scale-102 hover:text-white rounded-lg text-rose-400 text-xs font-black transition flex items-center gap-1.5 select-none shrink-0"
              >
                ❤️ <span className="text-[10px]">Incentivar</span>
              </button>

              <div className="flex-1 flex gap-1.5 items-center bg-slate-950/60 rounded-lg overflow-hidden border border-slate-805 px-2 py-1 focus-within:border-rose-900/40">
                <input
                  type="text"
                  placeholder="Envie uma palavra de apoio..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="bg-transparent border-0 ring-0 focus:ring-0 text-slate-100 text-xs outline-none flex-1 placeholder-slate-600 font-normal p-1"
                />
                <button
                  type="submit"
                  disabled={!commentInput.trim()}
                  className="text-rose-500 hover:text-rose-455 p-1 transition disabled:opacity-30 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>
        </div>

      </div>

      {/* QUICK INCENTIVES BAR */}
      <div className="bg-slate-900/40 p-4.5 rounded-2xl border border-slate-850 flex items-start gap-3 text-xs text-slate-450 leading-relaxed font-normal">
        <Flame className="w-5 h-5 text-soka-orange shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-350">Por que apoiar nas Lives?</p>
          <p>
            Dizemos que as transmissões ao vivo criam a rede indissolúvel de incentivos recíprocos. Ao enviar pensamentos positivos e clicar no botão ❤️ de incentivo rápido, você gera instantaneamente ondas alegres de encorajamento para os oradores na tribuna soka.
          </p>
        </div>
      </div>
    </div>
  );
}
