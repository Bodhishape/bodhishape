import React, { useState, useEffect } from "react";
import { Award, Search, Trophy, MapPin, Layers, Flame, Dumbbell, Zap } from "lucide-react";
import { motion } from "motion/react";
import { User, Activity, LeaderboardUser } from "../types";

interface LeaderboardsProps {
  users: User[];
  activities: Activity[];
  onSelectUser?: (user: User) => void;
  communityId?: string;
}

export default function Leaderboards({ users, activities, onSelectUser, communityId }: LeaderboardsProps) {
  const [boardType, setBoardType] = useState<"principal" | "daimoku" | "exercicio" | "streak">("principal");
  
  const [localLeaderboard, setLocalLeaderboard] = useState<any[] | null>(null);

  useEffect(() => {
    if (communityId) {
      fetch(`/api/leaderboard?communityId=${communityId}`)
        .then(res => res.json())
        .then(data => setLocalLeaderboard(Array.isArray(data) ? data : []))
        .catch(err => console.error(err));
    } else {
      setLocalLeaderboard(null);
    }
  }, [communityId, users, activities]);

  // Filtering state
  const [divisionFilter, setDivisionFilter] = useState<string>("ALL");
  const [regionFilter, setRegionFilter] = useState<string>("ALL");
  const [cityQuery, setCityQuery] = useState("");
  const [districtQuery, setDistrictQuery] = useState("");
  const [orgQuery, setOrgQuery] = useState("");

  // Dynamically compute list of unique user regions present in the current datasets
  const regionsList = Array.from(
    new Set(users.map((u) => u.region).filter((r): r is string => !!r))
  ).sort();

  // Helper function to calculate each user's stats
  const calculateLeaderboards = (): LeaderboardUser[] => {
    if (localLeaderboard) {
      return localLeaderboard.map((item: any) => {
        const u = users.find(x => x.id === item.userId) || {
          id: item.userId,
          displayName: item.name,
          name: item.name,
          avatar: item.avatar,
          division: item.division || "",
          region: item.region || "",
          city: "",
          district: "",
          organization: ""
        } as any;
        return {
          user: u,
          totalPoints: item.totalPoints,
          daimokuMinutes: item.daimokuMinutes,
          exerciseCount: item.exerciseCount,
          streakDays: item.streak
        };
      });
    }

    return users.map((u) => {
      const userActivities = activities.filter((a) => a.userId === u.id);

      // Points sum (Gongyo/Daimoku/Exercise combined points, respecting daily limits already applied at server)
      const totalPoints = userActivities.reduce((sum, a) => sum + (a.points || 0), 0);

      // Total Daimoku minutes registered (cumulative, including 5, 10, 15m)
      const daimokuMinutes = userActivities
        .filter((a) => a.type === "daimoku")
        .reduce((sum, a) => sum + (a.minutes || 0), 0);

      // Total exercise logs
      const exerciseCount = userActivities.filter((a) => a.type === "exercise").length;

      return {
        user: u,
        totalPoints,
        daimokuMinutes,
        exerciseCount,
        streakDays: u.streak || 0,
      };
    });
  };

  const rawLeaderboard = calculateLeaderboards();

  // Apply visual filtering
  const filteredLeaderboard = rawLeaderboard.filter((item) => {
    if (divisionFilter !== "ALL" && item.user.division !== divisionFilter) return false;
    if (regionFilter !== "ALL" && item.user.region !== regionFilter) return false;
    if (cityQuery.trim() && !item.user.city.toLowerCase().includes(cityQuery.toLowerCase())) return false;
    if (districtQuery.trim() && !item.user.district.toLowerCase().includes(districtQuery.toLowerCase())) return false;
    if (orgQuery.trim() && !item.user.organization.toLowerCase().includes(orgQuery.toLowerCase())) return false;
    return true;
  });

  // Sort based on board type
  const sortedLeaderboard = [...filteredLeaderboard].sort((a, b) => {
    if (boardType === "principal") return b.totalPoints - a.totalPoints;
    if (boardType === "daimoku") return b.daimokuMinutes - a.daimokuMinutes;
    if (boardType === "exercicio") return b.exerciseCount - a.exerciseCount;
    if (boardType === "streak") return b.streakDays - a.streakDays;
    return 0;
  });

  // Spotlight Top 3 podium earners
  const top3 = sortedLeaderboard.slice(0, 3);
  const restOfList = sortedLeaderboard.slice(3);

  const getRankValueString = (item: LeaderboardUser) => {
    if (boardType === "principal") return `${item.totalPoints} pontos`;
    if (boardType === "daimoku") return `${item.daimokuMinutes} min (${Number((item.daimokuMinutes / 60).toFixed(1))}h)`;
    if (boardType === "exercicio") return `${item.exerciseCount} treinos`;
    if (boardType === "streak") return `🔥 ${item.streakDays} dias`;
    return "";
  };

  const getDivisionLabel = (div: string) => {
    if (div === "DS") return "Divisão Sênior (DS)";
    if (div === "DF") return "Divisão Feminina (DF)";
    if (div === "JS") return "Juventude Soka (JS)";
    return div;
  };

  return (
    <div className="space-y-6" id="leaderboards-container">
      {/* EXPLICIT SCORE PHILOSOPHY BANNER */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-indigo-500/25 p-5 shadow-xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/20">
        <p className="text-xs text-indigo-300 leading-relaxed font-medium flex items-start gap-3">
          <span className="text-base leading-none">⚖️</span>
          <span>
            <strong className="font-bold text-indigo-200">Filosofia de Pontuação BodhiShape:</strong> Os pontos do Ranking Principal são conquistados exclusivamente através de <strong className="text-amber-300">Gongyo da Manhã</strong>, <strong className="text-indigo-300">Gongyo da Noite</strong>, <strong className="text-soka-pink animate-pulse">Daimoku</strong> e <strong className="text-soka-green">Exercícios Físicos</strong>. Recursos de apoio individual como Bons Hábitos, Áreas de Evolução, Leituras, Kofu e Metas são ferramentas de desenvolvimento pessoal privado que auxiliam sua evolução invisível, sem gerar concorrência ou pontuação pública.
          </span>
        </p>
      </div>

      {/* Search and filters board */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 shadow-xl space-y-4">
        <div>
          <h3 className="text-lg font-bold font-heading text-slate-100">Filtros das Classificações</h3>
          <p className="text-xs text-slate-400 mt-0.5">Filtre as pontuações e encontre companheiros por região, divisão ou distrito.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Divisão</label>
            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="w-full text-xs border border-slate-800 bg-slate-950/60 text-slate-100 px-2 py-1.5 rounded-lg outline-none focus:border-indigo-505"
            >
              <option value="ALL">Todas as Divisões</option>
              <option value="DS">DS (Divisão Sênior)</option>
              <option value="DF">DF (Divisão Feminina)</option>
              <option value="JS">JS (Juventude Soka)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Região</label>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-full text-xs border border-slate-800 bg-slate-950/60 text-slate-100 px-2 py-1.5 rounded-lg outline-none focus:border-indigo-505"
            >
              <option value="ALL">Todas as Regiões</option>
              {regionsList.map((r) => (
                <option key={r} value={r}>{r.replace("RM ", "").replace("RE ", "")}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Cidade</label>
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              placeholder="Ex: Recife"
              className="w-full text-xs border border-slate-800 bg-slate-950/60 text-slate-100 placeholder-slate-650 px-2 py-1.5 rounded-lg outline-none focus:border-indigo-505"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Distrito</label>
            <input
              type="text"
              value={districtQuery}
              onChange={(e) => setDistrictQuery(e.target.value)}
              placeholder="Filtrar distrito"
              className="w-full text-xs border border-slate-800 bg-slate-950/60 text-slate-100 placeholder-slate-650 px-2 py-1.5 rounded-lg outline-none focus:border-indigo-505"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Organização</label>
            <input
              type="text"
              value={orgQuery}
              onChange={(e) => setOrgQuery(e.target.value)}
              placeholder="Organização Soka"
              className="w-full text-xs border border-slate-800 bg-slate-950/60 text-slate-100 placeholder-slate-650 px-2 py-1.5 rounded-lg outline-none focus:border-indigo-505"
            />
          </div>
        </div>
      </div>

      {/* Classifiers Selector Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { id: "principal", icon: Trophy, label: "Principal", desc: "Soma de pontos diários", color: "border-soka-orange text-soka-orange" },
          { id: "daimoku", icon: Zap, label: "Daimoku", desc: "Horas totais acumuladas", color: "border-soka-pink text-soka-pink" },
          { id: "exercicio", icon: Dumbbell, label: "Exercícios", desc: "Soma total de treinos realizados", color: "border-soka-green text-soka-green" },
          { id: "streak", icon: Flame, label: "Consistência", desc: "Sequência consecutiva ativa", color: "border-soka-gold text-soka-gold" },
        ].map((btn) => {
          const isSelected = boardType === btn.id;
          const Icon = btn.icon;
          return (
            <button
              key={btn.id}
              onClick={() => setBoardType(btn.id as any)}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                isSelected
                  ? `bg-slate-850/90 border-[#303852] text-white shadow-xl transform scale-[1.02]`
                  : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700 text-slate-400"
              }`}
            >
              <div className={`p-2 rounded-xl ${isSelected ? "bg-white/10 text-white" : "bg-slate-950/40 text-slate-450"}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold font-heading">{btn.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5" style={{ color: isSelected ? "rgba(255,255,255,0.7)" : "" }}>{btn.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Podium spotlight for top 3 */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4" id="leaderboard-podium">
          {/* 2nd Place */}
          {top3[1] && (
            <div 
              onClick={() => onSelectUser?.(top3[1].user)}
              className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-xl text-center flex flex-col items-center order-2 md:order-1 h-72 justify-between cursor-pointer hover:bg-slate-850/50 hover:border-slate-700 hover:scale-[1.01] transition-all"
            >
              <div>
                <span className="w-8 h-8 rounded-full bg-slate-800 text-slate-350 flex items-center justify-center font-bold font-mono text-sm border border-slate-700 shadow mx-auto">
                  2
                </span>
                <img
                  src={top3[1].user.avatar}
                  alt={top3[1].user.displayName || top3[1].user.name}
                  className="w-14 h-14 rounded-full border-2 border-slate-750 mt-2 mx-auto object-cover bg-slate-950"
                />
                <h4 className="font-bold text-slate-200 text-sm mt-2 font-heading hover:text-amber-400">{top3[1].user.displayName || top3[1].user.name}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">{getDivisionLabel(top3[1].user.division)}</p>
                <p className="text-[9px] text-slate-400">{top3[1].user.region.replace("RM ", "").replace("RE ", "")}</p>
              </div>
              <div className="w-full bg-slate-950/45 rounded-xl py-2 mt-2 border border-slate-850">
                <span className="text-sm font-bold text-slate-300 font-mono">{getRankValueString(top3[1])}</span>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {top3[0] && (
            <div 
              onClick={() => onSelectUser?.(top3[0].user)}
              className="bg-gradient-to-b from-[#1E1915] to-[#12100E] rounded-2xl border-2 border-amber-500/60 p-6 shadow-2xl shadow-amber-950/25 text-center flex flex-col items-center order-1 md:order-2 h-80 justify-between transform scale-105 z-10 cursor-pointer hover:border-amber-400 hover:scale-[1.06] transition-all"
            >
              <div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white flex items-center justify-center font-extrabold font-heading text-lg border-2 border-[#1E1915] shadow-md mx-auto animate-bounce">
                  👑
                </div>
                <img
                  src={top3[0].user.avatar}
                  alt={top3[0].user.displayName || top3[0].user.name}
                  className="w-18 h-18 rounded-full border-2 border-amber-500/50 mt-2 mx-auto object-cover bg-slate-950"
                />
                <h4 className="font-bold text-amber-100 text-base mt-2 font-heading hover:text-yellow-300">{top3[0].user.displayName || top3[0].user.name}</h4>
                <p className="text-[10px] text-amber-500/80 mt-0.5">{getDivisionLabel(top3[0].user.division)}</p>
                <p className="text-[9px] text-amber-500/60">{top3[0].user.region.replace("RM ", "").replace("RE ", "")}</p>
              </div>
              <div className="w-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl py-2.5 mt-2 shadow-md">
                <span className="text-sm font-extrabold text-slate-950 font-mono">{getRankValueString(top3[0])}</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div 
              onClick={() => onSelectUser?.(top3[2].user)}
              className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-xl text-center flex flex-col items-center order-3 h-64 justify-between cursor-pointer hover:bg-slate-850/50 hover:border-slate-700 hover:scale-[1.01] transition-all"
            >
              <div>
                <span className="w-8 h-8 rounded-full bg-orange-950/50 text-amber-500 flex items-center justify-center font-bold font-mono text-sm border border-orange-900/30 shadow mx-auto">
                  3
                </span>
                <img
                  src={top3[2].user.avatar}
                  alt={top3[2].user.displayName || top3[2].user.name}
                  className="w-14 h-14 rounded-full border-2 border-orange-900/40 mt-2 mx-auto object-cover bg-slate-950"
                />
                <h4 className="font-bold text-slate-200 text-sm mt-2 font-heading hover:text-amber-450">{top3[2].user.displayName || top3[2].user.name}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">{getDivisionLabel(top3[2].user.division)}</p>
                <p className="text-[9px] text-slate-400">{top3[2].user.region.replace("RM ", "").replace("RE ", "")}</p>
              </div>
              <div className="w-full bg-slate-950/45 rounded-xl py-2 mt-2 border border-slate-850">
                <span className="text-sm font-bold text-slate-300 font-mono">{getRankValueString(top3[2])}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main rankings list */}
      <div className="bg-slate-900/60 border border-slate-800/80 shadow-xl backdrop-blur-md rounded-2xl overflow-hidden" id="rankings-table-wrap">
        <div className="px-5 py-3 border-b border-slate-805 bg-slate-950/40 flex items-center justify-between text-xs font-bold text-slate-500 font-heading">
          <span>PARTICIPANTE</span>
          <span>RESULTADO</span>
        </div>

        <div className="divide-y divide-slate-850">
          {restOfList.length > 0 ? (
            restOfList.map((item, idx) => (
              <div 
                key={item.user.id} 
                onClick={() => onSelectUser?.(item.user)}
                className="p-4 flex items-center justify-between hover:bg-slate-950/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-slate-550 text-xs font-bold font-mono text-center">
                    {idx + 4}
                  </span>
                  <img
                    src={item.user.avatar}
                    alt={item.user.displayName || item.user.name}
                    className="w-8 h-8 rounded-full border border-slate-800 object-cover bg-slate-950"
                  />
                  <div>
                    <h5 className="text-xs font-bold text-slate-205 font-heading ml-0.5 hover:text-[#FF8A00]">{item.user.displayName || item.user.name}</h5>
                    <p className="text-[9px] text-slate-450 ml-0.5">
                      {item.user.division} • {item.user.city} ({item.user.region.replace("RM ", "").replace("RE ", "")})
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-300 font-mono">
                  {getRankValueString(item)}
                </span>
              </div>
            ))
          ) : top3.length > 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 font-mono font-medium bg-slate-950/30">
              Fim das classificações com base nos filtros atuais.
            </div>
          ) : (
            <div className="p-8 text-center text-slate-450 bg-slate-900/40 border-slate-800">
              <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm">Nenhum participante atende aos filtros definidos.</p>
              <p className="text-xs text-slate-500 mt-0.5">Tente limpar os campos de busca ou experimentar outra divisão/região!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
