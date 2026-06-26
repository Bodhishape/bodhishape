import React, { useState } from "react";
import { Award, Heart, MessageSquare, Send, Sparkles, Star, Trophy, Plus, ShieldCheck, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "../types";

interface VictoryStory {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  category: "beneficio" | "aprovacao" | "familia" | "shape_saude" | "superacao";
  title: string;
  content: string;
  timestamp: string;
  likes: string[]; // List of userIds
  comments: {
    id: string;
    userName: string;
    userAvatar: string;
    content: string;
    isAI?: boolean;
    timestamp: string;
  }[];
}

interface MuralVitoriasProps {
  currentUser: User | null;
  onSelectUser: (user: User) => void;
  firebaseAuth?: any;
  communityId?: string;
}

export default function MuralVitorias({ currentUser, onSelectUser, firebaseAuth, communityId }: MuralVitoriasProps) {
  const [stories, setStories] = useState<VictoryStory[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real stories from backend
  React.useEffect(() => {
    const url = communityId ? `/api/stories?communityId=${communityId}` : "/api/stories";
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setStories(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar relatos de vitória:", err);
        setLoading(false);
      });
  }, [communityId]);

  const [category, setCategory] = useState<VictoryStory["category"]>("beneficio");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeStoryComment, setActiveStoryComment] = useState("");
  const [commentingStoryId, setCommentingStoryId] = useState<string | null>(null);

  const handleCreateStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !currentUser) return;

    const name = currentUser.displayName || currentUser.name.split(" ")[0];

    // Bodhi Public Encouragement Bot Comments automatically based on category using community identity (Bodhishaper, Bodhis)
    const aiComments: Record<VictoryStory["category"], string[]> = {
      beneficio: [
        `🪷 '${name}, você está evoluindo como uma verdadeira Bodhishaper! Hoje foi Daimoku, amanhã será benefício.'`,
        `🌟 'Pequenas ações diárias geram grandes transformações no seu macrocosmo! Os Bodhis estão acumulando vitórias!'`,
        `🏆 'Excelente trabalho, Bodhishaper! O universo move-se a favor de quem age com sincera determinação.'`
      ],
      aprovacao: [
        `🏆 'Parabéns, ${name}! Mais uma vitória espetacular para os Bodhis!'`,
        `💪 'Mais uma vitória registrada, Bodhishaper. A disciplina apareceu mais uma vez!'`,
        `🌟 'Os Bodhishapers estão construindo grandes causas. Você poliu seu espírito e conquistou com mérito!'`
      ],
      familia: [
        `🌟 '${name}, os Bodhis da sua região certamente estão inspirados pelo seu exemplo familiar.'`,
        `🪷 'A harmonia do lar é o reflexo da sua revolução humana inabalável! Parabéns por ser um líder Bodhishaper na família!'`,
        `🏆 'A luz do Gongyo do Bodhishaper banha todos os entes queridos de forma infalível.'`
      ],
      shape_saude: [
        `💪 '${name}, continue assim, Bodhishaper! A disciplina apareceu mais uma vez e o karma do cansaço foi derrotado!'`,
        `🔥 'A preguiça tentou negociar com o Bodhi, mas foi totalmente reduzida a pó de ponta a ponta!'`,
        `🌟 'Cuidar do tempo e do corpo é um ato de profundo humanismo. Parabéns, Bodhishaper!'`
      ],
      superacao: [
        `🔥 'Os Bodhis estão inspirando toda a nossa comunidade com essa superação colossal!'`,
        `🌟 'Mais uma vitória registrada, Bodhishaper. Suando o Karma, Conquistando Vitórias!'`,
        `💪 '${name}, sua resiliência brilha como o Sol nascente. Que orgulho ver um Bodhishaper triunfante!'`
      ]
    };

    const categoryPhrases = aiComments[category];
    const chosenPhrase = categoryPhrases[Math.floor(Math.random() * categoryPhrases.length)];

    const payload = {
      userId: currentUser.id,
      userName: currentUser.displayName || currentUser.name,
      userAvatar: currentUser.avatar,
      category,
      title,
      content,
      aiComment: chosenPhrase
    };

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const sendStory = async () => {
      try {
        if (firebaseAuth?.currentUser) {
          const token = await firebaseAuth.currentUser.getIdToken();
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch("/api/stories", {
          method: "POST",
          headers,
          body: JSON.stringify(payload)
        });
        const newStory = await res.json();
        
        // Automatically append the AI incentive bot message as a comment on backend or here
        if (newStory && newStory.id) {
          const aiCommentObj = {
            id: `c-ai-${Date.now()}`,
            userName: "🤖 IA Pública de Incentivo",
            userAvatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'><rect width='128' height='128' fill='%231e1b4b'/><circle cx='64' cy='64' r='40' fill='none' stroke='%2338bdf8' stroke-width='4'/><rect x='44' y='50' width='40' height='24' rx='4' fill='%2338bdf8'/><circle cx='54' cy='62' r='3' fill='%231e1b4b'/><circle cx='74' cy='62' r='3' fill='%231e1b4b'/><path d='M54,80 Q64,88 74,80' stroke='%2338bdf8' stroke-width='3' fill='none'/></svg>",
            content: chosenPhrase,
            isAI: true,
            timestamp: new Date().toISOString()
          };
          newStory.comments = [aiCommentObj, ...(newStory.comments || [])];
        }
        setStories(prev => [newStory, ...prev]);
        setTitle("");
        setContent("");
        setShowAddForm(false);
      } catch (err) {
        console.error("Erro ao criar relato de vitória:", err);
      }
    };

    sendStory();
  };

  const handleLikeStory = (storyId: string) => {
    if (!currentUser) return;
    
    // Optimistic UI update
    setStories(prev =>
      prev.map(st => {
        if (st.id === storyId) {
          const alreadyLiked = st.likes.includes(currentUser.id);
          return {
            ...st,
            likes: alreadyLiked
              ? st.likes.filter(id => id !== currentUser.id)
              : [...st.likes, currentUser.id]
          };
        }
        return st;
      })
    );

    fetch(`/api/stories/${storyId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser.id })
    }).catch(err => console.error("Erro ao dar like no relato:", err));
  };

  const handleCommentStory = (storyId: string) => {
    if (!activeStoryComment.trim() || !currentUser) return;

    // Optimistic UI update
    setStories(prev =>
      prev.map(st => {
        if (st.id === storyId) {
          return {
            ...st,
            comments: [
              ...(st.comments || []),
              {
                id: `comm-temp-${Date.now()}`,
                userName: currentUser.displayName || currentUser.name,
                userAvatar: currentUser.avatar,
                content: activeStoryComment,
                timestamp: new Date().toISOString()
              }
            ]
          };
        }
        return st;
      })
    );

    const commentBody = activeStoryComment;
    setActiveStoryComment("");
    setCommentingStoryId(null);

    fetch(`/api/stories/${storyId}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userName: currentUser.displayName || currentUser.name,
        userAvatar: currentUser.avatar,
        content: commentBody
      })
    })
      .then(res => res.json())
      .then(updatedStory => {
        // Set actual story from server response
        setStories(prev => prev.map(st => st.id === storyId ? { ...st, comments: updatedStory.comments } : st));
      })
      .catch(err => console.error("Erro ao comentar no relato de vitória:", err));
  };

  const getCategoryTheme = (cat: VictoryStory["category"]) => {
    const themes = {
      beneficio: { label: "🪷 Relato de Daimoku", bg: "bg-rose-950/40 text-rose-300 border-rose-900/30", icon: "🪷" },
      aprovacao: { label: "🎓 Conquista de Estudos/Trabalho", bg: "bg-yellow-950/40 text-yellow-300 border-yellow-900/30", icon: "🎓" },
      familia: { label: "🏠 Harmonia Familiar", bg: "bg-purple-950/40 text-purple-300 border-purple-900/30", icon: "🏠" },
      shape_saude: { label: "💪 Vitória do Corpo/Saúde", bg: "bg-emerald-950/40 text-emerald-300 border-emerald-900/30", icon: "💪" },
      superacao: { label: "🌟 Superação Pessoal", bg: "bg-blue-950/40 text-blue-300 border-blue-900/30", icon: "🌟" }
    };
    return themes[cat] || themes.beneficio;
  };

  return (
    <div className="space-y-6" id="victory-mural-root">
      
      {/* HEADER BAR */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-955/20 p-6 rounded-2xl border border-slate-850 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="bg-[#122A1E] text-[#A7F3D0] text-[10px] font-bold font-mono py-1 px-3 border border-emerald-900/30 rounded-full uppercase tracking-wider font-heading">
            🎉 Relatos Sinceros de Comprovação
          </span>
          <h2 className="text-2xl font-black font-heading text-slate-100 mt-2">Mural de Vitórias Soka</h2>
          <p className="text-xs text-slate-450 leading-relaxed mt-1">
            Espaço voltado exclusivamente para compartilhar relatos de superação, benefícios da prática budista do Daimoku, aprovações, harmonia no lar e vitórias de saúde.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-emerald-650 hover:bg-emerald-600 border border-emerald-500/20 text-white font-extrabold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 shrink-0 self-start md:self-center shadow-lg hover:shadow-emerald-950/35 transition"
        >
          <Plus className="w-4 h-4" />
          Registrar Minha Vitória ➔
        </button>
      </div>

      {/* NEW POST FORM DRAWER */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreateStory}
            className="bg-slate-900/50 rounded-2xl border border-slate-800/80 p-5 shadow-xl space-y-4 overflow-hidden"
          >
            <h3 className="text-sm font-bold text-slate-200 font-heading">🌟 O Relato do Bodhisattva Triunfante</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Título da Vitória:</label>
                <input
                  type="text"
                  placeholder="Ex: Minha cura de fibromialgia ou Consegui o emprego dos sonhos!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full text-xs border border-slate-800 bg-slate-950/60 text-slate-100 px-3 py-2 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Categoria:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full text-xs border border-slate-800 bg-slate-950/60 text-slate-100 px-3 py-2 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="beneficio">🪷 Relato de Daimoku / Benefício do Mantra</option>
                  <option value="aprovacao">🎓 Aprovação Acadêmica / Conquista Profissional</option>
                  <option value="familia">🏠 Harmonia Familiar / Revolução no Lar</option>
                  <option value="shape_saude">💪 Vitória de Saúde / Força no Shape</option>
                  <option value="superacao">🌟 Relato de Superação Pessoal Geral</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Descreva seu Relato (Incentive os companheiros):</label>
              <textarea
                placeholder="Como a prática do Daimoku, a união comunitária e o esforço físico te ajudaram a transformar essa situação? Seja o mais sincero possível..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="w-full text-xs border border-slate-800 bg-slate-950/60 text-slate-100 p-3 rounded-xl min-h-[110px] resize-none outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-205"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-550 text-white font-extrabold text-xs rounded-xl shadow-md"
              >
                Registrar no Mural Geral
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* MURALS FEED LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stories.map((story) => {
          const theme = getCategoryTheme(story.category);
          return (
            <div
              key={story.id}
              className="bg-slate-900/35 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 flex flex-col justify-between hover:border-slate-700/80 transition shadow-lg relative"
              id={`victory-card-${story.id}`}
            >
              {/* Category indicator & author */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-bold py-0.5 px-2 border rounded-full capitalize font-mono ${theme.bg}`}>
                    {theme.icon} {theme.label}
                  </span>
                  <span className="text-[9px] text-slate-550 font-mono">
                    {new Date(story.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <img
                    src={story.userAvatar}
                    alt={story.userName}
                    onClick={() => onSelectUser({ id: story.userId, name: story.userName, avatar: story.userAvatar } as any)}
                    className="w-8.5 h-8.5 rounded-full object-cover bg-slate-950 border border-slate-805 cursor-pointer hover:opacity-85 transition"
                  />
                  <div>
                    <h4 
                      onClick={() => onSelectUser({ id: story.userId, name: story.userName, avatar: story.userAvatar } as any)}
                      className="text-xs font-extrabold text-slate-200 block cursor-pointer hover:text-emerald-350 hover:underline"
                    >
                      {story.userName}
                    </h4>
                    <span className="text-[9px] text-slate-500 block leading-none mt-0.5">Bodhisatva Ativo</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 text-left">
                  <h3 className="text-sm font-black text-slate-100 font-heading">{story.title}</h3>
                  <p className="text-xs text-slate-350 leading-relaxed font-normal whitespace-pre-line bg-slate-955/35 p-3 rounded-xl border border-slate-850">
                    {story.content}
                  </p>
                </div>
              </div>

              {/* Interaction zone */}
              <div className="pt-4 mt-4 border-t border-slate-850 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-450 font-bold">
                  <button
                    type="button"
                    onClick={() => handleLikeStory(story.id)}
                    className="flex items-center gap-1.5 hover:text-rose-450 transition"
                  >
                    <Heart className={`w-3.5 h-3.5 ${story.likes.includes(currentUser?.id || "") ? "fill-rose-500 text-rose-500" : "text-slate-450"}`} />
                    <span>Inspirou {story.likes.length} mentes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCommentingStoryId(commentingStoryId === story.id ? null : story.id)}
                    className="flex items-center gap-1.5 hover:text-indigo-400 transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-slate-450" />
                    <span>Diálogos ({story.comments.length})</span>
                  </button>
                </div>

                {/* Comments box details */}
                {story.comments.length > 0 && (
                  <div className="space-y-2.5 bg-slate-950/40 p-3 rounded-xl border border-slate-850 text-xs">
                    {story.comments.map((comm) => (
                      <div key={comm.id} className="flex gap-2 items-start text-left leading-normal">
                        <img
                          src={comm.userAvatar}
                          alt={comm.userName}
                          className="w-6.5 h-6.5 rounded-full object-cover shrink-0 bg-slate-900 border border-slate-800"
                        />
                        <div className="flex-1 bg-slate-900/30 p-2 rounded-lg border border-slate-800/40">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className={`text-[10px] font-bold ${comm.isAI ? "text-indigo-300 font-mono" : "text-slate-300"}`}>
                              {comm.userName}
                            </span>
                            <span className="text-[8px] text-slate-550 font-mono">
                              {new Date(comm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-light whitespace-pre-line">{comm.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Typing comment input */}
                {commentingStoryId === story.id && (
                  <div className="flex gap-2 items-center pt-1.5">
                    <input
                      type="text"
                      placeholder="Adicione um incentivo sincero ou parabenize..."
                      value={activeStoryComment}
                      onChange={(e) => setActiveStoryComment(e.target.value)}
                      className="flex-1 text-xs border border-slate-800 bg-slate-950/65 text-slate-100 px-3 py-1.5 rounded-lg outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleCommentStory(story.id)}
                      className="bg-emerald-650 hover:bg-emerald-600 text-white p-1.5 px-3.5 rounded-lg text-xs font-bold transition"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
