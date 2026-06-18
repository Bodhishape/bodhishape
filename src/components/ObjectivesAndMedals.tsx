import React, { useState } from "react";
import { Plus, Award, Calendar, Trash2, CheckCircle2, ChevronRight, Sliders, Flame, Shield, Target } from "lucide-react";
import { motion } from "motion/react";
import { Goal, User, Activity } from "../types";

interface ObjectivesAndMedalsProps {
  currentUser: User | null;
  goals: Goal[];
  activities: Activity[];
  onAddGoal: (title: string, description: string, deadline: string) => void;
  onUpdateGoalProgress: (goalId: string, progress: number) => void;
  onDeleteGoal: (goalId: string) => void;
}

export default function ObjectivesAndMedals({
  currentUser,
  goals,
  activities,
  onAddGoal,
  onUpdateGoalProgress,
  onDeleteGoal,
}: ObjectivesAndMedalsProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddGoal(title, description, deadline || "Sem prazo");
    setTitle("");
    setDescription("");
    setDeadline("");
    setShowAddForm(false);
  };

  // Calculate medals earned by tracking cumulative history
  const daimokuActs = activities.filter((a) => a.userId === currentUser?.id && a.type === "daimoku");
  const totalDaimokuMinutes = daimokuActs.reduce((sum, a) => sum + (a.minutes || 0), 0);
  const totalDaimokuHours = totalDaimokuMinutes / 60;

  const exerciseActs = activities.filter((a) => a.userId === currentUser?.id && a.type === "exercise");
  const totalExercises = exerciseActs.length;

  const currentStreak = currentUser?.streak || 0;

  // Streak counters calculations scanned backwards
  const calculateStreakForType = (type: "gongyo" | "daimoku" | "exercise" | "complete") => {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date();
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];
      const dayActs = activities.filter(
        (a) => a.userId === currentUser?.id && a.timestamp.startsWith(dateStr)
      );
      
      let matched = false;
      if (type === "gongyo") {
        matched = dayActs.some((a) => a.type === "gongyo_morning" || a.type === "gongyo_evening");
      } else if (type === "daimoku") {
        matched = dayActs.some((a) => a.type === "daimoku");
      } else if (type === "exercise") {
        matched = dayActs.some((a) => a.type === "exercise");
      } else if (type === "complete") {
        const dayPoints = dayActs.reduce((sum, a) => sum + (a.points || 0), 0);
        matched = dayPoints >= 6;
      }
      
      if (matched) {
        streak++;
      } else {
        if (i === 0) continue; // Allow today to not be logged yet
        break;
      }
    }
    return streak;
  };

  const gongyoStreakVal = calculateStreakForType("gongyo");
  const daimokuStreakVal = calculateStreakForType("daimoku");
  const exerciseStreakVal = calculateStreakForType("exercise");
  const completeStreakVal = calculateStreakForType("complete");

  const userTotalPoints = activities
    .filter((a) => a.userId === currentUser?.id)
    .reduce((sum, a) => sum + (a.points || 0), 0);

  const completedGoalsCount = goals.filter((g) => g.progress === 100).length;

  // Generate last 30 calendar days
  const past30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d;
  });

  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);

  const getDayMetrics = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    const dayActs = activities.filter(
      (a) => a.userId === currentUser?.id && a.timestamp.startsWith(dateStr)
    );
    const dayPoints = dayActs.reduce((sum, a) => sum + (a.points || 0), 0);
    const gMorning = dayActs.some((a) => a.type === "gongyo_morning");
    const gEvening = dayActs.some((a) => a.type === "gongyo_evening");
    const dMins = dayActs.filter((a) => a.type === "daimoku").reduce((sum, a) => sum + (a.minutes || 0), 0);
    const hasWorkout = dayActs.some((a) => a.type === "exercise");

    return {
      dateStr,
      dayPoints,
      gMorning,
      gEvening,
      dMins,
      hasWorkout,
      dayActs
    };
  };

  const medalsList = [
    // Streak badges
    { category: "consistencia", label: "Consistência de Bronze", icon: "🔥 7", desc: "Completou 7 dias de determinação seguidos", active: currentStreak >= 7 },
    { category: "consistencia", label: "Consistência de Prata", icon: "🔥 30", desc: "Completou 30 dias de determinação seguidos", active: currentStreak >= 30 },
    { category: "consistencia", label: "Consistência de Ouro", icon: "🔥 100", desc: "Cem dias de constância inabalável!", active: currentStreak >= 100 },
    { category: "consistencia", label: "Coroa de Platina", icon: "👑 365", desc: "Um ano de dedicação constante", active: currentStreak >= 365 },

    // Point badges
    { category: "pontos", label: "Primeiros 100 Pontos", icon: "🏆 100", desc: "Soma de 100 pontos acumulados no histórico", active: userTotalPoints >= 100 },

    // Daimoku badges
    { category: "daimoku", label: "Primeira Hora Sagrada", icon: "🪷 1h", desc: "Completou sua primeira hora (60 minutos) de Daimoku", active: totalDaimokuHours >= 1 },
    { category: "daimoku", label: "Determinação Estável", icon: "⚡ 10h", desc: "Completou 10 horas de Daimoku acumulado", active: totalDaimokuHours >= 10 },
    { category: "daimoku", label: "Escudo do Guerreiro", icon: "🛡️ 50h", desc: "Superou 50 horas de forte determinação", active: totalDaimokuHours >= 50 },
    { category: "daimoku", label: "Benefício Celestial", icon: "🌟 100h", desc: "Pilar de orgulho: 100 horas acumuladas!", active: totalDaimokuHours >= 100 },

    // Exercise badges
    { category: "exercicio", label: "Primeiro Suor", icon: "💪", desc: "Iniciou sua revolução física (1º atividade)", active: totalExercises >= 1 },
    { category: "exercicio", label: "Hábitos do Gladiador", icon: "🏋️ 30", desc: "Completou 30 atividades físicas no shape", active: totalExercises >= 30 },
    { category: "exercicio", label: "Disciplina Inabalável", icon: "🦾 100", desc: "Monumento físico: 100 treinos concluídos!", active: totalExercises >= 100 },

    // Goal badges
    { category: "metas", label: "Primeira Vitória", icon: "🎯 1", desc: "Completou sua primeira meta pessoal customizada", active: completedGoalsCount >= 1 },
    { category: "metas", label: "Conquistador do Cume", icon: "🎯 10", desc: "Concluiu com sucesso 10 metas pessoais no app", active: completedGoalsCount >= 10 },

    // Special Campaign badges
    { category: "kofu", label: "Milho de Ouro da Gratidão", icon: "🌽", desc: "Participação realizada na campanha Arraiá de Kofu", active: true } // Active for general participants
  ];

  return (
    <div className="space-y-6" id="objectives-medals-wrapper">
      
      {/* Dynamic Streaks Dashboard Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Sequência de Gongyo", val: gongyoStreakVal, color: "from-amber-500/20 to-orange-500/10 border-orange-500/20 text-orange-400", title: "Gongyo" },
          { label: "Sequência de Daimoku", val: daimokuStreakVal, color: "from-pink-500/20 to-rose-500/10 border-rose-500/20 text-rose-450", title: "Daimoku" },
          { label: "Sequência de Treino", val: exerciseStreakVal, color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/20 text-emerald-450", title: "Exercícios" },
          { label: "Atividades Completas", val: completeStreakVal, color: "from-indigo-500/20 to-blue-500/10 border-indigo-500/20 text-indigo-400", title: "Dia Perfeito (6 pts)" },
        ].map((st) => (
          <div key={st.label} className={`bg-gradient-to-br ${st.color} border p-4 rounded-2xl shadow-md text-center`}>
            <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75">{st.title}</span>
            <p className="text-2xl font-black font-mono mt-1 flex items-center justify-center gap-1.5">
              🔥 {st.val} <span className="text-xs font-normal font-sans text-slate-300">dias</span>
            </p>
            <span className="text-[9px] text-slate-400 mt-1 block">Dias consecutivos ativos</span>
          </div>
        ))}
      </div>

      {/* GitHub-style Consistency Calendar */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-xl space-y-4">
        <div>
          <span className="bg-[#172522] text-emerald-400 text-xs font-bold font-mono py-1 px-3 rounded-full uppercase tracking-wider">
            🟩 Calendário de Consistência
          </span>
          <h3 className="text-xl font-bold font-heading text-slate-100 mt-2">Visão de Prática dos Últimos 30 Dias</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Legenda: <span className="text-emerald-400 font-bold">🟩 Completo (6 pts)</span> • <span className="text-amber-400 font-bold">🟨 Parcial (1-5 pts)</span> • <span className="text-slate-500">⬜ Sem prática</span>. Clique em um quadrante para detalhes do dia.
          </p>
        </div>

        {/* Calendar Grid */}
        <div className="flex flex-col space-y-4">
          <div className="flex flex-wrap gap-1.5 justify-center md:justify-start bg-slate-950/40 p-4 rounded-xl border border-slate-850">
            {past30Days.map((day, idx) => {
              const metrics = getDayMetrics(day);
              const isSelected = selectedDayIdx === idx;
              
              // Determine color class based on points
              let colorClass = "bg-slate-800 hover:bg-slate-700/85 border-slate-750";
              if (metrics.dayPoints >= 6) {
                colorClass = "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_6px_rgba(16,185,129,0.3)]";
              } else if (metrics.dayPoints > 0) {
                colorClass = "bg-amber-500 border-amber-400 text-slate-950 shadow-[0_0_6px_rgba(245,158,11,0.2)]";
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedDayIdx(isSelected ? null : idx)}
                  className={`w-6 h-6 rounded-md border text-[9px] font-bold flex items-center justify-center transition-all ${colorClass} ${
                    isSelected ? "ring-2 ring-white scale-110 z-10" : ""
                  }`}
                  title={`${day.toLocaleDateString("pt-BR")}: ${metrics.dayPoints} pontos`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {/* Details Drawer for selected day */}
          {selectedDayIdx !== null && (() => {
            const day = past30Days[selectedDayIdx];
            const metrics = getDayMetrics(day);
            return (
              <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs font-bold font-heading text-slate-300">
                  <span className="text-orange-400">📅 Práticas de {day.toLocaleDateString("pt-BR")}</span>
                  <span className="font-mono bg-indigo-500/10 text-indigo-300 py-0.5 px-2.5 border border-indigo-950 rounded-full">
                    Pontos: {metrics.dayPoints} / 6
                  </span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Gongyo Manhã</span>
                    <span className="font-bold text-slate-205 mt-0.5 block">{metrics.gMorning ? "✅ Concluído" : "❌ Pendente"}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Gongyo Noite</span>
                    <span className="font-bold text-slate-205 mt-0.5 block">{metrics.gEvening ? "✅ Concluído" : "❌ Pendente"}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Daimoku</span>
                    <span className="font-bold text-slate-205 mt-0.5 block">{metrics.dMins} minutos</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Exercício Físico</span>
                    <span className="font-bold text-slate-205 mt-0.5 block">{metrics.hasWorkout ? "🏋️ Realizado" : "❌ Pendente"}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PERSONAL GOALS LIST */}
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-xl lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <span className="bg-[#2D1B13] text-orange-400 text-xs font-bold font-mono py-1 px-3 rounded-full uppercase tracking-wider">
              🎯 Metas
            </span>
            <h3 className="text-xl font-bold font-heading text-slate-100 mt-2">Seus Objetivos Pessoais</h3>
            <p className="text-xs text-slate-400 mt-0.5">Determine e gerencie suas conquistas individuais.</p>
          </div>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-2.5 bg-soka-orange hover:bg-orange-700 text-white rounded-xl shadow transition"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Create goal form inline */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="bg-slate-950/60 rounded-2xl p-4 border border-slate-850 space-y-3.5">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-450 font-heading">Novo Objetivo</h4>
            <div className="space-y-2.5">
              <input
                type="text"
                placeholder="Título da meta (Ex: Fazer Gongyo Diário)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full text-xs bg-slate-900/80 text-slate-100 border border-slate-800 px-3 py-2 rounded-lg outline-none focus:border-soka-orange"
              />
              <input
                type="text"
                placeholder="Breve descrição (Ex: Para elevar o estado de vida e manter o shape)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs bg-slate-900/80 text-slate-100 border border-slate-800 px-3 py-2 rounded-lg outline-none focus:border-soka-orange"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Prazo (Ex: 31/12/2026)"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full text-xs bg-slate-900/80 text-slate-100 border border-slate-800 px-3 py-2 rounded-lg outline-none focus:border-soka-orange"
                />
                <button
                  type="submit"
                  className="py-2 bg-soka-orange text-white font-bold rounded-lg text-xs hover:bg-orange-705 transition"
                >
                  Confirmar Objetivo
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Goals Listing */}
        <div className="space-y-3.5">
          {goals.length > 0 ? (
            goals.map((goal) => (
              <div
                key={goal.id}
                className="p-4 rounded-2xl border border-slate-850 bg-slate-950/20 hover:bg-slate-950/40 hover:border-slate-800 transition-colors relative"
                id={`goal-item-${goal.id}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-2.5 items-start">
                    <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 mt-1">
                      <Target className="w-4 h-4 text-soka-orange" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm font-heading">{goal.title}</h4>
                      {goal.description && <p className="text-xs text-slate-400 mt-0.5">{goal.description}</p>}
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-2 font-medium">
                        <Calendar className="w-3 h-3" />
                        <span>Prazo limite: {goal.deadline}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingGoalId(editingGoalId === goal.id ? null : goal.id);
                        setEditVal(goal.progress);
                      }}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300 transition"
                      title="Editar progresso"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteGoal(goal.id)}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-rose-400 transition"
                      title="Apagar objetivo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress display */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
                    <span>Percentual de progresso</span>
                    <span className="font-bold text-slate-200 font-mono">{goal.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-850 h-2 rounded-full overflow-hidden border border-slate-800/30">
                    <div
                      className="h-full bg-soka-orange rounded-full transition-all"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>

                {/* Progress slider drawer */}
                {editingGoalId === goal.id && (
                  <div className="mt-4 p-3 bg-slate-900/60 rounded-xl border border-slate-800 block space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-350">
                      <span>Definir novo progresso:</span>
                      <span className="font-mono text-soka-orange">{editVal}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={editVal}
                      onChange={(e) => setEditVal(Number(e.target.value))}
                      className="w-full accent-soka-orange h-1.5 bg-slate-800 rounded"
                    />
                    <div className="flex justify-end gap-2 text-[10px] uppercase font-bold pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingGoalId(null)}
                        className="px-2.5 py-1 text-slate-400"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateGoalProgress(goal.id, editVal);
                          setEditingGoalId(null);
                        }}
                        className="px-2.5 py-1 bg-soka-orange text-white rounded"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-8 text-center text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-medium">Nenhum objetivo pessoal listado por enquanto.</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Defina suas metas clicando no botão de adição acima!</p>
            </div>
          )}
        </div>
      </div>

      {/* REVOLUTION MEDALS BRACKET */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-xl flex flex-col justify-between" id="visual-medals-card">
        <div className="space-y-4">
          <div>
            <span className="bg-[#241B33] text-purple-400 text-xs font-bold font-mono py-1 px-3 rounded-full uppercase tracking-wider">
              🏅 Medalhas
            </span>
            <h3 className="text-lg font-bold font-heading text-slate-100 mt-2 font-sans">Suas Medalhas de Transformação</h3>
            <p className="text-xs text-slate-400 mt-0.5">Selo de conquistas da sua revolução humana e física.</p>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {medalsList.map((m) => (
              <div
                key={m.label}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                  m.active
                    ? "bg-amber-955/15 border-amber-900/40 text-amber-200"
                    : "bg-slate-950/30 border-slate-900 text-slate-500 opacity-60"
                }`}
              >
                <span className="text-2xl w-10 h-10 rounded-full bg-[#13192B] border border-slate-805 flex items-center justify-center shadow-inner shrink-0">
                  {m.active ? m.icon.split(" ")[0] : "🔒"}
                </span>
                <div>
                  <h4 className="font-bold font-heading text-xs leading-none">
                    {m.label} {m.active && m.icon.split(" ")[1] ? `(${m.icon.split(" ")[1]})` : ""}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-sans">
                    {m.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center pt-4 border-t border-slate-850 mt-4">
          <p className="text-[10px] text-slate-500 font-medium font-mono">
            "Sua consistência determina o tamanho da sua vitória."
          </p>
        </div>
      </div>

    </div>
  </div>
  );
}
