import React from "react";
import { BookOpen, HelpCircle, Heart, Award, ArrowUpRight, BarChart2, CheckCircle2, History, Percent } from "lucide-react";
import { motion } from "motion/react";
import { User, KofuRecord, BsRecord } from "../types";

interface KofuAndImpressoProps {
  currentUser: User | null;
  kofu: KofuRecord | null;
  bs: BsRecord | null;
  users: User[];
  allKofu: KofuRecord[];
  allBs: BsRecord[];
  onUpdateKofuStatus: (status: "realizado" | "em_andamento" | "nao_realizado") => void;
  onUpdateBsStatus: (status: "ativo" | "pendente" | "nao_assinante", renewalDate?: string) => void;
  communityId?: string;
}

export default function KofuAndImpresso({
  currentUser,
  kofu,
  bs,
  users,
  allKofu,
  allBs,
  onUpdateKofuStatus,
  onUpdateBsStatus,
  communityId,
}: KofuAndImpressoProps) {
  const [redirectModal, setRedirectModal] = React.useState<{
    title: string;
    description: string;
    url: string;
    siteName: string;
  } | null>(null);

  const [localMembers, setLocalMembers] = React.useState<string[] | null>(null);

  React.useEffect(() => {
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

  const filteredUsers = localMembers 
    ? users.filter(u => localMembers.includes(u.id))
    : users;

  const filteredBs = localMembers
    ? allBs.filter(b => localMembers.includes(b.userId))
    : allBs;

  const filteredKofu = localMembers
    ? allKofu.filter(k => localMembers.includes(k.userId))
    : allKofu;
  
  // Calculate BS statistics in community
  const totalUsers = filteredUsers.length;
  const activeSubscribersCount = filteredBs.filter((b) => b.status === "ativo").length;
  const pendingCount = filteredBs.filter((b) => b.status === "pendente").length;
  const activePercentage = totalUsers > 0 ? Math.round((activeSubscribersCount / totalUsers) * 100) : 0;

  // Calculate Kofu statistics in community
  const totalKofusTracked = filteredKofu.length;
  const kofuRealizado = filteredKofu.filter((k) => k.status === "realizado").length;
  const kofuAndamento = filteredKofu.filter((k) => k.status === "em_andamento").length;

  const handleUpdateRenewalSimulation = () => {
    // Simulate updating renewal date
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const dateStr = futureDate.toISOString().split("T")[0];
    onUpdateBsStatus("ativo", dateStr);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="kofu-bs-container">
      {/* IMPRESSO BS SECTION */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 shadow-xl flex flex-col justify-between space-y-6" id="impresso-bs-card">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#1D2744] text-[#86AAFF] text-xs font-mono font-bold uppercase shrink-0">
              📖 Impresso
            </span>
            <h3 className="text-xl font-bold font-heading text-slate-100">
              Impresso
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Incentivo ao estudo continuado, renovação e leitura do Impresso. Fortalecer o conhecimento é pilar da revolução humana. <span className="font-semibold text-slate-300">Não gera pontos para o ranking, mas eleva o estado de vida!</span>
          </p>

          {/* User Status box */}
          {bs ? (
            <div className="p-4 rounded-xl border border-slate-850 bg-slate-950/40 relative overflow-hidden">
              <span className="absolute right-3 top-3 text-[10px] uppercase font-mono font-bold text-slate-500 font-sans">
                Seu Status
              </span>
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {bs.status === "ativo" ? "📰" : bs.status === "pendente" ? "⏳" : "❌"}
                </span>
                <div>
                  <h4 className="font-bold text-slate-200 text-sm font-heading">
                    {bs.status === "ativo"
                      ? "Assinante Ativo"
                      : bs.status === "pendente"
                      ? "Renovação Pendente"
                      : "Não Assinante"}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {bs.status === "ativo" && bs.renewalDate
                      ? `Próxima Renovação: ${bs.renewalDate.split("-").reverse().join("/")}`
                      : bs.status === "pendente"
                      ? "Assinatura próxima ao término do vencimento"
                      : "Aproveite para assinar e apoiar o movimento de paz e cultura"}
                  </p>
                </div>
              </div>

              {/* Specific encouragement warnings */}
              {bs.status === "nao_assinante" && (
                <div className="mt-3.5 pt-3.5 border-t border-slate-850 text-[11px] text-slate-400 italic">
                  "📖 Que tal fortalecer ainda mais seu desenvolvimento humano por meio da leitura do Impresso?"
                </div>
              )}

              {bs.status === "pendente" && (
                <div className="mt-3.5 pt-3.5 border-t border-slate-850 text-[11px] text-amber-400 font-semibold bg-amber-950/20 border border-amber-900/30 p-2 rounded-lg">
                  "📰 Sua assinatura está próxima da renovação."
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-slate-950 rounded-xl text-center text-xs text-slate-500 font-mono">
              Registros indisponíveis
            </div>
          )}

          {/* Call to action redirects button */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => setRedirectModal({
                title: "Assinar ou Renovar o Impresso",
                description: "Adquira ou renove sua assinatura impressa dos periódicos Brasil Seikyo de forma oficial e segura.",
                url: "https://www.brasilseikyo.com.br/",
                siteName: "Editora Brasil Seikyo"
              })}
              className="w-full py-3 bg-soka-blue hover:bg-indigo-900 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-center"
            >
              📖 Assinar ou Renovar Impresso <ArrowUpRight className="w-4 h-4" />
            </button>
            
            {/* Simulation button */}
            {bs && bs.status !== "ativo" ? (
              <button
                type="button"
                onClick={handleUpdateRenewalSimulation}
                className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] font-bold rounded-lg transition"
              >
                Simular Confirmação de Assinatura Ativa (Para testes)
              </button>
            ) : bs && (
              <button
                type="button"
                onClick={() => onUpdateBsStatus("pendente")}
                className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] font-bold rounded-lg transition"
              >
                Simular Assinatura Próxima ao Vencimento (Para testes)
              </button>
            )}
          </div>

          {/* BS Subscriber Medals */}
          <div className="pt-2">
            <h4 className="text-xs font-bold font-heading text-slate-500 mb-2.5 font-sans">Conquistas de Leitor</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Primeiro mês", icon: "🥉", desc: "Primeiro mês assinante", active: bs && bs.status === "ativo" },
                { label: "Seis meses", icon: "🥈", desc: "Seis meses assinado", active: bs && bs.status === "ativo" && (bs.currentStreakMonths || 0) >= 6 },
                { label: "Um ano", icon: "🥇", desc: "Um ano de leitura ativa", active: bs && bs.status === "ativo" && (bs.currentStreakMonths || 0) >= 12 },
                { label: "Assinante Constante", icon: "🏆", desc: "Leitor contínuo de valor", active: bs && bs.status === "ativo" },
              ].map((medal) => (
                <div
                  key={medal.label}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs transition ${
                    medal.active
                      ? "bg-amber-950/15 border-amber-900/30 text-amber-200"
                      : "bg-slate-950/30 border-slate-900 text-slate-500 opacity-60"
                  }`}
                >
                  <span className="text-lg">{medal.icon}</span>
                  <div>
                    <p className="font-bold font-heading text-[11px] leading-none">{medal.label}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">{medal.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Aggregate subscribers stats card footer */}
        <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 mt-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold font-heading text-slate-300 mb-2 font-sans">
            <BarChart2 className="w-4 h-4 text-slate-500" />
            <span>Postura Estatística Comunitária</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xl font-extrabold text-soka-blue font-mono">{activeSubscribersCount}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Leitores Ativos</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-soka-purple font-mono">{activePercentage}%</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Adesão Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* KOFU CAMPAIGNS SECTION */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 shadow-xl flex flex-col justify-between space-y-6" id="kofu-card">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-pink-950/30 text-pink-400 text-xs font-mono font-bold uppercase shrink-0">
              ❤️ Kofu
            </span>
            <h3 className="text-xl font-bold font-heading text-slate-100">
              Participação de Kofu
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Acompanhamento e fomento voluntário. <span className="font-semibold text-slate-300">Não gera pontos para o ranking, nunca fomenta competição e não exibe comparações entre participantes.</span> Apenas incentivo da pura sinceridade.
          </p>

          {/* Dynamic Campaign Box */}
          {(() => {
            const now = new Date();
            const transitionDate = new Date("2026-06-15T00:00:00");
            const isAfterTransition = now >= transitionDate;

            const activeCampaign = isAfterTransition ? {
              title: "Missão Kosen-rufu em Movimento 🏃‍♂️✨",
              period: "15 de junho a 30 de setembro",
              emoji: "🎯",
              slogan: "Cada determinação na caminhada polirá o brilhantismo do amanhã!",
              colorClass: "from-indigo-950/40 to-slate-900/40 border-indigo-500/10 text-indigo-300",
              badgeLabel: "Kosen-rufu Ativo",
              badgeColor: "text-indigo-400 bg-indigo-950/50 border-indigo-900/30",
              description: "Esta campanha estimula os membros a se engajarem no bem-estar comunitário, estabelecendo uma rede constante de saúde física inabalável, leituras inspiradoras e oração conjunta sincera."
            } : {
              title: "Campanha 3: Arraiá da Gratidão e da Vitória 🌽",
              period: "25 de março a 14 de junho",
              emoji: "🔥",
              slogan: "Em cada semente de sinceridade existe uma colheita de vitórias.",
              colorClass: "from-[#1E1915]/60 to-[#12100E]/40 border-amber-900/40 text-amber-200",
              badgeLabel: "Arraiá Ativo 2026",
              badgeColor: "text-amber-300 bg-amber-950/50 border-amber-900/30",
              description: "Assim como as festas juninas celebram união, alegria, esperança e abundância, esta campanha convida cada participante a fortalecer seu sentimento de confiança e determinação."
            };

            return (
              <div className={`bg-gradient-to-br ${activeCampaign.colorClass} border rounded-2xl p-4 relative shadow-inner`}>
                <span className={`absolute right-3 top-3 text-[9px] uppercase font-mono font-bold py-0.5 px-2 rounded-full border ${activeCampaign.badgeColor}`}>
                  {activeCampaign.badgeLabel}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-3xl animate-pulse">{activeCampaign.emoji}</span>
                  <div>
                    <h4 className="font-extrabold text-slate-200 text-sm font-heading">
                      {activeCampaign.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                      Período: {activeCampaign.period}
                    </p>
                  </div>
                </div>

                <div className="mt-3 text-slate-300 text-xs space-y-1.5 leading-relaxed">
                  <p className="font-medium italic text-indigo-300/90 text-[11px]">
                    "{activeCampaign.slogan}"
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    {activeCampaign.description}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* User participation selector */}
          {kofu ? (
            <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 space-y-3 relative">
              <span className="absolute right-3 top-3 text-[10px] uppercase font-mono font-bold text-slate-500 font-sans">
                Seu Status na Campanha
              </span>
              <p className="text-xs font-bold text-slate-300 font-heading">Como você está se preparando para esta rodada?</p>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "realizado", label: "✅ Realizado" },
                  { value: "em_andamento", label: "⏳ Em andamento" },
                  { value: "nao_realizado", label: "❌ Não realizado" },
                ].map((btn) => {
                  const isSelected = kofu.status === btn.value;
                  return (
                    <button
                      key={btn.value}
                      type="button"
                      onClick={() => onUpdateKofuStatus(btn.value as any)}
                      className={`py-2 px-1 text-center font-bold rounded-lg border text-[11px] transition-all capitalize ${
                        isSelected
                          ? "bg-[#1E253A] border-[#3F4D7B] text-white shadow-md font-sans"
                          : "bg-slate-950/40 hover:bg-slate-850 text-slate-400 border-slate-800"
                      }`}
                    >
                      {btn.label}
                    </button>
                  );
                })}
              </div>

            </div>
          ) : (
            <div className="p-3 bg-slate-950 rounded-xl text-center text-slate-500 text-xs font-mono">
              Registros indisponíveis
            </div>
          )}

          {/* official extra2 register link & account info */}
          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={() => setRedirectModal({
                title: "Portal de Contribuição de Kofu",
                description: "Acesse o portal de contribuição de Kofu oficial para consultar sua conta e realizar lançamentos de forma segura.",
                url: "https://extra2.bsgi.org.br/kofuv2/",
                siteName: "BSGI Portal Kofu"
              })}
              className="w-full py-3 bg-gradient-to-r from-pink-600 to-rose-650 hover:from-pink-700 hover:to-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 group border border-pink-500/25 cursor-pointer text-center"
            >
              ❤️ Consultar Conta & Efetuar Lançamento <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
            <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-850 space-y-1">
              <p className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">Como Contribuir:</p>
              <p className="text-[11px] text-slate-350 leading-relaxed">
                Acesse o link oficial do portal <span className="text-pink-400 font-semibold">Kofu V2</span> da BSGI para obter a chave Pix ou dados bancários corretos da conta e realizar o lançamento de seu comprovante de forma segura.
              </p>
            </div>
          </div>

          {/* Inspirational quotes carousel block */}
          <div className="bg-slate-950/20 rounded-xl p-3 border border-dashed border-slate-800 leading-relaxed text-[11px] text-slate-400 font-medium">
            <p className="font-bold text-[10px] text-slate-500 font-heading uppercase mb-1 font-sans">Causas sinceras & Benefícios:</p>
            {"🌻 Toda causa sincera floresce no tempo certo. A fogueira da determinação em nosso coração continua ardente, iluminando a vida das pessoas ao redor!"}
          </div>
        </div>

        {/* Aggregated totals footer */}
        <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 mt-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold font-heading text-slate-300 mb-2 font-sans">
            <Heart className="w-4 h-4 text-soka-pink animate-pulse" />
            <span>Participação Comunitária Consolidada</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xl font-extrabold text-soka-orange font-mono">{kofuRealizado}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Concluído</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-soka-purple font-mono">{kofuAndamento}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Agendado / Em andamento</p>
            </div>
          </div>
        </div>
      </div>

      {redirectModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#090b15] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative space-y-4 text-left"
          >
            <div className="flex items-center gap-3 border-b border-slate-850 pb-3">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 animate-pulse">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black font-heading text-slate-100 uppercase tracking-wider">
                  Redirecionamento Externo
                </h3>
                <p className="text-[10px] text-indigo-400 uppercase font-mono tracking-widest font-bold">
                  {redirectModal.siteName}
                </p>
              </div>
            </div>

            <div className="space-y-3 py-1">
              <p className="text-xs text-slate-350 leading-relaxed">
                Você será redirecionado para a plataforma oficial externa segura:
              </p>
              <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-850 font-mono text-[10px] text-fuchsia-300 break-all select-all select-text">
                {redirectModal.url}
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-950/30 p-3 rounded-xl border border-slate-900 italic">
                📌 <strong className="text-slate-300">Instrução amigável:</strong> Caso a página esteja temporariamente indisponível ou demore para carregar nas operadoras de rede, a mensagem padrão é: <br /> <strong className="text-amber-400 not-italic block mt-1">"Não foi possível acessar esta página no momento. Tente novamente mais tarde."</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setRedirectModal(null)}
                className="py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-400 font-bold text-xs rounded-xl border border-slate-850 transition text-center cursor-pointer"
              >
                Voltar
              </button>
              <a
                href={redirectModal.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setRedirectModal(null)}
                className="py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-lg border border-indigo-500/30 transition text-center flex items-center justify-center gap-1 cursor-pointer"
              >
                Acessar Portal <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
