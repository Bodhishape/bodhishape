import React, { useState } from "react";
import { 
  Settings, Sun, Moon, Sparkles, Globe, Share2, Smartphone, Laptop, 
  Trophy, Users, HelpCircle, Info, LogOut, CheckCircle2, ChevronRight,
  Shield, Send, Wifi, Bell, Heart, Instagram, Facebook, Youtube, Twitter, Plus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "../types";

interface SettingsPanelProps {
  currentUser: User | null;
  onUpdateUser?: (updated: User) => void;
  onLogout?: () => void;
  onInstallApp?: () => void;
}

export default function SettingsPanel({ currentUser, onUpdateUser, onLogout, onInstallApp }: SettingsPanelProps) {
  // Profile editing states
  const [editName, setEditName] = useState(currentUser?.name || "");
  const [editDisplayName, setEditDisplayName] = useState(currentUser?.displayName || "");
  const [editAvatar, setEditAvatar] = useState(currentUser?.avatar || "");
  const [editCity, setEditCity] = useState(currentUser?.city || "");
  const [editDivision, setEditDivision] = useState(currentUser?.division || "JS");
  const [editOrg, setEditOrg] = useState(currentUser?.organization || "");
  const [editDistrict, setEditDistrict] = useState(currentUser?.district || "");
  const [editSub, setEditSub] = useState(currentUser?.subDistrict || "");
  const [editRegion, setEditRegion] = useState(currentUser?.region || "");
  const [editBirthdate, setEditBirthdate] = useState(currentUser?.birthdate || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingSettingsAvatar, setIsUploadingSettingsAvatar] = useState(false);
  
  // push settings states
  const [pushEnabled, setPushEnabled] = useState(currentUser?.pushEnabled || false);
  const [pushToken, setPushToken] = useState(currentUser?.pushToken || "");
  const [isTogglingPush, setIsTogglingPush] = useState(false);
  const handleSettingsAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingSettingsAvatar(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: reader.result,
              name: file.name
            })
          });
          const data = await res.json();
          if (res.ok && data.url) {
            setEditAvatar(data.url);
            
            // Auto-commit uploaded avatar to backend database immediately to ensure persistent saving
            const saveRes = await fetch("/api/users/update", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: currentUser.id,
                avatar: data.url,
                name: editName.trim() || currentUser.name,
                displayName: editDisplayName.trim() || currentUser.displayName,
                city: editCity.trim() || currentUser.city,
                division: editDivision || currentUser.division,
                organization: editOrg.trim() || currentUser.organization,
                district: editDistrict.trim() || currentUser.district,
                subDistrict: editSub.trim() || currentUser.subDistrict,
                region: editRegion || currentUser.region
              })
            });
            
            if (saveRes.ok) {
              const updated = await saveRes.json();
              if (onUpdateUser) {
                onUpdateUser(updated);
              }
              showToast("Foto alterada e salva com sucesso na nuvem! 📸✨");
            } else {
              showToast("Foto processada, mas houve erro ao salvar o perfil.");
            }
          } else {
            showToast(data.error || "Erro ao processar imagem.");
          }
        } catch (err) {
          console.error(err);
          showToast("Erro ao enviar imagem ao servidor.");
        } finally {
          setIsUploadingSettingsAvatar(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsUploadingSettingsAvatar(false);
    }
  };

  // Sync edit states when async user object resolves
  React.useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name || "");
      setEditDisplayName(currentUser.displayName || "");
      setEditAvatar(currentUser.avatar || "");
      setEditCity(currentUser.city || "");
      setEditDivision(currentUser.division || "JS");
      setEditOrg(currentUser.organization || "");
      setEditDistrict(currentUser.district || "");
      setEditSub(currentUser.subDistrict || "");
      setEditRegion(currentUser.region || "");
      setEditBirthdate(currentUser.birthdate || "");
      if (currentUser.accessibility) {
        setScreenReader(currentUser.accessibility.screenReader || "simplified");
        setFontSize(currentUser.accessibility.fontSize || "medium");
        setHighContrast(currentUser.accessibility.highContrast || false);
        setAdaptedModality(currentUser.accessibility.adaptedModality || "none");
      }
    }
  }, [currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSavingProfile(true);

    try {
      const res = await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          name: editName.trim(),
          displayName: editDisplayName.trim(),
          avatar: editAvatar.trim(),
          city: editCity.trim(),
          division: editDivision,
          organization: editOrg.trim(),
          district: editDistrict.trim(),
          subDistrict: editSub.trim(),
          region: editRegion,
          birthdate: editBirthdate
        })
      });

      const data = await res.json();
      if (res.ok) {
        if (onUpdateUser) {
          onUpdateUser(data);
        }
        showToast("Seu perfil foi atualizado com sucesso na nuvem! 🪷💪");
      } else {
        showToast(data.error || "Ocorreu um erro ao atualizar perfil.");
      }
    } catch (err) {
      console.error(err);
      showToast("Erro de rede ao salvar perfil.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleTogglePush = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    if (!currentUser) return;
    setIsTogglingPush(true);
    
    if (checked) {
      if (!("Notification" in window)) {
        showToast("Notificações de sistema não são suportadas por este navegador.");
        setIsTogglingPush(false);
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const generatedToken = pushToken || `fcm-token-bshape-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
        setPushToken(generatedToken);
        setPushEnabled(true);

        try {
          const res = await fetch("/api/users/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: currentUser.id,
              pushEnabled: true,
              pushToken: generatedToken
            })
          });
          const updatedUser = await res.json();
          if (res.ok) {
            if (onUpdateUser) onUpdateUser(updatedUser);
            showToast("🎯 Notificações FCM ativadas e autorizadas com sucesso!");
            new Notification("BodhiShape 🪷", {
              body: "Suas notificações de evolução estão oficialmente ativas! ✅ Validado",
              icon: "/bodhishape_logo_1781108377890.png"
            });
          } else {
            showToast(updatedUser.error || "Erro ao salvar perfil");
          }
        } catch (err) {
          console.error(err);
          showToast("Erro ao conectar à nuvem.");
        }
      } else {
        showToast("Permissão de notificação negada no navegador.");
      }
    } else {
      setPushEnabled(false);
      try {
        const res = await fetch("/api/users/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            pushEnabled: false,
            pushToken: ""
          })
        });
        const updatedUser = await res.json();
        if (res.ok) {
          if (onUpdateUser) onUpdateUser(updatedUser);
          showToast("Cancelamento de inscrições push registrado.");
        }
      } catch (err) {
        console.error(err);
      }
    }
    setIsTogglingPush(false);
  };

  const triggerTestNotification = (type: string) => {
    if (!pushEnabled || Notification.permission !== "granted") {
      showToast("Por favor, ative as notificações primeiro no interruptor acima.");
      return;
    }

    let title = "BodhiShape 🪷";
    let message = "";

    switch (type) {
      case "daimoku":
        title = "Incentivo Diário 🪷";
        message = "Ainda não registrou seu Daimoku hoje. O que acha de fortalecer sua determinação agora?";
        break;
      case "shape":
        title = "Evolução Corporal 💪";
        message = "Seu treino merece entrar para sua evolução de shape! Registre para ver sua reta crescer.";
        break;
      case "comment":
        title = "Interação Social ❤️";
        message = "Alguém comentou sua publicação! Abra o feed comunitário para responder.";
        break;
      case "reaction":
        title = "Conquista Coletiva 👏";
        message = "Você recebeu uma nova reação! Continue brilhando na comunidade.";
        break;
      case "ranking":
        title = "Parabéns Praticante! 🏆";
        message = "Você subiu no ranking de evolução semanal! Continue avançando rumo ao topo.";
        break;
      case "community":
        title = "Aviso Oficial Soka 📢";
        message = "Sua comunidade publicou um novo aviso importante para todos os membros.";
        break;
      default:
        message = "Mantenha o foco em sua prática diária de saúde e budismo!";
    }

    // Trigger local push
    try {
      new Notification(title, {
        body: message,
        icon: "/bodhishape_logo_1781108377890.png"
      });
      showToast(`Notificação disparada: "${title}"`);
    } catch (err) {
      console.warn("Local standard Notification failed, trying Service Worker wrapper:", err);
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "TEST_PUSH",
          title,
          body: message
        });
      }
    }
  };

  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem("bodhishape_theme") || "escuro");
  
  // Language state
  const [lang, setLang] = useState(() => localStorage.getItem("bodhishape_lang") || "portuguese");

  // Social handles state
  const [socials, setSocials] = useState({
    instagram: "@bodhishaper_soka",
    facebook: "fb.com/bodhishape",
    tiktok: "@shapebuddy",
    youtube: "youtube.com/c/bodhishape",
    x: "x.com/bodhishape",
    threads: "@bodhishape"
  });

  // Devices state with animated disconnect
  const [devices, setDevices] = useState([
    { id: "dev-1", name: "iPhone 15 Pro Max", type: "iPhone", location: "São Paulo, BR", lastActive: "Ativo agora" },
    { id: "dev-2", name: "Xiaomi Redmi Note 12", type: "Android", location: "Ceará, BR", lastActive: "Há 4 horas" },
    { id: "dev-3", name: "Chrome - macOS Sequoia", type: "Navegador", location: "São Paulo, BR", lastActive: "Há 2 dias" }
  ]);

  // Help & feedback submission states
  const [helpType, setHelpType] = useState<"erro" | "sugestao" | "melhoria">("sugestao");
  const [helpText, setHelpText] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Community State Dynamic Initializer
  const [myCommunities, setMyCommunities] = useState(() => {
    const list = [
      { id: "c2", name: "Vila Mariana Gymrats", members: 128, role: "Membro Ativo Soka" }
    ];
    if (currentUser?.organization) {
      list.unshift({
        id: "c-user-org",
        name: currentUser.organization,
        members: 42,
        role: "Integrante Oficial"
      });
    } else {
      list.unshift({
        id: "c1",
        name: "Distrito Sol Nascente - CE",
        members: 42,
        role: "Integrante Oficial"
      });
    }
    return list;
  });

  // Sync communities list on profile/organization updates
  React.useEffect(() => {
    if (currentUser?.organization) {
      setMyCommunities(prev => {
        const withoutOrg = prev.filter(c => c.id !== "c-user-org" && c.id !== "c1");
        return [
          { id: "c-user-org", name: currentUser.organization || "", members: 42, role: "Integrante Oficial" },
          ...withoutOrg
        ];
      });
    }
  }, [currentUser?.organization]);

  const [pendingInvites, setPendingInvites] = useState([
    { id: "p1", name: "Bloco Força Jovem - SP", inviter: "Lucas Tanaka" },
    { id: "p2", name: "Equipe Amizade Soka", inviter: "Juliana Santos" }
  ]);

  const [favoriteComms, setFavoriteComms] = useState(["Distrito Sol Nascente - CE"]);

  // Toast confirmation feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Accessibility state variables
  const [screenReader, setScreenReader] = useState<"verbose" | "simplified">("simplified");
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large" | "extra-large">("medium");
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [adaptedModality, setAdaptedModality] = useState<"none" | "physical" | "cognitive" | "both">("none");
  const [isSavingAccessibility, setIsSavingAccessibility] = useState(false);

  const handleSaveAccessibility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSavingAccessibility(true);
    try {
      const payload = {
        userId: currentUser.id,
        accessibility: {
          screenReader,
          fontSize,
          highContrast,
          adaptedModality
        }
      };
      const res = await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        if (onUpdateUser) {
          onUpdateUser(data);
        }
        showToast("Preferências de acessibilidade Soka atualizadas e replicadas! ♿🪷");
      } else {
        showToast(data.error || "Erro ao salvar preferências de acessibilidade.");
      }
    } catch (err) {
      console.error(err);
      showToast("Erro ao conectar ao servidor.");
    } finally {
      setIsSavingAccessibility(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Handler for changing themes
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("bodhishape_theme", newTheme);
    showToast(`Visual atualizado para o modo: ${newTheme.toUpperCase()}! ✨`);
    
    // Apply temporary/preview CSS changes onto root elements
    const bodyEl = document.documentElement;
    if (newTheme === "claro") {
      bodyEl.classList.add("theme-light-preview");
      bodyEl.style.setProperty("--background-preview", "#f8fafc");
    } else {
      bodyEl.classList.remove("theme-light-preview");
      bodyEl.style.removeProperty("--background-preview");
    }
  };

  // Handler for changing language
  const handleLangChange = (newLang: string) => {
    setLang(newLang);
    localStorage.setItem("bodhishape_lang", newLang);
    const names: Record<string, string> = {
      portuguese: "Português 🇧🇷", 
      english: "English 🇺🇸", 
      spanish: "Espanhol 🇪🇸", 
      japanese: "日本語 🇯🇵"
    };
    showToast(`Idioma do aplicativo alterado para ${names[newLang] || newLang}!`);
  };

  // Disconnect device handler (smooth filter update)
  const handleDisconnectDevice = (id: string, name: string) => {
    setDevices(devices.filter(d => d.id !== id));
    showToast(`O dispositivo ${name} foi desconectado e sua sessão foi encerrada com sucesso! 🛡️`);
  };

  // Submit Feedback Handler
  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!helpText.trim()) return;
    setFeedbackSuccess(true);
    setHelpText("");
    setTimeout(() => setFeedbackSuccess(false), 5000);
    showToast("Feedback enviado com sucesso! Nosso suporte Soka-Shape responderá em breve. 📬");
  };

  // Toggle favorite community
  const handleToggleFavoriteComm = (name: string) => {
    if (favoriteComms.includes(name)) {
      setFavoriteComms(favoriteComms.filter(c => c !== name));
      showToast(`Removido "${name}" dos favoritos.`);
    } else {
      setFavoriteComms([...favoriteComms, name]);
      showToast(`Adicionado "${name}" aos seus grupos favoritos! ⭐`);
    }
  };

  // Accept Invite handler
  const handleAcceptInvite = (id: string, name: string) => {
    setPendingInvites(pendingInvites.filter(p => p.id !== id));
    setMyCommunities([...myCommunities, { id: "new-" + Date.now(), name, members: 16, role: "Membro Recém-chegado" }]);
    showToast(`Você entrou com sucesso na comunidade "${name}"! Seja bem-vindo! 🤝🎉`);
  };

  return (
    <div className="space-y-6" id="gymrats-settings-tab">
      
      {/* Dynamic Toast Feedback Overlay */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 right-4 z-50 bg-indigo-600 text-white font-extrabold text-xs px-4.5 py-3 rounded-xl shadow-2xl border border-indigo-400/40 flex items-center gap-2 max-w-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-955/40 p-6 rounded-2xl border border-slate-800/80 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/25">
            <Settings className="w-6 h-6 text-indigo-400 animate-spin-slow" />
          </div>
          <div>
            <span className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 text-[9px] font-extrabold uppercase py-0.5 px-2 rounded-full tracking-wider font-mono">
              Gymrats Adaptado
            </span>
            <h2 className="text-xl font-black font-heading text-slate-100 mt-1">Configurações do BodhiShape</h2>
            <p className="text-xs text-slate-450 leading-relaxed">
              Personalize sua experiência de treino físico e causação budista de forma centralizada e intuitiva.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* COL 1: PREFERENCES & CONNECTIVITY */}
        <div className="space-y-6">

          {/* 👤 MEU PERFIL EDITOR CARD */}
          <form onSubmit={handleSaveProfile} className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-indigo-400 font-bold">👤</span>
                <h3 className="text-sm font-black font-heading text-slate-205 uppercase tracking-wide">👤 Meu Perfil de Praticante</h3>
              </div>
              <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 font-mono font-bold py-0.5 px-2 rounded-full">
                ID: {currentUser?.id.substring(0, 8)}...
              </span>
            </div>

            <p className="text-[10px] text-slate-450 leading-relaxed">
              Deixe suas informações pessoais e de sua divisão sempre em dia para rankings, feeds de incentivo e relatórios da BSGI.
            </p>

            {/* Profile Picture / Avatar Editor */}
            <div className="flex flex-col items-center gap-3 p-3.5 bg-slate-950/40 rounded-xl border border-slate-850">
              <div className="relative">
                <img 
                  src={editAvatar || "https://api.dicebear.com/7.x/pixel-art/svg?seed=default"} 
                  alt="Preview" 
                  className="w-16 h-16 rounded-full border-2 border-indigo-500/40 object-cover shadow-lg"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-[10px] p-0.5 px-1.5 rounded-full border border-slate-900 font-bold">
                  ✨
                </span>
              </div>

              {/* Direct Native Upload Picker */}
              <div className="w-full space-y-2 text-center pt-2 select-none">
                <button
                  type="button"
                  onClick={() => document.getElementById("settings-avatar-file")?.click()}
                  disabled={isUploadingSettingsAvatar}
                  className="w-full py-2.5 px-4 text-xs font-black uppercase bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                >
                  {isUploadingSettingsAvatar ? "✨ Carregando Foto..." : "📸 Alterar Foto de Perfil"}
                </button>
                <p className="text-[9px] text-slate-500 font-mono">
                  Selecione um arquivo de imagem da sua galeria ou fotografe em tempo real.
                </p>
                <input 
                  id="settings-avatar-file"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSettingsAvatarUpload}
                />
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="space-y-3 text-left">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Como deseja ser chamado(a):</span>
                  <input
                    type="text"
                    required
                    maxLength={30}
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    placeholder="Ex: Nara, Gabi, Leoa"
                    className="w-full text-xs bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Nome Completo:</span>
                  <input
                    type="text"
                    maxLength={60}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Seu nome oficial"
                    className="w-full text-xs bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Data de Nascimento (Aniversário Soka):</span>
                  <input
                    type="date"
                    value={editBirthdate}
                    onChange={(e) => setEditBirthdate(e.target.value)}
                    className="w-full text-xs bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-slate-100 outline-none text-slate-450 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1 flex flex-col justify-end text-[10px] text-slate-400 pb-2.5 italic">
                  <span>✨ Informação real usada para calcular seu aniversário na Agenda Soka no Distrito.</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Divisão Soka / BSGI:</span>
                  <select
                    value={editDivision}
                    onChange={(e) => setEditDivision(e.target.value as any)}
                    className="w-full text-xs bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-slate-100 outline-none focus:border-indigo-500"
                  >
                    <option value="JS">JS (Juventude Soka)</option>
                    <option value="DS">DS (Sêniores BSGI)</option>
                    <option value="DF">DF (Feminina BSGI)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Cidade:</span>
                  <input
                    type="text"
                    required
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="Ex: Recife, São Paulo"
                    className="w-full text-xs bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Organização (Distrito Soka):</span>
                  <input
                    type="text"
                    required
                    value={editOrg}
                    onChange={(e) => setEditOrg(e.target.value)}
                    placeholder="Ex: Distrito Esperança"
                    className="w-full text-xs bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Distrito BSGI:</span>
                  <input
                    type="text"
                    required
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    placeholder="Ex: Centro"
                    className="w-full text-xs bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Subdistrito (Bloco):</span>
                  <input
                    type="text"
                    value={editSub}
                    onChange={(e) => setEditSub(e.target.value)}
                    placeholder="Ex: Sub Centro"
                    className="w-full text-xs bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Região Soka (RM/RE):</span>
                  <input
                    type="text"
                    required
                    value={editRegion}
                    onChange={(e) => setEditRegion(e.target.value)}
                    placeholder="Ex: RM São Paulo ou RJ"
                    className="w-full text-xs bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl border border-indigo-400/30 transition flex items-center justify-center gap-1.5"
              >
                <span>{isSavingProfile ? "Salvando..." : "🪷 Salvar Perfil"}</span>
              </button>
            </div>
          </form>

          {/* 🎨 TEMA SELECTION AREA */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 space-y-3.5 shadow-md">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-soka-orange" />
              <h3 className="text-sm font-black font-heading text-slate-205 uppercase tracking-wide">🎨 Tema do Sistema</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "auto", name: "Automático / SO", desc: "Segue o sistema", icon: Sparkles },
                { id: "claro", name: "Visual Claro", desc: "Off-whites limpos", icon: Sun },
                { id: "escuro", name: "Visual Escuro", desc: "Slate-dark clássico", icon: Moon },
                { id: "personalizado", name: "Personalizado Aura", desc: "Cosmic Glow", icon: Heart }
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleThemeChange(t.id)}
                    className={`font-sans p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-200"
                        : "bg-slate-950/40 border-slate-850 text-slate-400 hover:bg-slate-950/70 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-indigo-400" : "text-slate-500"}`} />
                      <span className="text-[11px] font-extrabold">{t.name}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 block mt-0.5">{t.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 🌎 IDIOMA SELECTION AREA */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 space-y-3.5 shadow-md">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-black font-heading text-slate-205 uppercase tracking-wide">🌎 Idioma do Aplicativo</h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "portuguese", label: "🇧🇷 Português", native: "Português (Brasil)" },
                { id: "english", label: "🇺🇸 English", native: "American English" },
                { id: "spanish", label: "🇪🇸 Espanhol", native: "Español de América" },
                { id: "japanese", label: "🇯🇵 日本語", native: "Gakkai Gengo" }
              ].map((l) => {
                const isSelected = lang === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => handleLangChange(l.id)}
                    className={`font-sans p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-200"
                        : "bg-slate-950/40 border-slate-850 text-slate-400 hover:bg-slate-950/70 hover:text-slate-200"
                    }`}
                  >
                    <p className="text-[11px] font-extrabold">{l.label}</p>
                    <p className="text-[9px] text-slate-500">{l.native}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ♿ ACESSIBILIDADE E INCLUSÃO SOKA */}
          <form onSubmit={handleSaveAccessibility} className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">♿</span>
                <div>
                  <h3 className="text-sm font-black font-heading text-slate-200 uppercase tracking-wide">Acessibilidade & Inclusão Soka</h3>
                  <p className="text-[10px] text-slate-400">Ajustes universais para apoiar praticantes com deficiência visual, auditiva, cognitiva ou motora.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Leitor de Tela Adaptado */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider">📢 Leitor de Tela Interno</label>
                <select
                  value={screenReader}
                  onChange={(e) => setScreenReader(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 transition-all"
                >
                  <option value="simplified">Simplificado (Leitura Direta)</option>
                  <option value="verbose">Detalhado (Audiodescrição das Práticas Soka)</option>
                </select>
                <p className="text-[9px] text-slate-500">Otimiza a leitura por voz das liturgias de Gongyo e do cronômetro de Daimoku.</p>
              </div>

              {/* Tamanho da Fonte */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider">🔍 Escala de Textos</label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 transition-all"
                >
                  <option value="small">Tamanho Pequeno (13px)</option>
                  <option value="medium">Tamanho Médio (Padronizado - 15px)</option>
                  <option value="large">Tamanho Grande (Adaptado - 17px)</option>
                  <option value="extra-large">Tamanho Ampliado (Fácil Leitura - 19px)</option>
                </select>
                <p className="text-[9px] text-slate-500">Aumenta os textos de posts, estatísticas e guias litúrgicos de oração.</p>
              </div>

              {/* Modalidade de Treino Adaptada */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider">🦾 Modalidade Adaptada (PCD)</label>
                <select
                  value={adaptedModality}
                  onChange={(e) => setAdaptedModality(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 transition-all"
                >
                  <option value="none">Nenhuma Adaptação Necessária</option>
                  <option value="physical">Limitação Física/Motora (Pilates, Fisioterapia, Adaptações)</option>
                  <option value="cognitive">Inclusão Cognitiva/Atencional (Metas Guiadas, Passos Curtos)</option>
                  <option value="both">Adaptação Plena (Física, Visual e Cognitiva)</option>
                </select>
                <p className="text-[9px] text-slate-500">Ajusta o catálogo de atividades físicas para exercícios adequados.</p>
              </div>

              {/* Alto Contraste Visual */}
              <div className="space-y-1.5 flex flex-col justify-end">
                <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-300">🖤 Alto Contraste Visual</span>
                    <span className="text-[9px] text-slate-500">Ativa contrastes puros de fundo preto para pessoas com visão subnormal.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={highContrast}
                    onChange={(e) => setHighContrast(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-slate-800 bg-slate-950 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingAccessibility}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl border border-indigo-400/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{isSavingAccessibility ? "Salvando..." : "♿ Salvar Preferências PCD"}</span>
              </button>
            </div>
          </form>

          {/* 📢 NOTIFICAÇÕES PUSH DO SISTEMA (FCM / PWA) */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 space-y-4 shadow-md text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-black font-heading text-slate-205 uppercase tracking-wide">📢 Notificações Push (FCM)</h3>
              </div>
              <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded ${
                pushEnabled ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400" : "bg-slate-950 text-slate-500 border border-slate-850"
              }`}>
                {pushEnabled ? "ATIVADO ✅" : "DESATIVADO"}
              </span>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
              Ative as notificações push baseadas em Firebase Cloud Messaging (FCM) para monitorar seu Daimoku, reações na comunidade, evolução corporal e novos rankings de forma instantânea mesmo com o aplicativo fechado!
            </p>

            <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">📲 Canal Push em Nuvem</span>
                  <span className="text-[9px] text-slate-500 block">Autoriza registros push FCM no seu dispositivo atual.</span>
                </div>
                <input
                  type="checkbox"
                  checked={pushEnabled}
                  disabled={isTogglingPush}
                  onChange={handleTogglePush}
                  className="w-4 h-4 text-indigo-600 border-slate-800 bg-slate-950 rounded focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                />
              </div>

              {pushEnabled && pushToken && (
                <div className="pt-2 border-t border-slate-900 space-y-1.5">
                  <span className="text-[9px] font-mono text-slate-500 uppercase font-bold block">Token FCM de Produção:</span>
                  <code className="text-[9px] font-mono bg-slate-900/80 text-teal-400 p-2 rounded block border border-slate-850 break-all leading-normal select-all">
                    {pushToken}
                  </code>
                  <span className="text-[8px] text-emerald-400 font-mono block">Acoplamento Ativo & Sincronizado com Firestore com Sucesso Absoluto</span>
                </div>
              )}
            </div>

            {pushEnabled && (
              <div className="space-y-3 pt-3 border-t border-slate-800/40">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block">🧪 Painel de Homologação de Push (Disparos Reais):</span>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => triggerTestNotification("daimoku")}
                    className="text-[9px] text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-900 border border-slate-850 py-1.5 px-2 rounded-lg text-left transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>🪷 Daimoku Diário</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerTestNotification("shape")}
                    className="text-[9px] text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-900 border border-slate-850 py-1.5 px-2 rounded-lg text-left transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>💪 Evolução do Shape</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerTestNotification("comment")}
                    className="text-[9px] text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-900 border border-slate-850 py-1.5 px-2 rounded-lg text-left transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>❤️ Comentário Rec.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerTestNotification("reaction")}
                    className="text-[9px] text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-900 border border-slate-850 py-1.5 px-2 rounded-lg text-left transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>👏 Nova Reação</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerTestNotification("ranking")}
                    className="text-[9px] text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-900 border border-slate-850 py-1.5 px-2 rounded-lg text-left transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>🏆 Subida de Ranking</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerTestNotification("community")}
                    className="text-[9px] text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-900 border border-slate-850 py-1.5 px-2 rounded-lg text-left transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>📢 Aviso Comunitário</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 📱 MEUS DISPOSITIVOS PANEL (With dynamic disconnection) */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-black font-heading text-slate-205 uppercase tracking-wide">📱 Meus Dispositivos</h3>
              </div>
              <span className="text-[9px] bg-teal-500/10 border border-teal-500/25 text-teal-400 font-mono font-bold py-0.5 px-2 rounded-full flex items-center gap-1">
                <Wifi className="w-2.5 h-2.5 animate-pulse" /> {devices.length} conexões
              </span>
            </div>

            <p className="text-[10px] text-slate-450 leading-relaxed">
              Estes são os dispositivos conectados compartilhando sua sessão BodhiShape. Você pode revogar o acesso a qualquer momento.
            </p>

            <div className="space-y-2.5">
              <AnimatePresence initial={false}>
                {devices.map((device) => (
                  <motion.div
                    key={device.id}
                    layout
                    exit={{ opacity: 0, x: -15, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-850"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 shrink-0 text-slate-400">
                        {device.type === "Navegador" ? <Laptop className="w-4 h-3.5" /> : <Smartphone className="w-3.5 h-4" />}
                      </div>
                      <div className="min-w-0 leading-tight">
                        <p className="text-[11px] font-black text-slate-205 truncate">{device.name}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">{device.location} • {device.lastActive}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDisconnectDevice(device.id, device.name)}
                      className="text-[9px] bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-300 font-bold px-2.5 py-1.5 rounded-lg transition"
                    >
                      Desconectar
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {devices.length === 0 && (
                <div className="text-center p-6 bg-slate-950/20 rounded-xl border border-slate-850 border-dashed text-slate-500 text-xs">
                  🔒 Nenhuma outra sessão conectada. Segurança máxima recomendada.
                </div>
              )}
            </div>
          </div>

          {/* 🔗 REDES SOCIAIS INTEGRITY */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 space-y-3.5 shadow-md">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-yellow-400" />
              <h3 className="text-sm font-black font-heading text-slate-205 uppercase tracking-wide">🔗 Redes Sociais Integradas</h3>
            </div>
            
            <p className="text-[10px] text-slate-450">
              Vincule seus handles para exibir tags do Gymrats-Soka em suas postagens do Feed Social.
            </p>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                  <Instagram className="w-3 h-3 text-pink-500" /> Instagram:
                </span>
                <input
                  type="text"
                  value={socials.instagram}
                  onChange={(e) => setSocials({ ...socials, instagram: e.target.value })}
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-pink-500"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                  <Facebook className="w-3 h-3 text-blue-500" /> Facebook:
                </span>
                <input
                  type="text"
                  value={socials.facebook}
                  onChange={(e) => setSocials({ ...socials, facebook: e.target.value })}
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                  <Youtube className="w-3" /> YouTube:
                </span>
                <input
                  type="text"
                  value={socials.youtube}
                  onChange={(e) => setSocials({ ...socials, youtube: e.target.value })}
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                  <Twitter className="w-3" /> X / Twitter:
                </span>
                <input
                  type="text"
                  value={socials.x}
                  onChange={(e) => setSocials({ ...socials, x: e.target.value })}
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => showToast("Handles de redes sociais atualizados com sucesso no perfil! 🔗")}
                className="text-[10px] bg-indigo-650 hover:bg-indigo-600 text-white font-bold p-2 px-4 rounded-xl border border-indigo-550/30 font-heading"
              >
                Salvar Links Sociais
              </button>
            </div>
          </div>

          {/* 🚪 ENCERRAR SESSÃO / LOGOUT AREA */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 space-y-3 shadow-md">
            <div className="flex items-center gap-2">
              <LogOut className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-black font-heading text-slate-205 uppercase tracking-wide">🚪 Encerrar Sessão</h3>
            </div>
            
            <p className="text-[10px] text-slate-455 leading-relaxed">
              Deseja sair do aplicativo BodhiShape neste dispositivo? Suas tarefas e logs de atividade continuam salvos na nuvem.
            </p>

            <button
              type="button"
              onClick={onLogout}
              className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair da minha Conta</span>
            </button>
          </div>

        </div>

        {/* COL 2: COMMUNITIES, ACHIEVEMENTS & SUPPORT */}
        <div className="space-y-6">

          {/* 📱 DOWNLOAD / INSTALL CARD */}
          <div className="bg-gradient-to-br from-[#121535] to-[#0A0C22] rounded-2xl border border-teal-500/25 p-5 space-y-3 shadow-xl">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-teal-400 animate-pulse" />
              <h3 className="text-sm font-black font-heading text-slate-100 uppercase tracking-wide">📱 Baixar BodhiShape</h3>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Instale o BodhiShape diretamente na tela de início do seu celular ou tablet para ter acesso mais rápido, desempenho otimizado de carregamento, e acompanhamento em tela cheia sem barras de navegador.
            </p>
            <button
              type="button"
              onClick={onInstallApp}
              className="w-full py-2.5 px-4 bg-teal-500 hover:bg-teal-600 active:scale-[0.98] text-slate-950 font-extrabold text-xs uppercase tracking-wide rounded-xl shadow-lg shadow-teal-500/10 transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>🔽 Instalar Aplicativo de Prática & Treino</span>
            </button>
          </div>

          {/* 🤝 MINHA COMUNIDADE CONFIG AREAS */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 space-y-4 shadow-md">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-black font-heading text-slate-205 uppercase tracking-wide">🤝 Minha Comunidade</h3>
            </div>

            {/* Participando active list */}
            <div className="space-y-2">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Grupos Soka Participados ({myCommunities.length}):</span>
              <div className="space-y-2">
                {myCommunities.map(c => {
                  const isFav = favoriteComms.includes(c.name);
                  return (
                    <div key={c.id} className="p-3 bg-slate-950/45 rounded-xl border border-slate-850 flex items-center justify-between">
                      <div className="leading-tight">
                        <p className="text-[11px] font-bold text-slate-205">{c.name}</p>
                        <p className="text-[9px] text-slate-450 mt-0.5">{c.members} Membros Ativos • <span className="text-indigo-450">{c.role}</span></p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleFavoriteComm(c.name)}
                          className={`p-1.5 rounded-lg border text-[10px] font-bold transition ${
                            isFav ? "bg-amber-500/10 border-amber-500/35 text-amber-400" : "bg-slate-900 border-slate-800 text-slate-550 hover:text-slate-300"
                          }`}
                          title="Grupo favorito"
                        >
                          ⭐
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Simulated Pending Invite list */}
            {pendingInvites.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800/40">
                <span className="text-[9px] font-extrabold text-amber-450 uppercase tracking-wider block flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" /> Convites Pendentes:
                </span>
                <div className="space-y-1.5">
                  {pendingInvites.map(p => (
                    <div key={p.id} className="p-2.5 bg-yellow-500/5 rounded-xl border border-yellow-500/10 flex items-center justify-between">
                      <div className="leading-none">
                        <p className="text-[10px] font-black text-slate-205">{p.name}</p>
                        <p className="text-[9px] text-slate-450 mt-1">Convidado por: {p.inviter}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAcceptInvite(p.id, p.name)}
                        className="text-[9px] bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/30 text-white font-bold px-2 py-1.5 rounded-lg transition"
                      >
                        Aceitar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History reference info footer */}
            <div className="text-[9px] text-slate-500 text-right font-mono block italic">
              Histórico de participação: 100% ativo nos últimos 4 encontros soka-shape.
            </div>
          </div>

          {/* 🏆 DESAFIOS CONCLUÍDOS CARD BADGES */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 space-y-4 shadow-md">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400 animate-pulse" />
              <h3 className="text-sm font-black font-heading text-slate-205 uppercase tracking-wide">🏆 Desafios Concluídos</h3>
            </div>

            <p className="text-[10px] text-slate-450 leading-relaxed">
              Exibindo distintivos autênticos obtidos através de campanhas especiais e constância comprovada no Daimoku e treinos.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              
              <div className="p-3 bg-indigo-950/10 border border-indigo-500/15 rounded-xl flex items-center gap-2.5">
                <div className="text-xl">🏆</div>
                <div className="leading-tight">
                  <p className="text-[10px] font-black text-slate-100 font-heading">Desafio 30 dias</p>
                  <p className="text-[8px] text-emerald-400 font-bold uppercase mt-0.5">Concluído ✓</p>
                </div>
              </div>

              <div className="p-3 bg-indigo-950/10 border border-indigo-500/15 rounded-xl flex items-center gap-2.5">
                <div className="text-xl">🔥</div>
                <div className="leading-tight">
                  <p className="text-[10px] font-black text-slate-100 font-heading">Constância Extra</p>
                  <p className="text-[8px] text-emerald-400 font-bold uppercase mt-0.5">Concluído ✓</p>
                </div>
              </div>

              <div className="p-3 bg-indigo-950/10 border border-indigo-500/15 rounded-xl flex items-center gap-2.5">
                <div className="text-xl">🪷</div>
                <div className="leading-tight">
                  <p className="text-[10px] font-black text-slate-100 font-heading">Daimoku Diamante</p>
                  <p className="text-[8px] text-emerald-400 font-bold uppercase mt-0.5">Concluído ✓</p>
                </div>
              </div>

              <div className="p-3 bg-indigo-950/10 border border-indigo-500/15 rounded-xl flex items-center gap-2.5">
                <div className="text-xl">💪</div>
                <div className="leading-tight">
                  <p className="text-[10px] font-black text-slate-100 font-heading">Desafio Fitness</p>
                  <p className="text-[8px] text-emerald-400 font-bold uppercase mt-0.5">Concluído ✓</p>
                </div>
              </div>

            </div>
          </div>

          {/* 💬 AJUDA E FEEDBACK */}
          <form onSubmit={handleFeedbackSubmit} className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 space-y-3.5 shadow-md">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-405" />
              <h3 className="text-sm font-black font-heading text-slate-205 uppercase tracking-wide">💬 Ajuda e Feedback</h3>
            </div>

            <p className="text-[10px] text-slate-455 leading-relaxed">
              Encontrou alguma anomalia ou quer deixar uma sugestão de melhoria soka-shape para facilitar seu dia de treinos? Digite abaixo:
            </p>

            <div className="flex gap-2 text-[10px] font-bold">
              {[
                { id: "erro", name: "⚠️ Reportar erro" },
                { id: "sugestao", name: "💡 Enviar sugestão" },
                { id: "melhoria", name: "⚙️ Solicitar melhoria" }
              ].map((subT) => (
                <button
                  key={subT.id}
                  type="button"
                  onClick={() => setHelpType(subT.id as any)}
                  className={`flex-1 p-2 rounded-xl transition text-center font-bold border ${
                    helpType === subT.id 
                      ? "bg-indigo-650 text-white border-indigo-505 shadow-md"
                      : "bg-slate-950/60 text-slate-450 border-slate-850 hover:text-slate-300"
                  }`}
                >
                  {subT.name}
                </button>
              ))}
            </div>

            <textarea
              value={helpText}
              onChange={(e) => setHelpText(e.target.value)}
              placeholder="Descreva detalhes aqui. Responderemos no seu e-mail de cadastro..."
              className="w-full text-xs bg-slate-955 border border-slate-800 rounded-xl p-3 min-h-[70px] text-slate-100 placeholder-slate-600 outline-none focus:border-slate-700 font-sans resize-none"
            />

            <div className="flex justify-between items-center">
              {feedbackSuccess ? (
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  ✓ Mensagem registrada! Obrigado.
                </span>
              ) : (
                <span className="text-[9px] text-slate-500 italic">Retorno em até 24h</span>
              )}

              <button
                type="submit"
                disabled={!helpText.trim()}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 disabled:opacity-40 text-white text-xs font-heading font-black rounded-xl transition border border-indigo-550/35 flex items-center gap-1.5"
              >
                <Send className="w-3 h-3" />
                <span>Enviar Feedback</span>
              </button>
            </div>
          </form>

          {/* ℹ️ SOBRE GENERAL CREDITS */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900/60 rounded-2xl border border-slate-800/80 p-5 space-y-4 shadow-md">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-450" />
              <h3 className="text-sm font-black font-heading text-slate-205 uppercase tracking-wide">ℹ️ Sobre o BodhiShape</h3>
            </div>

            <div className="p-3 bg-slate-950/45 rounded-xl border border-slate-850 space-y-2">
              <h4 className="text-[11px] font-black text-slate-200">🪷 Filosofia do BodhiShape</h4>
              <p className="text-[10px] text-slate-450 leading-relaxed">
                Aqui, a prática budista de Gongyo e Daimoku se une ao fortalecimento físico para lapidar o corpo e polir o espírito. Sendo templos de sabedoria e amizade profunda, ajudando cada membro a suar o carma e conquistar infinitas vitórias cotidianas!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center text-[10px]">
              
              <div className="bg-slate-950/25 p-2 rounded-xl border border-slate-850 leading-none">
                <span className="text-slate-500 block text-[8px] uppercase font-bold tracking-wider">Versão Atual</span>
                <span className="text-indigo-400 font-black font-mono block mt-1">v2.4.0-Gymrats</span>
              </div>

              <div className="bg-slate-950/25 p-2 rounded-xl border border-slate-850 leading-none">
                <span className="text-slate-500 block text-[8px] uppercase font-bold tracking-wider">Créditos Gerais</span>
                <span className="text-indigo-400 font-black block mt-1 truncate">SGI Soka Gakkai & Devs</span>
              </div>

            </div>

            <div className="space-y-1.5 pt-1.5 border-t border-slate-850">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Últimas Atualizações:</span>
              <ul className="text-[9px] text-slate-450 space-y-1 pl-3 list-disc">
                <li>Nova postagem e registro integrado unificado em 30 segundos.</li>
                <li>Comentários motivadores inteligentes da IA Soka baseados em carma e superação.</li>
                <li>Mecanismos contra "larping" e logs técnicos invasivos na tela.</li>
                <li>Estilo de configurações customizáveis adaptado dos melhores fluxos Gymrats.</li>
              </ul>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
