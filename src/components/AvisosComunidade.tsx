import React, { useState, useEffect } from "react";
import { 
  Info, Megaphone, Calendar, Users, ChevronRight, CheckCircle2, 
  Plus, Pencil, Trash2, X, Sparkles, HelpCircle, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
  maxProgress?: number | null;
  color: string;
  joinedCount?: number;
  participants?: string[];
}

interface AvisosComunidadeProps {
  currentUser: User | null;
  firebaseAuth?: any;
}

export default function AvisosComunidade({ currentUser, firebaseAuth }: AvisosComunidadeProps) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Control leader interface visibility
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

  // Form Fields
  const [formType, setFormType] = useState<"campaign" | "challenge" | "announcement" | "study">("announcement");
  const [formTag, setFormTag] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDeadline, setFormDeadline] = useState("");
  const [formTarget, setFormTarget] = useState("");
  const [formMaxProgress, setFormMaxProgress] = useState("");
  const [formColor, setFormColor] = useState("from-indigo-600/20 to-sky-600/10 border-indigo-500/20 text-indigo-300");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch notices on mount
  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/notices");
      if (res.ok) {
        const data = await res.json();
        setNotices(data);
      } else {
        throw new Error("Erro ao carregar comunicados");
      }
    } catch (err: any) {
      setError(err.message || "Não foi possível carregar os avisos do servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  // Color options presets matching outstanding theme
  const colorPresets = [
    { label: "Ouro / Âmbar", value: "from-amber-600/30 to-rose-600/20 border-amber-500/20 text-amber-300" },
    { label: "Púrpura / Rosa", value: "from-purple-900/40 to-pink-500/20 border-pink-550/30 text-pink-300" },
    { label: "Céu / Índigo", value: "from-sky-900/30 to-indigo-900/20 border-sky-500/30 text-sky-300" },
    { label: "Esmeralda / Teal", value: "from-emerald-950/35 to-teal-900/10 border-emerald-500/30 text-emerald-300" },
    { label: "Slate / Escuro", value: "from-slate-900/50 to-slate-950/40 border-slate-800 text-slate-350" }
  ];

  // Open Form for creation
  const handleOpenCreate = () => {
    setEditingNotice(null);
    setFormType("announcement");
    setFormTag("📢 Comunicado");
    setFormTitle("");
    setFormDescription("");
    setFormDeadline("");
    setFormTarget("");
    setFormMaxProgress("");
    setFormColor("from-sky-900/30 to-indigo-900/20 border-sky-500/30 text-sky-300");
    setShowForm(true);
  };

  // Open Form for editing
  const handleOpenEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setFormType(notice.type);
    setFormTag(notice.tag);
    setFormTitle(notice.title);
    setFormDescription(notice.description);
    setFormDeadline(notice.deadline || "");
    setFormTarget(notice.target || "");
    setFormMaxProgress(notice.maxProgress ? String(notice.maxProgress) : "");
    setFormColor(notice.color);
    setShowForm(true);
  };

  // Create or Update submit handle
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) return;

    try {
      setIsSubmitting(true);
      const isEdit = !!editingNotice;

      const payload = {
        id: editingNotice?.id,
        type: formType,
        tag: formTag || (formType === "campaign" ? "🌽 Campanha" : formType === "challenge" ? "🏆 Desafio" : formType === "study" ? "📚 Estudo" : "📢 Comunicado"),
        title: formTitle,
        description: formDescription,
        deadline: formDeadline,
        target: formTarget,
        maxProgress: formMaxProgress ? Number(formMaxProgress) : null,
        currentProgress: editingNotice ? editingNotice.currentProgress : 0,
        color: formColor
      };

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (firebaseAuth?.currentUser) {
        const idToken = await firebaseAuth.currentUser.getIdToken();
        headers["Authorization"] = `Bearer ${idToken}`;
      }

      const url = isEdit ? "/api/notices/update" : "/api/notices";
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowForm(false);
        setEditingNotice(null);
        await fetchNotices();
      } else {
        const data = await res.json();
        alert(data.error || "Houve erro ao salvar o aviso.");
      }
    } catch (err) {
      console.error(err);
      alert("Houve falha ao se comunicar com o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Notice handle
  const handleDelete = async (id: string) => {
    if (!window.confirm("Prezado Líder, você confirma que deseja remover este aviso permanentemente do Mural?")) {
      return;
    }
    try {
      const headers: Record<string, string> = {};
      if (firebaseAuth?.currentUser) {
        const idToken = await firebaseAuth.currentUser.getIdToken();
        headers["Authorization"] = `Bearer ${idToken}`;
      }

      const res = await fetch(`/api/notices/${id}`, {
        method: "DELETE",
        headers
      });
      if (res.ok) {
        await fetchNotices();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao excluir do servidor.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Houve falha ao deletar aviso.");
    }
  };

  // Member join actions
  const handleToggleParticipation = async (id: string) => {
    if (!currentUser) return;
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (firebaseAuth?.currentUser) {
        const token = await firebaseAuth.currentUser.getIdToken();
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch("/api/notices/join", {
        method: "POST",
        headers,
        body: JSON.stringify({ id, userId: currentUser.id })
      });
      if (res.ok) {
        const updatedNotice = await res.json();
        setNotices(prev => prev.map(n => n.id === id ? updatedNotice : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="community-bulletin-announcements">
      {/* BRAND BAR */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#161D32]/30 p-6 rounded-2xl border border-slate-850 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg">
            <Megaphone className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <span className="bg-[#1D223B] text-indigo-300 text-[10px] uppercase font-bold tracking-widest font-mono py-0.5 px-3.5 border border-indigo-900/30 rounded-full">
              Mural Público de Comunicados
            </span>
            <h2 className="text-xl font-bold font-heading text-slate-100 mt-2">Mural da Comunidade</h2>
            <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
              Campanhas reais coordenadas por lideranças da Soka-Gymrats e metas compartilhadas.
            </p>
          </div>
        </div>

        {/* Administration Toggle controls trigger */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setIsAdminMode(!isAdminMode)}
            className={`text-xs font-semibold py-1.5 px-3.5 rounded-xl border transition-all cursor-pointer ${
              isAdminMode 
                ? "bg-amber-500/25 border-amber-500/40 text-amber-300 font-mono shadow-md shadow-amber-500/5 animate-pulse"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {isAdminMode ? "⚡ Modo Líder: ON" : "🛡️ Painel do Líder"}
          </button>

          {isAdminMode && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-1.5 px-3 rounded-xl flex items-center gap-1 transition shadow-lg shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Novo Comunicado
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="bg-slate-900/85 p-6 rounded-2xl border border-indigo-500/25 shadow-2xl relative animate-scaleUp">
          <button
            type="button"
            onClick={() => { setShowForm(false); setEditingNotice(null); }}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-md font-bold text-slate-100">
              {editingNotice ? "🔧 Modificar Comunicado Oficial" : "✍️ Criar Novo Comunicado Oficial"}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Categoria do Aviso</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-xl text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="announcement">📢 Comunicado Oficial</option>
                  <option value="campaign">🌽 Campanha Geral (ex: Kofu, Daimoku)</option>
                  <option value="challenge">🏆 Desafio Coletivo (ex: Constância)</option>
                  <option value="study">📚 Estudo da Noite / Brasil Seikyo</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Tag Visual ou Emoji</label>
                <input
                  type="text"
                  placeholder="Ex: 🌽 Kofu Especial, 🏆 Desafio de Ferro"
                  value={formTag}
                  onChange={(e) => setFormTag(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-xl text-slate-200 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Título do Comunicado</label>
              <input
                type="text"
                placeholder="Ex: Campanha de Julho Sgi-Soka"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-xl text-slate-200 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Corpo do Comunicado (Descrição detalhada)</label>
              <textarea
                placeholder="Escreva as palavras de incentivo..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                required
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 text-xs p-3 rounded-xl text-slate-200 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Data Limite (Prazo)</label>
                <input
                  type="text"
                  placeholder="Ex: 30 de Julho de 2026"
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-xl text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Meta Objetiva / Alvo</label>
                <input
                  type="text"
                  placeholder="Ex: 500 horas de oração"
                  value={formTarget}
                  onChange={(e) => setFormTarget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-xl text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Meta Numérica (Opcional - Progresso)</label>
                <input
                  type="number"
                  placeholder="Deixe em branco se não houver barra de progresso"
                  value={formMaxProgress}
                  onChange={(e) => setFormMaxProgress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-xl text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Design e Cores de Fundo</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setFormColor(preset.value)}
                    className={`p-2.5 rounded-xl border text-[10px] font-semibold text-center transition-all ${
                      formColor === preset.value
                        ? "bg-indigo-650 border-white text-white scale-[1.03]"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingNotice(null); }}
                className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs p-2.5 px-4 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold text-xs p-2.5 px-6 rounded-xl transition shadow active:scale-95 cursor-pointer"
              >
                {isSubmitting ? "Gravando no Firestore..." : editingNotice ? "Atualizar Comunicado" : "Salvar no Mural"}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-xs font-mono">Contatando Firestore...</span>
        </div>
      ) : notices.length === 0 ? (
        <div className="bg-slate-950/45 border-2 border-dashed border-slate-850 p-12 rounded-2xl text-center space-y-4 max-w-lg mx-auto" id="notices-empty-state">
          <div className="w-14 h-14 bg-indigo-500/5 rounded-2xl flex items-center justify-center text-indigo-400/40 border border-slate-850 mx-auto">
            <Megaphone className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-200">Mural Livre no Momento</h3>
            <p className="text-xs text-slate-450 leading-relaxed max-w-sm mx-auto">
              Não há nenhum comunicado ou meta coletiva ativa no momento. É o momento ideal para focar no Daimoku individual e na oração pacífica!
            </p>
          </div>
          {isAdminMode && (
            <button
              onClick={handleOpenCreate}
              className="text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-bold py-1.5 px-4 rounded-xl border border-indigo-500/30 transition shadow cursor-pointer mx-auto"
            >
              Criar Primeiro Aviso Real
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="notices-panel-grid">
          {notices.map((notice) => {
            const hasJoined = currentUser && notice.participants?.includes(currentUser.id);
            const progressPercentage = notice.maxProgress
              ? Math.min(100, Math.floor((notice.currentProgress || 0) * 100 / notice.maxProgress))
              : 0;

            return (
              <div
                key={notice.id}
                className={`bg-gradient-to-br ${notice.color} p-5 rounded-2xl border flex flex-col justify-between hover:scale-[1.005] duration-300 transition-all shadow-md relative`}
                id={`bulletin-${notice.id}`}
              >
                {/* Real-time Leadership edit buttons */}
                {isAdminMode && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 z-10 shadow-lg">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(notice)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 transition"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(notice.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition"
                      title="Apagar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="bg-slate-950/65 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider font-mono rounded-full border border-slate-850">
                      {notice.tag}
                    </span>
                    
                    {notice.deadline && (
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 bg-slate-950/20 px-2 py-0.5 rounded-md text-right mr-16 sm:mr-0">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        Prazo: {notice.deadline}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-left">
                    <h3 className="text-base font-black font-heading text-slate-100 pr-12">{notice.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-normal whitespace-pre-line bg-slate-950/30 p-3 rounded-xl border border-slate-850/60">
                      {notice.description}
                    </p>
                  </div>

                  {notice.target && (
                    <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850 space-y-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block font-heading">Meta Coletiva:</span>
                      <p className="text-xs text-slate-200 font-semibold">{notice.target}</p>

                      {/* Display Progress Indicator if maxProgress exists */}
                      {notice.maxProgress && notice.maxProgress > 0 && (
                        <div className="space-y-1.5 pt-1.5">
                          <div className="flex justify-between text-[9px] font-mono text-slate-400">
                            <span>Progresso Coletivo</span>
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
                  )}
                </div>

                {/* Interactions Join Button Block */}
                <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-850/65 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span className="text-[11px] font-semibold">{(notice.participants || []).length} participando</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleParticipation(notice.id)}
                    className={`text-[10px] font-semibold py-1.5 px-4 rounded-lg flex items-center gap-1 border transition-all cursor-pointer ${
                      hasJoined
                        ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-400 font-mono"
                        : "bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-950/80 hover:text-white"
                    }`}
                  >
                    {hasJoined ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Participando!
                      </>
                    ) : (
                      <>
                        Quero Participar <ChevronRight className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MOTIVATIONAL INFORMATION WATERMARK */}
      <div className="bg-slate-900/30 p-4.5 rounded-2xl border border-slate-850/60 flex items-start gap-3.5 text-xs text-slate-400 leading-relaxed font-normal">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-300">Como funcionam as metas conjuntas?</p>
          <p>
            O andamento coletivo do mural sincroniza os registros individuais de orações e metas. Ao participar, cada avanço individual ajuda a preencher a barra de progresso em tempo real no Firestore oficial.
          </p>
        </div>
      </div>
    </div>
  );
}
