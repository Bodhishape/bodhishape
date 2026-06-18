import React, { useState } from "react";
import { Circle, Info, Layers, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { Activity } from "../types";

interface DaimokuBubbleChartProps {
  activities: Activity[];
}

export default function DaimokuBubbleChart({ activities }: DaimokuBubbleChartProps) {
  const [filter, setFilter] = useState<"diario" | "semanal" | "mensal" | "anual">("semanal");

  // Filter Daimoku sessions
  const daimokuActs = activities.filter((a) => a.type === "daimoku");

  // Get total minutes, hours, and session counts based on selected range filter
  const getFilteredData = () => {
    const now = new Date();
    let filtered = [...daimokuActs];

    if (filter === "diario") {
      const todayStr = now.toISOString().split("T")[0];
      filtered = daimokuActs.filter((a) => a.timestamp.startsWith(todayStr));
    } else if (filter === "semanal") {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 3600000);
      filtered = daimokuActs.filter((a) => new Date(a.timestamp) >= oneWeekAgo);
    } else if (filter === "mensal") {
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 3600000);
      filtered = daimokuActs.filter((a) => new Date(a.timestamp) >= oneMonthAgo);
    } else if (filter === "anual") {
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 3600000);
      filtered = daimokuActs.filter((a) => new Date(a.timestamp) >= oneYearAgo);
    }

    const totalMinutes = filtered.reduce((sum, a) => sum + (a.minutes || 0), 0);
    const totalHours = Number((totalMinutes / 60).toFixed(1));
    const averageSession = filtered.length > 0 ? Math.round(totalMinutes / filtered.length) : 0;
    
    // Bubble count: Each bubble represents 5 minutes
    const bubbleCount = Math.floor(totalMinutes / 5);
    const remainingMinutes = totalMinutes % 5;

    return {
      filtered,
      totalMinutes,
      totalHours,
      averageSession,
      bubbleCount,
      remainingMinutes,
    };
  };

  const { totalMinutes, totalHours, averageSession, bubbleCount, remainingMinutes } = getFilteredData();

  // Create an array of circles for rendering the bubble grid
  const bubbles = Array.from({ length: Math.min(120, bubbleCount) }); // cap at 120 on screen for UI beauty

  // Calculate community-wide collective daimoku accumulation
  const communityTotalMinutes = activities
    .filter((a) => a.type === "daimoku")
    .reduce((sum, a) => sum + (a.minutes || 0), 0);
  const targetMinuteMilestone = 1000000;
  const collectivePercent = Math.min(100, Number(((communityTotalMinutes / targetMinuteMilestone) * 100).toFixed(4)));

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 flex flex-col shadow-xl" id="daimoku-bubble-chart">
      
      {/* Collective 1,000,000 Target Board */}
      <div className="mb-6 bg-gradient-to-r from-indigo-950/40 via-[#26162F]/50 to-slate-950/60 rounded-xl p-4 border border-purple-900/20 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-[radial-gradient(ellipse_at_right,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-yellow-300 border border-amber-500/30 text-[9px] font-extrabold uppercase py-0.5 px-2.5 rounded-full tracking-wider font-mono">
              🎯 Alvo Coletivo BodhiShape
            </span>
            <h4 className="text-sm font-extrabold font-heading text-slate-100 flex items-center gap-1.5">
              <span>Rumo a 1.000.000 de Minutos de Daimoku 🪷</span>
            </h4>
            <p className="text-[11px] text-slate-400">Suando o karma coletivamente para manifestar paz, vitória e saúde inabalável.</p>
          </div>
          <div className="text-right leading-none shrink-0">
            <span className="text-xl font-black text-amber-300 font-mono">{(communityTotalMinutes).toLocaleString("pt-BR")} min</span>
            <span className="text-[10px] text-slate-500 block mt-1 font-sans">Soma Geral de Todos os Praticantes</span>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>Progresso da Campanha: <span className="text-purple-400 font-bold">{collectivePercent}%</span></span>
            <span>Meta: 1.000.000 min</span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-soka-pink via-purple-500 to-soka-gold rounded-full shadow-[0_0_8px_rgba(235,45,150,0.5)] transition-all duration-1000"
              style={{ width: `${Math.max(1.5, collectivePercent)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="bg-[#241B33] text-purple-400 text-xs font-bold font-mono py-1 px-3 rounded-full uppercase tracking-wider">
            🪷 Partículas de Daimoku
          </span>
          <h3 className="text-xl font-bold font-heading text-slate-100 mt-2">
            Evolução e Visualizador de Acumulado
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cada bolinha brilhante representa <span className="font-bold text-slate-350 font-mono">5 minutos</span> de Daimoku praticado.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-1.5 p-1 bg-slate-950/60 border border-slate-850 rounded-lg self-start sm:self-center">
          {(["diario", "semanal", "mensal", "anual"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all capitalize ${
                filter === opt
                  ? "bg-[#1E253A] border border-[#3F4D7B] text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Main visual readout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Total stats */}
        <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 flex flex-col justify-center">
          <span className="text-xs text-slate-500 font-medium font-heading">Total Consolidado</span>
          <p className="text-3xl font-extrabold text-soka-blue font-mono mt-1">
            {totalMinutes} <span className="text-sm font-sans font-normal text-slate-400">minutos</span>
          </p>
          <div className="h-px bg-slate-800/30 my-2" />
          <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <span className="font-bold text-slate-200">{totalHours} horas</span> somadas
          </p>
        </div>

        <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 flex flex-col justify-center">
          <span className="text-xs text-slate-500 font-medium font-heading">Média por Sessão</span>
          <p className="text-3xl font-extrabold text-soka-orange font-mono mt-1">
            {averageSession} <span className="text-sm font-sans font-normal text-slate-400">minutos</span>
          </p>
          <div className="h-px bg-slate-800/30 my-2" />
          <p className="text-xs text-slate-400 font-medium">
            Velocidade de determinação diária
          </p>
        </div>

        <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 flex flex-col justify-center">
          <span className="text-xs text-slate-500 font-medium font-heading">Bolinhas de Energia</span>
          <p className="text-3xl font-extrabold text-soka-gold font-mono mt-1">
            {bubbleCount} <span className="text-sm font-sans font-normal text-slate-400">esferas</span>
          </p>
          <div className="h-px bg-slate-800/30 my-2" />
          <p className="text-xs text-slate-400 font-medium font-sans">
            {remainingMinutes > 0 ? `+ ${remainingMinutes} min acumulados p/ próxima` : "Tudo convertido em energia!"}
          </p>
        </div>
      </div>

      {/* Bubble visual board */}
      <div className="flex-1 bg-slate-950/70 rounded-2xl p-6 flex flex-col justify-center items-center min-h-[220px] relative overflow-hidden border border-slate-850">
        {/* Decorative galaxy layout dots in the background */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        {bubbles.length > 0 ? (
          <div className="flex flex-wrap gap-2.5 justify-center max-w-lg z-10">
            {bubbles.map((_, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: Math.min(2, idx * 0.02), type: "spring" }}
                whileHover={{ scale: 1.3, rotate: 15 }}
                className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-soka-gold cursor-help relative flex items-center justify-center group shadow-[0_0_8px_rgba(245,180,0,0.4)]"
              >
                {/* Visual glow core */}
                <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80"></span>
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-6 bg-slate-950 text-slate-100 text-[10px] font-mono py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none border border-slate-850">
                  Esfera #{idx + 1} - 5 min
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center max-w-xs z-10">
            <RefreshCw className="w-8 h-8 text-slate-600 mb-3 animate-spin duration-3000" />
            <p className="text-slate-400 font-medium text-sm">Sem bolinhas de energia ainda!</p>
            <p className="text-xs text-slate-550 mt-1">
              Registre sessões de Daimoku na aba de lançamentos para contemplar a evolução de suas partículas de felicidade.
            </p>
          </div>
        )}

        {/* Bubble count info details */}
        {bubbleCount > 100 && (
          <div className="absolute bottom-2 right-2 text-[10px] text-slate-500 font-mono font-medium z-10">
            + {bubbleCount - 100} outras ocultadas para fluidez do layout
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 bg-slate-950/40 rounded-xl p-3 border border-slate-850">
        <Info className="w-4 h-4 text-slate-500 shrink-0" />
        <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
          Nota: O acúmulo de minutos serve para monitoramento constante do desenvolvimento humano e soma coletiva. A pontuação oficial das classificações segue estritamente a meta diária regulamentar de atividades completadas.
        </p>
      </div>
    </div>
  );
}
