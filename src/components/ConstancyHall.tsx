import React, { useState, useEffect } from "react";
import { Flame, Award, Zap, Heart, Sparkles, Trophy, Users, Star, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { User, Activity } from "../types";

interface ConstancyHallProps {
  users: User[];
  activities: Activity[];
  onSelectUser: (user: User) => void;
  communityId?: string;
}

export default function ConstancyHall({ users, activities, onSelectUser, communityId }: ConstancyHallProps) {
  const [localMembers, setLocalMembers] = useState<string[] | null>(null);

  useEffect(() => {
    if (communityId) {
      fetch(`/api/constancy-hall?communityId=${communityId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setLocalMembers(data.map((item: any) => item.userId));
          } else {
            setLocalMembers([]);
          }
        })
        .catch(err => console.error(err));
    } else {
      setLocalMembers(null);
    }
  }, [communityId]);

  const extendedUsers = localMembers 
    ? users.filter(u => localMembers.includes(u.id))
    : users;

  // Dynamically compile accomplishments based on real active users,
  // falling back onto classic Buddhist/Soka-Shape motivational quotes if no real users are active yet.
  const achievements = React.useMemo(() => {
    const list: string[] = [];
    
    // Scan real users for accomplishments
    extendedUsers.forEach(u => {
      const displayName = u.displayName || u.name;
      if (u.streak && u.streak >= 3) {
        list.push(`🚀 O Bodhishaper ${displayName} alcançou uma constância abençoada de ${u.streak} dias! Suando o Karma!`);
      }
      // Sum up Daimoku hours if activities are supplied
      const mins = activities
        .filter(a => a.userId === u.id && a.type === "daimoku")
        .reduce((sum, a) => sum + (a.minutes || 0), 0);
      if (mins > 0) {
        list.push(`🪷 ${displayName} completou ${mins} minutos de Daimoku acumulados no app! Parabéns, Bodhi!`);
      }
    });

    // Default high-vibe Soka-Shape motivational quotes
    const fallbackQuotes = [
      "🪷 'A engrenagem do Daimoku sintoniza o macrocosmo inteiro com a sua vitória diária!' - Incentivo Soka",
      "💪 'O ato diário de vencer a própria preguiça molda um caráter inabalável. Corpo Forte, Mente Firme!'",
      "🔥 'A revolução humana acontece a cada minuto orado e a cada gota de suor derramada!'",
      "🏆 'Suando o Karma, Conquistando Vitórias! Esse é o caminho da perseverança dos Bodhis!'",
      "📚 'Nutrir o intelecto com leituras sábias nos oferece clareza e sabedoria inabalável nas lutas diárias.'"
    ];

    return list.length > 0 ? [...list, ...fallbackQuotes] : fallbackQuotes;
  }, [extendedUsers, activities]);

  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % achievements.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [achievements.length]);

  // Group participants by active streak brackets:
  // 7+, 15+, 30+, 50+, 100+, 365+
  const brackets = [
    { title: "🔥 365+ dias inabaláveis (Mestre Soka-Shape)", min: 365, bg: "from-amber-600/20 to-yellow-500/10 border-amber-500/30 text-amber-300" },
    { title: "🔥 100+ dias seguidos (Determinação Absoluta)", min: 100, bg: "from-purple-900/20 to-pink-500/10 border-pink-500/30 text-pink-300" },
    { title: "🔥 50+ dias seguidos (Espírito de Guerreiro)", min: 50, bg: "from-indigo-505/30 to-rose-955/20 border-indigo-500/35 text-indigo-300" },
    { title: "🔥 30+ dias seguidos (Constância Admirável)", min: 30, bg: "from-blue-900/20 to-teal-500/10 border-blue-500/30 text-teal-300" },
    { title: "🔥 15+ dias seguidos (Hábito Consolidado)", min: 15, bg: "from-emerald-900/20 to-green-500/10 border-emerald-500/30 text-emerald-300" },
    { title: "🔥 7+ dias seguidos (Primeira Grande Vitória)", min: 7, bg: "from-slate-900/40 to-slate-800/40 border-slate-750 text-slate-350" }
  ];

  // Helper to find the maximum bracket a user fits into
  const getUserBracketIdx = (streak: number) => {
    for (let i = 0; i < brackets.length; i++) {
      if (streak >= brackets[i].min) {
        return i;
      }
    }
    return -1;
  };

  // Organize users into brackets
  const groupedUsersByBracket = brackets.map((b, idx) => {
    const list = extendedUsers.filter((u) => {
      const uIdx = getUserBracketIdx(u.streak || 0);
      return uIdx === idx;
    });
    return {
      ...b,
      users: list
    };
  });

  // Calculate automatically generated weekly highlights
  const calcWeeklyHighlights = () => {
    // 1. Largest growth / daimoku this week
    const daimokuLeaders = extendedUsers.map(u => {
      const mins = activities
        .filter(a => a.userId === u.id && a.type === "daimoku")
        .reduce((sum, a) => sum + (a.minutes || 0), 0);
      return { user: u, value: mins };
    }).filter(x => x.value > 0).sort((a,b) => b.value - a.value);

    // 2. Largest exercise frequency
    const exerciseLeaders = extendedUsers.map(u => {
      const count = activities
        .filter(a => a.userId === u.id && a.type === "exercise")
        .length;
      return { user: u, value: count };
    }).filter(x => x.value > 0).sort((a,b) => b.value - a.value);

    // 3. Peak streak active
    const streakLeaders = [...extendedUsers].filter(u => (u.streak || 0) > 0).sort((a,b) => (b.streak || 0) - (a.streak || 0));

    // Dynamic thresholds: highlights are ONLY generated if real metrics are met
    const growthHighlight = (daimokuLeaders[0] && daimokuLeaders[0].value >= 15) ? {
      user: daimokuLeaders[0].user,
      title: "🏆 Campeão da Evolução Soka",
      desc: "Liderou com persistência e auto-superação contínua nas ações diárias.",
      metric: `${daimokuLeaders[0].value} minutos consagrados`
    } : null;

    const daimokuHighlight = (daimokuLeaders[0] && daimokuLeaders[0].value >= 15) ? {
      user: daimokuLeaders[0].user,
      title: "🪷 Farol da Sabedoria",
      desc: "Maior tempo investido em oração Daimoku com foco inabalável no Kossen-rufu.",
      metric: `${daimokuLeaders[0].value} min de Daimoku`
    } : null;

    const exercisesHighlight = (exerciseLeaders[0] && exerciseLeaders[0].value >= 2) ? {
      user: exerciseLeaders[0].user,
      title: "💪 Guardião do Templo Físico",
      desc: "Maior frequência de treinos físicos para manter a saúde e a energia.",
      metric: `${exerciseLeaders[0].value} exercícios registrados`
    } : null;

    const streakHighlight = (streakLeaders[0] && streakLeaders[0].streak >= 7) ? {
      user: streakLeaders[0],
      title: "🔥 Pilar da Constância",
      desc: "Demonstrou dedicação ininterrupta, registrando hábitos sem quebrar a corrente.",
      metric: `Série de ${streakLeaders[0].streak} dias consecutivos`
    } : null;

    // Union activities
    const userTotalActivities = (user: User) => activities.filter(a => a.userId === user.id).length;
    const unionLeaders = extendedUsers.map(u => ({ user: u, value: userTotalActivities(u) })).filter(x => x.value >= 10).sort((a,b) => b.value - a.value);

    const activitiesHighlight = unionLeaders[0] ? {
      user: unionLeaders[0].user,
      title: "🤝 Espírito de União",
      desc: "Demonstrou alto empenho de união e constância nas frentes conjuntas esta semana.",
      metric: `${unionLeaders[0].value} ações registradas`
    } : null;

    // Goals completed
    const goalsLeaders = extendedUsers.map(u => {
      return { user: u, value: u.daimokuBalance || 0 };
    }).filter(x => x.value >= 500).sort((a,b) => b.value - a.value);

    const goalsHighlight = goalsLeaders[0] ? {
      user: goalsLeaders[0].user,
      title: "🌟 Realizador de Metas",
      desc: "Alcançou um patamar primoroso em suas metas e orações acumuladas esta semana.",
      metric: `${goalsLeaders[0].value} de Daimoku Acumulado`
    } : null;

    return {
      growth: growthHighlight,
      daimoku: daimokuHighlight,
      exercises: exercisesHighlight,
      streak: streakHighlight,
      activities: activitiesHighlight,
      goals: goalsHighlight
    };
  };

  const highlights = calcWeeklyHighlights();

  return (
    <div className="space-y-6" id="constancy-hall-root">
      
      {/* 🎖️ COMMUNITY ACCOMPLISHMENTS LIVE TICKER STREAM */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950/45 to-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between gap-4 overflow-hidden relative shadow-lg">
        <span className="bg-[#1C1F37] text-indigo-300 text-[9px] font-bold font-heading py-0.5 px-3 border border-indigo-900/40 rounded-full uppercase shrink-0 flex items-center gap-1.5 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-450 inline-block shrink-0" />
          Conquistas da Comunidade
        </span>

        <div className="flex-1 overflow-hidden relative h-5">
          <motion.div
            key={tickerIndex}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="text-xs text-slate-300 font-medium whitespace-nowrap overflow-ellipsis overflow-hidden"
          >
            {achievements[tickerIndex]}
          </motion.div>
        </div>

        <span className="text-[10px] text-slate-500 font-mono hidden md:inline">Tempo Real ⏱️</span>
      </div>

      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-955/20 p-6 rounded-2xl border border-slate-850 shadow-lg">
        <div className="max-w-2xl">
          <span className="bg-[#211B34] text-[#D8B4FE] text-[10px] font-bold font-mono py-1 px-3 border border-purple-900/30 rounded-full uppercase tracking-wider font-heading">
            🔥 Disciplina & Perseverança
          </span>
          <h2 className="text-2xl font-black font-heading text-slate-100 mt-2 flex items-center gap-2">
            Hall da Constância Soka-Shape
          </h2>
          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
            Neste espaço público, celebramos o valor mais precioso de nossa revolução humana: a **constância**. Não há pontuações de competição aqui, cada **Bodhishaper** listado é homenageado puramente por sua dedicação abnegada diária em vencer o próprio karma e cultivar hábitos sublimes. Aqui, os **Bodhis** provam que a vitória vem da repetição diária focado no lema: <span className="text-emerald-400 font-bold block mt-1">💪 Suando o Karma, Conquistando Vitórias.</span>
          </p>
        </div>
      </div>

      {/* 🏆 DESTAQUES DA SEMANA SECTION */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Award className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-heading">
            🌟 Destaques da Semana (Foco em Evolução)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="weekly-highlights-grid">
          {/* Highlight Cards */}
          {[
            { info: highlights.growth, color: "border-indigo-900/40 bg-indigo-950/10 hover:bg-indigo-950/20", icon: "🏆", badge: "Evolução Geral" },
            { info: highlights.daimoku, color: "border-rose-900/40 bg-rose-955/10 hover:bg-rose-955/20", icon: "🪷", badge: "Daimoku" },
            { info: highlights.exercises, color: "border-emerald-900/40 bg-emerald-955/10 hover:bg-emerald-955/20", icon: "💪", badge: "Frequência Shape" },
            { info: highlights.streak, color: "border-orange-950 bg-orange-955/10 hover:bg-orange-955/20", icon: "🔥", badge: "Sequência Ativa" },
            { info: highlights.activities, color: "border-sky-900/40 bg-sky-955/5 hover:bg-sky-955/15", icon: "🤝", badge: "Espírito de União" },
            { info: highlights.goals, color: "border-amber-900/40 bg-amber-955/5 hover:bg-amber-955/15", icon: "🌟", badge: "Metas Concluídas" }
          ].map((item, idx) => {
            if (!item.info) {
              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 shadow opacity-70 bg-slate-900/20 border-slate-850"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[9px] font-bold font-mono text-slate-500 bg-slate-950/45 px-2 py-0.5 rounded border border-slate-900">
                      {item.badge}
                    </span>
                    <span className="text-xl leading-none opacity-55">{item.icon}</span>
                  </div>

                  <div className="py-2 text-center text-slate-500 text-[10px] leading-relaxed">
                    🪷 Nenhum destaque nesta categoria ainda esta semana.
                    <p className="text-[9px] text-slate-600 mt-1">Gere dados reais no aplicativo para habilitar esse destaque.</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/35 text-center">
                    <p className="text-[9px] text-slate-600 font-mono">Status: Em aberto</p>
                  </div>
                </div>
              );
            }
            return (
              <div
                key={idx}
                onClick={() => onSelectUser(item.info.user)}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between gap-3 shadow ${item.color}`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-[9px] font-bold font-mono text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                    {item.badge}
                  </span>
                  <span className="text-xl leading-none">{item.icon}</span>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={item.info.user.avatar}
                    alt={item.info.user.displayName || item.info.user.name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-805 bg-slate-950"
                  />
                  <div>
                    <h4 className="text-xs font-black text-slate-200 leading-tight block">
                      {item.info.user.displayName || item.info.user.name}
                    </h4>
                    <p className="text-[9px] text-slate-500 font-heading">
                      {item.info.user.division} • {item.info.user.city}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 leading-tight">
                  <p className="text-[10px] text-slate-400 italic">"{item.info.desc}"</p>
                  <p className="text-xs font-bold text-indigo-300 mt-1.5 font-mono">{item.info.metric}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🔥 THE BRACKETS LIST */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 px-1">
          <Flame className="w-5 h-5 text-soka-orange" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-heading">
            🔥 Galeria de Constância Ininterrupta
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="constancy-brackets-grid">
          {groupedUsersByBracket.map((b, bIdx) => (
            <div
              key={bIdx}
              className={`p-5 rounded-2xl border bg-gradient-to-br ${b.bg} flex flex-col justify-between h-fit min-h-[160px] shadow`}
            >
              <div>
                <div className="flex justify-between items-center pb-2.5 mb-3.5 border-b border-slate-800/40">
                  <h4 className="text-xs font-black uppercase tracking-wider font-heading">{b.title}</h4>
                  <span className="text-[10px] bg-slate-950/60 px-2 py-0.5 rounded-full font-bold font-mono">
                    {b.users.length} {b.users.length === 1 ? "companheiro" : "companheiros"}
                  </span>
                </div>

                {b.users.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {b.users.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => onSelectUser(u)}
                        className="bg-slate-950/80 p-2 rounded-xl flex items-center gap-2 border border-slate-850 hover:border-slate-700 cursor-pointer transition"
                        title="Ver perfil detalhado"
                      >
                        <img
                          src={u.avatar}
                          alt={u.displayName || u.name}
                          className="w-7 h-7 rounded-full object-cover bg-slate-900 border border-slate-800"
                        />
                        <div className="leading-tight text-left">
                          <span className="text-[10px] font-bold text-slate-200 block max-w-[130px] truncate">{u.displayName || u.name}</span>
                          <span className="text-[8px] text-[#FF8A00] font-mono font-semibold block">🔥 {u.streak || 0} dias ativos</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-[10px] font-mono text-slate-550">Ninguém neste patamar neste momento. Faça Daimoku e treine para subir de nível! 🔥</p>
                  </div>
                )}
              </div>

              <div className="mt-4 text-[9px] text-slate-500 italic text-left">
                Lema: "A pressa gera cansaço, a constância forja o monumento."
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
