import React, { useState, useEffect } from "react";
import { 
  MessageSquare, Heart, Flame, Zap, Award, ThumbsUp, Send, Image, 
  MessageCircle, AlertCircle, Video, Check, Star, Settings, ShieldAlert,
  Calendar, Clock, MapPin, Sparkles, Plus, Dumbbell, Compass, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Post, User, ExerciseCategory } from "../types";

interface SocialFeedProps {
  posts: Post[];
  currentUser: User | null;
  allUsers?: User[];
  communities?: any[];
  onReact: (postId: string, reaction: string) => void;
  onComment: (postId: string, content: string) => void;
  onNewPost: (content: string, image: string) => void; // fallback
  onSubmitCombined: (payload: any) => Promise<any>; // New Unified creation callback
  onSelectUser?: (user: User) => void;
  onPostCreated?: () => void;
}

const predefinedImages = [
  { name: "Corrida de Rua", url: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600" },
  { name: "Treino Academia", url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600" },
  { name: "Meditação e Yoga", url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600" },
  { name: "Ciclismo", url: "https://images.unsplash.com/photo-1541614101331-1a5a3a194e92?w=600" },
  { name: "Bicicleta", url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600" }
];

const predefinedVideos = [
  { name: "Treino Academia", url: "https://assets.mixkit.co/videos/preview/mixkit-man-training-at-the-gym-with-dumbbells-4853-large.mp4" },
  { name: "Corrida na Esteira", url: "https://assets.mixkit.co/videos/preview/mixkit-woman-running-on-a-treadmill-at-the-gym-40092-large.mp4" },
  { name: "Ciclismo Estrada", url: "https://assets.mixkit.co/videos/preview/mixkit-cyclist-riding-on-a-country-road-41617-large.mp4" },
  { name: "Sinos Meditação", url: "https://assets.mixkit.co/videos/preview/mixkit-singing-bowl-close-up-vibe-33120-large.mp4" }
];

// Complete Exercise categories matching the system library
const exerciseLib = [
  {
    category: "Musculação" as ExerciseCategory,
    subtypes: ["Musculação", "Treino Livre", "Calistenia", "Treino Funcional", "Cross Training"]
  },
  {
    category: "Corrida" as ExerciseCategory,
    subtypes: ["Corrida", "Caminhada", "Corrida em Esteira", "Trail Running"]
  },
  {
    category: "Ciclismo" as ExerciseCategory,
    subtypes: ["Ciclismo Estrada", "Bicicleta", "Bike Indoor", "Spinning"]
  },
  {
    category: "Esportes" as ExerciseCategory,
    subtypes: ["Futebol", "Vôlei", "Basquete", "Tênis", "Beach Tennis"]
  },
  {
    category: "Artes Marciais" as ExerciseCategory,
    subtypes: ["Jiu-Jitsu", "Boxe", "Muay Thai", "Karatê", "Capoeira"]
  },
  {
    category: "Dança" as ExerciseCategory,
    subtypes: ["Dança", "Zumba", "Forró", "Ballet"]
  },
  {
    category: "Bem-estar" as ExerciseCategory,
    subtypes: ["Yoga", "Alongamento", "Pilates", "Mobilidade"]
  },
  {
    category: "Aquáticos" as ExerciseCategory,
    subtypes: ["Natação", "Hidroginástica", "Surf"]
  },
  {
    category: "Outro" as ExerciseCategory,
    subtypes: ["Caminhada Leve", "Trilha", "Atividade recreativa", "Outro"]
  }
];

export default function SocialFeed({ 
  posts, 
  currentUser, 
  allUsers,
  communities,
  onReact, 
  onComment, 
  onNewPost, 
  onSubmitCombined,
  onSelectUser,
  onPostCreated
}: SocialFeedProps) {
  
  // Custom states
  const [contentMsg, setContentMsg] = useState("");
  const [postImage, setPostImage] = useState("");
  const [postVideo, setPostVideo] = useState("");
  const [showImageChoices, setShowImageChoices] = useState(false);
  const [showVideoChoices, setShowVideoChoices] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaUploadError, setMediaUploadError] = useState("");

  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMedia(true);
    setMediaUploadError("");
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
          setPostImage(data.url);
          setPostVideo(""); // clear video if image selected
        } else {
          setMediaUploadError("Erro no envio da foto: " + (data.error || "Tente novamente"));
        }
      } catch (err) {
        setMediaUploadError("Erro de rede ao enviar foto.");
      } finally {
        setIsUploadingMedia(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMedia(true);
    setMediaUploadError("");
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
          setPostVideo(data.url);
          setPostImage(""); // clear image if video selected
        } else {
          setMediaUploadError("Erro no envio do vídeo: " + (data.error || "Tente novamente"));
        }
      } catch (err) {
        setMediaUploadError("Erro de rede ao enviar vídeo.");
      } finally {
        setIsUploadingMedia(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Combined Form fields states
  const [gongyoMorning, setGongyoMorning] = useState(false);
  const [gongyoEvening, setGongyoEvening] = useState(false);
  const [daimoku, setDaimoku] = useState(false);
  const [daimokuMinutes, setDaimokuMinutes] = useState<number>(30);
  const [isCustomDaimoku, setIsCustomDaimoku] = useState(false);
  const [customDaimokuVal, setCustomDaimokuVal] = useState("45");
  
  const [exercise, setExercise] = useState(false);
  const [exerciseCategory, setExerciseCategory] = useState<ExerciseCategory>("Musculação");
  const [exerciseType, setExerciseType] = useState("Musculação");
  
  // Exercise optional metrics
  const [exerciseDate, setExerciseDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [exerciseTime, setExerciseTime] = useState("07:00");
  const [exerciseDuration, setExerciseDuration] = useState<number>(45);
  const [exerciseLocation, setExerciseLocation] = useState("");
  const [exerciseDistance, setExerciseDistance] = useState("");
  const [exerciseCalories, setExerciseCalories] = useState("");
  const [exerciseSteps, setExerciseSteps] = useState("");
  const [exerciseNotes, setExerciseNotes] = useState("");

  const [noPublish, setNoPublish] = useState(false);

  // Edit & Delete posts & comments states
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostContent, setEditPostContent] = useState("");
  const [editPostImage, setEditPostImage] = useState("");
  const [editPostVideo, setEditPostVideo] = useState("");
  const [editPostCategory, setEditPostCategory] = useState("");
  const [editPostCommunityId, setEditPostCommunityId] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");

  const handleDeletePost = async (postId: string) => {
    if (!currentUser) return;
    const confirmed = window.confirm("Deseja realmente excluir esta publicação? Esta ação é irreversível.");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/posts/${postId}?userId=${currentUser.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        if (onPostCreated) onPostCreated();
      } else {
        const d = await res.json();
        alert(d.error || "Ocorreu um erro ao excluir publicação.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao conectar com o servidor.");
    }
  };

  const handleStartEditPost = (post: Post) => {
    setEditingPostId(post.id);
    setEditPostContent(post.content || "");
    setEditPostImage(post.image || "");
    setEditPostVideo(post.video || "");
    setEditPostCategory(post.category || "Geral");
    setEditPostCommunityId(post.communityId || "");
  };

  const handleCancelEditPost = () => {
    setEditingPostId(null);
    setEditPostContent("");
    setEditPostImage("");
    setEditPostVideo("");
    setEditPostCategory("");
    setEditPostCommunityId("");
  };

  const handleSaveEditPost = async (postId: string) => {
    if (!currentUser) return;
    if (!editPostContent.trim()) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          content: editPostContent.trim(),
          image: editPostImage,
          video: editPostVideo,
          category: editPostCategory,
          communityId: editPostCommunityId
        })
      });
      if (res.ok) {
        setEditingPostId(null);
        setEditPostContent("");
        setEditPostImage("");
        setEditPostVideo("");
        setEditPostCategory("");
        setEditPostCommunityId("");
        if (onPostCreated) onPostCreated();
      } else {
        const d = await res.json();
        alert(d.error || "Ocorreu um erro ao salvar edição.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao conectar com o servidor.");
    }
  };

  // Comments editing & deletion helpers
  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!currentUser) return;
    const confirmed = window.confirm("Deseja realmente excluir este comentário? Esta ação é irreversível.");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        if (onPostCreated) onPostCreated();
      } else {
        const d = await res.json();
        alert(d.error || "Ocorreu um erro ao excluir o comentário.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao conectar.");
    }
  };

  const handleStartEditComment = (comment: any) => {
    setEditingCommentId(comment.id);
    setEditCommentContent(comment.content);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentContent("");
  };

  const handleSaveEditComment = async (postId: string, commentId: string) => {
    if (!currentUser || !editCommentContent.trim()) return;

    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          content: editCommentContent.trim()
        })
      });
      if (res.ok) {
        setEditingCommentId(null);
        setEditCommentContent("");
        if (onPostCreated) onPostCreated();
      } else {
        const d = await res.json();
        alert(d.error || "Erro ao salvar.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro de conexão.");
    }
  };

  // Interaction feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Favorites logic loaded and stored in LocalStorage for amazing Gymrats personalization:
  const [favorites, setFavorites] = useState<Array<{category: ExerciseCategory, type: string}>>([
    { category: "Musculação", type: "Musculação" },
    { category: "Corrida", type: "Corrida" },
    { category: "Corrida", type: "Caminhada" },
    { category: "Ciclismo", type: "Bicicleta" }
  ]);

  useEffect(() => {
    const savedFavs = localStorage.getItem("bodhishape_favs_exercise");
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {
        // use default favorites
      }
    }
  }, []);

  const handleToggleFavorite = (cat: ExerciseCategory, type: string) => {
    const exists = favorites.some(f => f.category === cat && f.type === type);
    let updated;
    if (exists) {
      updated = favorites.filter(f => !(f.category === cat && f.type === type));
    } else {
      updated = [...favorites, { category: cat, type }];
    }
    setFavorites(updated);
    localStorage.setItem("bodhishape_favs_exercise", JSON.stringify(updated));
  };

  // Daimoku minutes preset buttons
  const daimokuPresets = [5, 10, 15, 20, 30, 45, 60, 90];

  // Dynamic live points estimator
  const [estimatedPoints, setEstimatedPoints] = useState(0);
  
  useEffect(() => {
    let pts = 0;
    if (gongyoMorning) pts += 1;
    if (gongyoEvening) pts += 1;
    if (daimoku) {
      const dm = isCustomDaimoku ? Number(customDaimokuVal) || 0 : daimokuMinutes;
      if (dm >= 30 && dm < 60) pts += 1;
      else if (dm >= 60) pts += 2;
    }
    if (exercise) {
      const duration = Number(exerciseDuration) || 0;
      if (duration >= 20) pts += 2;
    }
    setEstimatedPoints(pts);
  }, [gongyoMorning, gongyoEvening, daimoku, daimokuMinutes, isCustomDaimoku, customDaimokuVal, exercise, exerciseDuration]);

  // Clean form state variables
  const resetFormState = () => {
    setContentMsg("");
    setPostImage("");
    setPostVideo("");
    setGongyoMorning(false);
    setGongyoEvening(false);
    setDaimoku(false);
    setExercise(false);
    setExerciseLocation("");
    setExerciseDistance("");
    setExerciseCalories("");
    setExerciseSteps("");
    setExerciseNotes("");
    setNoPublish(false);
    setShowImageChoices(false);
    setShowVideoChoices(false);
  };

  const handleCombinedPostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const activeDaimokuMinutes = isCustomDaimoku ? Number(customDaimokuVal) || 0 : daimokuMinutes;

    const payload = {
      userId: currentUser?.id,
      content: contentMsg,
      image: postImage,
      video: postVideo,
      noPublish,
      gongyoMorning,
      gongyoEvening,
      daimoku,
      daimokuMinutes: activeDaimokuMinutes,
      exercise,
      exerciseCategory,
      exerciseType,
      exerciseDate,
      exerciseTime,
      exerciseDuration: Number(exerciseDuration) || 0,
      exerciseLocation,
      exerciseDistance,
      exerciseCalories,
      exerciseSteps,
      exerciseNotes
    };

    try {
      const result = await onSubmitCombined(payload);
      if (result.success) {
        setSuccessMessage(result.message || "Excelente causação e registro!");
        resetFormState();
        // Clear message warning after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setErrorMessage(result.error || "Algo deu errado ao registrar suas atividades.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Erro de conectividade. Suas atividades foram salvas no backup!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentSubmit = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const commentText = commentInputs[postId];
    if (!commentText || !commentText.trim()) return;
    onComment(postId, commentText);
    setCommentInputs({ ...commentInputs, [postId]: "" });
  };

  // Helper dictionary for reaction labels
  const reactionIcons: Record<string, string> = {
    "❤️": "❤️ Curtir",
    "🔥": "🔥 Determinação",
    "💪": "💪 Inspiração",
    "👏": "👏 Parabéns",
    "🌟": "🌟 Excelente"
  };

  return (
    <div className="space-y-6" id="social-feed-container">
      
      {/* 📸 UNIFIED GYMRATS CREATION FORM PANEL */}
      {currentUser && (
        <form 
          onSubmit={handleCombinedPostSubmit} 
          className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-slate-800 shadow-xl space-y-5" 
          id="gymrats-combined-creator"
        >
          {/* Header instructions info */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-black font-heading text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-soka-orange animate-pulse" />
              <span>✍️ Nova Publicação & Registro Integrado</span>
            </h3>
            <span className="text-[10px] text-slate-450 font-medium">Fluxo Unificado Gymrats × Soka</span>
          </div>

          {/* Success and status blocks */}
          {successMessage && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs flex items-center gap-2"
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}

          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Publication elements content: Foto, Video, Texto */}
          <div className="space-y-4">
            
            {/* Top row with user avatar and Text Area */}
            <div className="flex gap-4">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full border-2 border-slate-800 shrink-0 object-cover bg-slate-950"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1">
                <textarea
                  value={contentMsg}
                  disabled={noPublish}
                  onChange={(e) => setContentMsg(e.target.value)}
                  placeholder={
                    noPublish 
                      ? "🤝 Presença Rápida: Atividades serão publicadas em formato resumido, mas presentes para inspirar a comunidade!"
                      : "O que você realizou hoje? Como está sua determinação budista ou treino físico?..."
                  }
                  className={`w-full text-xs font-sans border-0 focus:ring-0 text-slate-100 placeholder-slate-500 p-3 resize-none bg-slate-955 rounded-xl min-h-[75px] outline-none border transition-colors ${
                    noPublish ? "opacity-45 bg-slate-950 border-slate-900" : "border-slate-800 focus:border-slate-750"
                  }`}
                />
                {!noPublish && (
                  <p className="text-[10px] text-amber-400/80 font-medium italic mt-1.5 flex items-center gap-1 font-sans">
                    <span>🤖 IA Bodhisattva:</span> 
                    <span>"{[
                      "Sua jornada pode inspirar outros Bodhishapers.",
                      "Cada vitória compartilhada fortalece a comunidade.",
                      "Muitos participantes gostam de acompanhar o progresso uns dos outros.",
                      "Sua constância pode motivar alguém hoje.",
                      "Obrigado por contribuir com a energia da comunidade."
                    ][Math.floor(Date.now() / 86400000) % 5]}"</span>
                  </p>
                )}
              </div>
            </div>

            {/* Injected image previews */}
            {postImage && !noPublish && (
              <div className="relative rounded-xl overflow-hidden border border-slate-800 max-h-48 bg-slate-950 flex items-center justify-center">
                <img src={postImage} alt="Instancia de Postagem" className="object-cover w-full h-full" />
                <button
                  type="button"
                  onClick={() => setPostImage("")}
                  className="absolute top-2 right-2 bg-slate-950/80 text-white text-xs px-2.5 py-1 rounded-full hover:bg-slate-900 font-bold"
                >
                  Remover Foto
                </button>
              </div>
            )}

            {/* Injected video previews */}
            {postVideo && !noPublish && (
              <div className="relative rounded-xl overflow-hidden border border-slate-800 max-h-48 bg-slate-950 flex items-center justify-center">
                <video src={postVideo} muted autoPlay loop className="object-cover w-full h-full max-h-48" />
                <button
                  type="button"
                  onClick={() => setPostVideo("")}
                  className="absolute top-2 right-2 bg-slate-950/80 text-white text-xs px-2.5 py-1 rounded-full hover:bg-slate-900 font-bold"
                >
                  Remover Vídeo
                </button>
              </div>
            )}

            {/* Direct hidden native uploads */}
            <input
              type="file"
              id="feed-photo-upload"
              accept="image/*"
              className="hidden"
              onChange={handleUploadPhoto}
            />
            <input
              type="file"
              id="feed-video-upload"
              accept="video/*"
              className="hidden"
              onChange={handleUploadVideo}
            />

            {/* Media upload status indicators */}
            {isUploadingMedia && (
              <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Sincronizando arquivo de mídia com o servidor BodhiShape...
              </div>
            )}
            {mediaUploadError && (
              <div className="text-xs text-rose-500 font-semibold">
                ⚠️ {mediaUploadError}
              </div>
            )}

            {/* Choice selectors list for media */}
            {!noPublish && (
              <div className="flex flex-wrap gap-2 text-[11px] font-bold font-sans">
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById("feed-photo-upload")?.click();
                  }}
                  disabled={isUploadingMedia}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                    postImage 
                      ? "bg-slate-800 border-slate-700 text-slate-100" 
                      : "border-slate-850 hover:bg-slate-800/40 text-slate-400 hover:text-slate-200"
                  } disabled:opacity-50`}
                >
                  <Image className="w-3.5 h-3.5 text-emerald-500" />
                  {postImage ? "Trocar Foto" : "📸 Upload Foto"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    document.getElementById("feed-video-upload")?.click();
                  }}
                  disabled={isUploadingMedia}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                    postVideo 
                      ? "bg-slate-800 border-slate-700 text-slate-100" 
                      : "border-slate-850 hover:bg-slate-800/40 text-slate-400 hover:text-slate-200"
                  } disabled:opacity-50`}
                >
                  <Video className="w-3.5 h-3.5 text-pink-500" />
                  {postVideo ? "Trocar Vídeo" : "🎥 Upload Vídeo"}
                </button>
              </div>
            )}
          </div>

          {/* 🪷 ACTIVITY LOGGING CHECKLIST COMPONENT AREAS */}
          <div className="bg-slate-950/65 p-4 rounded-xl border border-slate-850 space-y-4">
            
            {/* PRÁTICA BUDISTA SECTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-extrabold tracking-wider text-amber-450 font-heading flex items-center gap-1.5">
                  <span>🪷</span> Prática Budista SGI Soka
                </span>
                <span className="text-[9px] text-slate-500 font-mono">Gongyo/Daimoku</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                
                {/* Gongyo Morning */}
                <label className={`flex items-center gap-2 p-2.5 bg-slate-900/40 hover:bg-slate-900/80 rounded-xl cursor-pointer border transition-all select-none ${
                  gongyoMorning ? "border-indigo-500/40 bg-indigo-950/20" : "border-slate-800"
                }`}>
                  <input
                    type="checkbox"
                    checked={gongyoMorning}
                    onChange={(e) => setGongyoMorning(e.target.checked)}
                    className="rounded text-indigo-650 bg-slate-900 border-slate-700 w-4 h-4"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-slate-205 font-black truncate">🌅 Gongyo</span>
                    <span className="text-[9px] text-slate-450">Manhã</span>
                  </div>
                </label>

                {/* Gongyo Evening */}
                <label className={`flex items-center gap-2 p-2.5 bg-slate-900/40 hover:bg-slate-900/80 rounded-xl cursor-pointer border transition-all select-none ${
                    gongyoEvening ? "border-indigo-500/40 bg-indigo-950/20" : "border-slate-800"
                }`}>
                  <input
                    type="checkbox"
                    checked={gongyoEvening}
                    onChange={(e) => setGongyoEvening(e.target.checked)}
                    className="rounded text-indigo-650 bg-slate-900 border-slate-700 w-4 h-4"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-slate-205 font-black truncate">🌃 Gongyo</span>
                    <span className="text-[9px] text-slate-450">Tarde/Noite</span>
                  </div>
                </label>

                {/* Daimoku */}
                <label className={`flex items-center gap-2 p-2.5 bg-slate-900/40 hover:bg-slate-900/80 rounded-xl cursor-pointer border transition-all select-none ${
                  daimoku ? "border-indigo-500/40 bg-indigo-950/20" : "border-slate-800"
                }`}>
                  <input
                    type="checkbox"
                    checked={daimoku}
                    onChange={(e) => setDaimoku(e.target.checked)}
                    className="rounded text-indigo-650 bg-slate-900 border-slate-700 w-4 h-4"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-slate-205 font-black truncate">🪷 Daimoku</span>
                    <span className="text-[9px] text-slate-450">Prática diária</span>
                  </div>
                </label>
              </div>

              {/* Daimoku minutes options panel (appears only when Daimoku is selected) */}
              <AnimatePresence>
                {daimoku && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2.5 mt-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">🪷 Tempo de Daimoku praticado:</span>
                      <span className="text-[10px] text-amber-400 font-bold font-mono">
                        {isCustomDaimoku ? `${customDaimokuVal} min` : `${daimokuMinutes} min`}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {daimokuPresets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setDaimokuMinutes(preset);
                            setIsCustomDaimoku(false);
                          }}
                          className={`text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg border transition-all ${
                            daimokuMinutes === preset && !isCustomDaimoku
                              ? "bg-amber-500/20 border-amber-500/45 text-amber-300"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {preset} min
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => setIsCustomDaimoku(true)}
                        className={`text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg border transition-all ${
                          isCustomDaimoku
                            ? "bg-amber-500/20 border-amber-500/45 text-amber-300"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Outro
                      </button>
                    </div>

                    {isCustomDaimoku && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">Digitar minutos:</span>
                        <input
                          type="number"
                          min="1"
                          max="1440"
                          value={customDaimokuVal}
                          onChange={(e) => setCustomDaimokuVal(e.target.value)}
                          className="w-20 text-xs px-2 py-1 border border-slate-800 bg-slate-950 rounded-lg text-slate-100 outline-none focus:border-amber-500"
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* EXERCÍCIOS FISICOS SECTION */}
            <div className="space-y-3.5 pt-2 border-t border-slate-800/60">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-extrabold tracking-wider text-emerald-450 font-heading flex items-center gap-1.5">
                  <span>💪</span> Exercícios Físicos & Saúde
                </span>
                
                {/* Main Exercise toggle */}
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-3 font-sans select-none">
                  <input
                    type="checkbox"
                    checked={exercise}
                    onChange={(e) => setExercise(e.target.checked)}
                    className="rounded text-emerald-500 bg-slate-900 border-slate-700 w-4.5 h-4.5 cursor-pointer"
                  />
                  <span>Adicionar Treino</span>
                </label>
              </div>

              {/* Workout creation form body */}
              <AnimatePresence>
                {exercise && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-4 pt-1"
                  >
                    {/* MEUS FAVORITOS SECTION */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-heading font-extrabold text-slate-400 uppercase tracking-widest block">⭐ Meus Favoritos (Clique Rápido):</span>
                      <div className="flex flex-wrap gap-1.5">
                        {favorites.map((fav, index) => {
                          const isSelected = exerciseCategory === fav.category && exerciseType === fav.type;
                          return (
                            <button
                              key={`fav-${index}`}
                              type="button"
                              onClick={() => {
                                setExerciseCategory(fav.category);
                                setExerciseType(fav.type);
                              }}
                              className={`text-[10px] font-black px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
                                isSelected
                                  ? "bg-emerald-500/25 border-emerald-555 text-emerald-300 shadow-md transform scale-102"
                                  : "bg-slate-950/60 border-slate-850 text-slate-350 hover:bg-slate-900 hover:text-slate-205"
                              }`}
                            >
                              <span>⭐</span>
                              <span>{fav.type}</span>
                            </button>
                          );
                        })}

                        {/* Add to favorites hint */}
                        <div className="text-[9px] text-slate-500 flex items-center italic mt-1.5 ml-1 select-none">
                          *Todos os treinos selecionados abaixo podem ser favoritados clicando na estrela.
                        </div>
                      </div>
                    </div>

                    {/* TODAS AS MODALIDADES COMPONENT LIBRARY */}
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-850 space-y-3">
                      <span className="text-[10px] font-heading font-extrabold text-slate-400 uppercase tracking-widest block">📚 Todas as Modalidades:</span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        
                        {/* Selector para Categoria */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Grupo Disciplinar:</label>
                          <select
                            value={exerciseCategory}
                            onChange={(e) => {
                              const newCat = e.target.value as ExerciseCategory;
                              setExerciseCategory(newCat);
                              // Auto set first sub-type of library
                              const matching = exerciseLib.find(l => l.category === newCat);
                              if (matching && matching.subtypes.length > 0) {
                                setExerciseType(matching.subtypes[0]);
                              }
                            }}
                            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-2.5 outline-none text-slate-200 focus:border-slate-700"
                          >
                            {exerciseLib.map(lib => (
                              <option key={lib.category} value={lib.category}>{lib.category}</option>
                            ))}
                          </select>
                        </div>

                        {/* Selector para sub-modalidades específicas */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Modalidade Específica:</label>
                          <div className="flex gap-2">
                            <select
                              value={exerciseType}
                              onChange={(e) => setExerciseType(e.target.value)}
                              className="flex-1 text-xs bg-slate-950 border border-slate-800 rounded-xl p-2.5 outline-none text-slate-100 focus:border-slate-700"
                            >
                              {(exerciseLib.find(l => l.category === exerciseCategory)?.subtypes || ["Outro"]).map((sub) => (
                                <option key={sub} value={sub}>{sub}</option>
                              ))}
                            </select>

                            {/* Shortcut favoritar button */}
                            <button
                              type="button"
                              onClick={() => handleToggleFavorite(exerciseCategory, exerciseType)}
                              className={`p-2.5 rounded-xl border transition-all ${
                                favorites.some(f => f.category === exerciseCategory && f.type === exerciseType)
                                  ? "bg-amber-400/10 border-amber-400/30 text-amber-400"
                                  : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
                              }`}
                              title="Favoritar ou desfavoritar modalidade"
                            >
                              <Star className="w-3.5 h-3.5 fill-current" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* DADOS OPCIONAIS COLLAPSIBLE CARD GRID */}
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 space-y-3">
                      <span className="text-[10px] font-heading font-extrabold text-slate-450 uppercase tracking-widest block">🔧 Dados e Métricas Adicionais (Todos Opcionais):</span>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        
                        {/* Data */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-slate-450 uppercase font-bold flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" /> Data
                          </span>
                          <input
                            type="date"
                            value={exerciseDate}
                            onChange={(e) => setExerciseDate(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 outline-none focus:border-indigo-600"
                          />
                        </div>

                        {/* Horário de Inicio */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-slate-455 uppercase font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" /> Início
                          </span>
                          <input
                            type="time"
                            value={exerciseTime}
                            onChange={(e) => setExerciseTime(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 outline-none focus:border-indigo-600"
                          />
                        </div>

                        {/* Duração */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-slate-450 uppercase font-bold">⏱️ Duração (min)</span>
                          <input
                            type="number"
                            min="1"
                            max="1000"
                            value={exerciseDuration}
                            onChange={(e) => setExerciseDuration(Number(e.target.value) || 0)}
                            className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 outline-none focus:border-indigo-600"
                          />
                        </div>

                        {/* Localização */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-slate-450 uppercase font-bold flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" /> Localização
                          </span>
                          <input
                            type="text"
                            value={exerciseLocation}
                            onChange={(e) => setExerciseLocation(e.target.value)}
                            placeholder="Ex: Praia, Academia..."
                            className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-indigo-600"
                          />
                        </div>

                        {/* Distância */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-slate-450 uppercase font-bold">🏃 Distância (km)</span>
                          <input
                            type="text"
                            value={exerciseDistance}
                            onChange={(e) => setExerciseDistance(e.target.value)}
                            placeholder="Ex: 5"
                            className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-indigo-600"
                          />
                        </div>

                        {/* Calorias */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-slate-450 uppercase font-bold">🔥 Calorias kcal</span>
                          <input
                            type="text"
                            value={exerciseCalories}
                            onChange={(e) => setExerciseCalories(e.target.value)}
                            placeholder="Ex: 350"
                            className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-indigo-600"
                          />
                        </div>

                        {/* Passos */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-slate-450 uppercase font-bold">👣 Passos</span>
                          <input
                            type="text"
                            value={exerciseSteps}
                            onChange={(e) => setExerciseSteps(e.target.value)}
                            placeholder="Ex: 8500"
                            className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-indigo-600"
                          />
                        </div>

                        {/* Observações rápidas */}
                        <div className="flex flex-col gap-1Col flex-1 col-span-1 md:col-span-1">
                          <span className="text-[9px] text-slate-450 uppercase font-bold">📝 Anotações do Treino</span>
                          <input
                            type="text"
                            value={exerciseNotes}
                            onChange={(e) => setExerciseNotes(e.target.value)}
                            placeholder="Ex: Dor na canela, focado..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-indigo-600"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ⚖️ ESTIMATIVAS LIVE DE PONTOS E CONTROLE PRIVADO */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-950/40 p-4 border border-slate-850 rounded-xl">
            
            {/* Live Point Indicator block */}
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/10 p-2.5 rounded-full border border-amber-500/25">
                <Flame className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block font-heading">Pontos Estimados:</span>
                <span className="text-sm font-black text-slate-100 font-sans flex items-center gap-1.5">
                  <span className="text-amber-400 font-mono font-bold text-base">+{estimatedPoints} pontos</span>
                  <span className="text-slate-500 text-xs">hoje Soka-Shape</span>
                </span>
              </div>
            </div>

            {/* Toggle Registrar Presença Rápida */}
            <label className="flex items-center gap-2 px-3 py-2 bg-slate-900/60 rounded-xl cursor-pointer hover:bg-slate-900 border border-slate-800 select-none">
              <input
                type="checkbox"
                checked={noPublish}
                onChange={(e) => setNoPublish(e.target.checked)}
                className="rounded text-indigo-500 bg-slate-950 border-slate-750 w-4 h-4 cursor-pointer"
              />
              <div className="flex flex-col font-sans">
                <span className="text-[11px] text-slate-205 font-bold flex items-center gap-1">
                  <span>🤝</span> Presença Rápida
                </span>
                <span className="text-[8px] text-slate-450">Registra atividades sem texto/foto</span>
              </div>
            </label>
          </div>

          {/* SUBMIT ROW BUTTON */}
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting || (!contentMsg.trim() && !gongyoMorning && !gongyoEvening && !daimoku && !exercise)}
              className="px-6 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold font-heading rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-950/40 border border-indigo-500/30"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processando causação...</span>
                </>
              ) : noPublish ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>💾 Registrar Presença Rápida</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-indigo-200" />
                  <span>🚀 Publicar Atividades & Post</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Social post feed items list */}
      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map((post) => {
            const authorUser = allUsers?.find(u => u.id === post.userId);
            const authorName = authorUser ? (authorUser.displayName || authorUser.name) : post.userName;
            const authorAvatar = authorUser ? authorUser.avatar : post.userAvatar;

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden"
                id={`post-item-${post.id}`}
              >
                {post.isPresenceOnly ? (
                  /* Elegant Compact Presence card layout */
                  <div className="p-4 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-900/60 via-slate-950/40 to-slate-900/60 border-b border-slate-850">
                    <div className="flex items-center gap-3">
                      <img
                        src={authorAvatar}
                        alt={authorName}
                        onClick={() => onSelectUser?.({ id: post.userId, name: authorName, avatar: authorAvatar, division: post.userDivision, region: post.userRegion } as any)}
                        className="w-10 h-10 rounded-full border border-slate-800 shrink-0 object-cover cursor-pointer hover:opacity-80 transition bg-slate-950"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 
                            onClick={() => onSelectUser?.({ id: post.userId, name: authorName, avatar: authorAvatar, division: post.userDivision, region: post.userRegion } as any)}
                            className="font-bold text-slate-200 text-xs font-heading cursor-pointer hover:text-indigo-450 hover:underline"
                          >
                            {authorName}
                          </h4>
                          <span className="bg-indigo-505/10 text-indigo-300 text-[8px] uppercase font-bold px-1.5 py-0.2 rounded font-mono border border-indigo-500/15">
                            {post.userDivision}
                          </span>
                          <span className="text-[9px] text-slate-500">• {post.userRegion}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-slate-250 text-sm font-semibold font-sans mt-0.5 flex items-center gap-1.5">
                            {post.content}
                          </p>
                          {currentUser && (post.userId === currentUser.id || post.userName === currentUser.name || post.userName === currentUser.displayName || currentUser.email === "nara.gabriela@gmail.com") && (
                            <button
                              type="button"
                              onClick={() => handleDeletePost(post.id)}
                              className="text-[9px] text-slate-500 hover:text-rose-450 transition self-start font-bold mt-1 pr-1.5 py-0.5"
                            >
                              🗑️ Excluir registro
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats metrics badge with points and active streak */}
                    <div className="flex flex-col items-end gap-1 shrink-0 bg-slate-950/45 px-2.5 py-1 rounded-xl border border-slate-850">
                      {post.pointsEarned !== undefined && post.pointsEarned > 0 && (
                        <span className="text-amber-400 font-extrabold text-[10px] font-mono flex items-center gap-0.5">
                          🏆 +{post.pointsEarned} pts
                        </span>
                      )}
                      {post.streak !== undefined && post.streak > 0 && (
                        <span className="text-emerald-420 font-bold text-[9px] font-mono flex items-center gap-0.5">
                          🔥 {post.streak}d
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Standard fully documented Social Post Layout */
                  <>
                    {/* Header info */}
                    <div className="p-4 flex gap-3 items-center">
                      <img
                        src={authorAvatar}
                        alt={authorName}
                        onClick={() => onSelectUser?.({ id: post.userId, name: authorName, avatar: authorAvatar, division: post.userDivision, region: post.userRegion } as any)}
                        className="w-10 h-10 rounded-full border border-slate-805 shrink-0 object-cover bg-slate-950 cursor-pointer hover:opacity-80 transition"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 
                          onClick={() => onSelectUser?.({ id: post.userId, name: authorName, avatar: authorAvatar, division: post.userDivision, region: post.userRegion } as any)}
                          className="font-bold text-slate-205 text-sm font-heading cursor-pointer hover:text-orange-400 hover:underline"
                        >
                          {authorName}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="bg-indigo-500/10 text-indigo-300 text-[10px] uppercase font-bold py-0.2 px-1.5 rounded font-mono border border-indigo-500/20">
                            {post.userDivision}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">• {post.userRegion} •</span>
                          <span className="text-[9px] text-slate-500">
                            {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Post message content */}
                    <div className="px-4 pb-3">
                      {editingPostId === post.id ? (
                        <div className="space-y-3 mt-1 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                          <div>
                            <label className="text-[10px] font-black uppercase text-slate-500 font-sans block mb-1">Texto da Publicação</label>
                            <textarea
                              value={editPostContent}
                              onChange={(e) => setEditPostContent(e.target.value)}
                              className="w-full text-slate-100 bg-slate-950 border border-slate-700/60 rounded-lg p-2.5 text-xs outline-none focus:border-indigo-500 leading-relaxed font-sans"
                              rows={3}
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">URL da Imagem 📷</label>
                              <input
                                type="text"
                                value={editPostImage || ""}
                                onChange={(e) => setEditPostImage(e.target.value)}
                                placeholder="https://exemplo.com/foto.jpg"
                                className="w-full text-xs bg-slate-950 border border-slate-700/60 rounded-lg p-2 text-slate-200 outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">URL do Vídeo 🎥</label>
                              <input
                                type="text"
                                value={editPostVideo || ""}
                                onChange={(e) => setEditPostVideo(e.target.value)}
                                placeholder="https://exemplo.com/video.mp4"
                                className="w-full text-xs bg-slate-950 border border-slate-700/60 rounded-lg p-2 text-slate-200 outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Pilar / Categoria</label>
                              <select
                                value={editPostCategory || "Geral"}
                                onChange={(e) => setEditPostCategory(e.target.value)}
                                className="w-full text-xs bg-slate-950 border border-slate-700/60 rounded-lg p-2 text-slate-300 outline-none"
                              >
                                <option value="Geral">Geral</option>
                                <option value="Daimoku">Daimoku 🪷</option>
                                <option value="Gongyo">Gongyo 🔔</option>
                                <option value="Musculação">Musculação 💪</option>
                                <option value="Corrida">Corrida 🏃</option>
                                <option value="Ciclismo">Ciclismo 🚴</option>
                                <option value="Estudo">Estudo Doutrinário 📚</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Comunidade Responsável</label>
                              <select
                                value={editPostCommunityId || ""}
                                onChange={(e) => setEditPostCommunityId(e.target.value)}
                                className="w-full text-xs bg-slate-950 border border-slate-700/60 rounded-lg p-2 text-slate-300 outline-none"
                              >
                                <option value="">Sem comunidade (Público)</option>
                                {communities && communities.map(c => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end text-xs pt-1 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={handleCancelEditPost}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition text-[11px] font-medium"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditPost(post.id)}
                              className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-slate-950 rounded-lg transition text-[11px] font-black"
                            >
                              Salvar Alterações ✅
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-slate-300 text-sm whitespace-pre-line leading-relaxed font-sans">
                            {post.content}
                          </p>
                          {currentUser && (post.userId === currentUser.id || post.userName === currentUser.name || post.userName === currentUser.displayName || currentUser.email === "nara.gabriela@gmail.com") && (
                            <div className="flex gap-2.5 justify-end text-[9px] text-slate-500 mt-2">
                              <button
                                type="button"
                                onClick={() => handleStartEditPost(post)}
                                className="hover:text-amber-400 font-medium transition flex items-center gap-1"
                              >
                                ✏️ Editar publicação
                              </button>
                              <span className="text-slate-800">|</span>
                              <button
                                type="button"
                                onClick={() => handleDeletePost(post.id)}
                                className="hover:text-rose-455 font-medium transition flex items-center gap-1"
                              >
                                🗑️ Excluir publicação
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Gymrats Premium Activity Summary Badges (renders if parsed from loggedActivities) */}
                    {post.loggedActivities && post.loggedActivities.length > 0 && (
                      <div className="px-4 pb-4">
                        <div className="bg-slate-950/45 p-3 rounded-xl border border-slate-850 space-y-1.5">
                          <span className="text-[9px] uppercase font-extrabold text-indigo-400 font-heading block">📋 Atividades Registradas:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {post.loggedActivities.map((act, idx) => (
                              <span 
                                key={`act-badge-${idx}`}
                                className="bg-indigo-950/30 border border-indigo-550/20 text-indigo-300 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"
                              >
                                <span>✅</span>
                                <span>{act}</span>
                              </span>
                            ))}
                            {post.pointsEarned !== undefined && post.pointsEarned > 0 && (
                              <span className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-black px-2.5 py-1 rounded-lg">
                                🏆 +{post.pointsEarned} pontos hoje
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Optional visual post illustration / loops */}
                {post.image && !post.isPresenceOnly && (
                  post.image.endsWith(".mp4") ? (
                    <div className="relative border-y border-slate-850 bg-slate-950 flex flex-col items-center">
                      <video
                        src={post.image}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full max-h-80 object-cover"
                      />
                      <div className="absolute top-3 right-3 bg-red-650 text-white text-[9px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider font-mono shadow-md animate-pulse">
                        📹 SHORTS 15S SOKA
                      </div>
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-hidden border-y border-slate-850 bg-slate-950 flex items-center justify-center">
                      <img
                        src={post.image}
                        alt="Atividade"
                        className="w-full object-cover max-h-72"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )
                )}

                {/* Reaction summaries counts */}
                <div className="px-4 py-2 border-b border-slate-850 flex flex-wrap gap-2 text-xs">
                  {Object.entries(post.reactions || {}).map(([key, usersList]) => {
                    if (!usersList || usersList.length === 0) return null;
                    const hasUserReacted = currentUser && usersList.includes(currentUser.id);
                    return (
                      <span
                        key={key}
                        onClick={() => onReact(post.id, key)}
                        className={`cursor-pointer inline-flex items-center gap-1 font-semibold px-2 py-1 rounded-full transition-all border ${
                          hasUserReacted
                            ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-200"
                            : "bg-slate-950/60 hover:bg-slate-900 text-slate-400 border-slate-800"
                        }`}
                      >
                        <span>{key}</span>
                        <span className="text-[10px]">{usersList.length}</span>
                      </span>
                    );
                  })}
                </div>

                {/* Quick actions line */}
                <div className="grid grid-cols-5 border-b border-slate-850 bg-slate-950/40">
                  {["❤️", "🔥", "💪", "👏", "🌟"].map((emoji) => {
                    const usersList = post.reactions?.[emoji] || [];
                    const active = currentUser && usersList.includes(currentUser.id);
                    return (
                      <button
                        key={emoji}
                        onClick={() => onReact(post.id, emoji)}
                        className={`py-2 text-center text-xs hover:bg-slate-900/60 transition-colors flex flex-col items-center justify-center gap-1 ${
                          active ? "font-bold text-white bg-slate-950/60" : "text-slate-450 font-medium"
                        }`}
                      >
                        <span className="text-lg">{emoji}</span>
                        <span className="text-[9px] capitalize">{reactionIcons[emoji].split(" ")[1]}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Dedicated comments sub-section */}
                <div className="p-4 bg-slate-950/30 space-y-3">
                  {post.comments && post.comments.length > 0 && (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {post.comments.map((comm) => {
                        const commUser = allUsers?.find(u => u.id === comm.userId);
                        const commName = comm.isAI ? comm.userName : (commUser ? (commUser.displayName || commUser.name) : comm.userName);
                        const commAvatar = comm.isAI 
                          ? (comm.userAvatar || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'><rect width='128' height='128' fill='%2378350f'/><circle cx='64' cy='64' r='40' fill='none' stroke='%23f59e0b' stroke-width='4'/><rect x='44' y='50' width='40' height='24' rx='4' fill='%23f59e0b'/><circle cx='54' cy='62' r='3' fill='%2378350f'/><circle cx='74' cy='62' r='3' fill='%2378350f'/><path d='M54,80 Q64,88 74,80' stroke='%23f59e0b' stroke-width='3' fill='none'/></svg>") 
                          : (commUser ? (commUser.avatarUrl || commUser.avatar) : (comm.userAvatar || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'><rect width='128' height='128' fill='%231e293b'/><circle cx='64' cy='48' r='24' fill='%236366f1'/><path d='M28,104 C28,80 44,72 64,72 C84,72 100,80 100,104' fill='%236366f1'/></svg>"));

                        return (
                          <div
                            key={comm.id}
                            className={`p-2.5 rounded-xl border text-xs leading-relaxed ${
                              comm.isAI
                                ? "bg-amber-500/5 border-amber-500/10 text-slate-300"
                                : "bg-slate-900/40 border-slate-850 shadow-sm text-slate-300"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span 
                                onClick={() => {
                                  if (!comm.isAI) {
                                    onSelectUser?.({ id: comm.userId, name: commName, avatar: commAvatar, division: "JS", region: "Região Geral" } as any);
                                  }
                                }}
                                className={`font-bold cursor-pointer hover:underline ${comm.isAI ? "text-amber-400 font-heading" : "text-slate-200 hover:text-orange-400"}`}
                              >
                                {commName}
                              </span>
                            <span className="text-[9px] text-slate-500 font-mono">
                              {new Date(comm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {editingCommentId === comm.id ? (
                            <div className="mt-1 space-y-1.5">
                              <input
                                type="text"
                                value={editCommentContent}
                                onChange={(e) => setEditCommentContent(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700/60 rounded px-2 py-1 text-xs text-slate-100 outline-none focus:border-indigo-500"
                              />
                              <div className="flex gap-2 justify-end text-[10px]">
                                <button
                                  type="button"
                                  onClick={handleCancelEditComment}
                                  className="text-slate-400 hover:text-slate-200"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditComment(post.id, comm.id)}
                                  className="text-indigo-450 font-bold hover:text-indigo-350"
                                >
                                  Salvar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="mt-0.5 text-slate-250">{comm.content}</p>
                              {currentUser && (comm.userId === currentUser.id || comm.userName === currentUser.name || comm.userName === currentUser.displayName || currentUser.email === "nara.gabriela@gmail.com") && (
                                <div className="flex gap-2 mt-1 justify-end text-[9px] text-slate-500">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditComment(comm)}
                                    className="hover:text-indigo-400 transition"
                                  >
                                    Editar
                                  </button>
                                  <span className="text-slate-700">|</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(post.id, comm.id)}
                                    className="hover:text-rose-455 transition"
                                  >
                                    Excluir
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add comments bar */}
                  {currentUser && (
                    <form onSubmit={(e) => handleCommentSubmit(post.id, e)} className="flex gap-2">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ""}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        placeholder="Escreva um comentário de incentivo..."
                        className="flex-1 text-xs border border-slate-800 bg-slate-950/60 px-3 py-2 rounded-xl outline-none text-slate-100 placeholder-slate-500 focus:border-indigo-505 transition"
                      />
                      <button
                        type="submit"
                        className="px-3.5 bg-indigo-650 hover:bg-indigo-550 transition-colors text-white rounded-xl text-xs flex items-center justify-center font-bold"
                      >
                        Enviar
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="bg-gradient-to-br from-indigo-950/20 via-slate-900/40 to-purple-950/20 border border-indigo-500/10 rounded-2xl p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto text-indigo-400">
              🪷
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h4 className="text-sm font-black font-heading text-slate-200">Seja muito bem-vindo(a) ao feed do BodhiShape! ✨</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ao registrarmos nossa revolução diária em prol de saúde física, oração sincera e uma missão valiosa, criamos causas de felicidade inabalável.
              </p>
              <p className="text-[11px] text-indigo-300 font-medium leading-relaxed">
                Seja a primeira pessoa a incentivar o grupo! Publique o seu Daimoku, Gongyo ou treino de hoje na caixa acima e ilumine o caminho dos companheiros! 💪🌟
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
