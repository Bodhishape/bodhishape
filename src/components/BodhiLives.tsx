import React, { useState, useEffect, useRef } from "react";
import { Video, Heart, Send, Users, Wifi, RefreshCw, MessageSquare, Flame, Trash2, Play, CircleDot } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "../types";

interface LiveEvent {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  createdAt: string;
  createdBy: string;
  likes: number;
}

interface LiveChatMsg {
  id: string;
  liveId: string;
  userId: string;
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
  const [activeLive, setActiveLive] = useState<LiveEvent | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [viewers, setViewers] = useState(1);
  const [commentInput, setCommentInput] = useState("");
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const heartIdCounter = useRef(0);
  const [comments, setComments] = useState<LiveChatMsg[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Admin form state
  const [newLiveTitle, setNewLiveTitle] = useState("");
  const [newLiveDesc, setNewLiveDesc] = useState("");
  const [newLiveUrl, setNewLiveUrl] = useState("");
  const [isStartingLive, setIsStartingLive] = useState(false);

  const isAdmin = currentUser?.roles?.includes("admin") || currentUser?.roles?.includes("developer");

  // Fetch current active live
  const fetchActiveLive = async () => {
    try {
      const res = await fetch("/api/lives");
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setActiveLive(data[0]);
        } else {
          setActiveLive(null);
        }
      }
    } catch (err) {
      console.error("Error fetching live:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch active comments for the current live
  const fetchComments = async (liveId: string) => {
    try {
      const res = await fetch(`/api/lives/${liveId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  // Fetch active viewers from active practitioners
  const fetchViewersCount = async () => {
    try {
      const res = await fetch("/api/daimoku/active");
      if (res.ok) {
        const data = await res.json();
        // At least 1 viewer if a live is active, or use the length of connected practitioners
        setViewers(Math.max(1, data.length));
      }
    } catch (err) {
      console.error("Error fetching viewers:", err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchActiveLive();
    fetchViewersCount();
    
    const liveInterval = setInterval(fetchActiveLive, 5000);
    const viewersInterval = setInterval(fetchViewersCount, 8000);

    return () => {
      clearInterval(liveInterval);
      clearInterval(viewersInterval);
    };
  }, []);

  // Poll comments for active live
  useEffect(() => {
    if (!activeLive) {
      setComments([]);
      return;
    }

    fetchComments(activeLive.id);
    const commentsInterval = setInterval(() => {
      fetchComments(activeLive.id);
    }, 3000);

    return () => clearInterval(commentsInterval);
  }, [activeLive?.id]);

  const handleStartLive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newLiveTitle.trim() || !newLiveUrl.trim()) return;

    try {
      setIsStartingLive(true);
      const res = await fetch("/api/lives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          title: newLiveTitle,
          description: newLiveDesc,
          videoUrl: newLiveUrl
        })
      });

      if (res.ok) {
        const data = await res.json();
        setActiveLive(data);
        setNewLiveTitle("");
        setNewLiveDesc("");
        setNewLiveUrl("");
      }
    } catch (err) {
      console.error("Error starting live:", err);
    } finally {
      setIsStartingLive(false);
    }
  };

  const handleEndLive = async () => {
    if (!currentUser || !activeLive) return;
    if (!window.confirm("Deseja realmente encerrar a transmissão ao vivo atual para todos os membros?")) return;

    try {
      const res = await fetch(`/api/lives/${activeLive.id}?userId=${currentUser.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setActiveLive(null);
        setComments([]);
      }
    } catch (err) {
      console.error("Error ending live:", err);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !currentUser || !activeLive) return;

    const text = commentInput;
    setCommentInput("");

    try {
      const res = await fetch(`/api/lives/${activeLive.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          content: text
        })
      });

      if (res.ok) {
        const newMsg = await res.json();
        setComments(prev => [...prev, newMsg]);
        triggerHeart();
      }
    } catch (err) {
      console.error("Error posting comment:", err);
    }
  };

  const handleReactLive = async () => {
    if (!activeLive) return;
    triggerHeart();
    try {
      await fetch(`/api/lives/${activeLive.id}/react`, { method: "POST" });
    } catch (err) {
      console.error("Error sending reaction:", err);
    }
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

    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 2500);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Sincronizando sinal da Bodhi TV...</p>
      </div>
    );
  }

  // EMPTY STATE: No active live
  if (!activeLive) {
    return (
      <div className="space-y-6" id="bodhi-live-broadcast-room">
        {/* TRANSMISSION DETAILS CONTAINER */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#1F172C]/40 p-5 rounded-2xl border border-slate-850 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 border border-slate-700 p-2 rounded-xl text-slate-400 shrink-0 flex items-center justify-center">
              <Wifi className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="bg-slate-800 text-slate-400 font-black text-[9px] uppercase tracking-wider py-0.5 px-2 rounded font-sans flex items-center gap-1">
                  OFFLINE
                </span>
              </div>
              <h2 className="text-base font-black font-heading text-slate-300 mt-1">
                Nenhuma transmissão ao vivo ativa neste momento
              </h2>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-850 p-12 text-center flex flex-col items-center justify-center min-h-[300px] shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl">
              📺
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-300 font-heading">Aguardando início de transmissão</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Os líderes da BSGI e palestrantes convidados criam lives de fomento periodicamente. Fique de olho na agenda oficial!
              </p>
            </div>
          </div>

          {/* ADMIN ACTION PANEL to start a live */}
          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 space-y-4 shadow-xl text-left">
            {isAdmin ? (
              <form onSubmit={handleStartLive} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-lg">🛡️</span>
                  <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider font-heading">Painel de Transmissão Soka</h3>
                  <p className="text-[10px] text-slate-500">Inicie uma transmissão oficial da Bodhi TV para todos os membros ativos.</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-indigo-300 block">Título da Live</label>
                    <input
                      type="text"
                      placeholder="Ex: Estudo Geral de Incentivo - Regional Recife"
                      value={newLiveTitle}
                      onChange={(e) => setNewLiveTitle(e.target.value)}
                      required
                      className="w-full text-xs font-semibold bg-[#03010b] border border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 transition-colors text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-indigo-300 block">Descrição / Palestrantes</label>
                    <textarea
                      placeholder="Ex: Palestra especial com líderes convidados para aprimoramento da postura."
                      value={newLiveDesc}
                      onChange={(e) => setNewLiveDesc(e.target.value)}
                      rows={2}
                      className="w-full text-xs font-semibold bg-[#03010b] border border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 transition-colors text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-indigo-300 block">Link de Vídeo do YouTube</label>
                    <input
                      type="text"
                      placeholder="ID do vídeo ou URL completa"
                      value={newLiveUrl}
                      onChange={(e) => setNewLiveUrl(e.target.value)}
                      required
                      className="w-full text-xs font-mono font-bold bg-[#03010b] border border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 transition-colors text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isStartingLive}
                    className="w-full py-2.5 bg-rose-650 hover:bg-rose-600 disabled:opacity-50 text-white font-bold rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-1.5 text-[10px] uppercase font-mono"
                  >
                    <Play className="w-3.5 h-3.5" /> {isStartingLive ? "Iniciando..." : "Transmitir Ao Vivo"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2 text-center py-6">
                <span className="text-xl">🔒</span>
                <h4 className="text-xs font-bold text-slate-300">Acesso Restrito</h4>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Apenas contas administrativas ou de liderança regional licenciadas possuem permissões para iniciar transmissões na Bodhi TV.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* QUICK INCENTIVES BAR */}
        <div className="bg-slate-900/40 p-4.5 rounded-2xl border border-slate-850 flex items-start gap-3 text-xs text-slate-450 leading-relaxed font-normal text-left">
          <Flame className="w-5 h-5 text-soka-orange shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-350">Por que apoiar nas Lives?</p>
            <p>
              As transmissões ao vivo criam a rede indissolúvel de incentivos recíprocos. Ao enviar pensamentos positivos e clicar no botão ❤️ de incentivo rápido, você gera instantaneamente ondas alegres de encorajamento para os oradores na tribuna soka.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE STATE: Active live running
  return (
    <div className="space-y-6" id="bodhi-live-broadcast-room">
      
      {/* TRANSMISSION DETAILS CONTAINER */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#1F172C]/40 p-5 rounded-2xl border border-slate-850 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-rose-500/10 border border-rose-500/25 p-2 rounded-xl text-rose-450 shrink-0 flex items-center justify-center animate-pulse">
            <Wifi className="w-5 h-5 text-rose-400" />
          </div>
          <div className="text-left">
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
              {activeLive.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={handleEndLive}
              className="text-xs font-bold text-red-450 hover:text-white hover:bg-red-950/40 bg-red-950/15 px-3 py-1.5 rounded-xl border border-red-900/30 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Encerrar Transmissão
            </button>
          )}

          <button
            type="button"
            onClick={fetchViewersCount}
            className="text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-950/50 hover:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-850 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar Força
          </button>
        </div>
      </div>

      {/* COMPACT PLAYER GRID SYSTEM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="live-broadcast-layout">
        
        {/* VIDEO DISPLAY AREA */}
        <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-850 overflow-hidden relative min-h-[300px] sm:min-h-[411px] flex flex-col items-center justify-center group shadow-2xl">
          {isPlaying ? (
            <div className="absolute inset-0 w-full h-full">
              <iframe
                src={`https://www.youtube.com/embed/${activeLive.videoUrl}?autoplay=1&mute=0&playlist=${activeLive.videoUrl}&loop=1&controls=1&showinfo=0&rel=0`}
                title={activeLive.title}
                className="w-full h-full object-cover border-0 filter opacity-90 scale-100"
                referrerPolicy="no-referrer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent pointer-events-none" />
            </div>
          ) : (
            <div className="z-10 p-6 text-center space-y-3">
              <span className="text-3xl block">📺</span>
              <h4 className="text-sm font-bold text-slate-300">Transmissão pausada</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">Sua conexão com o transmissor Soka está garantida. Clique abaixo para restabelecer o sinal secundário.</p>
              <button
                onClick={() => setIsPlaying(true)}
                className="px-4 py-1.5 bg-rose-650 hover:bg-rose-600 text-white rounded-xl text-xs font-black shadow-lg cursor-pointer"
              >
                Retomar Transmissão
              </button>
            </div>
          )}

          {/* User video floating details overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent z-10 pointer-events-none w-full">
            {activeLive.description && (
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-850 backdrop-blur-md max-w-sm text-left">
                <p className="text-[10px] font-black font-sans uppercase text-rose-450 tracking-wider">PALESTRA ONLINE DO DIA</p>
                <p className="text-xs font-black text-slate-100 font-heading mt-1 leading-tight">{activeLive.description}</p>
              </div>
            )}

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
                    style={{ fontSize: `${heart.size}px`, color: heart.color }}
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
            SINAL AO VIVO • HD
          </div>
        </div>

        {/* LIVE STREAM CHAT CONSOLE */}
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-4.5 flex flex-col h-[400px] sm:h-[411px] justify-between shadow-xl relative text-left" id="live-chat-panel">
          
          <div className="border-b border-slate-850 pb-2.5 mb-2 flex items-center justify-between text-xs font-bold text-slate-350">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              Diálogos do Grupo Soka (Ao Vivo)
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-450 animate-ping inline-block shrink-0" />
          </div>

          {/* Scrolling Messages container */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 py-1.5 scrollbar-thin max-h-[300px]">
            {comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 text-[11px] font-mono">
                <CircleDot className="w-5 h-5 text-slate-600 animate-pulse mb-1.5" />
                Nenhuma mensagem enviada ainda.
                <br />Seja o primeiro a apoiar!
              </div>
            ) : (
              comments.map((comm) => (
                <div key={comm.id} className="flex gap-2.5 items-start text-xs text-left leading-relaxed">
                  <img
                    src={comm.userAvatar}
                    alt={comm.userName}
                    className="w-7 h-7 rounded-full object-cover shrink-0 bg-slate-950 border border-slate-805"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-[#95B2FF] font-sans text-[11px] truncate max-w-[120px]">{comm.userName}</span>
                      {comm.badge && (
                        <span className="bg-amber-500/10 text-amber-400 text-[8px] font-black uppercase px-1 rounded border border-amber-500/20 font-mono scale-95 shrink-0">
                          {comm.badge}
                        </span>
                      )}
                      <span className="text-[8px] text-slate-550 font-mono ml-auto shrink-0">{comm.timestamp}</span>
                    </div>
                    <p className="text-slate-300 font-light mt-0.5 break-words text-left">{comm.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Writing comment box section */}
          <form onSubmit={handleSendComment} className="pt-3 border-t border-slate-850 flex flex-col gap-2">
            <div className="flex gap-1.5 items-center">
              <button
                type="button"
                onClick={handleReactLive}
                className="p-1 px-3 bg-rose-950/30 border border-rose-900/35 hover:bg-rose-950/50 hover:scale-102 hover:text-white rounded-lg text-rose-400 text-xs font-black transition flex items-center gap-1.5 select-none shrink-0 cursor-pointer"
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
                  className="text-rose-500 hover:text-rose-455 p-1 transition disabled:opacity-30 shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>
        </div>

      </div>

      {/* QUICK INCENTIVES BAR */}
      <div className="bg-slate-900/40 p-4.5 rounded-2xl border border-slate-850 flex items-start gap-3 text-xs text-slate-450 leading-relaxed font-normal text-left">
        <Flame className="w-5 h-5 text-soka-orange shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-350">Por que apoiar nas Lives?</p>
          <p>
            As transmissões ao vivo criam a rede indissolúvel de incentivos recíprocos. Ao enviar pensamentos positivos e clicar no botão ❤️ de incentivo rápido, você gera instantaneamente ondas alegres de encorajamento para os oradores na tribuna soka.
          </p>
        </div>
      </div>
    </div>
  );
}
