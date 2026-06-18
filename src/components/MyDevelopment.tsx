import React, { useState, useEffect } from "react";
import { 
  BookOpen, Compass, Calendar, Award, Sparkles, AlertCircle, Plus, Trash2, 
  CheckCircle2, Flame, UserCheck, ShieldCheck, HeartPulse, HelpCircle, 
  CheckSquare, Square, TrendingUp, Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, Activity } from "../types";

interface MyDevelopmentProps {
  currentUser: User | null;
  activities: Activity[];
}

export interface ReadingItem {
  id: string;
  title: string;
  type: "livro" | "artigo" | "estudo" | "impresso";
  date: string;
}

export interface LectureItem {
  id: string;
  title: string;
  date: string;
}

export interface GroupParticipation {
  id: string;
  activityName: string;
  date: string;
}

export default function MyDevelopment({ currentUser, activities }: MyDevelopmentProps) {
  const currentUserId = currentUser?.id || "fallback";

  // --- 1. LOCAL PERSIDERED STATE ---
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [trilhaCompleted, setTrilhaCompleted] = useState<Record<string, boolean>>({});
  const [readings, setReadings] = useState<ReadingItem[]>([]);
  const [lectures, setLectures] = useState<LectureItem[]>([]);
  const [groupParticipations, setGroupParticipations] = useState<GroupParticipation[]>([]);

  // Modals / Form States
  const [showReadingForm, setShowReadingForm] = useState(false);
  const [newReadingTitle, setNewReadingTitle] = useState("");
  const [newReadingType, setNewReadingType] = useState<"livro" | "artigo" | "estudo" | "impresso">("livro");

  const [showLectureForm, setShowLectureForm] = useState(false);
  const [newLectureTitle, setNewLectureTitle] = useState("");

  const [showGroupParticipationForm, setShowGroupParticipationForm] = useState(false);
  const [newGroupActName, setNewGroupActName] = useState("");

  // --- 2. HYDRATION / SYNCHRONIZATION ---
  useEffect(() => {
    if (currentUser) {
      // Group Selector
      let initialGroup = currentUser?.horizontalGroup || "";
      if (currentUser?.horizontalGroup && currentUser?.localGroup) {
        initialGroup = `🪷 ${currentUser.horizontalGroup} (${currentUser.localGroup})`;
      } else if (currentUser?.horizontalGroup) {
        initialGroup = `🪷 ${currentUser.horizontalGroup}`;
      }
      const savedGroup = localStorage.getItem(`soka_group_${currentUserId}`);
      setSelectedGroup(savedGroup || initialGroup || "");

      // Trilha Soka Checklist
      const savedTrilha = localStorage.getItem(`soka_trilha_${currentUserId}`);
      setTrilhaCompleted(savedTrilha ? JSON.parse(savedTrilha) : {});

      // Readings List
      const savedReadings = localStorage.getItem(`soka_readings_${currentUserId}`);
      if (savedReadings) {
        setReadings(JSON.parse(savedReadings));
      } else {
        const defaults: ReadingItem[] = [];
        setReadings(defaults);
        localStorage.setItem(`soka_readings_${currentUserId}`, JSON.stringify(defaults));
      }

      // Lectures List
      const savedLectures = localStorage.getItem(`soka_lectures_${currentUserId}`);
      if (savedLectures) {
        setLectures(JSON.parse(savedLectures));
      } else {
        const defaults: LectureItem[] = [];
        setLectures(defaults);
        localStorage.setItem(`soka_lectures_${currentUserId}`, JSON.stringify(defaults));
      }

      // Group Participations
      const savedGroupPart = localStorage.getItem(`soka_grouppart_${currentUserId}`);
      if (savedGroupPart) {
        setGroupParticipations(JSON.parse(savedGroupPart));
      } else {
        const defaults: GroupParticipation[] = [];
        setGroupParticipations(defaults);
        localStorage.setItem(`soka_grouppart_${currentUserId}`, JSON.stringify(defaults));
      }
    }
  }, [currentUserId]);

  // --- 3. PERSISTERS TRIGGERS ---
  const saveTrilha = (updated: Record<string, boolean>) => {
    setTrilhaCompleted(updated);
    localStorage.setItem(`soka_trilha_${currentUserId}`, JSON.stringify(updated));
  };

  const handleToggleTrilha = (id: string) => {
    const updated = { ...trilhaCompleted, [id]: !trilhaCompleted[id] };
    saveTrilha(updated);
  };

  const handleSelectGroup = (g: string) => {
    setSelectedGroup(g);
    localStorage.setItem(`soka_group_${currentUserId}`, g);
  };

  const handleAddReading = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReadingTitle.trim()) return;

    const newItem: ReadingItem = {
      id: "rd-" + Math.random().toString(36).substring(2, 9),
      title: newReadingTitle.trim(),
      type: newReadingType,
      date: new Date().toISOString().split("T")[0]
    };

    const updated = [newItem, ...readings];
    setReadings(updated);
    localStorage.setItem(`soka_readings_${currentUserId}`, JSON.stringify(updated));
    setNewReadingTitle("");
    setShowReadingForm(false);
  };

  const handleDeleteReading = (id: string) => {
    const updated = readings.filter(r => r.id !== id);
    setReadings(updated);
    localStorage.setItem(`soka_readings_${currentUserId}`, JSON.stringify(updated));
  };

  const handleAddLecture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLectureTitle.trim()) return;

    const newItem: LectureItem = {
      id: "lec-" + Math.random().toString(36).substring(2, 9),
      title: newLectureTitle.trim(),
      date: new Date().toISOString().split("T")[0]
    };

    const updated = [newItem, ...lectures];
    setLectures(updated);
    localStorage.setItem(`soka_lectures_${currentUserId}`, JSON.stringify(updated));
    setNewLectureTitle("");
    setShowLectureForm(false);
  };

  const handleDeleteLecture = (id: string) => {
    const updated = lectures.filter(l => l.id !== id);
    setLectures(updated);
    localStorage.setItem(`soka_lectures_${currentUserId}`, JSON.stringify(updated));
  };

  const handleAddGroupParticipation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupActName.trim()) return;

    const newItem: GroupParticipation = {
      id: "gp-" + Math.random().toString(36).substring(2, 9),
      activityName: newGroupActName.trim(),
      date: new Date().toISOString().split("T")[0]
    };

    const updated = [newItem, ...groupParticipations];
    setGroupParticipations(updated);
    localStorage.setItem(`soka_grouppart_${currentUserId}`, JSON.stringify(updated));
    setNewGroupActName("");
    setShowGroupParticipationForm(false);
  };

  const handleDeleteGroupParticipation = (id: string) => {
    const updated = groupParticipations.filter(g => g.id !== id);
    setGroupParticipations(updated);
    localStorage.setItem(`soka_grouppart_${currentUserId}`, JSON.stringify(updated));
  };

  // --- 4. PREDEFINED CONSTANTS ---
  const trilhaItems = [
    { id: "trilha-1", title: "Participar da Reunião de Palestra do Bloco/Distrito", desc: "Principal pilar comunitário." },
    { id: "trilha-2", title: "Incentivar ou Telefonar para um companheiro de luta", desc: "Fomentar laços calorosos de revolução." },
    { id: "trilha-3", title: "Daimoku Consagrado de Determinação", desc: "Pelo menos 15 minutos focados em uma meta clara." },
    { id: "trilha-4", title: "Ler matéria do Brasil Seikyo ou Terceira Civilização", desc: "Estudo orientador para fortalecer a mente." },
    { id: "trilha-5", title: "Apoiar Atividade ou Logística Organizacional", desc: "Dedicação sincera nos bastidores (Sokahan, Gajokai, Kotekitai, etc.)." }
  ];

  // Group Definitions By Division
  const groupsByDivision = {
    JS: [
      { id: "taiyo", name: "🎼 Taiyo Ongakutai", desc: "Banda musical de instrumentos de sopro e percussão masculina." },
      { id: "sokahan", name: "🛡️ Sokahan", desc: "Grupo de apoio à organização, segurança externa e eventos." },
      { id: "gajokai", name: "🏢 Gajokai", desc: "Grupo de preservação do centro cultural, segurança e acolhimento." },
      { id: "myoon", name: "🎤 Myo-On", desc: "Sonorização, iluminação, filmagem e suporte de multimídia." },
      { id: "ohrin", name: "🚐 Ohrin", desc: "Equipe soka de transporte e logística terrestre segura." },
      { id: "arcoiris", name: "🌈 Arco-Íris", desc: "Comunicação, tradução técnica de palestras e interpretação." },
      { id: "kotekitai", name: "🎺 Nova Era Kotekitai", desc: "Banda feminina de pífanos (flautas) e tambores." },
      { id: "taiga", name: "💃 Taiga", desc: "Grupo de dança artística da juventude feminina jovem." },
      { id: "rubi", name: "💎 Rubi", desc: "Recepção, cuidado de salas de oração e suporte litúrgico." },
      { id: "mamorukai", name: "🛡️ Mamorukai DF", desc: "Proteção espiritual de reuniões, oração pelas viagens dos membros." }
    ],
    DF: [
      { id: "fukuchi", name: "🪷 Fukuchi", desc: "Grupo oficial de dança artística da Divisão Feminina." },
      { id: "taiyo_df", name: "🍽️ Taiyo DF", desc: "Preparo alegre de refeições e recepção de delegações." },
      { id: "mamorukai_df", name: "🛡️ Mamorukai DF", desc: "Oração firme de bastidores corporativa." },
      { id: "rubi_df", name: "💎 Rubi DF", desc: "Recepção de grandes eventos e arranjos litúrgicos." }
    ],
    DS: [
      { id: "ohjohkai", name: "🛡️ Ohjohkai", desc: "Grupo de apoio masculino sênior em segurança e solidez." }
    ],
    ALL: [
      { id: "coral", name: "🎶 Coral Soka", desc: "Vozes unidas cantando hinos e canções comemorativas." }
    ]
  };

  // Determine which groups to show
  const currentDivision = currentUser?.division || "JS";

  // Format user custom group info as a group item
  let customGroupItem = null;
  if (currentUser?.horizontalGroup) {
    const hasMatch = [
      ...(groupsByDivision[currentDivision] || []),
      ...groupsByDivision.ALL
    ].some(g => g.name.toLowerCase().includes(currentUser.horizontalGroup!.toLowerCase()) || currentUser.horizontalGroup!.toLowerCase().includes(g.name.toLowerCase()));

    if (!hasMatch) {
      customGroupItem = {
        id: "custom-group-soka",
        name: `🪷 ${currentUser.horizontalGroup}`,
        desc: currentUser.localGroup 
          ? `Grupo Soka unificado nacionalmente. Nome da sua localidade: ${currentUser.localGroup}` 
          : "Grupo Horizontal cadastrado pessoalmente no seu perfil."
      };
    }
  }

  const eligibleGroups = [
    ...(groupsByDivision[currentDivision] || []),
    ...groupsByDivision.ALL,
    ...(customGroupItem ? [customGroupItem] : [])
  ];

  // --- 5. CALCULATE STATS & COMPARISONS (MO-M) ---
  const today = new Date();
  const currentMonthNum = today.getMonth(); // 0-11
  const currentYearNum = today.getFullYear();

  const getMonthAndYear = (dateStr: string) => {
    const d = new Date(dateStr);
    return { month: d.getMonth(), year: d.getFullYear() };
  };

  // Readings Stats
  const readingsThisMonth = readings.filter(r => {
    const info = getMonthAndYear(r.date);
    return info.month === currentMonthNum && info.year === currentYearNum;
  }).length;

  const readingsLastMonth = readings.filter(r => {
    const info = getMonthAndYear(r.date);
    const targetMonth = currentMonthNum === 0 ? 11 : currentMonthNum - 1;
    const targetYear = currentMonthNum === 0 ? currentYearNum - 1 : currentYearNum;
    return info.month === targetMonth && info.year === targetYear;
  }).length;

  // Lectures Stats
  const lecturesThisMonth = lectures.filter(l => {
    const info = getMonthAndYear(l.date);
    return info.month === currentMonthNum && info.year === currentYearNum;
  }).length;

  const lecturesLastMonth = lectures.filter(l => {
    const info = getMonthAndYear(l.date);
    const targetMonth = currentMonthNum === 0 ? 11 : currentMonthNum - 1;
    const targetYear = currentMonthNum === 0 ? currentYearNum - 1 : currentYearNum;
    return info.month === targetMonth && info.year === targetYear;
  }).length;

  // Group Stats
  const groupThisMonth = groupParticipations.filter(g => {
    const info = getMonthAndYear(g.date);
    return info.month === currentMonthNum && info.year === currentYearNum;
  }).length;

  const groupLastMonth = groupParticipations.filter(g => {
    const info = getMonthAndYear(g.date);
    const targetMonth = currentMonthNum === 0 ? 11 : currentMonthNum - 1;
    const targetYear = currentMonthNum === 0 ? currentYearNum - 1 : currentYearNum;
    return info.month === targetMonth && info.year === targetYear;
  }).length;

  // Trilha Stats
  const completedTrilhaCount = Object.values(trilhaCompleted).filter(Boolean).length;
  const totalTrilhaCount = trilhaItems.length;

  // Gongyo and Daimoku states from Activities Props
  const userActivities = activities.filter(a => a.userId === currentUserId);
  const totalDaimokuMinutes = userActivities
    .filter(a => a.type === "daimoku")
    .reduce((sum, a) => sum + (a.minutes || 0), 0);
  const totalGongyoCount = userActivities
    .filter(a => a.type === "gongyo_morning" || a.type === "gongyo_evening")
    .length;
  const totalExercisesCount = userActivities
    .filter(a => a.type === "exercise")
    .length;

  // --- 6. INTELLIGENT AI SYSTEM ENGINE ---
  const generateWeeklyAndIntelligentSummary = () => {
    const hoursDaimoku = Number((totalDaimokuMinutes / 60).toFixed(1));
    const strongPoints: string[] = [];
    const opportunities: string[] = [];
    const name = currentUser?.displayName || currentUser?.name?.split(" ")[0] || "Bodhishaper";

    if (totalGongyoCount >= 4) strongPoints.push("constância no Gongyo");
    if (hoursDaimoku >= 1.5) strongPoints.push("firmeza espiritual no Daimoku");
    if (totalExercisesCount >= 3) strongPoints.push("compromisso com sua saúde física (workouts)");
    if (readingsThisMonth >= 2) strongPoints.push("sede saudável por estudos Soka");
    if (lecturesThisMonth >= 1 || groupThisMonth >= 1) strongPoints.push("participação ativa nas dinâmicas coletivas como Bodhishaper");

    if (totalExercisesCount < 2) opportunities.push("adicionar pelo menos mais um dia de exercícios físicos para continuar suando o karma");
    if (hoursDaimoku < 1) opportunities.push("ampliar as orações de Daimoku para fortalecer as metas");
    if (readingsThisMonth === 0) opportunities.push("reservar 10 minutinhos semanais para ler uma matéria soka");
    if (completedTrilhaCount < 3) opportunities.push("dedicar-se a mais alguns hábitos da Trilha Soka");

    const feedbackText = strongPoints.length > 0 
      ? `Nesta semana você somou ${totalGongyoCount} Gongyos completos, ${hoursDaimoku}h de Daimoku e ${totalExercisesCount} atividades físicas de equilíbrio. Parabéns, ${name}! Você está evoluindo como uma verdadeira Bodhishaper! Seu maior ponto forte foi ${strongPoints.slice(0, 2).join(" e ")}. Seu próximo desafio é ${opportunities[0] || "manter esse ritmo extraordinário de expansão de limites! Suando o Karma, Conquistando Vitórias!"}`
      : `Olá, ${name}! Você manteve a prática viva, demonstrando que mesmo em dias difíceis a persistência de um Bodhi gera nobres transformações. Continue cuidando do Gongyo e Daimoku diário, sua evolução mental e física ocorre a cada passo sincero. Os Bodhis estão construindo grandes causas!`;

    // AI developmental highlights and indicators
    const devHighlights = [
      readingsThisMonth > readingsLastMonth 
        ? "📚 Você aumentou sua frequência de estudos este mês. Excelente trabalho, Bodhishaper!" 
        : readingsThisMonth > 0 
          ? "📚 Seu ritmo de estudos está consistente. Um verdadeiro farol de sabedoria!"
          : "📚 Pequenas leituras geram grandes saltos na autoconfiança de vida de qualquer Bodhi.",
      lecturesThisMonth > lecturesLastMonth
        ? "🎤 Sua participação em palestras e reuniões de fomento foi maior do que no período anterior. Os Bodhis estão inspirando a comunidade!"
        : lecturesThisMonth > 0 
          ? "🎤 A audição e absorção das experiências de vitória nutre a sabedoria humana dos Bodhishapers."
          : "🎤 Participar das palestras amplia conexões fraternas e eleva seu estado de vida, Bodhishaper.",
      groupThisMonth > 0 
        ? "🤝 Sua presença ativa no grupo horizontal demonstra nobre responsabilidade e desenvolvimento humano de um verdadeiro Bodhishaper."
        : "🤝 Conectar-se ao seu grupo horizontal ajuda a expandir propósitos coletivos em nossa comunidade.",
      "🌟 Pequenas melhorias diárias geram gigantescas transformações na mente e no corpo dos Bodhishapers."
    ];

    // Suggestions of AI
    const suggestions = opportunitesText(hoursDaimoku, totalExercisesCount, readingsThisMonth, groupThisMonth, name);

    return { feedbackText, devHighlights, suggestions };
  };

  const opportunitesText = (hours: number, ex: number, rd: number, gp: number, name: string) => {
    if (hours >= 2 && ex >= 3 && rd >= 2) {
      return `🌟 ${name}, seu equilíbrio de Bodhishaper entre prática budista, saúde robusta e sede de estudo intelectual está em patamar majestoso! Continue liderando com seu próprio exemplo de revolução. Suando o Karma, Conquistando Vitórias!`;
    }
    if (hours >= 1 && ex >= 2 && rd === 0) {
      return "📚 Você tem mantido excelente ritmo de práticas e exercícios físicos diários. Que tal ler hoje mesmo um pequeno trecho ou artigo soka para robustecer a sabedoria teológica, Bodhishaper?";
    }
    if (gp === 0 && userActivities.length > 5) {
      return "🤝 Faz algum tempo desde seu último registro de participação horizontal de fomento. Talvez as próximas reuniões sejam o canal perfeito para reencontrar os companheiros Bodhis e recarregar o ânimo!";
    }
    return "💡 Para essa semana, que tal harmonizar? Defina uma pequena meta equilibrada de 15 minutos adicionais de Daimoku e um dia extra focado em exercícios cardiorrespiratórios. Mais uma conquista para os Bodhis!";
  };

  const { feedbackText, devHighlights, suggestions } = generateWeeklyAndIntelligentSummary();

  // --- 7. HUMAN REVOLUTION BALANCE CORES (🪷, 💪, 📚, 🤝) ---
  // Each category maps to a weight of 100 max
  const balanceScores = {
    pratica: Math.min(100, Math.round((totalDaimokuMinutes / 300) * 50 + (totalGongyoCount / 10) * 50)),
    saude: Math.min(100, Math.round((totalExercisesCount / 8) * 100)),
    estudo: Math.min(100, Math.round((completedTrilhaCount / 5) * 40 + (readingsThisMonth / 4) * 60)),
    participacao: Math.min(100, Math.round((lecturesThisMonth / 2) * 50 + (groupThisMonth / 2) * 50))
  };

  // --- 8. DEVELOPMENTAL MILESTONES (TROPHIES & BADGES AUTO-CALCULATED) ---
  const milestones = [
    { id: "ms-1", title: "Caminho Soka Iniciado", desc: "Marcar o primeiro item da Trilha Soka de desenvolvimento.", unlocked: completedTrilhaCount > 0 },
    { id: "ms-2", title: "Sede de Conhecimento", desc: "Completar a primeira leitura ou artigo acadêmico.", unlocked: readings.length > 0 },
    { id: "ms-3", title: "Voz Ativa no Fomento", desc: "Registrar a primeira participação de palestra.", unlocked: lectures.length > 0 },
    { id: "ms-4", title: "Identidade Soka", desc: "Declarar e vincular seu Grupo Soka Horizontal na área privada.", unlocked: !!selectedGroup },
    { id: "ms-5", title: "Mestre das Palestras x10", desc: "Somar mais de 10 palestras registradas no histórico.", unlocked: lectures.length >= 10 },
    { id: "ms-6", title: "Vanguarda Humana x25", desc: "Registrar mais de 25 engajamentos em eventos consolidadores.", unlocked: lectures.length + groupParticipations.length >= 25 }
  ];

  return (
    <div className="space-y-6" id="my-development-container">
      {/* 1. Header Card with Title and Privacy Info */}
      <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-indigo-600/20 text-indigo-300 text-[10px] font-bold font-mono px-3 py-1 rounded-full uppercase tracking-wider border border-indigo-500/10">
                🔒 Espaço Exclusivo de Autoconhecimento
              </span>
              <span className="bg-rose-500/20 text-rose-300 text-[9px] font-bold font-mono px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                Blindado
              </span>
              <span className="bg-slate-800 text-slate-400 text-[9px] font-bold font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">
                🚫 Não gera pontos públicos
              </span>
            </div>
            <h2 className="text-2xl font-black font-heading text-slate-100 flex items-center gap-2">
              📚 Meu Desenvolvimento Humano
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Seu refúgio privado para monitorar de forma pacífica o seu crescimento integral, leituras, estudos e palestras. Aqui, a evolução é 100% pessoal e livre da mecânica de pontuação do ranking principal.
            </p>
          </div>
          
          <div className="bg-slate-950/60 rounded-2xl p-3 border border-indigo-950/40 shrink-0 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block font-mono">Constância Soka</span>
            <span className="text-xl font-bold text-amber-400 font-mono flex items-center gap-1.5 justify-center mt-1">
              <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
              {currentUser?.streak || 1} Dias Ativo
            </span>
          </div>
        </div>
      </div>

      {/* 2. THE CHAT-LIKE CODES IA DEVELOPMENT COACH WITH DYNAMIC RESPONSIVE COMMENTARY */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/85 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-2 right-2 scale-90 opacity-20">
          <Sparkles className="w-20 h-20 text-indigo-400 animate-pulse" />
        </div>
        <div className="flex gap-4 items-start relative z-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-xl font-bold shadow-md shrink-0">
            🤖
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF85A1] font-mono">
                IA Bodhisattva • Análise de Evolução Soka
              </p>
              <h3 className="text-sm font-bold text-slate-200 mt-0.5">Resumo de Aprendizagem Semanal</h3>
            </div>
            
            <p className="text-xs text-slate-350 leading-relaxed italic bg-slate-950/40 p-4 rounded-xl border border-slate-850/60 font-medium">
              "{feedbackText}"
            </p>

            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block font-mono">Destaques Comportamentais do Mês</span>
              <ul className="space-y-1 text-xs text-slate-300">
                {devHighlights.map((hl, idx) => (
                  <motion.li 
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-2 pl-1.5 py-0.5 border-l-2 border-indigo-500/40 bg-indigo-500/5 rounded-md"
                  >
                    <span>{hl}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 3. RADAR EQUILIBRIO DE REVOLUÇÃO HUMANA - BAR GRAPH CHART PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Equilíbrio Revolução Humana */}
        <div className="md:col-span-2 bg-slate-900/50 rounded-2xl border border-slate-805 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-extrabold text-slate-100 font-heading">
                ❤️ Equilíbrio da Revolução Humana
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Visualização de como você distribui sua energia diária de desenvolvimento.</p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/20">
              Integrado
            </span>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span className="font-heading flex items-center gap-1.5 font-bold"><span className="text-rose-400">🪷</span> Prática Espiritual (Daimoku & Gongyo)</span>
                <span className="font-mono">{balanceScores.pratica}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${balanceScores.pratica}%` }} 
                  className="bg-gradient-to-r from-rose-500 to-pink-500 h-full"
                ></motion.div>
              </div>
              <p className="text-[9px] text-slate-500 font-mono mt-1">Soma de Gongyos diários e minutos acumulados de Daimoku espiritual.</p>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span className="font-heading flex items-center gap-1.5 font-bold"><span className="text-emerald-400">💪</span> Saúde & Templo Físico (Exercícios)</span>
                <span className="font-mono">{balanceScores.saude}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${balanceScores.saude}%` }} 
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full"
                ></motion.div>
              </div>
              <p className="text-[9px] text-slate-500 font-mono mt-1">Garantia de vigor, flexibilidade e liberação de hormônios benéficos de foco.</p>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span className="font-heading flex items-center gap-1.5 font-bold"><span className="text-amber-400">📚</span> Estudo e Cultura (Trilha & Leituras)</span>
                <span className="font-mono">{balanceScores.estudo}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${balanceScores.estudo}%` }} 
                  className="bg-gradient-to-r from-amber-400 to-orange-500 h-full"
                ></motion.div>
              </div>
              <p className="text-[9px] text-slate-500 font-mono mt-1">Estudo ativo e consolidação da trilha ética diária de revolução humana.</p>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span className="font-heading flex items-center gap-1.5 font-bold"><span className="text-sky-400">🤝</span> Participação & Comunidade (Palestras & Grupos)</span>
                <span className="font-mono">{balanceScores.participacao}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${balanceScores.participacao}%` }} 
                  className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full"
                ></motion.div>
              </div>
              <p className="text-[9px] text-slate-500 font-mono mt-1">Sua inserção, suporte voluntário e calor humano irradiados aos pares.</p>
            </div>
          </div>
        </div>

        {/* Suggestions of AI Box */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-805 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-full text-[9px] font-bold font-mono uppercase tracking-wide">
                🎯 Sugestão Inteligente IA
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-100 font-heading">Recomendação Construtiva</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-normal mt-3 italic bg-slate-950/40 p-4 rounded-xl border border-slate-850">
              "{suggestions}"
            </p>
          </div>
          
          <div className="border-t border-slate-800/80 pt-3 text-[10px] text-slate-500 italic mt-4 flex items-center gap-1.5 justify-center leading-none">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            Metas de evolução sem julgamento ou cobrança.
          </div>
        </div>
      </div>

      {/* 4. TRILHA SOKA: HABITS CHECKBOX SYSTEM */}
      <div className="bg-slate-900/55 rounded-2xl border border-slate-800/80 p-6 shadow-md" id="trilha-soka-habits-panel">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-100 font-heading flex items-center gap-2">
              📖 Trilha Soka Diária
            </h4>
            <p className="text-[10px] text-slate-400 mt-1">Marque suas virtudes concluídas na atual semana e expanda seu caráter.</p>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-400">
            {completedTrilhaCount} / {totalTrilhaCount} Concluído ({Math.round(completedTrilhaCount/totalTrilhaCount*100)}%)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trilhaItems.map((item) => {
            const isDone = !!trilhaCompleted[item.id];
            return (
              <button
                key={item.id}
                onClick={() => handleToggleTrilha(item.id)}
                type="button"
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                  isDone 
                    ? "bg-indigo-950/20 border-indigo-500/30 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]" 
                    : "bg-slate-950/30 border-slate-850 hover:border-slate-805 hover:bg-slate-950/50"
                }`}
              >
                <div className="pt-0.5 shrink-0">
                  {isDone ? (
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <div>
                  <p className={`text-xs font-bold leading-normal ${isDone ? "text-indigo-200 line-through opacity-80" : "text-slate-200"}`}>
                    {item.title}
                  </p>
                  <p className="text-[9px] text-slate-500 font-normal mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. LEITURAS E PALESTRAS SECTION: MANAGERS OF STUDIES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LEITURAS REALIZADAS DICTIONARY */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-805 p-6 shadow flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-100 font-heading flex items-center gap-2">
                  📚 Leituras Realizadas
                </h4>
                <p className="text-[10px] text-slate-400">Registros de livros, artigos, jornais ou boletins soka lidos.</p>
              </div>
              <button
                onClick={() => setShowReadingForm(!showReadingForm)}
                className="bg-indigo-600/15 hover:bg-indigo-600/30 text-indigo-300 font-bold text-[10px] px-2.5 py-1 rounded-lg border border-indigo-500/25 transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Registrar Leituras
              </button>
            </div>

            {/* Quick Add Form pop-up */}
            <AnimatePresence>
              {showReadingForm && (
                <motion.form 
                  onSubmit={handleAddReading}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-slate-955/65 p-4 rounded-xl border border-slate-850 space-y-3 overflow-hidden text-xs"
                >
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Título do Material:</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Brasil Seikyo - Edição 2640"
                      value={newReadingTitle}
                      onChange={(e) => setNewReadingTitle(e.target.value)}
                      className="w-full text-xs bg-slate-900 border border-slate-800 text-slate-100 rounded-lg p-2 outline-none focus:border-indigo-650"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Tipo de Conteúdo:</label>
                    <select
                      value={newReadingType}
                      onChange={(e) => setNewReadingType(e.target.value as any)}
                      className="w-full text-xs bg-slate-900 border border-slate-800 text-slate-200 rounded-lg p-2 outline-none"
                    >
                      <option value="livro">📖 Livro Completo</option>
                      <option value="artigo">📰 Artigo / Editorial</option>
                      <option value="estudo">📚 Material de Estudo (Exame)</option>
                      <option value="impresso">✉️ Boletim Impresso Soka</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowReadingForm(false)}
                      className="text-slate-400 hover:text-slate-200 px-3 py-1.5 font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-lg"
                    >
                      Salvar Leitura
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Readings list & annual counts indicators */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-850/60 text-center">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 font-mono block">No Mês Atual</span>
                <span className="text-base font-black text-indigo-300 font-mono mt-0.5">{readingsThisMonth} lidos</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 font-mono block">Mês Anterior</span>
                <span className="text-base font-black text-slate-400 font-mono mt-0.5">{readingsLastMonth} lidos</span>
              </div>
            </div>

            {/* List items block */}
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {readings.length === 0 ? (
                <p className="text-center text-slate-600 text-xs py-4">Nenhum livro ou artigo registrado ainda.</p>
              ) : (
                readings.map((r) => (
                  <div key={r.id} className="flex items-center justify-between bg-slate-950/30 p-2.5 rounded-lg border border-slate-850">
                    <div className="flex items-center gap-2 max-w-[80%]">
                      <span className="text-[14px]">
                        {r.type === "livro" ? "📖" : r.type === "impresso" ? "✉️" : "📰"}
                      </span>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-200 truncate">{r.title}</p>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">Registrado em {r.date}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteReading(r.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition"
                      title="Excluir registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-850 text-center text-[9px] text-slate-500 font-mono leading-relaxed">
            Total histórico: {readings.length} material(is) estudado(s) • Evolução anual contínua.
          </div>
        </div>

        {/* PALESTRAS PARTICIPADAS DICTIONARY */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-805 p-6 shadow flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-100 font-heading flex items-center gap-2">
                  🎤 Palestras Participadas
                </h4>
                <p className="text-[10px] text-slate-400">Presença em reuniões de palestra e eventos intelectuais.</p>
              </div>
              <button
                onClick={() => setShowLectureForm(!showLectureForm)}
                className="bg-indigo-600/15 hover:bg-indigo-600/30 text-indigo-300 font-bold text-[10px] px-2.5 py-1 rounded-lg border border-indigo-500/25 transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Registrar Palestra
              </button>
            </div>

            {/* Quick Add Form pop-up */}
            <AnimatePresence>
              {showLectureForm && (
                <motion.form 
                  onSubmit={handleAddLecture}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-slate-955/65 p-4 rounded-xl border border-slate-850 space-y-3 overflow-hidden text-xs"
                >
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Título da Palestra / Reunião:</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Reunião de Palestra Extraordinária de Junho"
                      value={newLectureTitle}
                      onChange={(e) => setNewLectureTitle(e.target.value)}
                      className="w-full text-xs bg-slate-900 border border-slate-800 text-slate-100 rounded-lg p-2 outline-none focus:border-indigo-650"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowLectureForm(false)}
                      className="text-slate-400 hover:text-slate-200 px-3 py-1.5 font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-lg"
                    >
                      Salvar Palestra
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Lectures list & annual counts indicators */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-850/60 text-center">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 font-mono block">Neste Mês</span>
                <span className="text-base font-black text-indigo-300 font-mono mt-0.5">{lecturesThisMonth} palestra(s)</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 font-mono block">Mês Anterior</span>
                <span className="text-base font-black text-slate-400 font-mono mt-0.5">{lecturesLastMonth} palestra(s)</span>
              </div>
            </div>

            {/* List items block */}
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {lectures.length === 0 ? (
                <p className="text-center text-slate-600 text-xs py-4">Nenhuma palestra registrada ainda.</p>
              ) : (
                lectures.map((l) => (
                  <div key={l.id} className="flex items-center justify-between bg-slate-950/30 p-2.5 rounded-lg border border-slate-850">
                    <div className="flex items-center gap-2 max-w-[80%]">
                      <span className="text-[14px]">🎤</span>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-200 truncate">{l.title}</p>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">Registrado em {l.date}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteLecture(l.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition"
                      title="Excluir palestra"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-850 text-center text-[9px] text-slate-500 font-mono leading-relaxed">
            Estimula a presença continuada e a expansão de diálogos saudáveis em toda a nossa comunidade. Total: {lectures.length} palestra(s).
          </div>
        </div>

      </div>

      {/* 6. GRUPOS HORIZONTAIS: DECLARATION & STATISTICS PORTLET */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6" id="grupos-horizontais-panel">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h4 className="text-base font-black text-slate-100 font-heading flex items-center gap-2">
              🤝 Seu Grupo Soka Horizontal
            </h4>
            <p className="text-xs text-slate-450 mt-1 max-w-xl">
              Os grupos horizontais realizam apoio técnico, voluntário ou artístico à Soka Gakkai. Vincule o seu para abrir o canal privado de estatísticas locais e registro de reuniões.
            </p>
          </div>

          {/* Group Selector Field */}
          <div className="shrink-0">
            <select
              value={selectedGroup}
              onChange={(e) => handleSelectGroup(e.target.value)}
              className="bg-slate-950 border border-slate-805 text-indigo-350 font-bold text-xs p-2.5 rounded-xl outline-none focus:border-indigo-600 transition"
            >
              <option value="">-- Selecione seu Grupo --</option>
              {eligibleGroups.map((group) => (
                <option key={group.id} value={group.name}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Group Metadata Show */}
        {selectedGroup ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            {/* Left col: banner group card */}
            <div className="bg-slate-950/45 p-5 rounded-2xl border border-slate-850 flex flex-col justify-between space-y-4">
              <div>
                <span className="bg-emerald-900/20 text-emerald-350 text-[9px] font-bold font-mono py-0.5 px-2.5 rounded-full uppercase border border-emerald-900/20">
                  ⚡ Membro Vinculado
                </span>
                <h5 className="text-sm font-black text-slate-200 font-heading mt-2">{selectedGroup}</h5>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1">
                  {eligibleGroups.find(g => g.name === selectedGroup)?.desc || "Engajamento voluntário coletivo nos bastidores."}
                </p>
              </div>

              <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-850/60">
                <span className="text-[9px] uppercase font-bold text-slate-500 font-mono block">Status Atual</span>
                <span className="text-xs font-bold text-slate-300 mt-0.5 block flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400" /> Presença Constante
                </span>
              </div>
            </div>

            {/* Mid col: Register participations tracker */}
            <div className="bg-slate-950/45 p-5 rounded-2xl border border-slate-850 flex flex-col justify-between space-y-4 col-span-2">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 font-heading">Histórico de Atividades no Grupo</span>
                  <button
                    onClick={() => setShowGroupParticipationForm(!showGroupParticipationForm)}
                    type="button"
                    className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-[10px] px-2 py-1 rounded"
                  >
                    + Logar Evento / Ensaio
                  </button>
                </div>

                {/* Event Form */}
                <AnimatePresence>
                  {showGroupParticipationForm && (
                    <motion.form 
                      onSubmit={handleAddGroupParticipation}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-3 overflow-hidden text-xs"
                    >
                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Nome do Encontro / Atuação:</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Ensaio Geral da Banda ou Escala de Apoio no Evento"
                          value={newGroupActName}
                          onChange={(e) => setNewGroupActName(e.target.value)}
                          className="w-full text-xs bg-slate-950 border border-slate-800 text-slate-100 rounded-lg p-2 outline-none focus:border-indigo-650"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowGroupParticipationForm(false)}
                          className="text-slate-400 text-[10px]"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="bg-indigo-650 text-white font-bold text-[10px] px-2.5 py-1 rounded"
                        >
                          Logar
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Comparison items bar */}
                <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-850/50 text-center">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 font-mono block">Neste Mês</span>
                    <span className="text-sm font-black text-indigo-300 font-mono mt-0.5">{groupThisMonth} atuação(ões)</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 font-mono block">Mês Anterior</span>
                    <span className="text-sm font-black text-slate-450 font-mono mt-0.5">{groupLastMonth} atuação(ões)</span>
                  </div>
                </div>

                {/* Mini list */}
                <div className="space-y-2 max-h-[110px] overflow-y-auto pr-1">
                  {groupParticipations.length === 0 ? (
                    <p className="text-center text-slate-600 text-xs py-2">Nenhum evento do grupo registrado.</p>
                  ) : (
                    groupParticipations.map((g) => (
                      <div key={g.id} className="flex items-center justify-between bg-slate-900/30 p-2 rounded-lg border border-slate-850/65">
                        <div className="flex items-center gap-2 max-w-[85%] truncate">
                          <span className="text-slate-400">🛡️</span>
                          <div className="truncate">
                            <p className="text-[11px] font-semibold text-slate-200 truncate">{g.activityName}</p>
                            <p className="text-[9.5px] text-slate-500 font-mono mt-0.5">Registrado em {g.date}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteGroupParticipation(g.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition"
                          title="Excluir atuação"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-850 text-center text-xs text-slate-500">
            🔒 Selecione o seu grupo horizontal no seletor acima para acompanhar seu engajamento mensal e histórico voluntário.
          </div>
        )}
      </div>

      {/* 7. MARCOS DE DESENVOLVIMENTO: CHRONOLOGICAL TIMELINE PORTS */}
      <div className="bg-slate-900/65 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4" id="desenvolvimento-marcos-timeline">
        <div>
          <h4 className="text-sm font-black text-slate-100 font-heading flex items-center gap-2">
            🏆 Marcos de Desenvolvimento
          </h4>
          <p className="text-xs text-slate-450 mt-1">Conquistas alcançadas automaticamente pelo seu compromisso com a revolução humana.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {milestones.map((ms) => (
            <div 
              key={ms.id} 
              className={`p-3.5 rounded-xl border flex gap-3 cursor-default transition-all ${
                ms.unlocked 
                  ? "bg-indigo-950/20 border-indigo-500/30 shadow-[0_4px_12px_rgba(79,70,229,0.1)]" 
                  : "bg-slate-950/20 border-slate-850 opacity-55 hover:opacity-75"
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                ms.unlocked ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse" : "bg-slate-900 text-slate-600 border border-slate-800"
              }`}>
                {ms.unlocked ? (
                  <Award className="w-5 h-5 text-amber-400" />
                ) : (
                  <span className="text-xs font-mono">🔒</span>
                )}
              </div>
              <div className="leading-tight">
                <p className={`text-xs font-bold ${ms.unlocked ? "text-indigo-200" : "text-slate-400"}`}>
                  {ms.title}
                </p>
                <p className="text-[9.5px] text-slate-500 font-normal mt-1 leading-normal">
                  {ms.desc}
                </p>
                {ms.unlocked && (
                  <span className="text-[8.5px] font-mono text-emerald-400 font-bold block mt-1.5">
                    ✓ Desbloqueado!
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
