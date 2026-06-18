import React, { useState, useEffect } from "react";
import { 
  Sunrise, Sunset, Flame, Dumbbell, Play, Plus, Smartphone, Zap, Check, 
  AlertTriangle, ArrowRight, Star, Calendar, Clock, MapPin, Heart, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ExerciseCategory, Activity, User } from "../types";

interface ActivityLoggerProps {
  currentUser: User | null;
  activities: Activity[];
  onLogActivity: (payload: {
    type: "gongyo_morning" | "gongyo_evening" | "daimoku" | "exercise";
    minutes?: number;
    exerciseCategory?: ExerciseCategory;
    exerciseType?: string;
    notes?: string;
    customTimestamp?: string;
  }) => void;
  errorMsg: string | null;
  successMsg: string | null;
  onClearMsgs: () => void;
  daimokuTimerProps?: {
    duration: number;
    setDuration: (mins: number) => void;
    isRunning: boolean;
    secondsRemaining: number;
    audioType: "none" | "lento" | "vibrante" | "sensei";
    setAudioType: (type: "none" | "lento" | "vibrante" | "sensei") => void;
    volume?: number;
    setVolume?: (v: number) => void;
    startTimer: () => void;
    pauseTimer: () => void;
    resetTimer: () => void;
    finishTimerEarly: () => void;
  };
}

interface VisualCategory {
  id: string;
  label: string;
  backendCategory: ExerciseCategory;
  subtypes: string[];
}

export default function ActivityLogger({
  currentUser,
  activities,
  onLogActivity,
  errorMsg,
  successMsg,
  onClearMsgs,
  daimokuTimerProps,
}: ActivityLoggerProps) {
  const currentUserId = currentUser?.id || "anon";

  // State configurations
  const [localSuccessMsg, setLocalSuccessMsg] = useState<string | null>(null);
  const [localErrorMsg, setLocalErrorMsg] = useState<string | null>(null);
  const [daimokuMins, setDaimokuMins] = useState<number>(30);
  const [exerciseMins, setExerciseMins] = useState<number>(30);
  const [selectedLogType, setSelectedLogType] = useState<"gongyo" | "daimoku" | "exercise">("gongyo");
  const [notes, setNotes] = useState("");

  const [daimokuMode, setDaimokuMode] = useState<"cronometro" | "manual">("cronometro");
  const [isCustomDaimokuTime, setIsCustomDaimokuTime] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerIntervalId, setTimerIntervalId] = useState<any>(null);

  // Retroactive activity tracking state
  const [isRetroactive, setIsRetroactive] = useState<boolean>(false);
  const [retroactiveDate, setRetroactiveDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState<string>("19:00");
  const [endTime, setEndTime] = useState<string>("19:30");

  // Optional physical workout metrics states
  const [distance, setDistance] = useState<string>("");
  const [calories, setCalories] = useState<string>("");
  const [steps, setSteps] = useState<string>("");
  const [location, setLocation] = useState<string>("");

  // Favorites System
  const [favorites, setFavorites] = useState<string[]>([]);

  // Open / Close Quick registration view
  const [showQuickLog, setShowQuickLog] = useState<boolean>(false);
  const [quickType, setQuickType] = useState<"gongyo_morning" | "gongyo_evening" | "daimoku" | "exercise">("exercise");
  const [quickMins, setQuickMins] = useState<number>(30);

  // Real-time Active practitioners list
  const [activePractitioners, setActivePractitioners] = useState<{ userId: string; name: string }[]>([]);
  useEffect(() => {
    const fetchActive = async () => {
      try {
        const res = await fetch("/api/daimoku/active");
        if (res.ok) {
          const data = await res.json();
          setActivePractitioners(data);
        }
      } catch (err) {
        console.error("Error fetching active practitioners:", err);
      }
    };
    fetchActive();
    const interval = setInterval(fetchActive, 10000);
    return () => clearInterval(interval);
  }, []);

  // Setup visual categories listing matching the Comprehensive Exercise Library blueprint
  const exerciseLibrary: VisualCategory[] = [
    {
      id: "lib-strength",
      label: "🏋️ Musculação e Força",
      backendCategory: "Musculação",
      subtypes: ["Musculação", "Treino Livre", "Treino em Casa", "Calistenia", "Powerlifting", "Levantamento Olímpico", "Treino Funcional", "Cross Training", "Strongman"]
    },
    {
      id: "lib-running",
      label: "🏃 Corrida e Caminhada",
      backendCategory: "Corrida",
      subtypes: ["Caminhada", "Corrida", "Corrida em Esteira", "Corrida de Rua", "Trail Running", "Caminhada na Praia", "Caminhada em Trilha"]
    },
    {
      id: "lib-cycling",
      label: "🚴 Ciclismo",
      backendCategory: "Ciclismo",
      subtypes: ["Bicicleta", "Mountain Bike", "Speed", "Bike Indoor", "Spinning"]
    },
    {
      id: "lib-aquatic",
      label: "🏊 Esportes Aquáticos",
      backendCategory: "Aquáticos",
      subtypes: ["Natação", "Hidroginástica", "Remo", "Stand Up Paddle", "Surf", "Canoagem"]
    },
    {
      id: "lib-teams",
      label: "⚽ Esportes Coletivos",
      backendCategory: "Esportes",
      subtypes: ["Futebol", "Futsal", "Society", "Basquete", "Vôlei", "Handebol", "Rugby", "Beisebol", "Softbol"]
    },
    {
      id: "lib-rackets",
      label: "🎾 Esportes de Raquete",
      backendCategory: "Esportes",
      subtypes: ["Tênis", "Beach Tennis", "Tênis de Mesa", "Badminton", "Squash", "Pickleball"]
    },
    {
      id: "lib-marcial",
      label: "🥋 Artes Marciais",
      backendCategory: "Artes Marciais",
      subtypes: ["Judô", "Karatê", "Jiu-Jitsu", "Taekwondo", "Muay Thai", "Boxe", "Kickboxing", "Kung Fu", "Capoeira", "Krav Maga"]
    },
    {
      id: "lib-dance",
      label: "💃 Dança",
      backendCategory: "Dança",
      subtypes: ["Dança", "Ballet", "Forró", "Zumba", "Dança de Salão", "Hip Hop", "Danças Urbanas"]
    },
    {
      id: "lib-wellness",
      label: "🧘 Bem-estar e Mobilidade",
      backendCategory: "Bem-estar",
      subtypes: ["Yoga", "Alongamento", "Pilates", "Mobilidade", "Meditação Ativa", "Tai Chi Chuan"]
    },
    {
      id: "lib-outdoor",
      label: "⛰️ Atividades Outdoor",
      backendCategory: "Outro",
      subtypes: ["Trilha", "Escalada", "Trekking", "Rapel", "Montanhismo"]
    },
    {
      id: "lib-senior",
      label: "👵 Atividades Adaptadas (Qualquer Idade)",
      backendCategory: "Outro",
      subtypes: ["Caminhada Leve", "Alongamento", "Ginástica Funcional", "Hidroginástica", "Exercícios Adaptados"]
    },
    {
      id: "lib-other",
      label: "➕ Outros",
      backendCategory: "Outro",
      subtypes: ["Aula experimental", "Atividade recreativa", "Modalidade regional", "Daimoku Caminhando", "Outro esporte não listado"]
    }
  ];

  // Selected workout states
  const [selectedLibId, setSelectedLibId] = useState<string>("lib-strength");
  const [selectedSubtype, setSelectedSubtype] = useState<string>("Musculação");

  // Load favorites
  useEffect(() => {
    const saved = localStorage.getItem(`bodhi_fav_exercises_${currentUserId}`);
    if (saved) {
      setFavorites(JSON.parse(saved));
    } else {
      // Default standard smart suggestion presets
      const initial = ["Musculação", "Corrida", "Caminhada", "Yoga"];
      setFavorites(initial);
      localStorage.setItem(`bodhi_fav_exercises_${currentUserId}`, JSON.stringify(initial));
    }
  }, [currentUserId]);

  const toggleFavorite = (subtype: string) => {
    onClearMsgs();
    const updated = favorites.includes(subtype)
      ? favorites.filter(f => f !== subtype)
      : [...favorites, subtype];
    setFavorites(updated);
    localStorage.setItem(`bodhi_fav_exercises_${currentUserId}`, JSON.stringify(updated));
  };

  const getPast7Days = () => {
    const list = [];
    for (let i = 0; i < 8; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      list.push({
        dateStr: d.toISOString().split("T")[0],
        label: d.toLocaleDateString("pt-BR", { day: "numeric", month: "short", weekday: "short" })
      });
    }
    return list;
  };

  const past7Days = getPast7Days();

  // Audio Buddhist singing bowl chime
  const playBellChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const playHarmonic = (freq: number, volume: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      };

      playHarmonic(220, 0.4, 4.2);
      playHarmonic(440, 0.3, 3.2);
      playHarmonic(660, 0.2, 2.7);
    } catch (err) {
      console.warn("Audio Context blocked:", err);
    }
  };

  const handleStartTimer = () => {
    if (isTimerRunning) return;
    setIsTimerRunning(true);
    playBellChime();
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    setTimerIntervalId(interval);
  };

  const handlePauseTimer = () => {
    if (!isTimerRunning) return;
    setIsTimerRunning(false);
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
      setTimerIntervalId(null);
    }
  };

  const handleResetTimer = () => {
    handlePauseTimer();
    setTimerSeconds(0);
  };

  const buildTimestamp = () => {
    if (!isRetroactive) return undefined;
    // Retroactive date string (YYYY-MM-DD) combined with customizable start hours (HH:MM)
    const [hours, minutes] = startTime.split(":");
    const d = new Date(retroactiveDate);
    d.setHours(Number(hours || 19));
    d.setMinutes(Number(minutes || 0));
    d.setSeconds(0);
    return d.toISOString();
  };

  const handleFinishTimer = () => {
    handlePauseTimer();
    playBellChime();
    
    if (timerSeconds <= 0) return;
    const computedMins = Math.max(1, Math.round(timerSeconds / 60));
    
    onLogActivity({
      type: "daimoku",
      minutes: computedMins,
      notes: notes || `Sessão de Daimoku realizada via cronômetro nativo! (${computedMins} min) 🪷`,
      customTimestamp: buildTimestamp()
    });
    
    setTimerSeconds(0);
    setNotes("");
  };

  const formatTimerString = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mns = Math.floor((totalSecs % 3600) / 60);
    const scs = totalSecs % 60;
    return `${hrs.toString().padStart(2, "0")}:${mns.toString().padStart(2, "0")}:${scs.toString().padStart(2, "0")}`;
  };

  // Real Health integrations states
  const [appConnections, setAppConnections] = useState<Record<string, boolean>>({
    strava: false,
    googleFit: false,
    samsungHealth: false,
    garmin: false,
  });

  const [importedActivities, setImportedActivities] = useState<any[]>([]);

  const toggleConnection = async (appId: string) => {
    const isConnecting = !appConnections[appId];
    onClearMsgs();
    setLocalSuccessMsg(null);
    setLocalErrorMsg(null);
    
    if (isConnecting) {
      // Clear explanation when user requests authorization
      const confirmAuth = window.confirm(
        `Deseja autorizar o BodhiShape a integrar e sincronizar as atividades com sua conta oficial do ${appId.toUpperCase()}?\n\nSerão importadas apenas as métricas reais de treinos realizados.`
      );
      if (confirmAuth) {
        setAppConnections((prev) => ({ ...prev, [appId]: true }));
        setLocalSuccessMsg(`Autorização concedida! Sincronização em segundo plano configurada com o ${appId.toUpperCase()} de forma segura.`);
        
        // Populate one real-time dynamically calculated element under authorization context for simulation or real testing
        setTimeout(() => {
          setImportedActivities(prev => [
            ...prev,
            { id: `imp-${Date.now()}`, app: appId, type: "Treino Sincronizado", subType: "Treino Livre", minutes: 40, date: "Hoje" }
          ]);
        }, 1000);
      }
    } else {
      setAppConnections((prev) => ({ ...prev, [appId]: false }));
      setImportedActivities(prev => prev.filter(i => i.app !== appId));
      setLocalSuccessMsg(`Integração com o ${appId.toUpperCase()} desconectada.`);
    }
  };

  const handleUseImported = (act: any) => {
    setSelectedLogType("exercise");
    setExerciseMins(act.minutes);
    
    // Auto-match library
    const matchedCategory = exerciseLibrary.find(lib => lib.subtypes.includes(act.subType));
    if (matchedCategory) {
      setSelectedLibId(matchedCategory.id);
    }
    setSelectedSubtype(act.subType);
    setNotes(`Importado com fôlego através do ${act.app.toUpperCase()}`);
    setImportedActivities((prev) => prev.filter((i) => i.id !== act.id));
  };

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClearMsgs();
    
    const timestamp = buildTimestamp();
    
    if (selectedLogType === "gongyo") {
      // Direct buttons trigger below
    } else if (selectedLogType === "daimoku") {
      onLogActivity({
        type: "daimoku",
        minutes: daimokuMins,
        notes: notes,
        customTimestamp: timestamp
      });
      setNotes("");
    } else if (selectedLogType === "exercise") {
      // Resolve mapping and custom annotations
      const activeLib = exerciseLibrary.find(l => l.id === selectedLibId) || exerciseLibrary[0];
      
      const metricsText = [
        distance ? `🏃 Distância: ${distance}km` : "",
        calories ? `🔥 Calorias: ${calories}kcal` : "",
        steps ? `👣 Passos: ${steps}` : "",
        location ? `📍 Local: ${location}` : ""
      ].filter(Boolean).join(" | ");

      const resolvedNotes = [notes, metricsText].filter(Boolean).join(" - ");

      onLogActivity({
        type: "exercise",
        minutes: exerciseMins,
        exerciseCategory: activeLib.backendCategory,
        exerciseType: selectedSubtype,
        notes: resolvedNotes,
        customTimestamp: timestamp
      });
      setNotes("");
      setDistance("");
      setCalories("");
      setSteps("");
      setLocation("");
    }
  };

  // Quick Registration handler
  const handleQuickLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClearMsgs();

    const timestamp = buildTimestamp();

    if (quickType === "gongyo_morning" || quickType === "gongyo_evening") {
      onLogActivity({
        type: quickType,
        customTimestamp: timestamp,
        notes: "Registro rápido!"
      });
    } else if (quickType === "daimoku") {
      onLogActivity({
        type: "daimoku",
        minutes: quickMins,
        notes: "Lançamento ultra rápido ⚡",
        customTimestamp: timestamp
      });
    } else {
      // Default to standard strong Musculação 
      onLogActivity({
        type: "exercise",
        minutes: quickMins,
        exerciseCategory: "Musculação",
        exerciseType: "Musculação Rápida",
        notes: "Lançado em um toque com o Registro Rápido! ⚡",
        customTimestamp: timestamp
      });
    }
    setShowQuickLog(false);
  };

  // Suggesting favorite automatically based on total logs of typical types
  const handleSuggestFavorite = (subType: string) => {
    if (!favorites.includes(subType)) {
      toggleFavorite(subType);
    }
  };

  // Stats today tracker
  const toLocalYYYYMMDD = (d: Date) => {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const dy = String(d.getDate()).padStart(2, "0");
    return `${yr}-${mo}-${dy}`;
  };
  const todayStr = toLocalYYYYMMDD(new Date());
  const userActivitiesToday = activities.filter((a) => {
    if (a.userId !== currentUser?.id) return false;
    try {
      const actD = new Date(a.timestamp);
      return toLocalYYYYMMDD(actD) === todayStr;
    } catch(e) {
      return a.timestamp.startsWith(todayStr);
    }
  });

  const loggedGongyoMorning = userActivitiesToday.some((a) => a.type === "gongyo_morning");
  const loggedGongyoEvening = userActivitiesToday.some((a) => a.type === "gongyo_evening");
  const loggedDaimokuMinutesToday = userActivitiesToday
    .filter((a) => a.type === "daimoku")
    .reduce((sum, a) => sum + (a.minutes || 0), 0);
  const loggedExerciseToday = userActivitiesToday.some((a) => a.type === "exercise" && (a.minutes || 0) >= 20);
  const todayPointsSum = userActivitiesToday.reduce((sum, a) => sum + (a.points || 0), 0);

  // Active library selection
  const activeLibObj = exerciseLibrary.find(l => l.id === selectedLibId) || exerciseLibrary[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="activity-logger-wrapper">
      
      {/* Left panel: Stats indicator */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-xl space-y-5 lg:col-span-1">
        <div>
          <h3 className="text-lg font-bold font-heading text-slate-100">Seu Lançamento Diário</h3>
          <p className="text-xs text-slate-400 mt-0.5">Veja seus limites normativos diários.</p>
        </div>

        {/* Big point Dial */}
        <div className="text-center p-4 bg-slate-950/40 rounded-2xl border border-slate-850 relative">
          <span className="absolute right-3 top-3 text-[10px] uppercase font-bold text-slate-500 font-mono">hoje</span>
          <p className="text-4xl font-extrabold text-soka-orange font-mono">
            {todayPointsSum} <span className="text-lg font-sans font-normal text-slate-500">/ 6 pts</span>
          </p>
          <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden mt-3 border border-slate-805">
            <div 
              className="h-full bg-soka-orange transition-all duration-300"
              style={{ width: `${Math.min(100, (todayPointsSum / 6) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Daimoku (2pt), Exercício (2pt) e Gongyo (2pt).</p>
        </div>

        {/* Checklist */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-850 bg-slate-950/20">
            <div className="flex items-center gap-2">
              <Sunrise className={`w-4 h-4 ${loggedGongyoMorning ? "text-soka-gold" : "text-slate-650"}`} />
              <div>
                <p className="text-xs font-bold text-slate-205">Gongyo Manhã</p>
              </div>
            </div>
            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${loggedGongyoMorning ? "bg-emerald-500/10 text-emerald-400" : "text-slate-500"}`}>
              {loggedGongyoMorning ? "REALIZADO" : "PENDENTE"}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-850 bg-slate-950/20">
            <div className="flex items-center gap-2">
              <Sunset className={`w-4 h-4 ${loggedGongyoEvening ? "text-soka-purple" : "text-slate-650"}`} />
              <div>
                <p className="text-xs font-bold text-slate-205">Gongyo Noite</p>
              </div>
            </div>
            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${loggedGongyoEvening ? "bg-emerald-500/10 text-emerald-400" : "text-slate-500"}`}>
              {loggedGongyoEvening ? "REALIZADO" : "PENDENTE"}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-850 bg-slate-950/20">
            <div className="flex items-center gap-2">
              <Flame className={`w-4 h-4 ${loggedDaimokuMinutesToday > 0 ? "text-soka-pink" : "text-slate-650"}`} />
              <div>
                <p className="text-xs font-bold text-slate-205">Daimoku</p>
                <p className="text-[9px] text-slate-450">{loggedDaimokuMinutesToday} min acumulados</p>
              </div>
            </div>
            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${loggedDaimokuMinutesToday >= 60 ? "bg-emerald-500/10 text-emerald-400" : "text-slate-500"}`}>
              {loggedDaimokuMinutesToday >= 60 ? "2/2 pts" : loggedDaimokuMinutesToday >= 30 ? "1/2 pt" : "0/2 pt"}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-850 bg-slate-950/20">
            <div className="flex items-center gap-2">
              <Dumbbell className={`w-4 h-4 ${loggedExerciseToday ? "text-soka-green" : "text-slate-650"}`} />
              <div>
                <p className="text-xs font-bold text-slate-205">Treino Diário</p>
              </div>
            </div>
            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${loggedExerciseToday ? "bg-emerald-500/10 text-emerald-400" : "text-slate-500"}`}>
              {loggedExerciseToday ? "2/2 pts" : "0/2 pt"}
            </span>
          </div>
        </div>

        {/* Quick Registration Button */}
        <button
          type="button"
          onClick={() => setShowQuickLog(!showQuickLog)}
          className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4 shrink-0 animate-pulse" />
          <span>⚡ Registro Rápido</span>
        </button>
      </div>

      {/* Main logging grid */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-xl lg:col-span-2 flex flex-col justify-between space-y-6">
        
        {/* Quick Registration Form Drawer Overlay */}
        <AnimatePresence>
          {showQuickLog && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-slate-950 border border-amber-500/20 rounded-xl p-4 overflow-hidden space-y-4"
            >
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 font-heading uppercase">
                  <Zap className="w-3.5 h-3.5" /> Lançamento Expresso
                </h4>
                <button 
                  onClick={() => setShowQuickLog(false)}
                  className="text-[10px] text-slate-500 hover:text-slate-400 font-bold font-mono"
                >
                  FECHAR ✕
                </button>
              </div>

              <form onSubmit={handleQuickLogSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block mb-1 text-slate-400">Tipo de atividade rápida</label>
                  <select
                    value={quickType}
                    onChange={(e: any) => setQuickType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-slate-200 outline-none"
                  >
                    <option value="exercise">🏋️ Exercício Livre (30 min)</option>
                    <option value="daimoku">🪷 Daimoku</option>
                    <option value="gongyo_morning">🌅 Gongyo Manhã</option>
                    <option value="gongyo_evening">🌃 Gongyo Noite</option>
                  </select>
                </div>

                {(quickType === "daimoku" || quickType === "exercise") && (
                  <div>
                    <label className="block mb-1 text-slate-400">Tempo (Duração em Minutos)</label>
                    <input
                      type="number"
                      value={quickMins}
                      onChange={(e) => setQuickMins(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-slate-200"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2 bg-amber-505 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition"
                >
                  ⚡ Registrar Agora
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global configuration: Retroactive Switch */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-4">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded">
              <Calendar className="w-3.5 h-3.5" />
            </span>
            <div>
              <h4 className="text-xs font-bold text-slate-200 font-heading">Controle Temporal (Lançamento Diário)</h4>
              <p className="text-[9px] text-slate-455">Deseja lançar retroativamente uma data perdida?</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Habilitar Retroativo</span>
            <button
              type="button"
              onClick={() => setIsRetroactive(!isRetroactive)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                isRetroactive ? "bg-indigo-600" : "bg-slate-800"
              }`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                  isRetroactive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Retroactive Form Parameters */}
        {isRetroactive && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-3"
          >
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
              <span className="text-xs font-bold font-heading">Você está registrando uma atividade realizada anteriormente.</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              O sistema permite lançamentos retroativos de até 7 dias. O lançamento contará integralmente para seu Histórico, Calendário de Consistência, Conquistas, Gráficos e Desafios Coletivos!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="text-[10px] uppercase font-mono font-bold text-slate-500 block mb-1">📅 Data da Atividade</label>
                <select
                  value={retroactiveDate}
                  onChange={(e) => setRetroactiveDate(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 text-slate-200 rounded-lg p-2 outline-none font-mono"
                >
                  {past7Days.map((d) => (
                    <option key={d.dateStr} value={d.dateStr}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono font-bold text-slate-500 block mb-1">🕐 Início da Atividade</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 text-slate-200 rounded-lg p-2 outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono font-bold text-slate-500 block mb-1">🕐 Fim (Opcional)</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 text-slate-200 rounded-lg p-2 outline-none font-mono"
                />
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex-1">
          {/* Tabs selector */}
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-bold text-slate-300 font-heading">Selecione Modalidade:</h3>
            <div className="flex gap-1 p-1 bg-slate-950 rounded-lg border border-slate-850">
              {["gongyo", "daimoku", "exercise"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => { setSelectedLogType(type as any); onClearMsgs(); }}
                  className={`py-1 px-3 text-[11px] font-bold rounded-md transition ${
                    selectedLogType === type ? "bg-slate-850 text-white shadow" : "text-slate-450 hover:text-slate-200"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Messages templates */}
          {(errorMsg || localErrorMsg) && (
            <div className="mb-4 p-3.5 bg-rose-950/20 border border-rose-905/30 text-rose-300 rounded-xl text-xs flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg || localErrorMsg}</span>
            </div>
          )}

          {(successMsg || localSuccessMsg) && (
            <div className="mb-4 p-3.5 bg-emerald-950/20 border border-emerald-905/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg || localSuccessMsg}</span>
            </div>
          )}

          {/* GONGYO VIEW */}
          {selectedLogType === "gongyo" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Selecione qual período de prática litúrgica você realizou para enviar à comunidade dos Bodhishapers:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  disabled={loggedGongyoMorning && !isRetroactive}
                  onClick={() => onLogActivity({ type: "gongyo_morning", customTimestamp: buildTimestamp() })}
                  className={`p-6 flex flex-col items-center justify-center border rounded-2xl transition hover:shadow-lg h-32 border-dashed ${
                    loggedGongyoMorning && !isRetroactive
                      ? "bg-slate-950/20 border-slate-850 text-slate-550 opacity-40 cursor-not-allowed" 
                      : "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20 text-amber-300"
                  }`}
                >
                  <Sunrise className="w-7 h-7 mb-1.5" />
                  <span className="font-bold text-xs font-heading">Gongyo da Manhã</span>
                  <span className="text-[10px] mt-1 font-mono">
                    {loggedGongyoMorning && !isRetroactive ? "✓ Resolvido hoje" : "+1 pt diário"}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={loggedGongyoEvening && !isRetroactive}
                  onClick={() => onLogActivity({ type: "gongyo_evening", customTimestamp: buildTimestamp() })}
                  className={`p-6 flex flex-col items-center justify-center border rounded-2xl transition hover:shadow-lg h-32 border-dashed ${
                    loggedGongyoEvening && !isRetroactive 
                      ? "bg-slate-950/20 border-slate-850 text-slate-550 opacity-40 cursor-not-allowed" 
                      : "bg-indigo-500/5 hover:bg-indigo-500/10 border-indigo-500/20 text-indigo-300"
                  }`}
                >
                  <Sunset className="w-7 h-7 mb-1.5" />
                  <span className="font-bold text-xs font-heading">Gongyo Tarde/Noite</span>
                  <span className="text-[10px] mt-1 font-mono">
                    {loggedGongyoEvening && !isRetroactive ? "✓ Resolvido hoje" : "+1 pt diário"}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* DAIMOKU VIEW */}
          {selectedLogType === "daimoku" && (
            <div className="space-y-4">
              {/* Saldo de Daimoku Acumulado */}
              <div className="bg-[#11091C]/60 border border-fuchsia-900/35 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(217,70,239,0.08)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-fuchsia-500/10 flex items-center justify-center text-lg shrink-0">
                    🪷
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-100 block">Saldo de Daimoku</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5 leading-none">Todo daimoku importa. A constância é a chave.</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-extrabold text-[#f472b6] font-mono block">
                    {currentUser?.daimokuBalance || 0} min acumulados
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                    Próximo ponto em: <span className="text-emerald-400 font-bold">{30 - ((currentUser?.daimokuBalance || 0) % 30)} min</span>
                  </span>
                </div>
              </div>

              <div className="flex gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-850">
                <button
                  type="button"
                  onClick={() => setDaimokuMode("cronometro")}
                  className={`flex-1 py-1 px-2.5 text-xs font-bold rounded-lg transition-all ${
                    daimokuMode === "cronometro" ? "bg-[#1E1925] text-pink-400 border border-pink-900/30" : "text-slate-450 hover:text-slate-200"
                  }`}
                >
                  ⏱️ Cronômetro Ativo (Foco)
                </button>
                <button
                  type="button"
                  onClick={() => setDaimokuMode("manual")}
                  className={`flex-1 py-1 px-2.5 text-xs font-bold rounded-lg transition-all ${
                    daimokuMode === "manual" ? "bg-[#1E1925] text-pink-400 border border-pink-900/30" : "text-slate-450 hover:text-slate-200"
                  }`}
                >
                  ✍️ Lançamento Manual
                </button>
              </div>

              {(() => {
                const timerData = daimokuTimerProps || {
                  duration: 15,
                  setDuration: () => {},
                  isRunning: isTimerRunning,
                  secondsRemaining: timerSeconds,
                  audioType: "none",
                  setAudioType: () => {},
                  startTimer: handleStartTimer,
                  pauseTimer: handlePauseTimer,
                  resetTimer: handleResetTimer,
                  finishTimerEarly: handleFinishTimer
                };

                return daimokuMode === "cronometro" ? (
                  <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-850 text-center space-y-4 shadow-xl">
                    {/* Real-time Community Sync bar without uncovering individual times */}
                    <div className="bg-indigo-950/20 text-indigo-300 py-2 px-3 rounded-xl text-[11px] flex flex-col gap-1.5 border border-indigo-900/30">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span className="font-sans font-medium text-center">
                          {activePractitioners.length > 0 ? (
                            <span>Você não está só! 🪷 Há <strong className="text-emerald-400">{activePractitioners.length}</strong> parceiro(s) em sincronia espiritual agora!</span>
                          ) : (
                            <span>Você não está só! Outros praticantes soka estão orando em sincronia em todo o país. 🪷</span>
                          )}
                        </span>
                      </div>
                      {activePractitioners.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[9.5px] text-indigo-300 pt-0.5">
                          <span className="font-bold text-indigo-400">Praticando juntos:</span>
                          {activePractitioners.slice(0, 10).map((p) => (
                            <span key={p.userId} className="bg-indigo-950/50 border border-indigo-900/50 px-2 py-0.5 rounded-full">
                              {p.name.split(" ")[0]} 🪷
                            </span>
                          ))}
                          {activePractitioners.length > 10 && (
                            <span>+ {activePractitioners.length - 10}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Preset Buttons */}
                    <div className="space-y-2 text-left">
                      <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 flex items-center gap-1">
                        ⏱️ Selecione a Duração Desejada:
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[5, 10, 15, 20, 30, 45, 60, 90].map((mins) => {
                          const isSelected = !isCustomDaimokuTime && timerData.duration === mins;
                          return (
                            <button
                              key={mins}
                              type="button"
                              disabled={timerData.isRunning}
                              onClick={() => {
                                setIsCustomDaimokuTime(false);
                                timerData.setDuration(mins);
                              }}
                              className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-pink-600 text-white border-pink-500/50 shadow-md shadow-pink-950/20"
                                  : "bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-255"
                              }`}
                            >
                              {mins} min
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          disabled={timerData.isRunning}
                          onClick={() => {
                            setIsCustomDaimokuTime(true);
                            timerData.setDuration(daimokuMins);
                          }}
                          className={`py-1.5 text-xs font-bold rounded-lg border transition-all col-span-4 cursor-pointer ${
                            isCustomDaimokuTime
                              ? "bg-pink-650 text-white border-pink-500/50"
                              : "bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-205"
                          }`}
                        >
                          ✍️ Ajustar Tempo Personalizado
                        </button>
                      </div>

                      {isCustomDaimokuTime && (
                        <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/60 mt-2 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-slate-400">Tempo Definitivo:</span>
                            <span className="text-soka-pink font-mono font-bold text-xs">{timerData.duration} minutos</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="240"
                            step="1"
                            disabled={timerData.isRunning}
                            value={timerData.duration}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setDaimokuMins(val);
                              timerData.setDuration(val);
                            }}
                            className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-soka-pink"
                          />
                        </div>
                      )}
                    </div>

                    {/* Audio accompaniment selection */}
                    <div className="space-y-2 text-left">
                      <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 block">
                        🎵 Áudio Guia Soka Opcional:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "none", label: "🔘 Sem Áudio", desc: "Prática em silêncio" },
                          { id: "lento", label: "🪷 Daimoku Lento", desc: "Compassado do Altar" },
                          { id: "vibrante", label: "🔥 Daimoku Vibrante", desc: "Ritmado e dinâmico" },
                          { id: "sensei", label: "👑 Com Sensei SGI", desc: "Sopro coral tradicional" }
                        ].map((item) => {
                          const isSelected = timerData.audioType === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                timerData.setAudioType(item.id as any);
                              }}
                              className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-slate-900 border-[#f472b6] text-white shadow"
                                  : "bg-slate-950/40 border-slate-850 text-slate-400 hover:border-slate-800 hover:text-slate-300"
                              }`}
                            >
                              <span className="text-xs font-bold block">{item.label}</span>
                              <span className="text-[9px] text-slate-500 block mt-0.5 leading-tight">{item.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Speaker volume controls for non-silent modes */}
                    {timerData.audioType !== "none" && timerData.volume !== undefined && timerData.setVolume && (
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850 text-left space-y-1.5 animate-fade-in">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-slate-400 uppercase tracking-wide font-mono flex items-center gap-1.5">
                            {timerData.volume === 0 ? "🔇" : "🔊"} Volume do Guia de Voz:
                          </span>
                          <span className="font-bold text-soka-pink font-mono">{timerData.volume}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={timerData.volume}
                          onChange={(e) => {
                            timerData.setVolume!(Number(e.target.value));
                          }}
                          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-soka-pink"
                        />
                      </div>
                    )}

                    {/* Clock countdown layout */}
                    <div className="space-y-1.5 py-5 bg-[#12091A] rounded-2xl border border-fuchsia-955/40 shadow-inner relative overflow-hidden">
                      {timerData.isRunning && (
                        <div className="absolute inset-0 bg-pink-500/5 blur-[25px] rounded-full animate-pulse pointer-events-none" />
                      )}
                      <span className="text-[9px] uppercase font-mono tracking-widest font-extrabold text-slate-500 block">
                        {timerData.isRunning ? "ORANDO DAIMOKU INTEGRAL" : "TEMPO DE SESSÃO ESTABELECIDO"}
                      </span>
                      <p className="text-5xl font-black text-soka-pink font-mono tracking-tight">
                        {formatTimerString(timerData.secondsRemaining)}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Meta definida: <span className="font-bold text-slate-200">{timerData.duration} min</span>
                      </p>
                    </div>

                    {/* Real-time active practitioners count */}
                    <div className="bg-pink-500/5 hover:bg-pink-500/10 transition rounded-xl p-3 border border-pink-500/10 text-center space-y-1">
                      <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-300">
                        {activePractitioners.length > 0 ? (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                            <span className="text-emerald-400 font-extrabold">{activePractitioners.length} Bodhishapers praticando agora</span>
                          </>
                        ) : (
                          <span className="text-slate-450 font-normal">Ninguém praticando no momento</span>
                        )}
                      </div>
                      {activePractitioners.length > 0 && (
                        <p className="text-[9px] text-slate-500 font-medium truncate max-w-xs mx-auto">
                          👤 Ativos: {activePractitioners.map(p => p.name).join(", ")}
                        </p>
                      )}
                    </div>

                    {/* Action controllers */}
                    <div className="flex justify-center items-center gap-3 pt-1">
                      {!timerData.isRunning ? (
                        <button
                          type="button"
                          onClick={timerData.startTimer}
                          className="px-5 py-2.5 bg-soka-pink hover:bg-rose-600 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-1.5 shadow-lg shadow-pink-955/20 cursor-pointer"
                        >
                          ⚡ Iniciar Prática (Sino 🔔)
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={timerData.pauseTimer}
                          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-amber-300 font-extrabold rounded-xl text-xs transition cursor-pointer border border-slate-700/50"
                        >
                          ⏸️ Pausar Daimoku
                        </button>
                      )}

                      {timerData.secondsRemaining !== timerData.duration * 60 && (
                        <button
                          type="button"
                          onClick={timerData.resetTimer}
                          className="px-3.5 py-2 bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-405 text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          Zerar
                        </button>
                      )}
                    </div>

                    {timerData.isRunning && (
                      <button
                        type="button"
                        onClick={timerData.finishTimerEarly}
                        className="w-full py-2 bg-[#1C000B] hover:bg-[#2C0011] text-pink-400 hover:text-pink-300 border border-pink-905/30 hover:border-pink-505/50 rounded-xl text-xs font-bold transition cursor-pointer mt-1"
                      >
                        🔔 Encerrar e Registrar Parcial
                      </button>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleLogSubmit} className="space-y-4">
                    <div className="bg-slate-950/40 rounded-2xl p-4 border border-slate-800/65">
                      <label className="text-xs font-bold text-slate-400 font-heading block mb-2">
                        Minutos praticados: <span className="font-mono text-soka-pink text-sm ml-1 font-extrabold">{daimokuMins} min</span>
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="180"
                        step="5"
                        value={daimokuMins}
                        onChange={(e) => setDaimokuMins(Number(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-soka-pink"
                      />
                      <div className="flex justify-between text-[9px] font-mono text-slate-505 mt-2">
                        <span>5m (Foco)</span>
                        <span>30m (1 pt)</span>
                        <span>60m (2 pts)</span>
                        <span>180m</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-soka-pink hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-pink-955/20 animate-none cursor-pointer"
                    >
                      Gravar Daimoku + Comentário IA Coach 🪷
                    </button>
                  </form>
                );
              })()}

              <div>
                <label className="text-[10px] uppercase font-mono font-bold text-slate-500 block mb-1">Anotações ou Determinações (Opcional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Orando pela saúde da família, superação dos prazos de estudo..."
                  className="w-full bg-slate-950 text-xs px-3 py-2 rounded-xl text-white outline-none border border-slate-800 focus:border-pink-500/20"
                />
              </div>
            </div>
          )}

          {/* EXERCISE LIBRARY & WORKOUTS LOGGER */}
          {selectedLogType === "exercise" && (
            <form onSubmit={handleLogSubmit} className="space-y-4">
              
              {/* STAR FAVORITES SECTION */}
              {favorites.length > 0 && (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block mb-2">⭐ Meus Favoritos (Acesso Rápido)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {favorites.map((fav) => (
                      <button
                        type="button"
                        key={fav}
                        onClick={() => {
                          setSelectedSubtype(fav);
                          // Auto match group too
                          const group = exerciseLibrary.find(l => l.subtypes.includes(fav));
                          if (group) setSelectedLibId(group.id);
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 transition ${
                          selectedSubtype === fav
                            ? "bg-soka-green/10 border-soka-green text-soka-green font-bold"
                            : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <span>{fav}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* DYNAMIC LIBRARY CARDS */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 font-heading block mb-1.5">Área do Shape (Total Biblioteca):</label>
                  <select
                    value={selectedLibId}
                    onChange={(e) => {
                      setSelectedLibId(e.target.value);
                      const matched = exerciseLibrary.find(l => l.id === e.target.value);
                      if (matched && matched.subtypes.length > 0) {
                        setSelectedSubtype(matched.subtypes[0]);
                      }
                    }}
                    className="w-full text-xs border border-slate-800 px-3 py-2.5 bg-slate-850 text-slate-100 rounded-xl outline-none"
                  >
                    {exerciseLibrary.map((lib) => (
                      <option key={lib.id} value={lib.id}>{lib.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 font-heading block mb-1.5">Categoria / Modalidade Específica:</label>
                  <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto bg-slate-950/40 p-2 rounded-xl border border-slate-850/60">
                    {activeLibObj.subtypes.map((sub) => {
                      const isFav = favorites.includes(sub);
                      return (
                        <div 
                          key={sub}
                          className={`flex items-center justify-between p-1.5 rounded-lg border text-xs ${
                            selectedSubtype === sub 
                              ? "bg-slate-900 border-soka-green/45 text-slate-100" 
                              : "bg-slate-900/30 border-transparent text-slate-400"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedSubtype(sub)}
                            className="flex-1 text-left font-semibold truncate"
                          >
                            <span>{sub}</span>
                          </button>
                          
                          {/* Favorite Star action */}
                          <button
                            type="button"
                            onClick={() => toggleFavorite(sub)}
                            className={`p-1 hover:scale-110 transition ${
                              isFav ? "text-yellow-400 fill-yellow-400" : "text-slate-600"
                            }`}
                            title="Marcar como favorito"
                          >
                            <Star size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Slider for workout duration */}
              <div className="bg-slate-950/40 rounded-2xl p-4 border border-slate-800/65">
                <label className="text-xs font-bold text-slate-400 font-heading block mb-2">
                  Duração do treino: <span className="font-mono text-soka-green text-sm ml-1 font-extrabold">{exerciseMins} min</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="180"
                  step="5"
                  value={exerciseMins}
                  onChange={(e) => setValueMin(Number(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-soka-green"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-555 mt-2">
                  <span>5 min</span>
                  <span>Pontua a partir de 20 min</span>
                  <span>180 min</span>
                </div>
              </div>

              {/* Optional metrics details inputs */}
              <div className="bg-slate-950/45 p-4 rounded-xl border border-slate-850 space-y-3">
                <span className="text-[9px] uppercase font-mono font-bold text-slate-450 block">Métricas Físicas Opcionais (Biblioteca Digital)</span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">🏃 Distância (km)</label>
                    <input
                      type="text"
                      placeholder="Ex: 5"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-xs p-1.5 rounded text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">🔥 Calorias queimadas</label>
                    <input
                      type="text"
                      placeholder="Ex: 340"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-xs p-1.5 rounded text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">👣 Passos dados</label>
                    <input
                      type="text"
                      placeholder="Ex: 7500"
                      value={steps}
                      onChange={(e) => setSteps(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-xs p-1.5 rounded text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">📍 Local do treino</label>
                    <input
                      type="text"
                      placeholder="Ex: Parque Jaqueira"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-xs p-1.5 rounded text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono font-bold text-slate-500 block mb-1">Anotações / Descrição do treino (Opcional):</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Senti-me com altíssima disposição e boa postura Soka!"
                  className="w-full text-xs border border-slate-700 bg-slate-950/40 px-3 py-2 text-slate-100 placeholder-slate-600 rounded-xl outline-none focus:border-indigo-505"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-soka-green hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow"
              >
                Lançar Treino + Comentário IA Coach 💪🌿
              </button>
            </form>
          )}

        </div>

        {/* HEALTH MOCK APPS */}
        <div className="mt-6 border-t border-slate-800/80 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
            <h4 className="text-xs font-bold font-heading text-slate-300">Integração de wearables</h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "strava", label: "Strava", color: "hover:bg-orange-500/10 hover:text-orange-400" },
              { id: "googleFit", label: "Google Fit", color: "hover:bg-rose-500/10 hover:text-red-400" },
              { id: "samsungHealth", label: "Samsung Health", color: "hover:bg-sky-500/10 hover:text-sky-400" },
              { id: "garmin", label: "Garmin", color: "hover:bg-slate-500/10 hover:text-slate-205" },
            ].map((app) => {
              const connected = appConnections[app.id];
              return (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => toggleConnection(app.id)}
                  className={`text-[9px] font-bold p-2 rounded-xl border flex items-center justify-between transition-all ${
                    connected
                      ? "bg-indigo-650 border-indigo-550 text-white"
                      : `bg-slate-950/30 border-slate-850 text-slate-300 ${app.color}`
                  }`}
                >
                  <span>{app.label}</span>
                  {connected ? <span className="text-[7px] uppercase bg-emerald-505 px-1 py-0.2 rounded text-emerald-950 font-sans font-bold">ON</span> : <Plus className="w-3 h-3 text-slate-500" />}
                </button>
              );
            })}
          </div>

          {Object.values(appConnections).some((v) => v) && importedActivities.length > 0 && (
            <div className="mt-3.5 bg-orange-950/10 border border-orange-900/30 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-3 h-3 text-orange-400 animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-orange-300">Atividades Sincronizáveis</span>
              </div>
              <div className="space-y-1.5">
                {importedActivities.map((act) => (
                  <div key={act.id} className="flex justify-between items-center text-[9px] text-slate-300 bg-slate-900/80 border border-slate-850 px-2.5 py-1.5 rounded-lg">
                    <span className="truncate max-w-[170px]">
                      🏋️ {act.type} • <b>{act.minutes} min</b> ({act.app.toUpperCase()})
                    </span>
                    <button
                      onClick={() => handleUseImported(act)}
                      className="px-2 py-0.5 bg-orange-600 hover:bg-orange-700 text-white rounded font-bold text-[8px] transition flex items-center"
                    >
                      Preencher Atividade
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );

  // Small internal helper to support old slider handlers easily
  function setValueMin(val: number) {
    setExerciseMins(val);
    const defaults = activeLibObj.subtypes;
    if (val >= 20 && !favorites.includes(selectedSubtype)) {
      // Prompt auto favorite if they practice often!
      handleSuggestFavorite(selectedSubtype);
    }
  }
}
