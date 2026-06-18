import React, { useState } from "react";
import { Award, CheckCircle2, Flame, MapPin, Users, Zap } from "lucide-react";
import { motion } from "motion/react";
import { User, Activity } from "../types";

interface RegionStats {
  id: string;
  name: string;
  targetMins: number;
  currentMins: number;
  currentHours: number;
  contributorsCount: number;
  percentage: number;
  completed: boolean;
  color: string;
}

interface MissaoNordesteMapProps {
  users: User[];
  activities: Activity[];
}

export default function MissaoNordesteMap({ users, activities }: MissaoNordesteMapProps) {
  const [selectedRegionId, setSelectedRegionId] = useState<string>("RM Pernambuco PE Norte");
  const [showCelebrate, setShowCelebrate] = useState<string | null>(null);

  // Targets in minutes for testing (easily reachable)
  const regionTargets: Record<string, number> = {
    "RM Pernambuco PE Norte": 500,
    "RM Pernambuco PE Sul": 400,
    "RM Pernambuco PE Oeste": 300,
    "RE Paraíba": 600,
    "RE Sergipe": 200,
    "RE Alagoas": 300,
  };

  const regionColors: Record<string, string> = {
    "RM Pernambuco PE Norte": "#0D0A8C", // Azul Royal
    "RM Pernambuco PE Sul": "#F25C05",   // Laranja
    "RM Pernambuco PE Oeste": "#F84C7F", // Rosa Coral
    "RE Paraíba": "#F5B400",             // Amarelo Ouro
    "RE Sergipe": "#8F6BCB",             // Roxo Lavanda
    "RE Alagoas": "#6BCB77",             // Verde Menta
  };

  // Compute stat dynamics by region
  const statsMap: Record<string, RegionStats> = {};

  Object.entries(regionTargets).forEach(([regionName, target]) => {
    // Users in this region
    const regionUsers = users.filter((u) => u.region === regionName);
    const regionUserIds = regionUsers.map((u) => u.id);

    // Cumulative Daimoku from users of this region
    const regionDaimokuMinutes = activities
      .filter((a) => a.type === "daimoku" && regionUserIds.includes(a.userId))
      .reduce((sum, a) => sum + (a.minutes || 0), 0);

    const contributorsCount = users.filter((u) => 
      u.region === regionName && 
      activities.some((a) => a.userId === u.id && a.type === "daimoku")
    ).length;

    const percentage = Math.min(100, Math.round((regionDaimokuMinutes / target) * 100));
    const completed = percentage >= 100;

    statsMap[regionName] = {
      id: regionName,
      name: regionName,
      targetMins: target,
      currentMins: regionDaimokuMinutes,
      currentHours: Number((regionDaimokuMinutes / 60).toFixed(1)),
      contributorsCount,
      percentage,
      completed,
      color: regionColors[regionName],
    };
  });

  const selectedRegionStats = statsMap[selectedRegionId];

  // Helper trigger for celebrating complete states
  const handleStateClick = (regionId: string) => {
    setSelectedRegionId(regionId);
    if (statsMap[regionId].completed) {
      setShowCelebrate(regionId);
      setTimeout(() => setShowCelebrate(null), 4000);
    }
  };

  const getRegionShortName = (regionName: string) => {
    return regionName.replace("RM ", "").replace("RE ", "");
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 shadow-xl relative overflow-hidden" id="missao-nordeste-card">
      {/* Celebration animation handler */}
      {showCelebrate && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/95 flex flex-col justify-center items-center z-50 p-6 text-center text-white"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mb-4 text-white shadow-lg"
          >
            <Award className="w-12 h-12 text-slate-950" />
          </motion.div>
          <h3 className="text-3xl font-bold font-heading text-amber-400 mb-2">🎉 ESTADO CONCLUÍDO! 🎉</h3>
          <p className="text-lg max-w-md text-amber-100 font-medium">
            A união e força de todos os Bodhisattvas em <span className="font-bold underline">{getRegionShortName(showCelebrate)}</span> preencheu a meta coletiva de Daimoku!
          </p>
          <p className="text-sm mt-4 text-slate-400 font-mono italic">
            "Suando o Karma, Conquistando Vitórias!"
          </p>
          <button
            onClick={() => setShowCelebrate(null)}
            className="mt-6 px-6 py-2 bg-amber-500 hover:bg-amber-600 font-semibold rounded-lg text-slate-950 transition-colors text-sm font-sans"
          >
            Sensacional! Continuar
          </button>
        </motion.div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Map Visualization Panel */}
        <div className="flex-1 flex flex-col">
          <div className="mb-4">
            <span className="bg-gradient-to-r from-soka-blue via-soka-orange to-soka-gold text-white text-xs font-bold font-mono py-1 px-3 rounded-full uppercase tracking-wider">
              📍 Missão Nordeste 1
            </span>
            <h2 className="text-2xl font-bold font-heading text-slate-100 mt-2">
              Mapa Gamificado de Daimoku
            </h2>
            <p className="text-slate-400 text-sm mt-1 leading-relaxed">
              Soma coletiva de minutos de Daimoku. Cada 10 minutos registered = +1 progresso na conquista dos estados. Clique nos estados para visualizar estatísticas.
            </p>
          </div>

          {/* SVG Map of the States with Interactive Clicking & Colors */}
          <div className="bg-slate-950/40 rounded-xl p-4 flex justify-center items-center relative min-h-[320px] border border-slate-850">
            <svg
              viewBox="0 0 500 350"
              className="w-full max-w-[460px] h-auto drop-shadow-md"
            >
              <g stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {/* PB State representation */}
                <path
                  d="M 120,80 L 350,90 L 340,115 L 320,135 L 200,125 L 120,110 Z"
                  fill={selectedRegionId === "RE Paraíba" ? "#F5B400" : statsMap["RE Paraíba"].completed ? "rgba(245, 180, 0, 0.45)" : "#1e293b"}
                  className="cursor-pointer transition-all hover:opacity-90 duration-300"
                  onClick={() => handleStateClick("RE Paraíba")}
                />
                
                {/* Pernambuco split representations */}
                {/* PE Oeste */}
                <path
                  d="M 30,140 L 145,130 L 140,165 L 50,165 Z"
                  fill={selectedRegionId === "RM Pernambuco PE Oeste" ? "#F84C7F" : statsMap["RM Pernambuco PE Oeste"].completed ? "rgba(248, 76, 127, 0.45)" : "#1e293b"}
                  className="cursor-pointer transition-all hover:opacity-90 duration-300"
                  onClick={() => handleStateClick("RM Pernambuco PE Oeste")}
                />
                
                {/* PE Norte */}
                <path
                  d="M 145,130 L 320,135 L 280,150 L 140,165 Z"
                  fill={selectedRegionId === "RM Pernambuco PE Norte" ? "#64748b" : statsMap["RM Pernambuco PE Norte"].completed ? "rgba(100, 116, 139, 0.45)" : "#1e293b"}
                  className="cursor-pointer transition-all hover:opacity-90 duration-300"
                  onClick={() => handleStateClick("RM Pernambuco PE Norte")}
                />

                {/* PE Sul */}
                <path
                  d="M 140,165 L 280,150 L 300,175 L 180,178 Z"
                  fill={selectedRegionId === "RM Pernambuco PE Sul" ? "#F25C05" : statsMap["RM Pernambuco PE Sul"].completed ? "rgba(242, 92, 5, 0.45)" : "#1e293b"}
                  className="cursor-pointer transition-all hover:opacity-90 duration-300"
                  onClick={() => handleStateClick("RM Pernambuco PE Sul")}
                />

                {/* AL State representation */}
                <path
                  d="M 180,178 L 300,175 L 260,215 L 190,205 Z"
                  fill={selectedRegionId === "RE Alagoas" ? "#6BCB77" : statsMap["RE Alagoas"].completed ? "rgba(107, 203, 119, 0.45)" : "#1e293b"}
                  className="cursor-pointer transition-all hover:opacity-90 duration-300"
                  onClick={() => handleStateClick("RE Alagoas")}
                />

                {/* SE State representation */}
                <path
                  d="M 190,205 L 260,215 L 230,260 L 170,240 Z"
                  fill={selectedRegionId === "RE Sergipe" ? "#8F6BCB" : statsMap["RE Sergipe"].completed ? "rgba(143, 107, 203, 0.45)" : "#1e293b"}
                  className="cursor-pointer transition-all hover:opacity-90 duration-300"
                  onClick={() => handleStateClick("RE Sergipe")}
                />
              </g>

              {/* Labels with percentage indicators overlaid on states */}
              {/* Paraiba */}
              <text x="210" y="105" fill="#f8fafc" fontSize="10" fontWeight="bold" className="pointer-events-none select-none font-sans">
                PB {statsMap["RE Paraíba"].percentage}%
              </text>

              {/* PE Oeste */}
              <text x="60" y="153" fill="#f8fafc" fontSize="9" fontWeight="bold" className="pointer-events-none select-none font-sans">
                PE Oeste {statsMap["RM Pernambuco PE Oeste"].percentage}%
              </text>

              {/* PE Norte */}
              <text x="180" y="148" fill="#f8fafc" fontSize="9" fontWeight="bold" className="pointer-events-none select-none font-sans">
                PE Norte {statsMap["RM Pernambuco PE Norte"].percentage}%
              </text>

              {/* PE Sul */}
              <text x="200" y="172" fill="#ffffff" fontSize="9" fontWeight="bold" className="pointer-events-none select-none font-sans">
                PE Sul {statsMap["RM Pernambuco PE Sul"].percentage}%
              </text>

              {/* AL */}
              <text x="215" y="198" fill="#f8fafc" fontSize="10" fontWeight="bold" className="pointer-events-none select-none font-sans">
                AL {statsMap["RE Alagoas"].percentage}%
              </text>

              {/* SE */}
              <text x="190" y="235" fill="#ffffff" fontSize="10" fontWeight="bold" className="pointer-events-none select-none font-sans">
                SE {statsMap["RE Sergipe"].percentage}%
              </text>
            </svg>

            {/* Quick map legend */}
            <div className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-lg p-2 text-[10px] space-y-1 text-slate-350">
              <div className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 bg-[#64748b] rounded-sm"></span> PE Norte
                <span className="w-2.5 h-2.5 bg-[#F25C05] rounded-sm ml-1"></span> PE Sul
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 bg-[#F84C7F] rounded-sm"></span> PE Oeste
                <span className="w-2.5 h-2.5 bg-[#F5B400] rounded-sm ml-1"></span> PB
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 bg-[#6BCB77] rounded-sm"></span> AL
                <span className="w-2.5 h-2.5 bg-[#8F6BCB] rounded-sm ml-1"></span> SE
              </div>
            </div>
          </div>
        </div>

        {/* Selected Territory Detailed Profile */}
        <div className="w-full lg:w-80 flex flex-col bg-slate-950/40 rounded-2xl p-5 border border-slate-850">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-soka-orange animate-pulse" />
            <h3 className="font-bold text-slate-200 font-heading text-lg">
              {getRegionShortName(selectedRegionStats.name)}
            </h3>
          </div>

          {/* Goal completion card */}
          {selectedRegionStats.completed ? (
            <div className="bg-emerald-950/40 border border-[#1b4332] rounded-xl p-3 flex items-start gap-3 mb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-sans">Conquista Destravada</p>
                <p className="text-xs text-slate-300 font-medium leading-relaxed font-sans">Este estado atingiu seu potencial comunitário planejado da rodada! 🎉</p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-3 flex items-start gap-3 mb-4">
              <Flame className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider font-sans">Em Andamento</p>
                <p className="text-xs text-slate-300 font-medium font-mono leading-relaxed">Precisamos de {selectedRegionStats.targetMins - selectedRegionStats.currentMins} minutos de Daimoku coletivos para completar!</p>
              </div>
            </div>
          )}

          {/* Progress gauge */}
          <div className="mb-5">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
              <span>Progresso geral</span>
              <span className="font-bold text-slate-200 font-mono">{selectedRegionStats.percentage}%</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/20 shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${selectedRegionStats.percentage}%` }}
                className="h-full rounded-full"
                style={{ backgroundColor: selectedRegionStats.name === "RM Pernambuco PE Norte" ? "#64748b" : selectedRegionStats.color }}
              ></motion.div>
            </div>
          </div>

          {/* Numerical highlights */}
          <div className="space-y-3 mb-5 flex-1 animate-fadeIn">
            <div className="bg-slate-950/40 border border-slate-850/80 rounded-xl p-3 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                <span className="text-xs text-slate-400 font-medium">Contribuintes Ativos</span>
              </div>
              <span className="text-sm font-bold text-slate-205 font-heading font-mono">{selectedRegionStats.contributorsCount}</span>
            </div>

            <div className="bg-slate-950/40 border border-slate-850/80 rounded-xl p-3 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-slate-500" />
                <span className="text-xs text-slate-400 font-medium">Minutos Acumulados</span>
              </div>
              <span className="text-sm font-bold text-slate-100 font-mono">{selectedRegionStats.currentMins} min</span>
            </div>

            <div className="bg-slate-950/40 border border-slate-850/80 rounded-xl p-3 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-slate-500" />
                <span className="text-xs text-slate-400 font-medium">Horas Somadas</span>
              </div>
              <span className="text-sm font-bold text-slate-100 font-mono">{selectedRegionStats.currentHours}h</span>
            </div>

            <div className="bg-slate-950/40 border border-slate-850/80 rounded-xl p-3 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span className="text-xs text-slate-400 font-medium">Meta Coletiva</span>
              </div>
              <span className="text-sm font-bold text-slate-200 font-mono">{selectedRegionStats.targetMins} min</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-[10px] text-slate-500 italic leading-relaxed font-sans">
              "Cada minuto de Daimoku fortalece a vida e constrói a vitória comum."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
