import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, Sparkles, Smile, RefreshCw, Scale, Heart, AlertTriangle, 
  Trash2, Plus, Calendar, Flame, Lock, ArrowUpRight, TrendingDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "../types";

interface AreasEvolucaoProps {
  currentUser: User | null;
}

interface ReduceHabit {
  id: string;
  name: string;
  isCustom: boolean;
  history: Record<string, "avoided" | "happened">; // YYYY-MM-DD -> status
}

export default function AreasEvolucao({ currentUser }: AreasEvolucaoProps) {
  const currentUserId = currentUser?.id || "anonymous";

  const defaultReduceList = [
    { id: "r-alcool", name: "🍺 Consumo de Álcool" },
    { id: "r-acucar", name: "🍬 Excesso de Açúcar" },
    { id: "r-fastfood", name: "🍔 Fast Food / Besteiras" },
    { id: "r-refrigerante", name: "🥤 Refrigerantes" },
    { id: "r-tabaco", name: "🚬 Tabagismo" },
    { id: "r-social", name: "📱 Excesso de Redes Sociais" },
    { id: "r-telas", name: "TV Excesso de Tempo de Tela" },
    { id: "r-tarde", name: "😴 Dormir Muito Tarde" },
    { id: "r-gastos", name: "💸 Gastos Impulsivos" },
    { id: "r-paciencia", name: "😡 Perda de Paciência" },
    { id: "r-procrastina", name: "📵 Procrastinação" },
  ];

  const [habits, setHabits] = useState<ReduceHabit[]>([]);
  const [newHabitName, setNewHabitName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(`bodhi_reduce_${currentUserId}`);
    if (saved) {
      setHabits(JSON.parse(saved));
    } else {
      // Mock historical data and populate some habits
      const initial: ReduceHabit[] = defaultReduceList.map(h => ({
        id: h.id,
        name: h.name,
        isCustom: false,
        history: {}
      }));
      setHabits(initial);
      localStorage.setItem(`bodhi_reduce_${currentUserId}`, JSON.stringify(initial));
    }
  }, [currentUserId]);

  const saveReduceHabits = (list: ReduceHabit[]) => {
    setHabits(list);
    localStorage.setItem(`bodhi_reduce_${currentUserId}`, JSON.stringify(list));
  };

  function getOffsetDate(offset: number): string {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split("T")[0];
  }

  const todayStr = new Date().toISOString().split("T")[0];

  const setDayStatus = (habitId: string, dateStr: string, status: "avoided" | "happened") => {
    const updated = habits.map(h => {
      if (h.id === habitId) {
        return {
          ...h,
          history: {
            ...h.history,
            [dateStr]: h.history[dateStr] === status ? undefined : status // toggle off if clicked same
          } as any
        };
      }
      return h;
    });
    // Remove undefined keys
    const cleaned = updated.map(h => {
      const hist = { ...h.history };
      Object.keys(hist).forEach(k => {
        if (!hist[k]) delete hist[k];
      });
      return { ...h, history: hist };
    });
    saveReduceHabits(cleaned);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const newH: ReduceHabit = {
      id: "custom-r-" + Date.now(),
      name: "⚠️ " + newHabitName.trim(),
      isCustom: true,
      history: {
        [todayStr]: "avoided"
      }
    };
    saveReduceHabits([newH, ...habits]);
    setNewHabitName("");
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    const updated = habits.filter(h => h.id !== id);
    saveReduceHabits(updated);
  };

  // Calculate stats for habit
  const calculateAvoidedStreak = (habit: ReduceHabit): number => {
    let streak = 0;
    let checkDate = new Date();

    while (true) {
      const checkStr = checkDate.toISOString().split("T")[0];
      const status = habit.history[checkStr];

      if (status === "avoided") {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (status === "happened") {
        break; // Streak broken
      } else {
        // No log for today is allowed without breaking if yesterday is avoided
        if (checkStr === todayStr) {
          checkDate.setDate(checkDate.getDate() - 1);
          const yesterdayStr = checkDate.toISOString().split("T")[0];
          if (habit.history[yesterdayStr] === "avoided") {
            continue;
          }
        }
        break;
      }
    }
    return streak;
  };

  // Calculate monthly reduction percentage vs baseline (simulated nice percentage improvement)
  const getReductionSuccessRate = (habit: ReduceHabit): number => {
    const entries = Object.values(habit.history);
    if (entries.length === 0) return 0;
    const avoidedCount = entries.filter(v => v === "avoided").length;
    return Math.round((avoidedCount / entries.length) * 100);
  };

  const getWeekDays = () => {
    const days = [];
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

  const weekDays = getWeekDays();

  // Gentle, positive, non-judgmental AI comments (absolutely no guilt or shame)
  const getPositiveAIComment = () => {
    const totalAvoidedToday = habits.filter(h => h.history[todayStr] === "avoided").length;
    if (totalAvoidedToday > 3) {
      return "🪷 Extraordinário espírito de autocontrole! Cada pequena escolha fortalece seu macrocosmo interior. Hoje você escolheu cultivar profunda sabedoria.";
    }
    if (totalAvoidedToday > 0) {
      return "🌱 Parabéns por cada sim que deu para si mesmo hoje ao evitar o que prejudica seu potencial. A evolução acontece passo a passo, no seu ritmo.";
    }
    return "🌟 Lembre-se, cada amanhecer traz uma nova oportunidade de recomeçar com calma e pureza. Sem comparações ou julgamentos, você é um mestre da sua própria vida.";
  };

  return (
    <div className="space-y-6" id="areas-evolucao-panel">
      {/* Privacy Guarantee Header block */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-xl relative overflow-hidden">
        <div className="absolute top-4 right-4 text-slate-500 flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800 text-[10px] font-bold uppercase font-mono">
          <Lock size={12} className="text-indigo-400" /> Painel 100% Privado
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 text-xl">
            ⚖️
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
              Áreas de Evolução Pessoal
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Reflita e monitore de forma gentil e autônoma os hábitos que você deseja reduzir ou afastar. <b>Nenhum dado é compartilhado nos rankings, feed ou comunidades.</b>
            </p>
          </div>
        </div>

        {/* Supporting AI encouragement feedback bubble */}
        <div className="mt-5 p-4 bg-orange-950/10 border border-orange-900/20 rounded-xl flex items-center gap-3">
          <Smile className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
          <p className="text-xs text-slate-300 leading-relaxed">
            {getPositiveAIComment()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Habit reduction central panel */}
        <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-heading">
              Meus Registros Diários
            </h3>
            <span className="text-[10px] text-slate-505 font-mono">Últimos 7 dias</span>
          </div>

          <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
            {habits.map((habit) => {
              const avoidStreak = calculateAvoidedStreak(habit);
              const successRate = getReductionSuccessRate(habit);

              return (
                <div 
                  key={habit.id} 
                  className="p-3 bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-xl space-y-3.5 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-100 font-heading">{habit.name}</h4>
                      <div className="flex items-center gap-3 mt-0.5 text-[9px] text-slate-450 font-mono">
                        <span className="flex items-center gap-0.5 font-bold text-emerald-400">
                          🔥 {avoidStreak} dias livres
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingDown className="w-3 h-3 text-sky-400 shrink-0" /> Taxa de Evitado: {successRate}%
                        </span>
                        {habit.isCustom && (
                          <button
                            onClick={() => handleDelete(habit.id)}
                            className="text-rose-500 hover:text-rose-400 hover:underline transition"
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Today buttons quick toggles */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setDayStatus(habit.id, todayStr, "avoided")}
                        className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition border flex items-center gap-1 ${
                          habit.history[todayStr] === "avoided"
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-md"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        ✅ Consegui Evitar
                      </button>
                      <button
                        onClick={() => setDayStatus(habit.id, todayStr, "happened")}
                        className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition border flex items-center gap-1 ${
                          habit.history[todayStr] === "happened"
                            ? "bg-rose-500/15 border-rose-500/30 text-rose-455 shadow-md"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        ⚠️ Aconteceu
                      </button>
                    </div>
                  </div>

                  {/* Grid week row */}
                  <div className="grid grid-cols-7 gap-1 bg-slate-950/60 p-1.5 rounded-lg border border-slate-900">
                    {weekDays.map((day) => {
                      const status = habit.history[day.dateStr];
                      return (
                        <div
                          key={day.dateStr}
                          className={`py-1 text-center rounded flex flex-col items-center justify-center transition border ${
                            status === "avoided"
                              ? "bg-emerald-950/30 border-emerald-900/30 text-emerald-400"
                              : status === "happened"
                                ? "bg-rose-950/30 border-rose-900/30 text-rose-400"
                                : day.isToday
                                  ? "bg-slate-900 border-slate-800 text-slate-350"
                                  : "bg-transparent border-transparent text-slate-600"
                          }`}
                          title={`${day.dateStr}: ${status === "avoided" ? "Conseguiu evitar" : status === "happened" ? "Ocorreu" : "Sem registro"}`}
                        >
                          <span className="text-[8px] uppercase font-mono font-bold leading-none">{day.label}</span>
                          <span className="text-[9px] font-mono font-semibold mt-0.5 leading-none">{day.dayNum}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Form */}
          <div className="border-t border-slate-850 pt-3">
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full py-2.5 bg-slate-950/40 hover:bg-slate-900 border border-slate-850/80 text-slate-350 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Plus size={14} className="text-orange-400" /> Criar Hábito Saudável a Monitorar
              </button>
            ) : (
              <form onSubmit={handleAddCustom} className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-3.5">
                <div>
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-500 block mb-1">Qual comportamento deseja reduzir ou afastar?</label>
                  <input
                    type="text"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    placeholder="Ex: Roer unhas, Comer besteiras de madrugada, Pular treinos..."
                    className="w-full bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded-lg text-white"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-400 rounded-lg"
                  >
                    Mudar de ideia
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg"
                  >
                    Começar Monitoramento
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Left widget feedback cards / philosophy */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-205 uppercase tracking-wider font-heading flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-orange-400" /> Filosofia & Suporte
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              O Budismo foca na <b>revolução humana</b> através do discernimento positivo de nossas próprias vidas. Afastar tendências prejudiciais não exige autoflagelação, culpa ou vergonha.
            </p>
            <p className="text-xs text-slate-450 leading-relaxed">
              Quando você registra que <span className="text-rose-400 font-bold">"Aconteceu"</span>, veja como um lembrete amoroso da impermanência e uma oportunidade preciosa de fazer diferente amanhã! Como budistas-shapers, nós transformamos o veneno em remédio.
            </p>
            <div className="border-t border-dashed border-slate-800 pt-3 text-[10px] font-mono text-emerald-400 text-center">
              "Cada pequena melhoria diária gera gigantescas e gloriosas revoluções."
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-205 uppercase tracking-wider font-heading flex items-center gap-1.5 text-indigo-300">
              🔥 Sequências de Auto-Controle
            </h3>
            
            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-lg flex items-center justify-between">
                <span className="text-slate-400">🔥 7 dias sem refrigerante</span>
                <span className="text-[10px] bg-emerald-505/10 border border-emerald-505/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">Excelente</span>
              </div>
              <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-lg flex items-center justify-between">
                <span className="text-slate-400">🔥 30 dias sem tabaco rascunhado</span>
                <span className="text-[10px] bg-indigo-505/10 border border-indigo-505/20 text-indigo-400 px-1.5 py-0.5 rounded font-bold">Inabalável</span>
              </div>
              <div className="p-2 bg-indigo-950/20 border border-indigo-900/30 text-[10px] text-indigo-205 rounded-lg leading-relaxed text-center">
                Mantenha seu ritmo privado saudável para inspirar sua própria sabedoria oculta.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
