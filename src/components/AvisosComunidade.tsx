import React, { useState } from "react";
import { Info, Megaphone, Calendar, Users, Sparkles, BookOpen, Heart, Trophy, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { User } from "../types";

interface Notice {
  id: string;
  type: "campaign" | "challenge" | "announcement" | "study";
  tag: string;
  title: string;
  description: string;
  deadline?: string;
  target?: string;
  currentProgress?: number;
  maxProgress?: number;
  color: string;
  joinedCount?: number;
}

export default function AvisosComunidade({ currentUser }: { currentUser: User | null }) {
  const [notices, setNotices] = useState<Notice[]>([
    {
      id: "no-1",
      type: "campaign",
      tag: "🌽 Kofu Especial",
      title: "Campanha Junina de Kofu 2026",
      description: "Momento singular de expressar nossa sincera gratidão pelo desenvolvimento e expansão do Kossen-rufu em nossa comunidade. Cada oferecimento sincero gera benefícios protetores indiscutíveis. Semeie boas sementes hoje!",
      deadline: "30 de Junho de 2026",
      target: "Participação integral de todos os distritos",
      currentProgress: 88,
      maxProgress: 100,
      color: "from-amber-600/30 to-rose-600/20 border-amber-500/20 text-amber-300",
      joinedCount: 42
    },
    {
      id: "no-2",
      type: "challenge",
      tag: "🏆 Desafio Coletivo",
      title: "Grande Desafio de Constância: 15 Dias Inabaláveis",
      description: "Desafiamos cada Bodhishaper a manter sua sequência de Gongyo e exercícios intacta por 15 dias! Os Bodhis que vencerem receberão o distintivo especial dourado de 'Guerreiro de Ferro' em seus perfis públicos.",
      deadline: "24 de Junho de 2026",
      target: "Concluir 15 dias sem quebrar",
      currentProgress: 65,
      maxProgress: 100,
      color: "from-purple-900/40 to-pink-500/20 border-pink-550/30 text-pink-300",
      joinedCount: 29
    },
    {
      id: "no-3",
      type: "campaign",
      tag: "🪷 Oração Coletiva",
      title: "Meta Coletiva de Daimoku da Comunidade",
      description: "Correntes de oração unificada pelo bem-estar e harmonia de todos os membros de nossa comunidade. Nosso objetivo coletivo nesta campanha é consagrarmos 500 horas integradas de oração de força!",
      deadline: "15 de Julho de 2026",
      target: "500 Horas Totais de Daimoku",
      currentProgress: 395,
      maxProgress: 500,
      color: "from-sky-900/30 to-indigo-900/20 border-sky-500/30 text-sky-300",
      joinedCount: 68
    },
    {
      id: "no-4",
      type: "study",
      tag: "📚 Estudo BSGI",
      title: "Campanha de Estudos Brasil Seikyo: Matéria de Junho",
      description: "Leitura orientada do editorial do mestre do mês de Junho sobre o tema 'Polir as engrenagens ocultas de sua vitória'. Discutiremos em nossos grupos de Bate-Papo os principais trechos para fortalecer a mente de guerreiro.",
      deadline: "28 de Junho de 2026",
      target: "Leitura de 3 Editoriais e Estudos Chave",
      currentProgress: 2,
      maxProgress: 3,
      color: "from-emerald-900/35 to-teal-900/10 border-emerald-500/30 text-emerald-300",
      joinedCount: 17
    }
  ]);

  const [simulatedParticipation, setSimulatedParticipation] = useState<Record<string, boolean>>({});

  const handleToggleParticipation = (id: string) => {
    setSimulatedParticipation(prev => {
      const isRegistered = !!prev[id];
      setNotices(items =>
        items.map(n => {
          if (n.id === id) {
            return {
              ...n,
              joinedCount: (n.joinedCount || 0) + (isRegistered ? -1 : 1)
            };
          }
          return n;
        })
      );
      return {
        ...prev,
        [id]: !isRegistered
      };
    });
  };

  return (
    <div className="space-y-6" id="community-bulletin-announcements">
      {/* BRAND BAR */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#161D32]/30 p-6 rounded-2xl border border-slate-850 shadow-lg flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg animate-bounce">
          <Megaphone className="w-6 h-6 text-indigo-300" />
        </div>
        <div>
          <span className="bg-[#1D223B] text-indigo-300 text-[10px] uppercase font-bold tracking-widest font-mono py-0.5 px-3.5 border border-indigo-900/30 rounded-full">
            📋 Mural Público de Avisos
          </span>
          <h2 className="text-xl font-bold font-heading text-slate-100 mt-2">Comunicados e Campanhas Coletivas</h2>
          <p className="text-xs text-slate-450 leading-relaxed mt-0.5">
            Acompanhe comunicados oficiais, campanhas temáticas e metas conjuntas para sintonizar sua prática com todos os Bodhishapers da comunidade.
          </p>
        </div>
      </div>

      {/* ANNOUNCEMENT BLOCKED LIST DISPLAY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="notices-panel-grid">
        {notices.map((notice) => {
          const hasJoined = simulatedParticipation[notice.id];
          const progressPercentage = notice.maxProgress
            ? Math.floor((notice.currentProgress || 0) * 100 / notice.maxProgress)
            : 0;

          return (
            <div
              key={notice.id}
              className={`bg-gradient-to-br ${notice.color} p-5.5 rounded-2xl border flex flex-col justify-between hover:scale-[1.005] duration-300 transition-all shadow-md`}
              id={`bulletin-${notice.id}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="bg-slate-950/65 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider font-mono rounded-full border border-slate-850">
                    {notice.tag}
                  </span>
                  
                  {notice.deadline && (
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 bg-slate-950/20 px-2 py-0.5 rounded-md text-right">
                      <Calendar className="w-3 h-3 text-slate-450 shrink-0" />
                      Até {notice.deadline}
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-left">
                  <h3 className="text-base font-black font-heading text-slate-100">{notice.title}</h3>
                  <p className="text-xs text-slate-350 leading-relaxed font-normal whitespace-pre-line bg-slate-955/35 p-3 rounded-xl border border-slate-850">
                    {notice.description}
                  </p>
                </div>

                <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850 space-y-2">
                  <span className="text-[9px] font-bold text-slate-450 uppercase block font-heading">Meta Coletiva / Alvo Real:</span>
                  <p className="text-xs text-slate-200 font-semibold">{notice.target}</p>

                  {/* Progress Indicator */}
                  {notice.maxProgress && (
                    <div className="space-y-1.5 pt-1.5">
                      <div className="flex justify-between text-[9px] font-mono text-slate-400">
                        <span>Progresso Geral dos Membros</span>
                        <span className="font-bold text-indigo-400">{notice.currentProgress}/{notice.maxProgress} ({progressPercentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-950/60 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-sky-400 via-indigo-500 to-amber-500 h-full transition-all duration-300"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Interactions Join Button Block */}
              <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-850 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span className="text-[11px] font-semibold">{notice.joinedCount} membros participando</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleParticipation(notice.id)}
                  className={`text-[10px] font-semibold py-1.5 px-4 rounded-lg flex items-center gap-1 border transition-all ${
                    hasJoined
                      ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-400 font-mono"
                      : "bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-950/80 hover:text-white"
                  }`}
                >
                  {hasJoined ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Participando!
                    </>
                  ) : (
                    <>
                      Quero Participar <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MOTIVATIONAL WATERMARK BANNER */}
      <div className="bg-slate-900/40 p-4.5 rounded-2xl border border-slate-850 flex items-start gap-3.5 text-xs text-slate-450 leading-relaxed font-normal">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-300">Como as Campanhas e Desafios são calculados?</p>
          <p>
            Os pontos e os tempos de Daimoku ou Gongyo de cada participante inscrito em um desafio são de fato integrados no andamento acumulado de forma coletiva. Cada minuto de Daimoku, cada Gongyo e cada atividade registrada fortalecem sua jornada e contribuem para o crescimento coletivo da comunidade.
          </p>
        </div>
      </div>
    </div>
  );
}
