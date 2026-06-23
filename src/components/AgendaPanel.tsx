import React, { useState, useEffect } from "react";
import { User, Goal, Community } from "../types";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Clock, 
  MapPin, 
  Tag, 
  AlertCircle, 
  RefreshCw, 
  CalendarDays, 
  Check, 
  Bell, 
  Award,
  BookOpen,
  Heart,
  Users,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AgendaEvent {
  id: string;
  userId: string;
  title: string;
  date: string; // YYYY-MM-DD
  category: "reuniao" | "campanha" | "desafio" | "meta" | "lembrete" | "aniversario" | "evento";
  description?: string;
  createdAt?: string;
}

interface AgendaPanelProps {
  currentUser: User | null;
  goals: Goal[];
  communities: Community[];
  users: User[];
  onAddLogActivity?: (payload: any) => void;
  setLoggerSuccessMsg: (msg: string | null) => void;
  setLoggerErrorMsg: (msg: string | null) => void;
  sendLocalNotification?: (title: string, body: string) => void;
  firebaseAuth?: any;
}

export default function AgendaPanel({
  currentUser,
  goals,
  communities,
  users,
  onAddLogActivity,
  setLoggerSuccessMsg,
  setLoggerErrorMsg,
  sendLocalNotification,
  firebaseAuth
}: AgendaPanelProps) {
  const [reminders, setReminders] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Date states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // New entry form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<AgendaEvent["category"]>("lembrete");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newDesc, setNewDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const localTime = new Date();

  // Fetch reminders on mount or user change
  const fetchReminders = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/reminders?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setReminders(data);
      }
    } catch (err) {
      console.error("Erro ao buscar lembretes da agenda:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [currentUser]);

  // Aggregate user goals into calendar events
  const goalEvents: AgendaEvent[] = goals
    .filter(g => g.deadline && g.deadline !== "Sem prazo")
    .map(g => {
      // Try to parse clean YYYY-MM-DD date from deadline
      let eventDate = g.deadline;
      if (g.deadline.includes("T")) {
        eventDate = g.deadline.split("T")[0];
      } else if (g.deadline.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        // Simple pt-BR layout dd/mm/yyyy conversion
        const [d, m, y] = g.deadline.split("/");
        eventDate = `${y}-${m}-${d}`;
      }
      return {
        id: `goal-ev-${g.id}`,
        userId: g.userId || currentUser?.id || "",
        title: `🎯 Meta: ${g.title}`,
        date: eventDate,
        category: "meta",
        description: g.description || `Meta de desenvolvimento individual. Progresso atual: ${g.progress || 0}%`
      };
    });

  // Dynamic birthdays of community members
  const birthdayEvents: AgendaEvent[] = users
    .filter(u => u.birthdate)
    .map((u): AgendaEvent | null => {
      const birthStr = u.birthdate!;
      const parts = birthStr.split("-");
      if (parts.length < 3) return null;
      const [, m, d] = parts;
      if (!m || !d) return null;
      const year = currentDate.getFullYear();
      return {
        id: `bday-${u.id}`,
        userId: u.id,
        title: `🍰 Aniversário de ${u.name}`,
        date: `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`,
        category: "aniversario",
        description: `Deseje muitos parabéns e vitórias Soka para o integrante ${u.name}!`
      };
    })
    .filter((e): e is AgendaEvent => e !== null);

  // Fixed Real Soka Community schedule/reunions
  const communityEvents: AgendaEvent[] = [];
  communities.forEach(c => {
    if ((c as any).activeChallenges) {
      ((c as any).activeChallenges as any[]).forEach(ch => {
        if (ch.endDate) {
          communityEvents.push({
            id: `challenge-${ch.id}`,
            userId: "community",
            title: `🏆 Fim do Desafio: ${ch.title}`,
            date: ch.endDate.split("T")[0],
            category: "desafio",
            description: `Desafio comunitário de constância e Daimoku: ${ch.description || ""}`
          });
        }
      });
    }
  });

  // Prepopulate standard collective Soka meetings and campaigns on specific calendar dates
  const year = currentDate.getFullYear();
  const baseSokaEvents: AgendaEvent[] = [
    {
      id: "soka-meeting-1",
      userId: "system",
      title: "👥 Reunião de Palestra Soka (Distrito)",
      date: `${year}-06-21`,
      category: "reuniao",
      description: "Estudo mútuo dos escritos de Nichiren Daishonin. Tema: Infundir Coragem e Suar o Karma!"
    },
    {
      id: "soka-meeting-2",
      userId: "system",
      title: "🪷 Encontro Geral da Juventude Soka",
      date: `${year}-06-28`,
      category: "reuniao",
      description: "Sincronização nacional da Divisão dos Jovens. Relatórios de Vitórias do Nordeste!"
    },
    {
      id: "soka-campaign-1",
      userId: "system",
      title: "🔥 Lançamento Oficial da Campanha Kofu BodhiShape",
      date: `${year}-06-19`,
      category: "campanha",
      description: "Campanha de 90 dias de consolidação da saúde e expansão do Daimoku coletivo."
    }
  ];

  // Combine all interactive & derived list items
  const allEvents = [
    ...reminders,
    ...goalEvents,
    ...birthdayEvents,
    ...communityEvents,
    ...baseSokaEvents
  ];

  // Helper date calculators
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!newTitle.trim()) {
      setLoggerErrorMsg("Adicione um título descritivo para o evento.");
      return;
    }

    try {
      setIsSubmitting(true);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (firebaseAuth?.currentUser) {
        const token = await firebaseAuth.currentUser.getIdToken();
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers,
        body: JSON.stringify({
          userId: currentUser.id,
          title: newTitle,
          date: newDate,
          category: newCategory,
          description: newDesc
        })
      });

      if (res.ok) {
        const itemCreated = await res.json();
        setReminders(prev => [...prev, itemCreated]);
        setNewTitle("");
        setNewDesc("");
        setShowAddForm(false);
        setLoggerSuccessMsg("📅 Evento adicionado com sucesso absoluto na sua Agenda!");
        
        // Push notification simulation
        if (sendLocalNotification) {
          sendLocalNotification(
            "Agenda Atualizada 📅",
            `Seu compromisso "${newTitle}" foi gravado de forma vitalícia e segura.`
          );
        }
      } else {
        const errData = await res.json();
        setLoggerErrorMsg(errData.error || "Erro ao gravar na agenda.");
      }
    } catch (err) {
      setLoggerErrorMsg("Problema de sincronização offline. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const headers: Record<string, string> = {};
      if (firebaseAuth?.currentUser) {
        const token = await firebaseAuth.currentUser.getIdToken();
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/reminders/${id}`, {
        method: "DELETE",
        headers
      });
      if (res.ok) {
        setReminders(prev => prev.filter(r => r.id !== id));
        setLoggerSuccessMsg("Evento removido com sucesso.");
      }
    } catch (err) {
      setLoggerErrorMsg("Não foi possível excluir o evento agora.");
    }
  };

  // Filter events by selected category
  const filteredEvents = allEvents.filter(ev => {
    if (categoryFilter === "all") return true;
    return ev.category === categoryFilter;
  });

  // Days list for the calendar month visual rendering
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayIndex = getFirstDayOfMonth(currentDate);

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Map category colors
  const categoryConfig: Record<AgendaEvent["category"], { label: string; bg: string; text: string; border: string; icon: any }> = {
    reuniao: { label: "Reunião Soka", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", icon: Users },
    campanha: { label: "Campanha Kofu", bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/30", icon: Heart },
    desafio: { label: "Desafio Coletivo", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", icon: Award },
    meta: { label: "Meta Individual", bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/30", icon: Target },
    lembrete: { label: "Lembrete Pessoal", bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/30", icon: Clock },
    aniversario: { label: "Aniversário", bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/30", icon: CalendarIcon },
    evento: { label: "Evento Especial", bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/30", icon: CalendarDays }
  };

  // Find events for specific day in calendar grid
  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    return allEvents.filter(ev => ev.date === dateStr);
  };

  // Format date correctly for UI
  const formatSelectedDateTitle = (date: Date) => {
    const d = date.getDate();
    const m = monthNames[date.getMonth()];
    const y = date.getFullYear();
    return `${d} de ${m}, ${y}`;
  };

  const selectedDateStr = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, "0")}-${selectedDate.getDate().toString().padStart(2, "0")}`;
  const selectedDayEvents = filteredEvents.filter(ev => ev.date === selectedDateStr);

  return (
    <div id="agenda-central-panel" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden font-sans">
      
      {/* Background radial atmosphere */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-violet-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header section with action targets */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-widest text-[#39df1d] bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
              SISTEMA OPERACIONAL
            </span>
          </div>
          <h2 className="text-xl font-bold font-heading text-slate-100 tracking-tight flex items-center gap-2">
            📅 Agenda de Atividades
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Programação integrada, calendário de metas, reuniões e rituais diários.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-[#1b3d2b] hover:bg-emerald-800 border border-emerald-500/30 text-emerald-300 font-bold px-4 py-2.5 rounded-xl text-xs transition duration-300 shadow cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Novo Compromisso</span>
        </button>
      </div>

      {/* Add New Event interactive form layout */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddSubmit}
            className="mb-6 bg-slate-955/60 border border-slate-800/80 rounded-2xl p-5 overflow-hidden shadow-inner flex flex-col gap-4 font-sans"
          >
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-205 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Adicionar Compromisso / Lembrete Vitalicial</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Título do compromisso:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Reunião de Bloco / Visita de Incentivo"
                  className="w-full text-xs font-semibold bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 px-3 py-2 rounded-xl outline-none focus:border-indigo-505"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Categoria:</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full text-xs bg-slate-950/60 border border-slate-800 text-slate-100 px-3 py-2 rounded-xl outline-none focus:border-indigo-505"
                >
                  <option value="lembrete">📝 Lembrete Pessoal</option>
                  <option value="reuniao">👥 Reunião Soka</option>
                  <option value="campanha">🪷 Campanha Kofu</option>
                  <option value="desafio">🏆 Desafio Coletivo</option>
                  <option value="meta">🎯 Meta Individual</option>
                  <option value="evento">📅 Evento Especial</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Data:</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full text-xs bg-slate-950/60 border border-slate-800 text-slate-100 px-3 py-2 rounded-xl outline-none focus:border-indigo-505"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Descrição / Notas complementares:</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Ex: Levar incentivo e folheto da Terceira Civilização"
                  className="w-full text-xs bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 px-3 py-2 rounded-xl outline-none focus:border-indigo-505"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3.5 py-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-1.5 bg-emerald-580 hover:bg-emerald-600 text-white border border-emerald-500/20 text-[11px] font-bold rounded-xl transition cursor-pointer"
              >
                {isSubmitting ? "Gravando..." : "Sincronizar na Nuvem ✓"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Categories Multi-Filter Select */}
      <div className="flex flex-wrap items-center gap-1.5 mb-6 bg-slate-950/40 p-2 border border-slate-850 rounded-2xl">
        <span className="text-[9px] uppercase font-heading font-black text-slate-500 px-2 tracking-widest block">Filtrar:</span>
        <button
          onClick={() => setCategoryFilter("all")}
          className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-wide font-heading transition ${
            categoryFilter === "all" ? "bg-indigo-650 text-white border border-indigo-550/30" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Tudo
        </button>
        {Object.entries(categoryConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setCategoryFilter(key)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
              categoryFilter === key ? `${config.bg} ${config.text} border ${config.border}` : "text-slate-400 hover:text-slate-205"
            }`}
          >
            <span>{config.label}</span>
          </button>
        ))}
      </div>

      {/* Main Grid: Left side interactive calendar, Right side scheduled list agenda details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: The actual Monthly Interactive Calendar Grid Layout */}
        <div className="lg:col-span-7 bg-slate-950/40 border border-slate-850 p-4 rounded-2xl flex flex-col">
          
          {/* Calendar top controls month bar */}
          <div className="flex items-center justify-between mb-4 px-1">
            <h4 className="text-xs font-black text-slate-200 font-heading tracking-wide uppercase">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h4>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 px-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs rounded-lg transition"
              >
                &larr;
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 px-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs rounded-lg transition"
              >
                &rarr;
              </button>
            </div>
          </div>

          {/* Days of the week header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[9px] uppercase font-mono font-bold text-slate-500">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>

          {/* Monthly grid space with interactive indicators */}
          <div className="grid grid-cols-7 gap-1 flex-1">
            {/* Empty slots for offset padding starting day */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-12 bg-slate-955/10 rounded-lg opacity-20 border border-transparent" />
            ))}

            {/* Days entries */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
              const dayEvents = getEventsForDay(day);
              const isToday = day === localTime.getDate() && currentDate.getMonth() === localTime.getMonth() && currentDate.getFullYear() === localTime.getFullYear();
              const isSelected = day === selectedDate.getDate() && currentDate.getMonth() === selectedDate.getMonth() && currentDate.getFullYear() === selectedDate.getFullYear();

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => setSelectedDate(dateObj)}
                  className={`h-14 p-1.5 rounded-xl border flex flex-col justify-between transition-all duration-200 relative ${
                    isToday 
                      ? "bg-indigo-950/20 border-indigo-500/50 shadow shadow-indigo-950" 
                      : isSelected 
                      ? "bg-slate-800 border-indigo-500 text-white" 
                      : "bg-slate-900/30 hover:bg-slate-850/50 border-slate-850 hover:border-slate-800 text-slate-300"
                  }`}
                >
                  <span className={`text-[10px] font-mono font-extrabold px-1 py-0.5 rounded ${
                    isToday ? "bg-indigo-600 text-white" : ""
                  }`}>
                    {day}
                  </span>

                  {/* Multi event indicators */}
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-auto flex-wrap max-w-full overflow-hidden">
                      {dayEvents.slice(0, 3).map((ev, evIdx) => {
                        const style = categoryConfig[ev.category];
                        return (
                          <span
                            key={ev.id}
                            className={`w-1.5 h-1.5 rounded-full ${
                              ev.category === "reuniao" ? "bg-emerald-400" :
                              ev.category === "campanha" ? "bg-pink-400" :
                              ev.category === "desafio" ? "bg-amber-400" :
                              ev.category === "meta" ? "bg-violet-400" : "bg-sky-450"
                            }`}
                            title={ev.title}
                          />
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <span className="text-[7px] text-slate-500 font-mono">+</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

        </div>

        {/* RIGHT COLUMN: Real schedule/compromissos details lists */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="bg-slate-950/50 border border-slate-850 rounded-2xl p-4 flex flex-col h-full min-h-[300px]">
            <div className="flex items-center justify-between mb-3 border-b border-slate-850 pb-2">
              <h4 className="text-xs font-heading font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Dia: {formatSelectedDateTitle(selectedDate)}</span>
              </h4>
              <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {selectedDayEvents.length} Atividades
              </span>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 flex-1">
              {selectedDayEvents.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center justify-center text-slate-500">
                  <AlertCircle className="w-6 h-6 text-slate-600 mb-2" />
                  <p className="text-xs italic">Nenhum evento registrado para este dia.</p>
                  <p className="text-[10px] text-slate-650 mt-1 max-w-[180px]">Utilize o botão acima para programar práticas ou compromissos.</p>
                </div>
              ) : (
                selectedDayEvents.map(ev => {
                  const style = categoryConfig[ev.category];
                  const Icon = style?.icon || Tag;
                  return (
                    <div
                      key={ev.id}
                      className={`p-3 rounded-xl border ${style?.bg} ${style?.border} flex flex-col gap-1 transition shadow-sm hover:shadow`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 ${style?.text}`} />
                          <h5 className="text-xs font-black text-slate-100 font-heading leading-tight">{ev.title}</h5>
                        </div>
                        {ev.userId === currentUser?.id && (
                          <button
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="p-1 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded text-slate-500 hover:text-rose-450 transition"
                            title="Remover evento"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      {ev.description && (
                        <p className="text-[10px] text-slate-350 leading-relaxed font-sans mt-0.5">{ev.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between text-[8px] font-mono font-bold mt-1.5 border-t border-slate-800/40 pt-1 text-slate-500">
                        <span className="uppercase tracking-wider">Compromisso Real</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-slate-550" />
                          <span>Todo o dia</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick tips footer */}
          <div className="bg-[#15112c] border border-indigo-950/40 p-3 rounded-2xl mt-4 text-[10px] text-slate-400 flex items-center gap-3">
            <span className="text-xl">🪷</span>
            <div>
              <span className="font-bold text-indigo-300 block mb-0.5">Determinação Budista Soka</span>
              <span>"Uma agenda focada reflete o sincero anseio de concretizar nossas maiores vitórias!"</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
