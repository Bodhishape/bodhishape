import React, { useState, useEffect } from "react";
import { 
  Heart, Apple, Book, GraduationCap, PenTool, ThumbsUp, Sparkles, 
  Moon, GlassWater, Users, Music, Trees, DollarSign, Brush, Smartphone, 
  Check, Plus, Calendar, Flame, Award, Trash2, ArrowRight, ToggleLeft, ToggleRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "../types";

interface BonsHabitosProps {
  currentUser: User | null;
}

interface Habit {
  id: string;
  name: string;
  icon: string;
  isCustom: boolean;
  history: Record<string, boolean>; // maps date string "YYYY-MM-DD" -> true if done
}

export default function BonsHabitos({ currentUser }: BonsHabitosProps) {
  const currentUserId = currentUser?.id || "anonymous";

  // Default suggested habits
  const defaultHabitsList = [
    { id: "h-namoro", name: "❤️ Noite de Namoro", icon: "Heart" },
    { id: "h-comida", name: "🥗 Alimentação Saudável", icon: "Apple" },
    { id: "h-leitura", name: "📖 Leitura", icon: "Book" },
    { id: "h-estudos", name: "📚 Estudos", icon: "GraduationCap" },
    { id: "h-diario", name: "✍️ Diário", icon: "PenTool" },
    { id: "h-gratidao", name: "🙏 Gratidão", icon: "ThumbsUp" },
    { id: "h-meditacao", name: "🧘 Meditação", icon: "Sparkles" },
    { id: "h-sono", name: "😴 Dormir Bem", icon: "Moon" },
    { id: "h-agua", name: "🚰 Beber Água", icon: "GlassWater" },
    { id: "h-familia", name: "👨‍👩‍👧 Tempo em Família", icon: "Users" },
    { id: "h-musica", name: "🎵 Ouvir Música", icon: "Music" },
    { id: "h-natureza", name: "🌳 Contato com a Natureza", icon: "Trees" },
    { id: "h-financas", name: "💰 Organização Financeira", icon: "DollarSign" },
    { id: "h-ambiente", name: "🧹 Organização do Ambiente", icon: "Brush" },
    { id: "h-tela", name: "📵 Menos Tempo de Tela", icon: "Smartphone" },
    { id: "h-caridade", name: "🤝 Fazer Algo por Outrem", icon: "Users" },
  ];

  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitIcon, setNewHabitIcon] = useState("Sparkles");
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [viewMode, setViewMode] = useState<"semanal" | "mensal">("semanal");

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(`bodhi_habits_${currentUserId}`);
    if (saved) {
      setHabits(JSON.parse(saved));
    } else {
      // Initialize with default suggestions and empty history empty
      const initial: Habit[] = defaultHabitsList.map(h => ({
        id: h.id,
        name: h.name,
        icon: h.icon,
        isCustom: false,
        history: {}
      }));
      setHabits(initial);
      localStorage.setItem(`bodhi_habits_${currentUserId}`, JSON.stringify(initial));
    }
  }, [currentUserId]);

  // Persist to local storage
  const saveHabits = (updatedList: Habit[]) => {
    setHabits(updatedList);
    localStorage.setItem(`bodhi_habits_${currentUserId}`, JSON.stringify(updatedList));
  };

  function getOffsetDate(offset: number): string {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split("T")[0];
  }

  const toggleDay = (habitId: string, dateStr: string) => {
    const updated = habits.map(h => {
      if (h.id === habitId) {
        const currentHist = { ...h.history };
        if (currentHist[dateStr]) {
          delete currentHist[dateStr];
        } else {
          currentHist[dateStr] = true;
        }
        return { ...h, history: currentHist };
      }
      return h;
    });
    saveHabits(updated);
  };

  const handleAddCustomHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const newH: Habit = {
      id: "custom-h-" + Date.now(),
      name: "🌱 " + newHabitName.trim(),
      icon: newHabitIcon,
      isCustom: true,
      history: {
        [new Date().toISOString().split("T")[0]]: true
      }
    };
    const updated = [newH, ...habits];
    saveHabits(updated);
    setNewHabitName("");
    setShowAddCustom(false);
  };

  const handleDeleteHabit = (id: string) => {
    const updated = habits.filter(h => h.id !== id);
    saveHabits(updated);
  };

  const todayStr = new Date().toISOString().split("T")[0];

  // Calculate current streak for a habit
  const calculateStreak = (habit: Habit): number => {
    let streak = 0;
    let checkDate = new Date();
    
    // Check consecutive days backwards
    while (true) {
      const checkStr = checkDate.toISOString().split("T")[0];
      if (habit.history[checkStr]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If it's today and not done yet, don't break immediately until we check yesterday
        if (checkStr === todayStr) {
          checkDate.setDate(checkDate.getDate() - 1);
          const yesterdayStr = checkDate.toISOString().split("T")[0];
          if (habit.history[yesterdayStr]) {
            continue; // Keep checking yesterday
          }
        }
        break;
      }
    }
    return streak;
  };

  // Best streak calculation
  const calculateBestStreak = (habit: Habit): number => {
    const dates = Object.keys(habit.history).filter(d => habit.history[d]).sort();
    if (dates.length === 0) return 0;

    let best = 0;
    let temp = 0;
    let prevTime: number | null = null;

    dates.forEach(dateStr => {
      const curTime = new Date(dateStr).getTime();
      if (prevTime === null) {
        temp = 1;
      } else {
        const diffDays = Math.round((curTime - prevTime) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          temp++;
        } else if (diffDays > 1) {
          if (temp > best) best = temp;
          temp = 1;
        }
      }
      prevTime = curTime;
    });
    return Math.max(best, temp);
  };

  // Get dynamic AI comments based on total achievements
  const getAIIncentiveOfHabit = () => {
    const totalDoneToday = habits.filter(h => h.history[todayStr]).length;
    if (totalDoneToday >= 4) {
      return "🌟 Fantástico! Você está cultivando múltiplos hábitos de luz hoje. A constância vale mais do que a perfeição!";
    }
    if (totalDoneToday > 0) {
      return "🌱 Seu hábito saudável está se fortalecendo dia após dia! Cada comemoração sincera é um bloco de felicidade sendo assentado.";
    }
    return "🪷 Pequenos momentos de cuidado geram grandes memórias. Escolha um bom hábito para checkar hoje e dê cor ao seu dia!";
  };

  // Get active week days
  const getWeekDays = () => {
    const days = [];
    // Sunday to Saturday of current week
    const current = new Date();
    const dayOfWeek = current.getDay();
    const startOfWeek = new Date(current);
    startOfWeek.setDate(current.getDate() - dayOfWeek); // Go to Sunday

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push({
        dateStr: d.toISOString().split("T")[0],
        label: d.toLocaleDateString("pt-BR", { weekday: "narrow" }),
        dayNum: d.getDate(),
        isToday: d.toISOString().split("T")[0] === todayStr
      });
    }
    return days;
  };

  // Get last 30 days
  const getMonthDays = () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        dateStr: d.toISOString().split("T")[0],
        dayNum: d.getDate(),
        isToday: d.toISOString().split("T")[0] === todayStr
      });
    }
    return days;
  };

  const weekDays = getWeekDays();
  const monthDays = getMonthDays();

  // Render habit icon helper
  const renderIcon = (iconName: string) => {
    const size = 16;
    switch(iconName) {
      case "Heart": return <Heart size={size} className="text-rose-455" />;
      case "Apple": return <Apple size={size} className="text-emerald-455" />;
      case "Book": return <Book size={size} className="text-sky-455" />;
      case "GraduationCap": return <GraduationCap size={size} className="text-indigo-455" />;
      case "PenTool": return <PenTool size={size} className="text-amber-455" />;
      case "ThumbsUp": return <ThumbsUp size={size} className="text-yellow-455" />;
      case "Moon": return <Moon size={size} className="text-purple-455" />;
      case "GlassWater": return <GlassWater size={size} className="text-blue-455" />;
      case "Music": return <Music size={size} className="text-pink-455" />;
      case "Trees": return <Trees size={size} className="text-teal-455" />;
      case "DollarSign": return <DollarSign size={size} className="text-green-455" />;
      case "Brush": return <Brush size={size} className="text-amber-500" />;
      case "Smartphone": return <Smartphone size={size} className="text-red-400" />;
      default: return <Sparkles size={size} className="text-emerald-400" />;
    }
  };

  // Streaks statistics and badges earned (mock validation metrics)
  const totalCompletedCount = habits.reduce((sum, h) => sum + Object.keys(h.history).length, 0);
  const bestOverallStreak = habits.reduce((max, h) => Math.max(max, calculateBestStreak(h)), 0);

  return (
    <div className="space-y-6" id="bons-habitos-panel">
      {/* Header card info */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-5 opacity-10">
          <Trees size={120} className="text-emerald-400" />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl">
            🌱
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
              Surgimento de Bons Hábitos
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Reforçando o desenvolvimento humano, saúde familiar, inteligência intelectual e bem-estar sutil. <b>Não gera pontuação para rankings públicos!</b>
            </p>
          </div>
        </div>

        {/* AI encouragement bubbles */}
        <div className="mt-5 p-4 bg-emerald-950/20 border border-emerald-900/30 rounded-xl flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
          <p className="text-xs text-slate-205 leading-relaxed italic">
            {getAIIncentiveOfHabit()}
          </p>
        </div>
      </div>

      {/* Grid: Habits lists card and Stats/Awards cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Tracker */}
        <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-heading">
                Calendário De Foco
              </h3>
            </div>
            
            <div className="flex gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-850">
              <button
                onClick={() => setViewMode("semanal")}
                className={`py-1 px-2.5 text-[10px] font-bold rounded-md transition ${
                  viewMode === "semanal" ? "bg-slate-800 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Semanal
              </button>
              <button
                onClick={() => setViewMode("mensal")}
                className={`py-1 px-2.5 text-[10px] font-bold rounded-md transition ${
                  viewMode === "mensal" ? "bg-slate-800 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Últimos 30 dias
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {habits.map((habit) => {
              const currentStreak = calculateStreak(habit);
              const bestStreak = calculateBestStreak(habit);

              return (
                <div 
                  key={habit.id} 
                  className="p-3 bg-slate-950/40 border border-slate-850 hover:border-slate-800 transition rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800/50 flex items-center justify-center shadow-inner">
                      {renderIcon(habit.icon)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100 font-heading">{habit.name}</h4>
                      <div className="flex items-center gap-2.5 mt-0.5">
                        <span className="text-[9px] text-slate-450 font-mono flex items-center gap-0.5">
                          <Flame className="w-3 h-3 text-orange-500 fill-orange-500/10" /> Streak: {currentStreak}d
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          Recorde: {bestStreak}d
                        </span>
                        {habit.isCustom && (
                          <button
                            onClick={() => handleDeleteHabit(habit.id)}
                            className="text-[9px] text-rose-500 hover:text-rose-400 flex items-center gap-0.5"
                            title="Remover hábito customizado"
                          >
                            <Trash2 size={10} /> Deletar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Calendar Matrix View */}
                  {viewMode === "semanal" ? (
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      {weekDays.map((day) => {
                        const isDone = !!habit.history[day.dateStr];
                        return (
                          <button
                            key={day.dateStr}
                            onClick={() => toggleDay(habit.id, day.dateStr)}
                            className={`w-7 h-9 rounded-lg flex flex-col items-center justify-center transition border ${
                              isDone
                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-md"
                                : day.isToday
                                  ? "bg-slate-900 border-indigo-500/40 text-slate-300"
                                  : "bg-slate-900/60 border-slate-850 hover:border-slate-800 text-slate-500"
                            }`}
                          >
                            <span className="text-[8px] uppercase font-bold font-mono">{day.label}</span>
                            <span className="text-[9px] font-bold mt-0.5 font-mono">{day.dayNum}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* Mini Pixel Grid representation for Monthly view */
                    <div className="flex flex-wrap items-center gap-1 max-w-[210px] self-end sm:self-auto">
                      {monthDays.map((day) => {
                        const isDone = !!habit.history[day.dateStr];
                        return (
                          <button
                            key={day.dateStr}
                            onClick={() => toggleDay(habit.id, day.dateStr)}
                            title={`${day.dateStr}: ${isDone ? "Realizado" : "Pendente"}`}
                            className={`w-3.5 h-3.5 rounded transition ${
                              isDone
                                ? "bg-emerald-500 border border-emerald-600 shadow"
                                : day.isToday
                                  ? "bg-slate-800 ring-1 ring-indigo-500"
                                  : "bg-slate-900 border border-slate-800"
                            }`}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Create custom habits */}
          <div className="border-t border-slate-850/80 pt-4">
            {!showAddCustom ? (
              <button
                onClick={() => setShowAddCustom(true)}
                className="w-full py-2.5 bg-slate-950/60 hover:bg-slate-900 text-slate-300 text-xs font-bold rounded-xl border border-slate-850/80 transition-all flex items-center justify-center gap-1.5"
              >
                <Plus size={14} className="text-emerald-400" /> Criar Hábito Personalizado
              </button>
            ) : (
              <form onSubmit={handleAddCustomHabit} className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-205 uppercase font-heading">Novo Hábito Personalizado</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="text-[10px] uppercase font-mono font-bold text-slate-500 block mb-1">Nome do hábito</label>
                    <input
                      type="text"
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      placeholder="Ex: Ler 10 páginas, Estudar inglês, Beber 3L..."
                      className="w-full bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded-lg text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono font-bold text-slate-500 block mb-1">Ícone</label>
                    <select
                      value={newHabitIcon}
                      onChange={(e) => setNewHabitIcon(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-xs px-2 py-2 rounded-lg text-white font-sans"
                    >
                      <option value="Sparkles">✨ Estudo/Foco</option>
                      <option value="Heart">❤️ Relações</option>
                      <option value="Apple">🥗 Saudável</option>
                      <option value="Book">📖 Livro</option>
                      <option value="Moon">😴 Dormir</option>
                      <option value="GlassWater">🚰 Água</option>
                      <option value="DollarSign">💰 Finanças</option>
                      <option value="Brush">🧹 Organização</option>
                      <option value="Smartphone">📵 Anti-tela</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddCustom(false)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-400 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
                  >
                    Adicionar Hábito
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right column: Highlights & medals tracker */}
        <div className="space-y-6">
          
          {/* Progress stats widget */}
          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-202 uppercase tracking-wider font-heading">
              Sua Constância Pessoal
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-955 rounded-xl border border-slate-850 text-center">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Feitos Totais</span>
                <span className="text-2xl font-extrabold text-emerald-400 font-mono block mt-1">{totalCompletedCount}</span>
                <span className="text-[8px] text-slate-450 block mt-0.5">checks confirmados</span>
              </div>
              <div className="p-3 bg-slate-955 rounded-xl border border-slate-850 text-center">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Recorde Geral</span>
                <span className="text-2xl font-extrabold text-orange-400 font-mono flex items-center justify-center gap-1.5 mt-1">
                  <Flame className="w-5 h-5 text-orange-500 fill-orange-500/10 shrink-0" /> {bestOverallStreak}d
                </span>
                <span className="text-[8px] text-slate-450 block mt-0.5">dias seguidos</span>
              </div>
            </div>
          </div>

          {/* Habits Medals system */}
          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-soka-gold animate-pulse" />
              <h3 className="text-sm font-bold text-slate-201 uppercase tracking-wider font-heading">
                Medalhas de Hábitos
              </h3>
            </div>

            <div className="space-y-3">
              {[
                { 
                  title: "🌱 Primeiro Hábito Concluído", 
                  desc: "Deu o primeiro passo na jornada sutil diária.", 
                  unlocked: totalCompletedCount >= 1 
                },
                { 
                  title: "📖 Sabedoria Constante", 
                  desc: "Leia e atualize o hábito de estudos por 30 dias.", 
                  unlocked: bestOverallStreak >= 30,
                  lockedMsg: "Recorde de 30 dias seguidos requerido"
                },
                { 
                  title: "✍️ Escudo Emocional", 
                  desc: "Dedicou-se a escrever e registrar no diário por 15 dias.", 
                  unlocked: bestOverallStreak >= 15,
                  lockedMsg: "Recorde de 15 dias seguidos requerido"
                },
                { 
                  title: "🥗 Têmperas de Ferro", 
                  desc: "Manteve alimentação perfeitamente saudável por 7 dias seguidos.", 
                  unlocked: bestOverallStreak >= 7,
                  lockedMsg: "Recorde de 7 dias seguidos requerido"
                },
                { 
                  title: "❤️ Harmonia Transcendental", 
                  desc: "Vivenciou grandes noites de namoro e carinho familiar.", 
                  unlocked: totalCompletedCount >= 12,
                  lockedMsg: "Exige 12 checks acumulados de namoro/família"
                },
                { 
                  title: "🤝 Causa Nobre Gloriosa", 
                  desc: "Realizou ações de doação e auxílio ao próximo de forma constante.", 
                  unlocked: totalCompletedCount >= 100,
                  lockedMsg: "Exige 100 ações positivas registradas"
                }
              ].map((m, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                    m.unlocked 
                      ? "bg-slate-950/40 border-emerald-500/20 text-slate-100 shadow-md" 
                      : "bg-slate-950/10 border-slate-850 opacity-40 text-slate-500"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-lg ${
                    m.unlocked ? "bg-emerald-500/15 border border-emerald-500/30" : "bg-slate-900 border border-slate-800"
                  }`}>
                    {m.unlocked ? "🏆" : "🔒"}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-heading">{m.title}</h4>
                    <p className="text-[10px] text-slate-450 mt-0.5 leading-tight">{m.desc}</p>
                    {!m.unlocked && m.lockedMsg && (
                      <span className="text-[8px] text-orange-400 font-mono block mt-1">{m.lockedMsg} ({bestOverallStreak}d atual)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
