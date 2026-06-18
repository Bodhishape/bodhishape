import React, { useState, useEffect, useRef } from "react";
import { 
  History, Calendar, Flame, TrendingUp, Sparkles, Image, ShieldAlert, BadgeCheck, 
  ChevronRight, CalendarDays, Sliders, Play, Plus, Trash2, Dumbbell, Award, HelpCircle,
  TrendingDown, Check, Scale, Ruler, Compass
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, Activity, Goal } from "../types";

interface PrivateEvolutionProps {
  currentUser: User | null;
  activities: Activity[];
  goals: Goal[];
  initialTab?: "insights" | "calendar" | "history" | "photos" | "body";
  focusOnDaimoku?: boolean;
  onUpdateUser?: (updated: User) => void;
}

interface ProgressPhoto {
  id: string;
  url: string;
  caption: string;
  date: string;
  type: "fisica" | "espiritual" | "mista";
}

export default function PrivateEvolution({ 
  currentUser, 
  activities,
  goals,
  initialTab,
  focusOnDaimoku,
  onUpdateUser
}: PrivateEvolutionProps) {
  const [filterType, setFilterType] = useState<"all" | "gongyo" | "daimoku" | "exercise" | "weight">("all");
  const [activeSubTab, setActiveSubTab] = useState<"insights" | "photos" | "calendar" | "history" | "body">("insights");

  useEffect(() => {
    if (initialTab) {
      if (initialTab === "photos") {
        setActiveSubTab("photos");
      } else if (initialTab === "calendar") {
        setActiveSubTab("calendar");
      } else if (initialTab === "history") {
        setActiveSubTab("history");
      } else if (initialTab === "body") {
        setActiveSubTab("body");
      } else {
        setActiveSubTab("insights");
      }
    }
  }, [initialTab]);
  
  // State for user's personal Daimoku goal
  const [personalGoal, setPersonalGoal] = useState<number>(120); // default 120 minutes

  useEffect(() => {
    if (currentUser) {
      const savedGoal = localStorage.getItem(`personal_daimoku_goal_${currentUser.id}`);
      if (savedGoal) {
        setPersonalGoal(Number(savedGoal));
      }
    }
  }, [currentUser?.id]);

  const handleUpdateGoal = (mins: number) => {
    const validMins = Math.max(5, isNaN(mins) ? 5 : mins);
    setPersonalGoal(validMins);
    if (currentUser) {
      localStorage.setItem(`personal_daimoku_goal_${currentUser.id}`, String(validMins));
    }
  };

  // State files indicators
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Physical form fields synced with currentUser or local state fallback
  const [height, setHeight] = useState<number>(currentUser?.height || 0);
  const [initialWeight, setInitialWeight] = useState<number>(currentUser?.initialWeight || 0);
  const [currentWeight, setCurrentWeight] = useState<number>(currentUser?.currentWeight || 0);
  const [targetWeight, setTargetWeight] = useState<number>(currentUser?.targetWeight || 0);

  // Body Measurements form fields
  const [peitoral, setPeitoral] = useState<number>(currentUser?.bodyMeasurements?.peitoral || 0);
  const [cintura, setCintura] = useState<number>(currentUser?.bodyMeasurements?.cintura || 0);
  const [abdomen, setAbdomen] = useState<number>(currentUser?.bodyMeasurements?.abdomen || 0);
  const [quadril, setQuadril] = useState<number>(currentUser?.bodyMeasurements?.quadril || 0);
  const [bracoD, setBracoD] = useState<number>(currentUser?.bodyMeasurements?.bracoD || 0);
  const [bracoE, setBracoE] = useState<number>(currentUser?.bodyMeasurements?.bracoE || 0);
  const [coxaD, setCoxaD] = useState<number>(currentUser?.bodyMeasurements?.coxaD || 0);
  const [coxaE, setCoxaE] = useState<number>(currentUser?.bodyMeasurements?.coxaE || 0);
  const [panturrilhaD, setPanturrilhaD] = useState<number>(currentUser?.bodyMeasurements?.panturrilhaD || 0);
  const [panturrilhaE, setPanturrilhaE] = useState<number>(currentUser?.bodyMeasurements?.panturrilhaE || 0);

  const [selectedBodyPart, setSelectedBodyPart] = useState<string>("abdomen");
  const [isSavingBodyData, setIsSavingBodyData] = useState(false);

  // Local state inputs elements refs
  const peitoralRef = useRef<HTMLInputElement>(null);
  const cinturaRef = useRef<HTMLInputElement>(null);
  const abdomenRef = useRef<HTMLInputElement>(null);
  const quadrilRef = useRef<HTMLInputElement>(null);
  const bracoDRef = useRef<HTMLInputElement>(null);
  const bracoERef = useRef<HTMLInputElement>(null);
  const coxaDRef = useRef<HTMLInputElement>(null);
  const coxaERef = useRef<HTMLInputElement>(null);
  const panturrilhaDRef = useRef<HTMLInputElement>(null);
  const panturrilhaERef = useRef<HTMLInputElement>(null);

  // Sync state values on user update
  useEffect(() => {
    if (currentUser) {
      setHeight(currentUser.height || 0);
      setInitialWeight(currentUser.initialWeight || 0);
      setCurrentWeight(currentUser.currentWeight || 0);
      setTargetWeight(currentUser.targetWeight || 0);

      const m = currentUser.bodyMeasurements || {};
      setPeitoral(m.peitoral || 0);
      setCintura(m.cintura || 0);
      setAbdomen(m.abdomen || 0);
      setQuadril(m.quadril || 0);
      setBracoD(m.bracoD || 0);
      setBracoE(m.bracoE || 0);
      setCoxaD(m.coxaD || 0);
      setCoxaE(m.coxaE || 0);
      setPanturrilhaD(m.panturrilhaD || 0);
      setPanturrilhaE(m.panturrilhaE || 0);
    }
  }, [currentUser]);

  // Core update helper
  const updateStoreProfile = async (fields: Partial<User>) => {
    if (!currentUser || !onUpdateUser) return false;
    try {
      setIsSavingBodyData(true);
      const res = await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          ...fields
        })
      });
      const data = await res.json();
      if (res.ok) {
        onUpdateUser(data);
        return true;
      } else {
        showToast(data.error || "Erro ao atualizar dados físicos.");
        return false;
      }
    } catch (err) {
      console.error(err);
      showToast("Não foi possível conectar ao servidor de produção.");
      return false;
    } finally {
      setIsSavingBodyData(false);
    }
  };

  // Submit physical changes
  const saveMeuCorpo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Build or update history
    const history = currentUser.weightHistory ? [...currentUser.weightHistory] : [];
    const todayStr = new Date().toISOString().split("T")[0];
    
    // Check if we already have weight for today
    const exists = history.findIndex(h => h.date === todayStr);
    if (exists !== -1) {
      history[exists].weight = Number(currentWeight);
    } else {
      history.push({ date: todayStr, weight: Number(currentWeight) });
    }

    // Keep sorted sortedWeightHistory
    history.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const success = await updateStoreProfile({
      height: Number(height),
      initialWeight: Number(initialWeight),
      currentWeight: Number(currentWeight),
      targetWeight: Number(targetWeight),
      weightHistory: history
    });

    if (success) {
      showToast("Dados do seu corpo atualizados e salvos com sucesso! 🧬💪");
    }
  };

  // Submit dynamic dimensions
  const saveGroupMeasurements = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const measurementsData = {
      peitoral: Number(peitoral),
      cintura: Number(cintura),
      abdomen: Number(abdomen),
      quadril: Number(quadril),
      bracoD: Number(bracoD),
      bracoE: Number(bracoE),
      coxaD: Number(coxaD),
      coxaE: Number(coxaE),
      panturrilhaD: Number(panturrilhaD),
      panturrilhaE: Number(panturrilhaE)
    };

    const success = await updateStoreProfile({
      bodyMeasurements: measurementsData
    });

    if (success) {
      showToast("Medidas corporais gravadas com sucesso no scanner! 📐🛸");
    }
  };

  // Local photo progress array synced with currentUser Cloud database
  const photos = currentUser?.progressPhotos || [];
  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [newPhotoCaption, setNewPhotoCaption] = useState("");

  const handleAddPrivateDocPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    try {
      setIsUploadingPhoto(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: reader.result,
              name: file.name
            })
          });
          const uploadData = await uploadRes.json();
          if (uploadRes.ok && uploadData.url) {
            const newItem = {
              id: "photo-" + Math.random().toString(36).substr(2, 9),
              url: uploadData.url,
              date: new Date().toISOString().split("T")[0],
              caption: newPhotoCaption.trim() || `Evolução Física - ${new Date().toLocaleDateString("pt-BR")}`
            };
            const updatedList = [newItem, ...photos];
            const success = await updateStoreProfile({
              progressPhotos: updatedList
            });
            if (success) {
              setNewPhotoCaption("");
              setShowPhotoForm(false);
              showToast("Foto adicionada instantaneamente à sua galeria militar silenciosa! 📸🚀");
            }
          } else {
            showToast(uploadData.error || "Falha ao gravar arquivo de imagem.");
          }
        } catch (err) {
          console.error(err);
          showToast("Erro durante o envio da imagem.");
        } finally {
          setIsUploadingPhoto(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsUploadingPhoto(false);
    }
  };

  const handleDeleteDocPhoto = async (id: string) => {
    if (!currentUser) return;
    const filtered = photos.filter(p => p.id !== id);
    const success = await updateStoreProfile({
      progressPhotos: filtered
    });
    if (success) {
      showToast("Foto removida da galeria privada de produção.");
    }
  };

  // Antes & Depois slider state vars
  const [selectedBeforeUrl, setSelectedBeforeUrl] = useState<string>("");
  const [selectedAfterUrl, setSelectedAfterUrl] = useState<string>("");

  useEffect(() => {
    if (photos.length > 1) {
      // Auto assign first two images for easier start
      setSelectedBeforeUrl(photos[photos.length - 1].url);
      setSelectedAfterUrl(photos[0].url);
    } else if (photos.length === 1) {
      setSelectedBeforeUrl(photos[0].url);
      setSelectedAfterUrl(photos[0].url);
    }
  }, [photos]);

  // Core User specific statistics
  const userActivities = activities.filter(a => a.userId === currentUser?.id);
  const daimokuActs = userActivities.filter(a => a.type === "daimoku");
  const gongyoMActs = userActivities.filter(a => a.type === "gongyo_morning");
  const gongyoEActs = userActivities.filter(a => a.type === "gongyo_evening");
  const exerciseActs = userActivities.filter(a => a.type === "exercise");

  const totalDaimokuMinutes = daimokuActs.reduce((sum, a) => sum + (a.minutes || 0), 0);
  const totalDaimokuHours = Number((totalDaimokuMinutes / 60).toFixed(1));
  const totalExCount = exerciseActs.length;
  const totalGongyoCount = gongyoMActs.length + gongyoEActs.length;

  const userStreak = currentUser?.streak || 0;

  // Comparison logic (Evolução: This week vs Previous week)
  const getWeeklyComparison = () => {
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    const thisWeekActs = userActivities.filter(a => {
      const actTime = new Date(a.timestamp).getTime();
      return now - actTime <= oneWeek;
    });

    const prevWeekActs = userActivities.filter(a => {
      const actTime = new Date(a.timestamp).getTime();
      const age = now - actTime;
      return age > oneWeek && age <= 2 * oneWeek;
    });

    const thisWeekDaimoku = thisWeekActs.filter(a => a.type === "daimoku").reduce((sum, a) => sum + (a.minutes || 0), 0);
    const prevWeekDaimoku = prevWeekActs.filter(a => a.type === "daimoku").reduce((sum, a) => sum + (a.minutes || 0), 0);

    const thisWeekEx = thisWeekActs.filter(a => a.type === "exercise").length;
    const prevWeekEx = prevWeekActs.filter(a => a.type === "exercise").length;

    return {
      thisWeekDaimoku,
      prevWeekDaimoku,
      daimokuDiff: thisWeekDaimoku - prevWeekDaimoku,
      thisWeekEx,
      prevWeekEx,
      exDiff: thisWeekEx - prevWeekEx
    };
  };

  const comp = getWeeklyComparison();

  // STREAKS CALCULATOR DETAILED FOR MAIN PANEL
  const calculateStreakForType = (type: "gongyo" | "daimoku" | "exercise" | "complete") => {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
       const checkDate = new Date();
       checkDate.setDate(today.getDate() - i);
       const dateStr = checkDate.toISOString().split("T")[0];
       const dayActs = userActivities.filter(a => a.timestamp.startsWith(dateStr));
      
       let matched = false;
       if (type === "gongyo") {
         matched = dayActs.some(a => a.type === "gongyo_morning" || a.type === "gongyo_evening");
       } else if (type === "daimoku") {
         matched = dayActs.some(a => a.type === "daimoku");
       } else if (type === "exercise") {
         matched = dayActs.some(a => a.type === "exercise");
       } else if (type === "complete") {
         const dayPoints = dayActs.reduce((sum, a) => sum + (a.points || 0), 0);
         matched = dayPoints >= 6; // morning + evening + base daimoku
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

  const gongyoStreak = calculateStreakForType("gongyo");
  const daimokuStreak = calculateStreakForType("daimoku");
  const exerciseStreak = calculateStreakForType("exercise");
  const completeStreak = calculateStreakForType("complete");

  // Real-time automatic IMC calculator: weight / (height/100)^2
  const computeIMC = () => {
    if (!currentWeight || !height) return { value: 0, text: "Dados insuficientes", color: "text-slate-400 bg-slate-900 border-slate-800" };
    const hMeters = height / 100;
    const bmiVal = Number((currentWeight / (hMeters * hMeters)).toFixed(1));
    
    if (bmiVal < 18.5) {
      return { value: bmiVal, text: "Abaixo do peso ⚠️", color: "text-blue-400 bg-blue-950/45 border-blue-900/40" };
    } else if (bmiVal >= 18.5 && bmiVal <= 24.9) {
      return { value: bmiVal, text: "Peso saudável ✅", color: "text-emerald-400 bg-emerald-950/45 border-emerald-900/40" };
    } else if (bmiVal >= 25.0 && bmiVal <= 29.9) {
      return { value: bmiVal, text: "Sobrepeso 📏", color: "text-yellow-400 bg-yellow-950/45 border-yellow-900/40" };
    } else {
      return { value: bmiVal, text: "Obesidade Classificada ⚠️", color: "text-rose-400 bg-rose-950/45 border-rose-900/40" };
    }
  };

  const imc = computeIMC();

  // Dynamic Badges Achievement System
  const getDynamicBadges = () => {
    return [
      {
        id: "altar_champion",
        title: "Guerreiro do Altar",
        desc: "Lançou sua primeira causa espiritual no BodhiShape.",
        howTo: "Registre pelo menos 1 minuto de Daimoku ou Gongyo.",
        unlocked: totalDaimokuMinutes > 0 || totalGongyoCount > 0,
        icon: "🪷",
      },
      {
        id: "streak_7",
        title: "Garra Soka de Leão",
        desc: "Consolidou constância invicta de 7 dias consecutivos.",
        howTo: "Mantenha o streak geral de login ativo maior ou igual a 7 dias.",
        unlocked: userStreak >= 7,
        icon: "🦁",
      },
      {
        id: "perfect_streak_30",
        title: "Foco Soka Blindado",
        desc: "Manteve o altar aceso e fôlego soka por 30 dias.",
        howTo: "Alcançar streak de 30 dias no aplicativo.",
        unlocked: userStreak >= 30,
        icon: "👑",
      },
      {
        id: "shape_warrior",
        title: "Fúria do Shape",
        desc: "Esmerilhou limites registrando 10 ou mais treinos.",
        howTo: "Acumule pelo menos 10 registros de atividade física/musculação.",
        unlocked: totalExCount >= 10,
        icon: "💪",
      },
      {
        id: "scientific_mind",
        title: "Scanner Ativo",
        desc: "Registrou dados de peso e altura para acompanhamento estatístico.",
        howTo: "Preencha a altura e peso no painel Meu Corpo.",
        unlocked: height > 0 && currentWeight > 0,
        icon: "🧬",
      },
      {
        id: "gallery_elite",
        title: "Galeria de Metamorfose",
        desc: "Registrou sua primeira fotografia privada militar na galeria de evolução.",
        howTo: "Carregue pelo menos 1 foto privada de progresso físico ou de altar.",
        unlocked: photos.length > 0,
        icon: "📸",
      }
    ];
  };

  const dynamicBadges = getDynamicBadges();

  // Biomechanical body diagram configuration mapping
  const diagramParts = [
    { id: "peitoral", label: "Peitoral", ref: peitoralRef, setVal: setPeitoral, val: peitoral, cx: "50", cy: "48", pulse: "animate-ping text-indigo-505" },
    { id: "cintura", label: "Cintura", ref: cinturaRef, setVal: setCintura, val: cintura, cx: "50", cy: "74", pulse: "animate-pulse text-indigo-405" },
    { id: "abdomen", label: "Abdômen", ref: abdomenRef, setVal: setAbdomen, val: abdomen, cx: "50", cy: "89", pulse: "animate-ping text-violet-505" },
    { id: "quadril", label: "Quadril", ref: quadrilRef, setVal: setQuadril, val: quadril, cx: "50", cy: "105", pulse: "animate-pulse text-violet-405" },
    { id: "bracoD", label: "Braço Dir.", ref: bracoDRef, setVal: setBracoD, val: bracoD, cx: "18", cy: "62", pulse: "animate-ping text-rose-505" },
    { id: "bracoE", label: "Braço Esq.", ref: bracoERef, setVal: setBracoE, val: bracoE, cx: "82", cy: "62", pulse: "animate-ping text-rose-505" },
    { id: "coxaD", label: "Coxa Dir.", ref: coxaDRef, setVal: setCoxaD, val: coxaD, cx: "38", cy: "128", pulse: "animate-pulse text-emerald-505" },
    { id: "coxaE", label: "Coxa Esq.", ref: coxaERef, setVal: setCoxaE, val: coxaE, cx: "62", cy: "128", pulse: "animate-pulse text-emerald-505" },
    { id: "panturrilhaD", label: "Panturrilha Dir.", ref: panturrilhaDRef, setVal: setPanturrilhaD, val: panturrilhaD, cx: "38", cy: "168", pulse: "animate-ping text-pink-505" },
    { id: "panturrilhaE", label: "Panturrilha Esq.", ref: panturrilhaERef, setVal: setPanturrilhaE, val: panturrilhaE, cx: "62", cy: "168", pulse: "animate-ping text-pink-505" },
  ];

  const handleFocusBodyPart = (p: typeof diagramParts[0]) => {
    setSelectedBodyPart(p.id);
    setTimeout(() => {
      p.ref.current?.focus();
      p.ref.current?.select();
    }, 80);
  };

  // AI comments generator
  const getAICoachComments = () => {
    const commentsList: { text: string; type: "motivation" | "success" | "humor" | "alert" | "milestone" }[] = [];
    const name = currentUser?.name?.split(" ")[0] || "Bodhishaper";

    if (userStreak >= 7) {
      commentsList.push({ text: `🔥 ${name}, sua disciplina está brilhando! Uma sequência de ${userStreak} dias consolida novos hábitos e fortalece o seu espírito indômito de leão.`, type: "milestone" });
    }
    if (imc.value > 0) {
      commentsList.push({ text: `🧬 Seu IMC atual é de ${imc.value} kg/m² (${imc.text}). Continue ajustando o consumo e as séries de treinos para consolidar o estado físico do guerreiro Budista!`, type: "success" });
    }
    if (photos.length > 0) {
      commentsList.push({ text: `📸 Com ${photos.length} fotos salvas de progresso, sua metamorfose física e espiritual está blindada na nuvem contra desvios de foco.`, type: "success" });
    }
    if (totalDaimokuMinutes > 0) {
      commentsList.push({ text: `😂 O seu karma pessoal está correndo de esteira para conseguir acompanhar toda a sua evolução no altar e no shape!`, type: "humor" });
    }
    commentsList.push({ text: `🪷 O Nam-myoho-rengue-kyo vibra forte em sua corrente sanguínea. Seus treinos criam causas incomparáveis de saúde e vigor!`, type: "motivation" });
    return commentsList;
  };

  const aiComments = getAICoachComments();

  const toLocalYYYYMMDD = (d: Date) => {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const dy = String(d.getDate()).padStart(2, "0");
    return `${yr}-${mo}-${dy}`;
  };

  // Generate last 30 calendar days
  const past30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d;
  });

  const getDayMetrics = (date: Date) => {
    const dateStr = toLocalYYYYMMDD(date);
    const dayActs = userActivities.filter(a => {
      try {
        const actD = new Date(a.timestamp);
        return toLocalYYYYMMDD(actD) === dateStr;
      } catch (e) {
        return a.timestamp.split("T")[0] === dateStr;
      }
    });
    const dayPoints = dayActs.reduce((sum, a) => sum + (a.points || 0), 0);
    const gMorning = dayActs.some(a => a.type === "gongyo_morning");
    const gEvening = dayActs.some(a => a.type === "gongyo_evening");
    const dMins = dayActs.filter(a => a.type === "daimoku").reduce((sum, a) => sum + (a.minutes || 0), 0);
    const hasWorkout = dayActs.some(a => a.type === "exercise");

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

  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);

  // Filter historic table
  const filteredActivities = userActivities
    .filter(a => {
      if (filterType === "all") return true;
      if (filterType === "gongyo") return a.type === "gongyo_morning" || a.type === "gongyo_evening";
      if (filterType === "daimoku") return a.type === "daimoku";
      if (filterType === "exercise") return a.type === "exercise";
      return true;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Render Weight History Chart Helper using simple SVG
  const renderWeightHistoryChart = () => {
    const history = currentUser?.weightHistory || [];
    if (history.length < 2) {
      return (
        <div className="h-36 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl p-4 bg-slate-950/20 text-center">
          <Scale className="w-6 h-6 text-slate-600 mb-1.5 animate-pulse" />
          <p className="text-[10px] text-slate-500 font-mono">Pesos insuficientes para traçar gráficos ({history.length}/2)</p>
          <span className="text-[9px] text-slate-600 mt-0.5">Registre seu peso hoje para iniciar a linha de tendência.</span>
        </div>
      );
    }

    const minWeight = Math.min(...history.map(h => h.weight)) - 1;
    const maxWeight = Math.max(...history.map(h => h.weight)) + 1;
    const range = maxWeight - minWeight || 1;

    const width = 450;
    const height = 150;
    const padding = 20;

    const points = history.map((h, idx) => {
      const x = padding + (idx / (history.length - 1)) * (width - padding * 2);
      const y = height - padding - ((h.weight - minWeight) / range) * (height - padding * 2);
      return { x, y, ...h };
    });

    const linePath = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

    return (
      <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-850 space-y-1">
        <span className="text-[9px] font-black uppercase text-indigo-400 font-mono tracking-wider block">📈 Histórico de Gráficos Cronológicos (kg)</span>
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto text-indigo-500">
            {/* Grid Lines */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1e293b" strokeDasharray="3 3" />
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#1e293b" strokeDasharray="3 3" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" />

            {/* Main Path Curve */}
            <path d={linePath} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-indigo-500" />

            {/* Glowing dots */}
            {points.map((p, i) => (
              <g key={i} className="group cursor-help">
                <circle cx={p.x} cy={p.y} r="5" className="fill-indigo-400 stroke-slate-950 stroke-2 hover:r-7 transition-all" />
                <text x={p.x} y={p.y - 8} textAnchor="middle" className="text-[8px] font-bold font-mono fill-indigo-200 bg-slate-950/80">
                  {p.weight}kg
                </text>
                <text x={p.x} y={height - 2} textAnchor="middle" className="text-[7.5px] font-mono fill-slate-500">
                  {p.date.split("-").slice(1).reverse().join("/")}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" id="private-evolution-container">
      
      {/* Toast floating notifications system */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-indigo-500 text-indigo-300 px-4 py-3 rounded-xl shadow-2xl text-xs font-bold font-heading flex items-center gap-2 animate-bounce">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Badge Explain overlay Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-850 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative">
            <span className="text-4xl block text-center select-none">{selectedBadge.icon}</span>
            <div className="text-center space-y-1">
              <h4 className="text-base font-black font-heading text-slate-100">{selectedBadge.title}</h4>
              <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-wider">Troféu Particular</p>
            </div>
            
            <p className="text-xs text-slate-350 leading-relaxed text-center bg-slate-950/60 p-3 rounded-xl border border-slate-850/40">
              {selectedBadge.desc}
            </p>

            <div className="space-y-1.5 text-[11px] bg-slate-950/30 p-3 rounded-lg border border-slate-850">
              <span className="font-bold text-slate-400 uppercase tracking-wide text-[9px] block">Como Desbloquear:</span>
              <p className="text-slate-300">{selectedBadge.howTo}</p>
            </div>

            <div className="flex justify-between items-center text-[10px] pt-1">
              <span className={`font-mono font-bold ${selectedBadge.unlocked ? "text-emerald-400" : "text-amber-500"}`}>
                Status: {selectedBadge.unlocked ? "🏆 CONQUISTADO!" : "🔒 Bloqueado"}
              </span>
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="py-1 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Privacy Guard Header Disclaimer */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-indigo-900/30 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 p-8 text-indigo-500/10 pointer-events-none">
          <BadgeCheck className="w-24 h-24 stroke-[1]" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[9px] font-extrabold uppercase py-1 px-3 rounded-full tracking-wider font-mono flex items-center gap-1.5 w-fit">
              <span>🔒 Espaço estritamente Privado</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            </span>
            <h2 className="text-xl font-black font-heading text-slate-100 flex items-center gap-2">
              Painel de Evolução Pessoal & Insights de Evolução
            </h2>
            <p className="text-xs text-slate-450 leading-relaxed max-w-2xl">
              Nenhum outro praticante tem acesso a esta folha privada de desenvolvimento humano. Aqui o foco é estritamente comparar você consigo mesmo, cultivando a constância que dissolve o karma.
            </p>
          </div>
          
          <div className="bg-indigo-950/40 p-3 rounded-xl border border-indigo-900/20 text-center shrink-0">
            <span className="text-[9px] text-indigo-400 block font-mono">DURAÇÃO DO SHAPE</span>
            <span className="text-sm font-black font-mono text-indigo-300">🔥 {userStreak}d Inabaláveis</span>
          </div>
        </div>
      </div>

      {/* Visual Sub - Tabs navigation */}
      <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-850 overflow-x-auto w-full max-w-2xl gap-0.5">
        {[
          { id: "insights", icon: Sparkles, label: "Insights de Evolução" },
          ...(!focusOnDaimoku ? [{ id: "body", icon: Scale, label: "Meu Corpo & Medidas" }] : []),
          { id: "photos", icon: Image, label: "Galeria de Fotos" },
          { id: "calendar", icon: Calendar, label: "Frequência Soka" },
          { id: "history", icon: History, label: "Histórico Completo" },
        ].map((subTab) => {
          const Icon = subTab.icon;
          const active = activeSubTab === subTab.id;
          return (
            <button
              key={subTab.id}
              onClick={() => setActiveSubTab(subTab.id as any)}
              className={`flex-1 py-2 px-3 text-[10.5px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition shrink-0 whitespace-nowrap ${
                active 
                  ? "bg-indigo-650 text-white shadow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{subTab.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          
          {/* 1. IA COACH INSIGHTS TAB */}
          {activeSubTab === "insights" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="evolution-insights-grid">
              
              {/* Left Column: Private metrics evolution comparing with previous weeks */}
              {!focusOnDaimoku && (
                <div className="md:col-span-1 space-y-6">
                  
                  {/* Total Stats card */}
                  <div className="bg-slate-900/50 rounded-2xl border border-slate-800/80 p-5 space-y-4 shadow">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-heading">
                      🛡️ Energia Consolidada
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850">
                        <span className="text-[9px] text-slate-500 uppercase font-black block">Daimoku</span>
                        <span className="text-lg font-black text-rose-450 font-mono">{totalDaimokuHours}h</span>
                        <span className="text-[8px] text-slate-550 block font-mono mt-0.5">({totalDaimokuMinutes}m)</span>
                      </div>
                      
                      <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850">
                        <span className="text-[9px] text-slate-500 uppercase font-black block">Gongyo</span>
                        <span className="text-lg font-black text-indigo-400 font-mono">{totalGongyoCount}</span>
                        <span className="text-[8px] text-slate-550 block font-mono mt-0.5">vezes</span>
                      </div>
                      
                      <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850">
                        <span className="text-[9px] text-slate-500 uppercase font-black block">Cardio/Musc</span>
                        <span className="text-lg font-black text-emerald-400 font-mono">{totalExCount}</span>
                        <span className="text-[8px] text-slate-550 block font-mono mt-0.5">treinos</span>
                      </div>

                      <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850">
                        <span className="text-[9px] text-slate-500 uppercase font-black block">Gongyo Streak</span>
                        <span className="text-lg font-black text-orange-400 font-mono">🔥 {gongyoStreak}d</span>
                        <span className="text-[8px] text-slate-550 block font-mono mt-0.5">correntes</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 space-y-2">
                        <span className="text-[9px] uppercase font-bold text-[#FF85A1] block font-heading">
                          📈 Tendência Semanal (Comparação):
                        </span>
                        
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between items-center text-slate-300">
                            <span>Daimoku de hoje/esta semana:</span>
                            <span className={`font-mono font-bold ${comp.daimokuDiff >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              {comp.thisWeekDaimoku}m ({comp.daimokuDiff >= 0 ? "+" : ""}{comp.daimokuDiff}m)
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-slate-300">
                            <span>Série de exercícios concluídos:</span>
                            <span className={`font-mono font-bold ${comp.exDiff >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              {comp.thisWeekEx} ({comp.exDiff >= 0 ? "+" : ""}{comp.exDiff})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Private Medal Trophy achievements section */}
                  <div className="bg-slate-900/50 rounded-2xl border border-slate-800/80 p-5 space-y-4 shadow">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-heading">
                        🏅 Conquistas Pessoais ({dynamicBadges.filter(b => b.unlocked).length}/{dynamicBadges.length})
                      </h3>
                      <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {dynamicBadges.map((badge) => (
                        <div 
                          key={badge.id}
                          onClick={() => setSelectedBadge(badge)}
                          className={`p-2.5 rounded-xl border text-center cursor-pointer transition select-none ${
                            badge.unlocked 
                              ? "bg-slate-950 border-indigo-500/40 hover:border-indigo-500" 
                              : "bg-slate-955/20 border-slate-900/50 opacity-20 hover:opacity-40"
                          }`}
                          title={`Clique para ver detalhes de "${badge.title}"`}
                        >
                          <span className="text-2xl block">{badge.icon}</span>
                          <span className="text-[8.5px] font-bold block truncate mt-1 text-slate-300 font-mono leading-none">{badge.title}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[9px] text-slate-500 italic text-center leading-normal">Toque nos troféus para ver requisitos e instruções de desbloqueio.</p>
                  </div>

                </div>
              )}

              {/* Right Columns: AI Interactive feedback scrolling chat bubbles */}
              <div className={`${focusOnDaimoku ? "md:col-span-3" : "md:col-span-2"} space-y-4`}>
                
                {/* PERSONAL DAIMOKU BUBBLE CHART CARD WITH CUSTOMIZABLE OBJECTIVE */}
                <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 flex flex-col shadow-xl space-y-5" id="personal-daimoku-bubble-goal-card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="bg-[#241B33] text-[#FF85A1] text-[10px] font-bold font-mono py-1 px-3 border border-pink-900/20 rounded-full uppercase tracking-wider">
                        🎯 Objetivo de Daimoku Personalizado
                      </span>
                      <h3 className="text-base font-bold font-heading text-slate-100 mt-2">
                        Seu Gráfico de Esferas Individuais
                      </h3>
                      <p className="text-xs text-slate-450 mt-1 leading-relaxed">
                        Defina o seu alvo espiritual em minutos e acompanhe as bolinhas serem <span className="text-indigo-400 font-semibold">pintadas automaticamente</span> (cada bolinha = 5 minutos) à medida que você registra suas práticas.
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0 self-start sm:self-center bg-slate-950/45 p-3 rounded-xl border border-slate-800/40">
                      <label className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">Meta em Minutos</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="5"
                          step="5"
                          value={personalGoal}
                          onChange={(e) => handleUpdateGoal(Number(e.target.value))}
                          className="w-20 text-center text-xs font-mono font-bold border border-slate-700 bg-slate-900 text-indigo-300 rounded-lg p-1 outline-none focus:border-indigo-550"
                        />
                        <span className="text-xs text-slate-400 font-mono">min</span>
                      </div>
                    </div>
                  </div>

                  {/* Preset quickly clickable buttons */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] font-mono font-semibold text-slate-500">Preset Rápido:</span>
                    {[30, 60, 120, 300, 600, 1200].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => handleUpdateGoal(mins)}
                        className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border transition-all ${
                          personalGoal === mins
                            ? "bg-indigo-650 border-indigo-500/50 text-white shadow-lg"
                            : "border-slate-850 bg-slate-950/40 text-slate-450 hover:text-slate-200 hover:bg-slate-950"
                        }`}
                      >
                        {mins >= 60 ? `${mins / 60}h (${mins}m)` : `${mins}m`}
                      </button>
                    ))}
                  </div>

                  {/* Bubble stats & state bar */}
                  {(() => {
                    const numBolinhasPraticadas = Math.floor(totalDaimokuMinutes / 5);
                    const numBolinhasObjetivo = Math.ceil(personalGoal / 5);
                    const totalBubblesToShow = Math.max(numBolinhasObjetivo, numBolinhasPraticadas);
                    const percentComplete = Math.min(100, Number(((totalDaimokuMinutes / personalGoal) * 100).toFixed(1))) || 0;
                    const isGoalAchieved = totalDaimokuMinutes >= personalGoal;

                    // Create array size of total bubbles to display
                    const bubbleSlots = Array.from({ length: Math.min(180, totalBubblesToShow) });

                    return (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/40 p-4 rounded-xl border border-slate-850/50 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">Praticado por você</span>
                            <span className="text-sm font-black text-rose-400 font-mono mt-0.5">{totalDaimokuMinutes} min</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">Seu Objetivo</span>
                            <span className="text-sm font-black text-indigo-300 font-mono mt-0.5">{personalGoal} min</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">Bolinhas Pintadas</span>
                            <span className="text-sm font-black text-amber-300 font-mono mt-0.5">{numBolinhasPraticadas} / {numBolinhasObjetivo}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">Status Geral</span>
                            <span className={`text-[10px] font-bold leading-relaxed px-2.5 py-0.5 rounded-md border w-fit block mt-1 ${
                              isGoalAchieved 
                                ? "bg-emerald-950/40 border-emerald-900/40 text-emerald-350"
                                : "bg-indigo-955/20 border-indigo-900/30 text-indigo-300"
                            }`}>
                              {isGoalAchieved ? "🏆 Meta Batida!" : `${percentComplete}%`}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Grid Board of Beads */}
                        <div className="bg-slate-950/70 rounded-2xl p-5 border border-slate-850 flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden">
                          {/* Stars decorative background */}
                          <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]"></div>

                          <div className="flex flex-wrap gap-2 justify-center max-w-lg z-10 w-full p-2">
                            {bubbleSlots.map((_, idx) => {
                              const isFilled = idx < numBolinhasPraticadas;
                              const isExtra = idx >= numBolinhasObjetivo; // exceeded target bubbles!

                              return (
                                <motion.div
                                  key={idx}
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: Math.min(1.2, idx * 0.01), type: "spring" }}
                                  whileHover={{ scale: 1.25 }}
                                  className={`w-5.5 h-5.5 rounded-full flex items-center justify-center relative group select-none transition-all ${
                                    isFilled
                                      ? isExtra
                                        ? "bg-gradient-to-br from-indigo-400 via-pink-400 to-[#FF85A1] shadow-[0_0_8px_rgba(255,133,161,0.6)] cursor-help border border-pink-300/20"
                                        : "bg-gradient-to-br from-amber-300 via-yellow-400 to-[#FF85A1] shadow-[0_0_6px_rgba(247,196,40,0.4)] cursor-help border border-amber-300/10"
                                      : "border border-slate-800 bg-slate-950/30 text-slate-600 cursor-pointer hover:border-slate-700 hover:bg-slate-900/40"
                                  }`}
                                >
                                  {/* Bubble core center */}
                                  {isFilled ? (
                                    <span className="w-1.5 h-1.5 rounded-full bg-white opacity-90"></span>
                                  ) : (
                                    <span className="text-[8.5px] font-mono text-slate-650">{idx + 1}</span>
                                  )}

                                  {/* Tooltip on hover */}
                                  <div className="absolute bottom-7 bg-slate-950 text-slate-150 text-[9px] font-mono py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none border border-slate-800">
                                    {isFilled 
                                      ? `Esfera #${idx + 1} Pintada! (Minutos ${idx * 5 + 1} a ${(idx + 1) * 5})` 
                                      : `Esfera #${idx + 1} Pendente (Minutos ${idx * 5 + 1} a ${(idx + 1) * 5})`}
                                    {isExtra && " (🏆 Extra!)"}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>

                          <p className="text-[9px] text-slate-500 font-mono mt-4 text-center font-medium">
                            {numBolinhasPraticadas} de {numBolinhasObjetivo} esferas de determinação coloridas • Cada bolinha representa 5 minutos de Daimoku praticado.
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="bg-slate-900/50 rounded-2xl border border-slate-800/85 p-6 shadow space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-indigo-400 animate-spin" />
                      <div>
                        <h3 className="font-bold text-sm text-slate-100 font-heading">
                          Comentários do seu AI Coach de Evolução
                        </h3>
                        <p className="text-[10px] text-slate-450 uppercase font-mono tracking-wider">
                          Análise autônoma baseada nos seus dados de produção
                        </p>
                      </div>
                    </div>

                    {/* Chat Bubble List */}
                    <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                      {aiComments.map((comment, idx) => {
                        let headerText = "💡 INSIGHT DE DISSOLUÇÃO";
                        let colorClasses = "bg-slate-955/70 border-slate-850 text-slate-300";
                        let icon = "💡";

                        if (comment.type === "milestone") {
                          headerText = "🔥 CONQUISTA DE CONSTÂNCIA";
                          colorClasses = "bg-orange-955/10 border-orange-900/30 text-orange-250";
                          icon = "🏆";
                        } else if (comment.type === "success") {
                          headerText = "🚀 EVOLUÇÃO ATIVA";
                          colorClasses = "bg-emerald-955/10 border-emerald-900/30 text-emerald-250";
                          icon = "📈";
                        } else if (comment.type === "humor") {
                          headerText = "😂 ZEN HUMOR SAUDÁVEL";
                          colorClasses = "bg-indigo-955/10 border-indigo-900/30 text-indigo-250";
                          icon = "✨";
                        }

                        return (
                          <div 
                            key={idx} 
                            className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed transition ${colorClasses}`}
                          >
                            <span className="text-xl shrink-0 mt-0.5">{icon}</span>
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-wider block font-mono text-slate-450">
                                {headerText}
                              </span>
                              <p className="font-medium text-[11.5px] leading-relaxed">
                                {comment.text}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-850 shrink-0 text-center text-[10px] text-slate-500 font-medium italic">
                    "O Buda que habita em você respeita e incentiva o guerreiro no shape. Erga-se hoje!"
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 2. BODY METRICS TAB ("MEU CORPO & MEDIDAS") */}
          {activeSubTab === "body" && (
            <div className="space-y-6" id="private-body-metrics">
              
              {/* Form 1: Meu Corpo Hoje */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Inputs Fields */}
                <div className="lg:col-span-1 bg-slate-900/50 rounded-2xl border border-slate-800/80 p-5 space-y-4 shadow">
                  <div className="space-y-1">
                    <span className="text-xl">🧬</span>
                    <h3 className="text-sm font-black text-slate-200 font-heading">Meu Corpo Hoje</h3>
                    <p className="text-[11px] text-slate-450">Monitore pesos, metas e veja seu IMC ser calculado instantaneamente conforme as regras científicas da OMS.</p>
                  </div>

                  <form onSubmit={saveMeuCorpo} className="space-y-3.5 text-xs text-left">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-wider text-indigo-300 block">Altura (cm)</label>
                      <input 
                        type="number"
                        placeholder="Ex: 175"
                        value={height || ""}
                        onChange={(e) => setHeight(Number(e.target.value))}
                        className="w-full text-xs font-mono font-bold bg-[#03010b] border border-slate-800 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-550 transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-wider text-indigo-300 block">Peso Inicial (kg)</label>
                      <input 
                        type="number"
                        step="0.1"
                        placeholder="Ex: 85.5"
                        value={initialWeight || ""}
                        onChange={(e) => setInitialWeight(Number(e.target.value))}
                        className="w-full text-xs font-mono font-bold bg-[#03010b] border border-slate-800 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-550 transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-wider text-indigo-300 block">Peso Atual (kg)</label>
                      <input 
                        type="number"
                        step="0.1"
                        placeholder="Ex: 79.2"
                        value={currentWeight || ""}
                        onChange={(e) => setCurrentWeight(Number(e.target.value))}
                        className="w-full text-xs font-mono font-bold bg-[#03010b] border border-slate-800 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-550 transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-wider text-indigo-300 block">Peso Objetivo (kg)</label>
                      <input 
                        type="number"
                        step="0.1"
                        placeholder="Ex: 75.0"
                        value={targetWeight || ""}
                        onChange={(e) => setTargetWeight(Number(e.target.value))}
                        className="w-full text-xs font-mono font-bold bg-[#03010b] border border-slate-800 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-550 transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingBodyData}
                      className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-1 text-[10px] uppercase font-mono"
                    >
                      {isSavingBodyData ? "Salvando..." : "💾 Registrar Novo Peso"}
                    </button>
                  </form>
                </div>

                {/* Real-time automatic IMC classifier widget & Weight history chart */}
                <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* IMC classification panel */}
                    <div className={`p-5 rounded-2xl border ${imc.color} space-y-3 shadow-md`}>
                      <span className="text-xs uppercase font-black font-mono block tracking-wider opacity-60">Calculadora de IMC Automático</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black font-mono">{imc.value || "--"}</span>
                        <span className="text-xs font-mono text-slate-400">kg/m²</span>
                      </div>
                      <div className="font-heading font-extrabold text-xs">
                        Classificação: {imc.text}
                      </div>
                      <p className="text-[10px] leading-relaxed opacity-80 pt-1 font-sans">
                        IMC é a medida internacional adotada pela OMS para diagnosticar faixas de peso corporal. Continue praticando Daimoku, Gongyo e shape para manter o peso saudável!
                      </p>
                    </div>

                    {/* Weight goal gap tracker slider */}
                    <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3 shadow shadow-slate-950">
                      <span className="text-xs uppercase font-black text-indigo-300 font-mono tracking-wider block">Meta de Peso Restante</span>
                      {currentWeight && targetWeight ? (() => {
                        const delta = Number((currentWeight - targetWeight).toFixed(1));
                        const loss = initialWeight ? Number((initialWeight - currentWeight).toFixed(1)) : 0;
                        return (
                          <div className="space-y-3.5 pt-0.5 text-xs">
                            <div className="flex justify-between font-mono">
                              <span className="font-bold">Distância da Meta:</span>
                              <span className={delta <= 0 ? "text-emerald-400 font-black" : "text-amber-500 font-black"}>
                                {delta <= 0 ? "Meta Alcançada! 🎉" : `${delta} kg restantes`}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                              <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full"
                                style={{ width: `${Math.max(10, Math.min(100, (loss / (initialWeight - targetWeight || 1)) * 100))}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[9px] font-mono text-slate-500">
                              <span>Inicial: {initialWeight}kg</span>
                              <span>Atual: {currentWeight}kg</span>
                              <span>Objetivo: {targetWeight}kg</span>
                            </div>
                          </div>
                        );
                      })() : (
                        <p className="text-[10px] text-slate-500 italic pt-3 font-mono">Selecione Peso Inicial, Atual e Alvo para carregar o termômetro de evolução.</p>
                      )}
                    </div>
                  </div>

                  {/* Weight Progress Chronological Line Chart */}
                  {renderWeightHistoryChart()}
                </div>
              </div>

              {/* Form 2: Biomechanical Body Scanner & Dimensional Inputs */}
              <div className="bg-slate-900/40 rounded-2xl border border-slate-800/80 p-6 shadow space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-lg">📐</span>
                    <h3 className="text-sm font-black text-slate-200 font-heading">
                      Biomecanismo e Medidas Corporais (Morfologia)
                    </h3>
                    <p className="text-xs text-slate-450 max-w-2xl">
                      Utilize o <span className="text-indigo-400 font-semibold uppercase">Scanner Antropométrico</span> abaixo. Clique em um dos sensores pulsantes nos marcadores do diagrama de corpo para focar ou preencher direto o campo correspondente.
                    </p>
                  </div>
                  <div className="flex gap-2 items-center bg-slate-950/60 p-2.5 px-3.5 border border-slate-850 rounded-xl shrink-0 text-center">
                    <span className="text-[9.5px] font-mono text-slate-500 block uppercase">Último Escaneamento:</span>
                    <span className="text-xs font-mono font-bold text-[#39df1d]">
                      {currentUser?.lastActive ? new Date(currentUser.lastActive).toLocaleDateString("pt-BR") : "Nunca"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  
                  {/* Left component: Graphical Pulsing Interactive Body diagram SVG */}
                  <div className="md:col-span-5 flex justify-center bg-[#070414] border border-slate-850 p-6 rounded-2xl relative shadow-inner overflow-hidden select-none">
                    
                    {/* Glowing Tech telemetry grids */}
                    <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:10px_10px]" />
                    <div className="absolute top-2 left-2 text-[8px] text-slate-650 font-mono">TELEMETRY_SCANNER_V2_ACTIVE</div>
                    <div className="absolute bottom-2 right-2 text-[8px] text-slate-650 font-mono">GRID: 0.1M SECURE</div>

                    <div className="w-56 h-80 relative">
                      {/* Silicon Body Core Outline */}
                      <svg viewBox="0 0 100 200" className="w-full h-full text-slate-800">
                        {/* Head */}
                        <circle cx="50" cy="18" r="12" className="fill-slate-900 border stroke-indigo-500/20 stroke-2" />
                        {/* Arms & Torso */}
                        <path d="M 35 44 C 35 44, 18 58, 18 64 C 18 72, 24 100, 24 100 L 32 98 L 32 144 L 68 144 L 68 98 L 76 100 L 82 64 C 82 58, 65 44, 65 44 Z" className="fill-indigo-950/20 stroke-indigo-500/30 stroke-1.5" />
                        {/* Legs outline overlay */}
                        <path d="M 34 144 L 38 198 L 48 198 L 50 148 L 52 198 L 62 198 L 66 144 Z" className="fill-violet-950/20 stroke-indigo-500/20 stroke-1.5" />
                      </svg>

                      {/* Overlays pulsing beacons coordinate sensor nodes */}
                      {diagramParts.map((p) => {
                        const active = selectedBodyPart === p.id;
                        return (
                          <div 
                            key={p.id}
                            style={{ left: p.cx + "%", top: p.cy + "%" }}
                            onClick={() => handleFocusBodyPart(p)}
                            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-25 group"
                          >
                            <span className={`absolute inline-flex h-4 w-4 rounded-full opacity-75 ${p.pulse} ${active ? "bg-indigo-550 border border-white" : "bg-indigo-500"}`} />
                            <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${active ? "bg-indigo-300 ring-4 ring-indigo-500/30 scale-120" : "bg-indigo-600 border border-slate-950"} transition-all`} />
                            
                            {/* Diagram Sensor label */}
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-slate-950 border border-slate-800 text-slate-100 text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded shadow z-40 transition-opacity pointer-events-none whitespace-nowrap">
                              {p.label}: {p.val || "--"} cm
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right components: input list fields columns */}
                  <div className="md:col-span-7 space-y-4">
                    <form onSubmit={saveGroupMeasurements} className="space-y-4 text-xs text-left">
                      <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-xl">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5">
                          {diagramParts.map((p) => {
                            const isFocusedPart = selectedBodyPart === p.id;
                            return (
                              <div 
                                key={p.id} 
                                onClick={() => setSelectedBodyPart(p.id)}
                                className={`p-2.5 rounded-xl border transition-all ${
                                  isFocusedPart 
                                    ? "bg-slate-950 border-indigo-500 ring-1 ring-indigo-550/20" 
                                    : "bg-slate-950/50 border-slate-850 hover:bg-slate-950"
                                }`}
                              >
                                <label className="text-[9.5px] font-black uppercase text-slate-450 block mb-1 font-heading">{p.label}</label>
                                <div className="flex items-center gap-1">
                                  <input 
                                    ref={p.ref}
                                    type="number"
                                    step="0.1"
                                    placeholder="0"
                                    value={p.val || ""}
                                    onChange={(e) => p.setVal(Number(e.target.value))}
                                    className="w-full text-xs font-mono font-bold bg-[#020108] border border-slate-850 rounded p-1 outline-none text-slate-200"
                                  />
                                  <span className="text-[10px] text-slate-500 font-mono shrink-0">cm</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingBodyData}
                        className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 disabled:opacity-50 text-white font-extrabold uppercase tracking-wide rounded-xl text-[10.5px] font-mono cursor-pointer transition text-center shadow"
                      >
                        {isSavingBodyData ? "Salvando Scanner..." : "💾 Gravar Dimensões Corporais Atuais"}
                      </button>
                    </form>

                    {/* Historical morphologic comparisons log */}
                    {currentUser?.bodyMeasurements ? (
                      <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-850 space-y-2 text-xs">
                        <span className="text-[9px] uppercase font-black tracking-wide text-indigo-400 block font-mono">📊 Relatório de Fita Métrica Compartilhado:</span>
                        <p className="text-[11px] text-slate-400 leading-normal">
                          Para melhores avaliações estéticas, procure medir-se sempre aos finais de semana desjejuando e registrando neste ambiente blindado. Comparar é a causa da disciplina!
                        </p>
                      </div>
                    ) : null}
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* 3. PROGRESS PHOTOS GALLERY TAB */}
          {activeSubTab === "photos" && (
            <div className="space-y-6" id="private-progress-photos">
              
              {/* Photo Upload Form / Action button */}
              <div className="bg-slate-900/50 rounded-2xl border border-slate-800/85 p-6 shadow space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-205 font-heading">
                      Galeria de Fotos de Progresso Humano & Shape
                    </h3>
                    <p className="text-xs text-slate-440 mt-0.5">
                      Controle visual histórico de suas conquistas e postura. Somente você pode visualizar estas imagens.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setNewPhotoCaption("");
                      setShowPhotoForm(!showPhotoForm);
                    }}
                    className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-605 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition shadow-md cursor-pointer select-none"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{showPhotoForm ? "Cancelar Registro" : "Adicionar Foto de Progresso"}</span>
                  </button>
                </div>

                {showPhotoForm && (
                  <div className="bg-slate-950/50 p-4 border border-indigo-900/30 rounded-xl space-y-3.5 text-xs">
                    <span className="text-[10px] uppercase font-black text-indigo-300 block tracking-wider font-heading">
                      📸 Selecionar Arquivo de Evolução do Celular:
                    </span>
                    
                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-heading block">Legenda / Relato / Peso do Dia:</label>
                      <input 
                        type="text"
                        placeholder="Ex: Treino de Perna Puxado + Altar forte feito"
                        value={newPhotoCaption}
                        onChange={(e) => setNewPhotoCaption(e.target.value)}
                        className="w-full text-xs font-mono border border-slate-700 bg-slate-900 text-slate-100 rounded-xl p-2 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <button
                        type="button"
                        onClick={() => document.getElementById("native-gallery-progress-uploader")?.click()}
                        disabled={isUploadingPhoto}
                        className="w-full py-3 border border-dashed border-indigo-500/20 hover:border-indigo-500 bg-indigo-950/25 hover:bg-indigo-950/40 text-indigo-300 rounded-xl font-bold cursor-pointer transition select-none flex items-center justify-center gap-2 text-xs"
                      >
                        {isUploadingPhoto ? "✨ Enviando e Gravando..." : "📸 Escolher Galeria / Câmera Integrada"}
                      </button>
                      <input 
                        id="native-gallery-progress-uploader"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAddPrivateDocPhoto}
                      />
                    </div>
                  </div>
                )}

                {/* Display grid of photos */}
                {photos.length > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {photos.map(p => (
                        <div key={p.id} className="bg-slate-950/60 rounded-xl overflow-hidden border border-slate-850 flex flex-col justify-between shadow">
                          <div className="relative aspect-video max-h-48 overflow-hidden bg-slate-950">
                            <img
                              src={p.url}
                              alt={p.caption}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute top-2.5 left-2.5 text-[8.5px] font-black uppercase tracking-wider py-1 px-2.5 rounded-full bg-indigo-950/80 border border-indigo-800/50 text-indigo-200">
                              📷 PROGRES_PHOTO
                            </span>

                            <button
                              type="button"
                              onClick={() => handleDeleteDocPhoto(p.id)}
                              className="absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:text-rose-455 text-slate-400 rounded-full transition cursor-pointer"
                              title="Apagar foto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="p-3.5 space-y-1.5 text-left">
                            <span className="text-[10px] font-bold font-mono text-slate-500">{p.date.split("-").reverse().join("/")} • Registro Pessoal</span>
                            <p className="text-xs text-slate-300 leading-relaxed font-sans">{p.caption}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Antes & Depois visual slider comparator */}
                    {photos.length > 1 && (
                      <div className="bg-slate-950/50 border border-slate-850 p-5 rounded-2xl space-y-4">
                        <div className="space-y-1">
                          <span className="text-lg">⚖️</span>
                          <h4 className="text-sm font-black text-slate-200 font-heading">Histórico de Mudança: Antes & Depois</h4>
                          <p className="text-xs text-slate-450">Selecione quaisquer dois registros de metamorfose da sua galeria secreta e compare lado a lado sua silhueta física e de postura.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[9.5px] font-mono tracking-widest font-black uppercase text-slate-450 block mb-1">Selecione Foto Inicial (Antes):</label>
                            <select 
                              value={selectedBeforeUrl}
                              onChange={(e) => setSelectedBeforeUrl(e.target.value)}
                              className="w-full text-xs font-mono font-bold bg-[#04010b] border border-slate-800 rounded-xl p-2"
                            >
                              {photos.map(p => (
                                <option key={p.id} value={p.url}>{p.date.split("-").reverse().join("/")} - {p.caption.slice(0, 30)}...</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[9.5px] font-mono tracking-widest font-black uppercase text-slate-450 block mb-1">Selecione Foto da Evolução (Depois):</label>
                            <select 
                              value={selectedAfterUrl}
                              onChange={(e) => setSelectedAfterUrl(e.target.value)}
                              className="w-full text-xs font-mono font-bold bg-[#04010b] border border-slate-800 rounded-xl p-2"
                            >
                              {photos.map(p => (
                                <option key={p.id} value={p.url}>{p.date.split("-").reverse().join("/")} - {p.caption.slice(0, 30)}...</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {selectedBeforeUrl && selectedAfterUrl && (
                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="bg-[#03010c] border border-slate-850 p-2 rounded-2xl relative shadow-md">
                              <span className="absolute top-4 left-4 bg-red-950/90 text-red-400 text-[8.5px] tracking-widest font-black py-0.5 px-2 rounded font-mono border border-red-900/20 z-10">ANTES</span>
                              <div className="aspect-[4/3] rounded-xl overflow-hidden select-none">
                                <img src={selectedBeforeUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                            </div>
                            <div className="bg-[#03010c] border border-slate-850 p-2 rounded-2xl relative shadow-md">
                              <span className="absolute top-4 left-4 bg-emerald-955 text-emerald-400 text-[8.5px] tracking-widest font-black py-0.5 px-2 rounded font-mono border border-emerald-900/20 z-10">DEPOIS</span>
                              <div className="aspect-[4/3] rounded-xl overflow-hidden select-none">
                                <img src={selectedAfterUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-950/30 border border-slate-855 rounded-xl p-8 text-center text-slate-500">
                    <p className="text-xs">Nenhuma foto de progresso privado adicionada por enquanto.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. FREQUENCY CALENDAR TAB (Calendário de consistência) */}
          {activeSubTab === "calendar" && (
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800/80 p-6 shadow space-y-6" id="private-calendar-view">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-205 font-heading">
                    Calendário de Consistência e Ritmo Cósmico
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Seu mapa de hábitos nos últimos 30 dias. Clique sobre qualquer célula para visualizar o relatório estendido.
                  </p>
                </div>
                
                {/* Legends */}
                <div className="flex flex-wrap items-center gap-3 text-[9px] uppercase font-bold text-slate-400">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-indigo-500/80 rounded" /> Gongyo</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#FF85A1] rounded" /> Daimoku</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500/80 rounded" /> Exercícios</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 rounded" /> Completo</span>
                </div>
              </div>

              {/* Grid 30 days contributions */}
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                {past30Days.map((date, idx) => {
                  const m = getDayMetrics(date);
                  let colorClass = "bg-slate-950/40 border-slate-900 text-slate-500";
                  
                  if (m.gMorning && m.gEvening && m.dMins >= 15 && m.hasWorkout) {
                    colorClass = "bg-amber-550 border-amber-400/50 text-white shadow shadow-amber-950/40";
                  } else if (m.dayPoints >= 8) {
                    colorClass = "bg-indigo-600 border-indigo-500/30 text-white shadow shadow-indigo-950/30";
                  } else if (m.hasWorkout && m.dMins > 0) {
                    colorClass = "bg-emerald-600/90 border-emerald-500/40 text-emerald-100";
                  } else if (m.dMins > 0) {
                    colorClass = "bg-rose-900/60 border-rose-800/40 text-rose-150";
                  } else if (m.gMorning || m.gEvening) {
                    colorClass = "bg-[#271E40] border-indigo-900/30 text-indigo-300";
                  }

                  const formattedDate = date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
                  const isSelected = selectedDayIdx === idx;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedDayIdx(isSelected ? null : idx)}
                      className={`relative aspect-square rounded-xl border flex flex-col items-center justify-center p-1 cursor-pointer transition transform hover:scale-105 active:scale-95 ${colorClass} ${
                        isSelected ? "ring-2 ring-indigo-400 border-transparent scale-105 z-10" : ""
                      }`}
                    >
                      <span className="text-[10px] font-sans font-bold leading-none">{formattedDate.split(" ")[0]}</span>
                      <span className="text-[7.5px] uppercase font-bold font-mono tracking-wider mt-1">{formattedDate.split(" ")[2]}</span>
                      
                      {/* Dots inside cells */}
                      <div className="flex gap-0.5 mt-1">
                        {m.gMorning && <span className="w-1 h-1 rounded-full bg-indigo-400" />}
                        {m.dMins > 0 && <span className="w-1 h-1 rounded-full bg-rose-400" />}
                        {m.hasWorkout && <span className="w-1 h-1 rounded-full bg-emerald-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Day details dialog drawer inside tab */}
              {selectedDayIdx !== null && (() => {
                const dayDate = past30Days[selectedDayIdx];
                const m = getDayMetrics(dayDate);
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl space-y-3"
                  >
                    <div className="flex justify-between items-center text-xs font-bold font-heading">
                      <span className="text-slate-200">
                        📆 Relatório Detalhado: {dayDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      </span>
                      <span className="bg-indigo-500/10 text-indigo-400 py-0.5 px-2.5 border border-indigo-500/20 rounded-full font-mono">
                        {m.dayPoints} Pontos de Causa
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div className={`p-2.5 rounded-xl border text-center ${m.gMorning ? "bg-indigo-950/30 border-indigo-900/40 text-indigo-200" : "bg-slate-900/20 border-slate-850 text-slate-500"}`}>
                        <span className="block text-[8px] font-mono tracking-wider">🌅 GONGYO MANHÃ</span>
                        <span className="font-bold text-xs uppercase block mt-1">{m.gMorning ? "✔ REALIZADO" : "PENDENTE"}</span>
                      </div>

                      <div className={`p-2.5 rounded-xl border text-center ${m.gEvening ? "bg-indigo-950/30 border-indigo-900/40 text-indigo-200" : "bg-slate-900/20 border-slate-850 text-slate-500"}`}>
                        <span className="block text-[8px] font-mono tracking-wider">🌃 GONGYO NOITE</span>
                        <span className="font-bold text-xs block uppercase mt-1">{m.gEvening ? "✔ REALIZADO" : "PENDENTE"}</span>
                      </div>

                      <div className={`p-2.5 rounded-xl border text-center ${m.dMins > 0 ? "bg-rose-950/30 border-rose-900/40 text-rose-200" : "bg-slate-900/20 border-slate-850 text-slate-500"}`}>
                        <span className="block text-[8px] font-mono tracking-wider">🪷 DAIMOKU INTEGRAL</span>
                        <span className="font-bold text-xs block mt-1">{m.dMins > 0 ? `✔ ${m.dMins} minutos` : "PENDENTE"}</span>
                      </div>

                      <div className={`p-2.5 rounded-xl border text-center ${m.hasWorkout ? "bg-emerald-955 border-emerald-900/40 text-emerald-250" : "bg-slate-900/20 border-slate-850 text-slate-500"}`}>
                        <span className="block text-[8px] font-mono tracking-wider">💪 MUSC/CARDIO SHAPE</span>
                        <span className="font-bold text-xs block uppercase mt-1">{m.hasWorkout ? "✔ CONCLUÍDO" : "PENDENTE"}</span>
                      </div>
                    </div>

                    {m.dayActs.length > 0 ? (
                      <div className="space-y-1.5 pt-1 text-left">
                        <span className="text-[9px] font-bold text-slate-450 uppercase block font-heading">Lançamento de Registros Privados:</span>
                        <div className="divide-y divide-slate-900">
                          {m.dayActs.map(a => (
                            <div key={a.id} className="py-2 flex justify-between items-center text-xs">
                              <span className="text-slate-300 font-medium">
                                {a.type === "daimoku" ? "🪷 Prática de Daimoku Concentrado" : a.type === "exercise" ? `💪 Atividade: ${a.category || "Treino"} (${a.subType || "Shape"})` : "🌅 Recitação de Gongyo Sacerdotal"}
                              </span>
                              <div className="flex gap-2 items-center text-[10px] font-mono text-slate-400">
                                <span>{a.minutes ? `${a.minutes} min` : ""}</span>
                                {a.notes && <span className="bg-slate-900 p-1 rounded italic text-slate-500">"{a.notes}"</span>}
                                <span className="py-0.5 px-2 bg-indigo-950 border border-indigo-900/30 rounded text-indigo-300">+{a.points}pts</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic mt-1 text-center font-mono">Nenhuma atividade registrada na base para este dia específico do calendário.</p>
                    )}
                  </motion.div>
                );
              })()}
            </div>
          )}

          {/* 5. DETAILED LOGS HISTORY LIST TAB */}
          {activeSubTab === "history" && (
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800/80 shadow overflow-hidden" id="private-history-logs">
              <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-205 font-heading">
                    Memoria do Altar privado
                  </h3>
                  <p className="text-xs text-slate-450 mt-0.5">
                    Histórico cronológico detalhado de todos os compromissos espirituais e físicos declarados.
                  </p>
                </div>

                {/* Filter Selector Buttons */}
                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-850">
                  {[
                    { id: "all", label: "Todos" },
                    { id: "gongyo", label: "Gongyo" },
                    { id: "daimoku", label: "Daimoku" },
                    { id: "exercise", label: "Treino" },
                  ].map(btn => (
                    <button
                      key={btn.id}
                      onClick={() => setFilterType(btn.id as any)}
                      className={`px-3 py-1 text-[10.5px] font-bold rounded transition ${
                        filterType === btn.id ? "bg-slate-800 text-indigo-300" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredActivities.length > 0 ? (
                <div className="divide-y divide-slate-850">
                  {filteredActivities.map(a => {
                    let icon = "🪷";
                    let titleLabel = "Daimoku Realizado";
                    let badgeClass = "bg-rose-500/10 text-rose-300 border-rose-500/20";
                    
                    if (a.type === "gongyo_morning") {
                      icon = "🌅";
                      titleLabel = "Gongyo da Manhã";
                      badgeClass = "bg-indigo-500/10 text-indigo-300 border-indigo-500/20";
                    } else if (a.type === "gongyo_evening") {
                      icon = "🌃";
                      titleLabel = "Gongyo da Noite";
                      badgeClass = "bg-purple-500/10 text-purple-300 border-purple-500/20";
                    } else if (a.type === "exercise") {
                      icon = "💪";
                      titleLabel = `${a.category || "Atividade Física"} - ${a.subType || "Treino"}`;
                      badgeClass = "bg-emerald-500/10 text-emerald-350 border-emerald-500/20";
                    }

                    return (
                      <div key={a.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-950/20 transition-colors">
                        <div className="flex items-center gap-3 text-left">
                          <span className="text-xl w-8 h-8 rounded-full bg-slate-950 border border-slate-850 flex items-center justify-center shrink-0">
                            {icon}
                          </span>
                          <div>
                            <span className="block text-xs font-bold text-slate-200 font-heading">
                              {titleLabel}
                            </span>
                            <span className="text-[10px] text-slate-500 block leading-tight mt-0.5 font-mono">
                              {new Date(a.timestamp).toLocaleString("pt-BR", { day: "numeric", month: "long", hour: "numeric", minute: "numeric" })}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {a.notes && (
                            <span className="text-[11px] font-medium text-slate-400 bg-slate-950/40 py-1 px-2.5 rounded-lg italic border border-slate-850/50">
                              "{a.notes}"
                            </span>
                          )}
                          <span className={`py-1 px-3 rounded-md text-[9px] font-black uppercase font-mono tracking-wider border ${badgeClass}`}>
                            +{a.points} PONTOS CAUSA
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-950/40 text-slate-500">
                  <History className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-xs font-medium">Nenhum registro encontrado para a categoria selecionada.</p>
                </div>
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>

    </div>
  );
}
