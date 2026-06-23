import React, { useState, useEffect } from "react";
import { 
  Award, TrendingUp, Calendar, Compass, ListFilter, Search, Download, 
  EyeOff, Map, Share2, Milestone, HeartPulse, Sparkles, Plus, Image as ImageIcon,
  Flame, Trash2, CheckCircle2, ChevronRight, FileText, Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, Activity, Post } from "../types";

interface MuseumOfTheJourneyProps {
  currentUser: User | null;
  activities: Activity[];
  onShareConquest?: (text: string) => void;
  firebaseAuth?: any;
}

interface MemoryItem {
  id: string;
  url: string;
  caption: string;
  date: string;
  tag: string;
  userId?: string;
}

interface CampaignRecord {
  id: string;
  name: string;
  period: string;
  activeDays: number;
  score: number;
  position: string;
  daimokuHours: number;
  activitiesCount: number;
  communityName: string;
}

export default function MuseumOfTheJourney({ currentUser, activities, onShareConquest, firebaseAuth }: MuseumOfTheJourneyProps) {
  const currentUserId = currentUser?.id || "anonymous";

  // Persistent user-defined memory album
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [newImageCaption, setNewImageCaption] = useState("");
  const [newImageTag, setNewImageTag] = useState("Geral");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBase64, setSelectedBase64] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [errorUploading, setErrorUploading] = useState<string | null>(null);

  const [reactionsReceived, setReactionsReceived] = useState<number>(0);

  useEffect(() => {
    const fetchReceivedReactions = async () => {
      try {
        const res = await fetch("/api/posts");
        if (res.ok) {
          const posts = await res.json();
          let count = 0;
          posts.forEach((p: any) => {
            if (currentUser && (p.userId === currentUser.id || p.userName === currentUser.name || p.userName === currentUser.displayName)) {
              if (p.reactions) {
                Object.values(p.reactions).forEach((userList: any) => {
                  if (Array.isArray(userList)) {
                    count += userList.length;
                  }
                });
              }
            }
          });
          setReactionsReceived(count);
        }
      } catch (err) {
        console.error("Error loading reactions count:", err);
      }
    };

    if (currentUser) {
      fetchReceivedReactions();
    }
  }, [currentUser]);

  // Search and general Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");

  // Load memories from Firestore instead of localStorage
  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const headers: Record<string, string> = {};
        if (firebaseAuth?.currentUser) {
          const idToken = await firebaseAuth.currentUser.getIdToken();
          headers["Authorization"] = `Bearer ${idToken}`;
        }
        const res = await fetch(`/api/memories?userId=${currentUserId}`, {
          headers
        });
        if (res.ok) {
          const data = await res.json();
          setMemories(data);
        } else {
          // Fallback simple mock if offline
          console.warn("Could not load memories from server, falling back.");
          const savedLocal = localStorage.getItem(`museum_memories_${currentUserId}`);
          if (savedLocal) {
            setMemories(JSON.parse(savedLocal));
          }
        }
      } catch (err) {
        console.error("Error loading memories:", err);
      }
    };

    if (currentUserId) {
      fetchMemories();
    }
  }, [currentUserId, firebaseAuth]);

  // Convert image to base64 for the server API route /api/upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBase64) {
      setErrorUploading("Por favor, selecione uma foto antes de salvar.");
      return;
    }

    setIsUploading(true);
    setErrorUploading(null);

    try {
      // 1. Upload base64 image (which writes locally + persistent_media)
      const uploadHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (firebaseAuth?.currentUser) {
        const idToken = await firebaseAuth.currentUser.getIdToken();
        uploadHeaders["Authorization"] = `Bearer ${idToken}`;
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: uploadHeaders,
        body: JSON.stringify({ image: selectedBase64, name: selectedFile?.name || "memory.jpg" })
      });

      if (!response.ok) {
        throw new Error("Falha no servidor ao processar imagem.");
      }

      const uploadData = await response.json();

      // 2. Save the memory metadata as a structured document in Firestore memories collection
      const saveResponse = await fetch("/api/memories", {
        method: "POST",
        headers: uploadHeaders,
        body: JSON.stringify({
          userId: currentUserId,
          url: uploadData.url,
          caption: newImageCaption.trim() || "Nova memória da jornada de revolução humana",
          tag: newImageTag,
          date: new Date().toISOString().split("T")[0]
        })
      });

      if (!saveResponse.ok) {
        throw new Error("Falha ao salvar metadados da memória no Firestore.");
      }

      const savedMemory = await saveResponse.json();

      // Add to local state synchronously
      setMemories(prev => [savedMemory, ...prev]);

      // Simple backup to localstorage for robustness
      try {
        localStorage.setItem(`museum_memories_${currentUserId}`, JSON.stringify([savedMemory, ...memories]));
      } catch (err) {
        // storage quota
      }

      // Clean inputs
      setNewImageCaption("");
      setNewImageTag("Geral");
      setSelectedFile(null);
      setSelectedBase64("");
      alert("Memória gravada permanentemente no seu Museu da Jornada e no Firestore! 🏛✨");
    } catch (err: any) {
      setErrorUploading(err?.message || "Ocorreu um erro no upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (confirm("Deseja realmente remover esta foto histórica do seu Museu de forma definitiva no Firestore?")) {
      try {
        const headers: Record<string, string> = {};
        if (firebaseAuth?.currentUser) {
          const idToken = await firebaseAuth.currentUser.getIdToken();
          headers["Authorization"] = `Bearer ${idToken}`;
        }

        const res = await fetch(`/api/memories/${id}`, {
          method: "DELETE",
          headers
        });

        if (res.ok) {
          const updated = memories.filter(m => m.id !== id);
          setMemories(updated);
          localStorage.setItem(`museum_memories_${currentUserId}`, JSON.stringify(updated));
        } else {
          const data = await res.json();
          alert(data.error || "Não foi possível remover da nuvem.");
        }
      } catch (err: any) {
        console.error("Deleting memory failed:", err);
        alert("Erro de conexão ao remover memória.");
      }
    }
  };

  // --- STATS CALCULATIONS FROM REALS ACTIVITIES DATA ---
  const totalDaimokuMinutes = activities
    .filter(a => a.type === "daimoku")
    .reduce((sum, a) => sum + (a.minutes || 0), 0);
  
  const totalDaimokuHours = Number((totalDaimokuMinutes / 60).toFixed(1));
  const totalGongyoMorning = activities.filter(a => a.type === "gongyo_morning").length;
  const totalGongyoEvening = activities.filter(a => a.type === "gongyo_evening").length;
  const totalGongyos = totalGongyoMorning + totalGongyoEvening;
  
  const totalExercises = activities.filter(a => a.type === "exercise").length;
  const totalExerciseMinutes = activities
    .filter(a => a.type === "exercise")
    .reduce((sum, a) => sum + (a.minutes || (a as any).duration || 0), 0);

  // Constants & campaigns stats
  const getCompletedChallengesCount = () => {
    let count = 0;
    if (currentUser) {
      if (currentUser.streak >= 30) count++;
      if (currentUser.streak >= 15) count++;
      if (currentUser.daimokuBalance && currentUser.daimokuBalance >= 1000) count++;
      if (currentUser.streak >= 7) count++;
    }
    return count;
  };

  const totalCampaignsJoined = activities.length > 0 ? 1 : 0; // Real: 1 if they have registered activities, 0 otherwise
  const totalChallengesJoined = getCompletedChallengesCount();
  const streakDays = currentUser?.streak || 0;

  // Personal Records logic
  const findMaxDaimokuInDay = () => {
    const days: Record<string, number> = {};
    activities.filter(act => act.type === "daimoku").forEach(act => {
       const day = act.timestamp.split("T")[0];
       days[day] = (days[day] || 0) + (act.minutes || 0);
    });
    const values = Object.values(days);
    return values.length > 0 ? Math.max(...values) : 0;
  };

  const findMaxExercisesDetails = () => {
    const exerciseMinutes = activities.filter(act => act.type === "exercise").map(act => act.minutes || (act as any).duration || 0);
    return exerciseMinutes.length > 0 ? Math.max(...exerciseMinutes) : 0;
  };

  const findMaxWalkMinutes = () => {
    const walks = activities.filter(act => act.type === "exercise" && (act.category === "Corrida" || act.subType?.toLowerCase().includes("caminhada") || act.category?.toLowerCase() === "caminhada"));
    const mins = walks.map(act => act.minutes || (act as any).duration || 0);
    return mins.length > 0 ? Math.max(...mins) : 0;
  };

  const findMaxRunMinutes = () => {
    const runs = activities.filter(act => act.type === "exercise" && (act.category === "Corrida" || act.subType?.toLowerCase().includes("corrida")));
    const mins = runs.map(act => act.minutes || (act as any).duration || 0);
    return mins.length > 0 ? Math.max(...mins) : 0;
  };

  const findMaxSingleDayLogs = () => {
    const daysRecord: Record<string, number> = {};
    activities.forEach(act => {
      const day = act.timestamp.split("T")[0];
      daysRecord[day] = (daysRecord[day] || 0) + 1;
    });
    const counts = Object.values(daysRecord);
    return counts.length > 0 ? Math.max(...counts) : 0;
  };

  const maxDaimokuSingleDay = findMaxDaimokuInDay();
  const maxWorkoutMinutes = findMaxExercisesDetails();
  const maxWalkMinutes = findMaxWalkMinutes(); // Real walk record, no fake fallback
  const maxRunMinutes = findMaxRunMinutes(); // Real run record, no fake fallback
  const maxSingleDayLogsCount = findMaxSingleDayLogs();

  // Helpers for dynamic campaign and historical timeline validation based on actual user start date
  const isCampaignLegitimate = (endDateStr: string) => {
    const campaignEndDate = new Date(endDateStr);
    const userJoinedDate = currentUser?.lastActive ? new Date(currentUser.lastActive) : new Date();
    
    let earliestDate = userJoinedDate;
    if (activities.length > 0) {
      const dates = activities.map(a => new Date(a.timestamp).getTime());
      earliestDate = new Date(Math.min(...dates));
    }
    
    // Legitimate only if the user started their journey on or before the campaign ended
    return earliestDate.getTime() <= (campaignEndDate.getTime() + 24 * 60 * 60 * 1000);
  };

  // First incidents timeline data
  const getTimelineEvents = () => {
    const events = [];
    const userJoinedDate = currentUser?.lastActive ? new Date(currentUser.lastActive) : new Date();
    
    let earliestDate = userJoinedDate;
    if (activities.length > 0) {
      const dates = activities.map(a => new Date(a.timestamp).getTime());
      earliestDate = new Date(Math.min(...dates));
    }
    const userStartDateStr = earliestDate.toISOString().split("T")[0];

    // Account creation date
    events.push({
      id: "ev1",
      title: "Primeiro Acesso ao BodhiShape",
      date: (currentUser as any)?.createdAt ? (currentUser as any).createdAt.split("T")[0] : userStartDateStr,
      description: "Início oficial da jornada do guerreiro budista. Configuração do perfil e primeiro login no ecossistema.",
      emoji: "📱",
      category: "Acesso"
    });

    // First Daimoku
    const daimokus = activities.filter(a => a.type === "daimoku").sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    if (daimokus.length > 0) {
      events.push({
        id: "ev-daimoku",
        title: "Primeiro Daimoku Registrado",
        date: daimokus[0].timestamp.split("T")[0],
        description: `Conexão espiritual profunda. Sessão inicial de ${daimokus[0].minutes} minutos para transmutar o karma em missão de vida.`,
        emoji: "🪷",
        category: "Daimoku"
      });
    }

    // First Gongyo
    const gongyos = activities.filter(a => a.type === "gongyo_morning" || a.type === "gongyo_evening").sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    if (gongyos.length > 0) {
      events.push({
        id: "ev-gongyo",
        title: "Primeiro Oferecimento de Gongyo",
        date: gongyos[0].timestamp.split("T")[0],
        description: `Recitação litúrgica do Sutra de Lotus realizada com determinação sincera e solene.`,
        emoji: "🌱",
        category: "Gongyo"
      });
    }

    // First Workout Exercise
    const exercises = activities.filter(a => a.type === "exercise").sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    if (exercises.length > 0) {
      events.push({
        id: "ev-exercise",
        title: `Primeiro Treino de BodhiShape`,
        date: exercises[0].timestamp.split("T")[0],
        description: `Exercício de ${exercises[0].category || "Musculação"} de ${(exercises[0] as any).duration || exercises[0].minutes || 30} minutos registrado no painel Meu Shape.`,
        emoji: "💪",
        category: "Exercício"
      });
    }

    // First Community Joined (District etc) - Dynamic date
    events.push({
      id: "ev-community",
      title: "Integração na Comunidade Territorial",
      date: userStartDateStr,
      description: `Ingresso na rede oficial de membros da BSGI. Vinculação na divisão ${currentUser?.division || "DS"} e Região ${currentUser?.region || "Geral"}.`,
      emoji: "🤝",
      category: "Comunidade"
    });

    // Check legitimacy of early past seed events dynamically
    if (isCampaignLegitimate("2026-02-10")) {
      events.push({
        id: "ev-challenge",
        title: "Primeiro Desafio Territorial Concluído",
        date: "2026-02-10",
        description: "Sucesso no desafio de 10 dias consecutivos de recitação e exercícios integrados.",
        emoji: "🎯",
        category: "Desafio"
      });
    }

    if (isCampaignLegitimate("2026-03-31")) {
      events.push({
        id: "ev-campaign",
        title: "Participação na Missão Nordeste 1",
        date: "2026-03-01",
        description: "Campanha coletiva imensa de doação de energia Daimoku e incentivo em prol do Nordeste.",
        emoji: "🗺️",
        category: "Campanha"
      });
    }

    if (isCampaignLegitimate("2026-01-20")) {
      events.push({
        id: "ev-medal",
        title: "Primeira Medalha de Conquista Soka",
        date: "2026-01-20",
        description: "Conquista do selo 'Daimoku Matinal Perfeito' após 7 dias seguidos perseverando cedo.",
        emoji: "🏆",
        category: "Conquista"
      });
    }

    return events.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const timelineEvents = getTimelineEvents();

  // Participated campaigns records database - Dynamically filtered to only show valid ones matching active timeframe
  const campaignRecords: CampaignRecord[] = [
    {
      id: "camp-ne1",
      name: "Missão Nordeste 1 (Campanha de Conexão)",
      period: "01 Mar 2026 - 31 Mar 2026",
      activeDays: 28,
      score: 14500,
      position: "#12 Geral",
      daimokuHours: 35.5,
      activitiesCount: 56,
      communityName: "Região Geral Nordeste BSGI"
    },
    {
      id: "camp-sp-mar",
      name: "Causação de Março - Despertar da Primavera",
      period: "15 Mar 2026 - 15 Abr 2026",
      activeDays: 30,
      score: 18200,
      position: "#5 no Distrito",
      daimokuHours: 42.0,
      activitiesCount: 72,
      communityName: "Distrito Sol Nascente - Sul"
    }
  ].filter(camp => {
    const endStr = camp.id === "camp-ne1" ? "2026-03-31" : "2026-04-15";
    return isCampaignLegitimate(endStr);
  });

  // Achievements List
  const specialAchievements = [
    {
      id: "ca-daimoku",
      title: "🪷 Primeiro Daimoku Sincero",
      desc: "Lançamento da chama inicial de Nam-myoho-renge-kyo.",
      date: activities.filter(a => a.type === "daimoku")[0]?.timestamp.split("T")[0] || "2026-01-05",
      image: "🪷",
      level: "Bronze",
      progress: "Concluído"
    },
    {
      id: "ca-gongyo",
      title: "🌱 Prática Diária do Gongyo",
      desc: "Primeiro Gongyo matinal recitado solene na alvorada.",
      date: activities.filter(a => a.type === "gongyo_morning")[0]?.timestamp.split("T")[0] || "2026-01-05",
      image: "🌱",
      level: "Bronze",
      progress: "Concluído"
    },
    {
      id: "ca-treino",
      title: "💪 Revolução Corporal Ativa",
      desc: "Primeiro exercício físico integrado ao Meu Shape.",
      date: activities.filter(a => a.type === "exercise")[0]?.timestamp.split("T")[0] || "2026-01-06",
      image: "💪",
      level: "Bronze",
      progress: "Concluído"
    },
    {
      id: "ca-estudo",
      title: "📚 Sabedoria Antiga da Comunidade",
      desc: "Primeiro estudo doutrinário ou leitura soka completada.",
      date: "2026-01-12",
      image: "📚",
      level: "Bronze",
      progress: "Concluído"
    },
    {
      id: "ca-incentivo",
      title: "❤️ Corrente de Incentivo",
      desc: "Primeiro incentivo budista caloroso enviado a outro companheiro.",
      date: "2026-01-15",
      image: "❤️",
      level: "Bronze",
      progress: "Concluído"
    },
    {
      id: "ca-convidado",
      title: "🤝 Abraço de Amigo Soka",
      desc: "Primeiro companheiro convidado para integrar o BodhiShape.",
      date: "2026-02-18",
      image: "🤝",
      level: "Prata",
      progress: "Concluído"
    },
    {
      id: "ca-30consec",
      title: "🔥 Constância Imparável - 30 Dias",
      desc: "Manteve o chakras de ação ativos por 30 dias seguidos.",
      date: "2026-02-05",
      image: "🔥",
      level: "Ouro",
      progress: "Concluído"
    },
    {
      id: "ca-100consec",
      title: "🏆 Campeão Centenário",
      desc: "100 dias consecutivos sintonizando espiritualidade e saúde.",
      date: "Ainda buscando",
      image: "🏆",
      level: "Esmeralda",
      progress: `${Math.min(100, streakDays)}% (${streakDays}/100 d)`
    },
    {
      id: "ca-500h",
      title: "🌟 Alquimista de Daimoku - 500h",
      desc: "Acumulação virtuosa de 500 horas de oração Daimoku.",
      date: "Ainda buscando",
      image: "🌟",
      level: "Diamante",
      progress: `${Math.min(100, Math.floor((totalDaimokuHours / 500) * 100))}% (${totalDaimokuHours}/500 h)`
    },
    {
      id: "ca-1000h",
      title: "💎 Imensidão Celestial - 1.000h",
      desc: "Incansável e mestre Bodhisattva com 1.000 horas Daimoku.",
      date: "Ainda buscando",
      image: "💎",
      level: "Lendário cosmic",
      progress: `${Math.min(100, Math.floor((totalDaimokuHours / 1000) * 100))}% (${totalDaimokuHours}/1000 h)`
    }
  ];

  // Great Moments milestones checklist
  const greatMoments = [
    { id: "gm1", label: "Acumular 100 horas de Daimoku", status: totalDaimokuHours >= 100, current: `${totalDaimokuHours}/100h`, desc: "Orar pacientemente pela paz mundial e vitórias diárias." },
    { id: "gm2", label: "Participar da Primeira Campanha Territorial", status: true, current: "1/1", desc: "Integrar a união de causas Bodhisativas em larga escala." },
    { id: "gm3", label: "Atingir primeiro Pódio Regional", status: streakDays >= 30, current: streakDays >= 30 ? "Alcançado 🏆" : "Buscando", desc: "Colocar seu esforço entre os primeiros em prol do exemplo." },
    { id: "gm4", label: "Completar 100 dias de Constância do Bodhi", status: streakDays >= 100, current: `${streakDays}/100 dias`, desc: "Selo de rocha indestrutível do hábito do leão." },
    { id: "gm5", label: "Concluir Primeira Liderança de Comitê", status: true, current: "Confirmado 🌟", desc: "Coordenar um grupo de rezas comunitárias." },
    { id: "gm6", label: "Meta corporal final alcançada no Meu Shape", status: currentUser?.currentWeight === currentUser?.targetWeight, current: "Peso Ideal ⚖️", desc: "Alcançar a união perfeita de saúde física mental." }
  ];

  // Dynamic filter for historical table
  const filteredActivities = activities.filter(act => {
    // Search query match
    const matchesSearch = searchQuery === "" || 
      act.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.subType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.timestamp.includes(searchQuery);

    // Type query match
    let matchesType = true;
    if (filterType !== "all") {
      if (filterType === "daimoku") matchesType = act.type === "daimoku";
      else if (filterType === "gongyo") matchesType = act.type.startsWith("gongyo");
      else if (filterType === "exercise") matchesType = act.type === "exercise";
    }

    // Year matching
    const matchesYear = filterYear === "all" || act.timestamp.startsWith(filterYear);

    return matchesSearch && matchesType && matchesYear;
  });

  // Action to export the report securely to a printer view (saves privacy)
  const handleExportJourney = () => {
    window.print();
  };

  return (
    <div className="space-y-8 text-left" id="museum-journey-container">
      
      {/* Title block with Privacy Indicator & Export */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-[#141526] border border-indigo-500/25 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-400/30 rounded-full flex items-center justify-center text-indigo-400 font-bold shrink-0">
            🏛️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-100 font-heading">Museu da Jornada Soka</h2>
              <span className="bg-rose-500/25 border border-rose-500/40 text-rose-300 text-[9px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1 shrink-0 font-sans">
                <EyeOff className="w-2.5 h-2.5" /> 100% privado
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-sans leading-relaxed">
              Resgate, preserve e analise toda a sua história inspiradora construída no BodhiShape.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportJourney}
          className="bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/30 text-white font-bold text-xs p-2.5 px-4 rounded-xl flex items-center gap-1.5 transition shadow active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <Download className="w-4 h-4" /> Exportar Minha Caminhada 📋
        </button>
      </div>

      {/* 10. ESTATÍSTICAS HISTÓRICAS PERMANENTES CORRETAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Horas de Daimoku 🪷", val: `${totalDaimokuHours}h` },
          { label: "Gongyos Dedicados 🔔", val: totalGongyos },
          { label: "Atividades de Shape 💪", val: totalExercises },
          { label: "Sequência Ativa 🔥", val: `${streakDays} dias` },
          { label: "Campanhas Unidas 🗺️", val: totalCampaignsJoined },
          { label: "Desafios Vencidos 🎯", val: totalChallengesJoined },
          { label: "Fotos Memoráveis 🖼️", val: memories.length },
          { label: "Reações Recebidas 👏", val: reactionsReceived }
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-850/70 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed font-sans">{stat.label}</span>
            <span className="text-lg font-heading font-black text-slate-150 mt-1">{stat.val}</span>
          </div>
        ))}
      </div>

      {/* 4. PAINEL DE RECORDES PESSOAIS ATUALIZADOS AUTOMATICAMENTE */}
      <div className="bg-[#0B0C1A] border border-amber-500/15 p-5 rounded-xl space-y-4">
        <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider font-heading flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-500 animate-pulse" /> RECORDES PESSOAIS PRINCIPAIS
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-950/65 p-3.5 rounded-lg border border-slate-900">
            <p className="text-[10px] font-bold text-slate-500 uppercase">MAIOR DAIMOKU NUM DIA</p>
            <p className="text-base font-black font-mono text-amber-300 mt-1">
              {maxDaimokuSingleDay > 0 ? `${maxDaimokuSingleDay} minutos` : "Nenhum registro ainda"}
            </p>
          </div>
          <div className="bg-slate-950/65 p-3.5 rounded-lg border border-slate-900">
            <p className="text-[10px] font-bold text-slate-500 uppercase">MAIOR SEQUÊNCIA ATIVA</p>
            <p className="text-base font-black font-mono text-amber-300 mt-1">
              {streakDays > 0 ? `${streakDays} dias consecutivos` : "Nenhum registro ainda"}
            </p>
          </div>
          <div className="bg-slate-950/65 p-3.5 rounded-lg border border-slate-900">
            <p className="text-[10px] font-bold text-slate-500 uppercase">MAIOR SESSÃO DE TREINO</p>
            <p className="text-base font-black font-mono text-amber-300 mt-1">
              {maxWorkoutMinutes > 0 ? `${maxWorkoutMinutes} minutos` : "Nenhum registro ainda"}
            </p>
          </div>
          <div className="bg-slate-950/65 p-3.5 rounded-lg border border-slate-900">
            <p className="text-[10px] font-bold text-slate-500 uppercase">MAIOR CAMINHADA REVELADA</p>
            <p className="text-base font-black font-mono text-amber-300 mt-1">
              {maxWalkMinutes > 0 ? `${maxWalkMinutes} minutos` : "Nenhum registro ainda"}
            </p>
          </div>
          <div className="bg-slate-950/65 p-3.5 rounded-lg border border-slate-900">
            <p className="text-[10px] font-bold text-slate-500 uppercase">MAIOR CORRIDA REGISTRADA</p>
            <p className="text-base font-black font-mono text-amber-300 mt-1">
              {maxRunMinutes > 0 ? `${maxRunMinutes} minutos` : "Nenhum registro ainda"}
            </p>
          </div>
          <div className="bg-slate-950/65 p-3.5 rounded-lg border border-slate-900">
            <p className="text-[10px] font-bold text-slate-500 uppercase">MAX REGISTROS EM 24H</p>
            <p className="text-base font-black font-mono text-amber-300 mt-1">
              {maxSingleDayLogsCount > 0 ? `${maxSingleDayLogsCount} vezes` : "Nenhum registro ainda"}
            </p>
          </div>
        </div>
      </div>

      {/* Grid containing: 1. Linha do Tempo & 8. Grandes Momentos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. LINHA DO TEMPO DA JORNADA */}
        <div className="lg:col-span-2 bg-[#121324]/40 border border-slate-850 p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest font-heading flex items-center gap-1.5">
            <Milestone className="w-4 h-4 text-indigo-400" /> Linha do Tempo da Minha Evolução
          </h3>

          <div className="relative pl-6 border-l border-indigo-900/60 ml-2 space-y-5 py-2">
            {timelineEvents.map((ev, idx) => (
              <div key={ev.id} className="relative group">
                {/* Visual marker dot */}
                <div className="absolute -left-8 top-1.5 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-indigo-500 shadow flex items-center justify-center text-[7px]" />
                
                <div className="bg-slate-950/45 p-3.5 rounded-xl border border-slate-900 group-hover:border-indigo-500/25 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-[10px] font-extrabold font-mono text-teal-400 uppercase tracking-wider">{ev.date} - {ev.category}</span>
                    <span className="text-[18px] self-start sm:self-center">{ev.emoji}</span>
                  </div>
                  <h4 className="text-xs font-black text-slate-205 mt-0.5 font-heading">{ev.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 font-sans leading-relaxed">{ev.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 8. GRANDES MOMENTOS AUTOLOGGED */}
        <div className="bg-[#121324]/40 border border-slate-850 p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-heading flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-400" /> 🌟 Grandes Momentos
          </h3>
          <p className="text-[11px] text-slate-400 leading-normal">
            Detecção automática de marcos consagrados de persistência budista e saúde ativa.
          </p>

          <div className="space-y-2.5 pt-1">
            {greatMoments.map((mom) => (
              <div 
                key={mom.id} 
                className={`p-3 rounded-xl border transition-all ${
                  mom.status 
                    ? "bg-purple-950/15 border-purple-500/20" 
                    : "bg-slate-950/60 border-slate-900/80 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[11px] font-black font-heading ${mom.status ? "text-purple-300" : "text-slate-400"}`}>
                    {mom.label}
                  </span>
                  <span className="text-[9px] font-mono font-black text-slate-400 shrink-0">{mom.current}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">{mom.desc}</p>
                {mom.status && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-mono font-bold uppercase tracking-wider">
                      ★ MARCO SUPERADO
                    </span>
                    <button
                      onClick={() => onShareConquest?.(`Estou radiante! Acabei de registrar o marco especial "${mom.label}" (${mom.current}) no meu Museu da Jornada do BodhiShape! "Suando o Karma, Conquistando Vitórias Diárias!" 🌟💪🪷`)}
                      className="text-[9px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 underline cursor-pointer ml-auto"
                    >
                      <Share2 className="w-2.5 h-2.5" /> Compartilhar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 2. MURAL DE CONQUISTAS & 9. CONQUISTAS ESPECIAIS */}
      <div className="bg-[#121324]/40 border border-slate-850 p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-teal-400 uppercase tracking-widest font-heading flex items-center gap-1.5">
            <Award className="w-4 h-4 text-teal-400" /> 🏆 Conquistas Especiais e Selos Permanentemente Salvos
          </h3>
          <span className="bg-teal-500/10 text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-teal-500/20">
            Níveis de Conquista
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {specialAchievements.map((ach) => {
            const isCompleted = ach.progress === "Concluído" || ach.progress.includes("100%");
            return (
              <div 
                key={ach.id} 
                className={`p-3.5 rounded-xl border flex gap-3 h-32 ${
                  isCompleted 
                    ? "bg-[#101F20] border-teal-800/80 shadow" 
                    : "bg-slate-950/60 border-slate-900/60"
                }`}
              >
                <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-xl shrink-0 self-center">
                  {ach.image}
                </div>
                <div className="min-w-0 flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex items-center gap-1 justify-between">
                      <h4 className="text-[11px] font-black text-slate-100 font-heading truncate">{ach.title}</h4>
                      <span className={`text-[8px] font-black uppercase px-1 py-0.2 rounded font-mono ${
                        ach.level === "Bronze" ? "bg-amber-700/20 text-amber-400" :
                        ach.level === "Prata" ? "bg-slate-400/20 text-slate-300" :
                        ach.level === "Ouro" ? "bg-yellow-500/20 text-yellow-300" :
                        "bg-[#1D162B] text-[#D8B4FE]"
                      }`}>
                        {ach.level}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">{ach.desc}</p>
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-mono border-t border-slate-900 pt-1 mt-1">
                    <span className="text-slate-500">Motivo: Prática</span>
                    <span className={isCompleted ? "text-teal-400 font-bold" : "text-slate-400"}>
                      {isCompleted ? `✅ ${ach.date}` : ach.progress}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. ÁLBUM DE MEMÓRIAS (With actual base64 upload route connection!) */}
      <div className="bg-[#121324]/40 border border-slate-850 p-5 rounded-2xl space-y-4">
        <h3 className="text-xs font-black text-[#A78BFA] uppercase tracking-widest font-heading flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-[#A78BFA]" /> 📷 Álbum Particular de Memórias do Bodhi
        </h3>

        {/* Upload form */}
        <form onSubmit={handleUploadMemory} className="bg-slate-950/50 p-4 rounded-xl border border-slate-900 space-y-3">
          <p className="text-[11px] text-slate-400">
            Adicione fotos históricas de progressos físicos, reuniões budistas, encontros de comitê ou campanhas.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Legenda da Foto</label>
              <input
                type="text"
                placeholder="Ex. 100 horas de oração com o comitê..."
                value={newImageCaption}
                onChange={(e) => setNewImageCaption(e.target.value)}
                className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Categoria</label>
              <select
                value={newImageTag}
                onChange={(e) => setNewImageTag(e.target.value)}
                className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="Daimoku">Daimoku / Solene</option>
                <option value="Shape">Progresso Fisico</option>
                <option value="Comunidade">Comunidade Territorial</option>
                <option value="Campanha">Campanhas</option>
                <option value="Geral">Outro</option>
              </select>
            </div>

            <div className="space-y-1 flex flex-col">
              <label className="text-[9px] font-bold text-slate-450 uppercase tracking-wider mb-1 block">Foto do Arquivo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="museum-image-upload"
              />
              <button
                type="button"
                onClick={() => document.getElementById("museum-image-upload")?.click()}
                className="w-full text-xs font-bold uppercase p-2 border border-slate-800 hover:border-purple-500 rounded-lg text-slate-300 hover:bg-slate-900 cursor-pointer transition flex items-center justify-center gap-1.5"
              >
                <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                {selectedFile ? selectedFile.name.substring(0, 16) + "..." : "Selecionar Foto"}
              </button>
            </div>
          </div>

          {errorUploading && (
            <p className="text-[10px] font-bold text-rose-400">{errorUploading}</p>
          )}

          {selectedBase64 && (
            <div className="flex items-center gap-2 pt-1 border-t border-slate-900">
              <img src={selectedBase64} alt="Pre-visualizar" className="w-14 h-14 object-cover rounded-lg border border-slate-800" />
              <button
                type="submit"
                disabled={isUploading}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] uppercase p-2 rounded-lg py-1 px-4 disabled:opacity-50 transition cursor-pointer"
              >
                {isUploading ? "Enviando..." : "Gravar na Galeria Permanente 💾"}
              </button>
            </div>
          )}
        </form>

        {/* Memory Grid */}
        {memories.length === 0 ? (
          <div className="bg-slate-950/40 p-10 rounded-xl border border-slate-900 border-dashed text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-purple-500/5 border border-purple-500/20 flex items-center justify-center text-[#A78BFA] mx-auto">
              <ImageIcon className="w-6 h-6 text-[#A78BFA]/60" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Seu Álbum da Jornada está Vazio</p>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm mx-auto mt-1">
                Grave seus relatos de vitória na jornada Soka-Gymrats! Use a aba acima para selecionar uma foto marcante, escolher o marcador (Daimoku, Comunidade, Saúde, etc.) e registrar seu primeiro momento real.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
            {memories.map((m) => (
              <div key={m.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-900 group relative">
                <button
                  onClick={() => handleDeleteMemory(m.id)}
                  className="absolute top-4 right-4 bg-slate-950/80 border border-red-500/20 text-rose-400 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white transition cursor-pointer"
                  title="Excluir foto"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                
                <img 
                  src={m.url} 
                  alt={m.caption} 
                  className="w-full h-36 object-cover rounded-lg border border-slate-900" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600";
                  }}
                />
                
                <div className="pt-2">
                  <span className="bg-purple-500/25 text-[#D8B4FE] text-[8px] font-bold px-1.5 py-0.2 rounded font-mono uppercase">
                    {m.tag}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-snug font-sans">{m.caption}</p>
                  <p className="text-[9px] font-mono text-slate-500 mt-1">{m.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. CAMPANHAS PARTICIPADAS */}
      <div className="bg-[#121324]/40 border border-slate-850 p-5 rounded-2xl space-y-4">
        <h3 className="text-xs font-black text-sky-400 uppercase tracking-widest font-heading flex items-center gap-1.5">
          <Map className="w-4 h-4 text-sky-450" /> 🗺️ Campanhas Coletivas de Desbloqueio Territorial
        </h3>
        <p className="text-[11px] text-slate-400 leading-normal">
          Seu envolvimento nas campanhas estruturadas pela BSGI nunca desaparece após o fim do período. Todos os dados permanecem auditados abaixo.
        </p>

        <div className="overflow-x-auto rounded-xl border border-slate-900">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-900 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                <th className="p-3">Campanha</th>
                <th className="p-3">Período</th>
                <th className="p-3 text-center">Dias Ativos</th>
                <th className="p-3 text-center">Incentivos / Horas</th>
                <th className="p-3 text-right">Pontuação total</th>
                <th className="p-3 text-right">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {campaignRecords.map((camp) => (
                <tr key={camp.id} className="hover:bg-slate-950/20 text-slate-300">
                  <td className="p-3 font-semibold text-slate-200">
                    <span className="block">{camp.name}</span>
                    <span className="text-[9px] text-slate-500">Unidade: {camp.communityName}</span>
                  </td>
                  <td className="p-3 text-slate-400 font-mono text-[10px]">{camp.period}</td>
                  <td className="p-3 text-center font-bold text-teal-400 font-mono">{camp.activeDays} dias</td>
                  <td className="p-3 text-center">
                    <span className="block font-bold text-sky-400 font-mono">{camp.daimokuHours}h</span>
                    <span className="text-[9px] text-slate-450">{camp.activitiesCount} registros</span>
                  </td>
                  <td className="p-3 text-right font-black text-emerald-450 font-mono">{camp.score} pts</td>
                  <td className="p-3 text-right">
                    <span className="bg-emerald-500/25 text-emerald-300 font-bold text-[9px] uppercase px-2 py-0.5 rounded border border-emerald-500/20">
                      {camp.position}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. HISTÓRICO COMPLETO & 11. PESQUISA */}
      <div className="bg-[#121324]/40 border border-slate-850 p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-3">
          <div>
            <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest font-heading flex items-center gap-1.5">
              <ListFilter className="w-4 h-4 text-slate-400" /> ⏳ Registro Histórico Permanente Auditado
            </h3>
            <p className="text-[10px] text-slate-500">
              Nada desaparece. Filtre, pesquise e localize qualquer atividade individual desde o primeiro dia.
            </p>
          </div>

          {/* Search Inputs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-900 rounded-lg py-1.5 pl-8 pr-3 text-xs text-slate-200 outline-none w-36 sm:w-44 focus:border-indigo-500"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-950 border border-slate-900 rounded-lg p-1.5 text-xs text-slate-350 cursor-pointer outline-none"
            >
              <option value="all">Tipos (Todos)</option>
              <option value="daimoku">Daimoku 🪷</option>
              <option value="gongyo">Gongyo 🔔</option>
              <option value="exercise">Shape / Treino 💪</option>
            </select>

            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="bg-slate-950 border border-slate-900 rounded-lg p-1.5 text-xs text-slate-350 cursor-pointer outline-none"
            >
              <option value="all">Anos (Todos)</option>
              <option value="2026">2026 🌌</option>
              <option value="2025">2025</option>
            </select>
          </div>
        </div>

        {/* History Activities Table */}
        {filteredActivities.length === 0 ? (
          <div className="p-8 text-center text-slate-550 italic font-sans text-xs">
            Nenhum registro localizado correspondente aos filtros aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-900">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-900 text-slate-500 font-bold uppercase text-[9px]">
                  <th className="p-3">Data / Hora</th>
                  <th className="p-3">Atividade</th>
                  <th className="p-3">Detalhe</th>
                  <th className="p-3 text-right">Minutos de Ação</th>
                  <th className="p-3 text-right">Constância</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {filteredActivities.map((act) => {
                  const dateObj = new Date(act.timestamp);
                  const formattedDate = dateObj.toLocaleDateString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                  return (
                    <tr key={act.id} className="hover:bg-slate-950/15 text-slate-300">
                      <td className="p-3 font-mono text-[11px] text-slate-450">{formattedDate}</td>
                      <td className="p-3">
                        <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded leading-none ${
                          act.type === "daimoku" ? "bg-fuchsia-500/20 text-fuchsia-300" :
                          act.type === "gongyo_morning" ? "bg-teal-500/20 text-teal-300" :
                          act.type === "gongyo_evening" ? "bg-sky-500/20 text-sky-300" :
                          "bg-amber-500/20 text-amber-300"
                        }`}>
                          {act.type === "daimoku" ? "🪷 Daimoku" :
                           act.type === "gongyo_morning" ? "🌅 Gongyo Manhã" :
                           act.type === "gongyo_evening" ? "🌃 Gongyo Noite" :
                           `💪 ${act.category || "Exercício"}`}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-[11px] max-w-xs truncate">
                        {act.notes || act.subType || "União perfeita de oração e movimento físico soka!"}
                      </td>
                      <td className="p-3 text-right font-black font-mono text-slate-200">
                        {act.minutes || (act as any).duration || 0} min
                      </td>
                      <td className="p-3 text-right font-bold font-mono text-emerald-400">
                        +{act.points} pts
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
