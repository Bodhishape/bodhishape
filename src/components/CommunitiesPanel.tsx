import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, Users, Shield, Check, Layers, Sparkles, BookOpen, Dumbbell, Zap, 
  MessageSquare, Send, Trophy, ArrowLeft, Share2, QrCode, Lock, Key, Edit,
  Calendar, Award, Globe, Mail, Eye, Pin, PinOff, Smile, Camera, 
  ThumbsUp, BarChart, TrendingUp, AlertCircle, X, ChevronRight, CheckCircle2,
  MapPin, Copy, Link, Bell, Settings, Trash2, UserCheck, UserX, Play, FileText, Download, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Community, User, Activity } from "../types";
import { hasRole } from "../lib/roles";
import MissaoNordesteMap from "./MissaoNordesteMap";
import ConstancyHall from "./ConstancyHall";
import MuralVitorias from "./MuralVitorias";
import SocialFeed from "./SocialFeed";

interface CommunitiesPanelProps {
  currentUser: User | null;
  communities: Community[];
  onAddCommunity: (payload: {
    name: string;
    description: string;
    rules: string;
    enabledActivities: string[];
    cover: string;
    startDate?: string;
    endDate?: string;
    prize?: string;
    privacy?: "public" | "private" | "invite";
  }) => void;
  users: User[];
  activities: Activity[];
  firebaseAuth?: any;
  onSelectCommunity?: (comm: any) => void;
  posts?: any[];
  onComment?: (postId: string, content: string) => void;
  onReact?: (postId: string, reaction: string) => void;
  onNewPost?: (content: string, image: string) => void;
  onSubmitCombined?: (payload: any) => Promise<any>;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  image?: string;
  reactions?: Record<string, number>; // emoji -> count
  isPinned?: boolean;
}

export default function CommunitiesPanel({ 
  currentUser, 
  communities, 
  onAddCommunity, 
  users, 
  activities, 
  firebaseAuth, 
  onSelectCommunity,
  posts = [],
  onComment,
  onReact,
  onNewPost,
  onSubmitCombined
}: CommunitiesPanelProps) {
  // Rich fallback seed list in case DB has old structure
  const [localCommunities, setLocalCommunities] = useState<any[]>([]);

  // Selection of active challenge
  const [selectedChallenge, setSelectedChallenge] = useState<any | null>(null);

  useEffect(() => {
    if (onSelectCommunity) {
      onSelectCommunity(selectedChallenge);
    }
  }, [selectedChallenge, onSelectCommunity]);

  // Track join status locally so the user can dynamically click join/leave
  const [joinedChallenges, setJoinedChallenges] = useState<Record<string, boolean>>({});

  // Track custom invitation received list
  const [receivedInvites, setReceivedInvites] = useState<any[]>([]);

  // Form states matching custom challenges fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [startDate, setStartDate] = useState("2026-07-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [prize, setPrize] = useState("Troféu + reconhecimento no mural");
  const [privacy, setPrivacy] = useState<"public" | "private" | "invite">("public");
  const [activitiesSelected, setActivitiesSelected] = useState<string[]>(["gongyo", "daimoku", "exercise"]);
  const [gongyoMorningPoints, setGongyoMorningPoints] = useState(1);
  const [gongyoEveningPoints, setGongyoEveningPoints] = useState(1);
  const [daimokuPoints, setDaimokuPoints] = useState(1);
  const [exercisePoints, setExercisePoints] = useState(2);
  const [cover, setCover] = useState("");
  const [customSubgroupsInput, setCustomSubgroupsInput] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Advanced metadata fields for creation/edit
  const [regionField, setRegionField] = useState("");
  const [cityField, setCityField] = useState("");
  const [stateField, setStateField] = useState("");
  const [countryField, setCountryField] = useState("Brasil");
  const [languageField, setLanguageField] = useState("Português");
  const [categoryField, setCategoryField] = useState("Geral");
  const [joinCriteria, setJoinCriteria] = useState<string>("invite_auto");
  const [inviteCodeField, setInviteCodeField] = useState("");

  // Sub-resource interactions
  const [iaHistory, setIaHistory] = useState<{ role: "user" | "model"; content: string }[]>([]);
  const [iaMessage, setIaMessage] = useState("");
  const [iaLoading, setIaLoading] = useState(false);

  const [evtTitle, setEvtTitle] = useState("");
  const [evtDesc, setEvtDesc] = useState("");
  const [evtDate, setEvtDate] = useState("");
  const [evtLocation, setEvtLocation] = useState("");
  const [evtCategory, setEvtCategory] = useState("evento");

  const [fileName, setFileName] = useState("");
  const [fileDesc, setFileDesc] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileCat, setFileCat] = useState("estudo");

  const [liveTitle, setLiveTitle] = useState("");
  const [liveDesc, setLiveDesc] = useState("");
  const [liveUrl, setLiveUrl] = useState("");

  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [assignRoleName, setAssignRoleName] = useState("Membro");
  const [adminMsg, setAdminMsg] = useState("");

  // Notice board management within communities
  const [communityNotices, setCommunityNotices] = useState<any[]>([]);
  const [communityEvents, setCommunityEvents] = useState<any[]>([]);
  const [communityFiles, setCommunityFiles] = useState<any[]>([]);
  const [communityLives, setCommunityLives] = useState<any[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeDesc, setNoticeDesc] = useState("");
  const [noticeType, setNoticeType] = useState<"campaign" | "challenge" | "announcement" | "study">("announcement");
  const [noticeColor, setNoticeColor] = useState("from-sky-900/30 to-indigo-900/20 border-sky-500/30 text-sky-300");

  // Unlocking private challenges code states
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [showInviteUnlockModal, setShowInviteUnlockModal] = useState(false);
  const [unlockSuccessMsg, setUnlockSuccessMsg] = useState("");
  const [unlockErrorMsg, setUnlockErrorMsg] = useState("");

  // Tabs inside active selected challenge space
  const [activeTab, setActiveTab] = useState<"feed" | "chat" | "ranking" | "dashboard" | "regras" | "subgroups">("chat");

  // Community ranking states
  const [communityRanking, setCommunityRanking] = useState<any[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingView, setRankingView] = useState<"general" | "subgroups">("general");

  // Community feed states
  const [communityFeed, setCommunityFeed] = useState<any[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);

  // Edit community states
  const [isEditing, setIsEditing] = useState(false);

  // Prevent duplicate join handling from causing render loops
  const joinProcessedRef = useRef(false);

  // Dedicated Chat state per challenge
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});

  // Chat message composition states
  const [chatText, setChatText] = useState("");
  const [selectedChatImage, setSelectedChatImage] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
  
  // Link copied & QR Code states for community invitations
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showQrModalFor, setShowQrModalFor] = useState<any | null>(null);

  // Preset covers
  const availableCovers = [
    { name: "Padrão Abstrato", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800" }
  ];

  // Quick message presets
  const illustrativeImages = [
    { label: "Treino no Boxe", url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400" },
    { label: "Meditação Serena", url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400" },
    { label: "Corrida ao Ar Livre", url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400" },
    { label: "Companheiros Sinceros", url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400" }
  ];

  // Sync and enrich remote backend communities on mount / change
  useEffect(() => {
    if (communities && communities.length > 0) {
      const enriched = communities.map((comm: any) => {
        // Provide defaults if these properties were left blank by older servers
        return {
          ...comm,
          startDate: comm.startDate || "2026-06-01",
          endDate: comm.endDate || "2026-12-31",
          prize: comm.prize || "Troféu de Destaque + Reconhecimento Coletivo",
          privacy: comm.privacy || (comm.id?.includes("private") ? "private" : "public"),
          participants: comm.participants || (comm.creatorId && comm.creatorId !== "system" ? [comm.creatorId] : [])
        };
      });
      setLocalCommunities(enriched);
    }
  }, [communities]);

  // Load and sync real-time chat messages from backend with multi-device polling fallback
  useEffect(() => {
    if (!selectedChallenge) return;
    const fetchChatMessages = async () => {
      try {
        const res = await fetch(`/api/chats/${selectedChallenge.id}`);
        if (res.ok) {
          const data = await res.json();
          setChats(prev => ({
            ...prev,
            [selectedChallenge.id]: data
          }));
        }
      } catch (err) {
        console.error("Erro ao sincronizar mensagens:", err);
      }
    };
    fetchChatMessages();
    const interval = setInterval(fetchChatMessages, 4000);
    return () => clearInterval(interval);
  }, [selectedChallenge?.id]);

  // Sync real-time challenge ranking from backend
  useEffect(() => {
    if (!selectedChallenge || activeTab !== "ranking") return;
    const fetchRanking = async () => {
      setRankingLoading(true);
      try {
        const res = await fetch(`/api/communities/${selectedChallenge.id}/ranking`);
        if (res.ok) {
          const data = await res.json();
          setCommunityRanking(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setRankingLoading(false);
      }
    };
    fetchRanking();
    const interval = setInterval(fetchRanking, 15000);
    return () => clearInterval(interval);
  }, [selectedChallenge?.id, activeTab]);

  // Sync real-time challenge feed from backend
  useEffect(() => {
    if (!selectedChallenge || activeTab !== "feed") return;
    const fetchFeed = async () => {
      setFeedLoading(true);
      try {
        const res = await fetch(`/api/communities/${selectedChallenge.id}/feed`);
        if (res.ok) {
          const data = await res.json();
          setCommunityFeed(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setFeedLoading(false);
      }
    };
    fetchFeed();
    const interval = setInterval(fetchFeed, 15000);
    return () => clearInterval(interval);
  }, [selectedChallenge?.id, activeTab]);

  // Sync notices when visiting notices tab
  useEffect(() => {
    if (!selectedChallenge || activeTab !== "avisos") return;
    const fetchNotices = async () => {
      setNoticesLoading(true);
      try {
        const res = await fetch(`/api/notices?communityId=${selectedChallenge.id}`);
        if (res.ok) {
          const data = await res.json();
          setCommunityNotices(data);
        }
      } catch (err) {
        console.error("Erro ao carregar avisos:", err);
      } finally {
        setNoticesLoading(false);
      }
    };
    fetchNotices();
  }, [selectedChallenge?.id, activeTab]);

  // Sync lives when visiting events tab
  useEffect(() => {
    if (!selectedChallenge || activeTab !== "eventos") return;
    const fetchLives = async () => {
      try {
        const res = await fetch(`/api/lives?communityId=${selectedChallenge.id}`);
        if (res.ok) {
          const data = await res.json();
          setCommunityLives(data);
        }
      } catch (err) {
        console.error("Erro ao carregar transmissões:", err);
      }
    };
    fetchLives();
  }, [selectedChallenge?.id, activeTab]);

  // Sync events and library files from the community object
  useEffect(() => {
    if (!selectedChallenge) return;
    setCommunityEvents(selectedChallenge.events || []);
    setCommunityFiles(selectedChallenge.files || []);
  }, [selectedChallenge]);

  const isAllowedRegion = (regionStr: string) => {
    if (!regionStr) return false;
    const norm = regionStr.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const targets = [
      "pernambuco norte", "pernambuco pe norte", "pernambuco nort",
      "pernambuco sul", "pernambuco pe sul",
      "pernambuco oeste", "pernambuco pe oeste",
      "paraiba", "re paraiba", "paraiba pe", "re paraiba pe",
      "alagoas", "re alagoas",
      "sergipe", "re sergipe"
    ];
    return targets.some(t => norm.includes(t) || t.includes(norm));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get("join") || params.get("comunidade") || params.get("invite");
    if (joinCode && currentUser && !joinProcessedRef.current) {
      const upperCode = joinCode.toUpperCase().trim();
      
      const targetChallenge = localCommunities.find(c => 
        c.id.toUpperCase() === upperCode || 
        c.id.substr(0, 8).toUpperCase() === upperCode || 
        (c.entryCode && c.entryCode.toUpperCase() === upperCode)
      );

      if (targetChallenge) {
        joinProcessedRef.current = true;
        // Verify regional rules for Nordeste 1
        if ((targetChallenge.id === "comm-nordeste1" || targetChallenge.name?.toLowerCase().includes("nordeste 1")) && !isAllowedRegion(currentUser.region)) {
          setUnlockErrorMsg("❌ Seu cadastro não pertence às regionais permitidas para este desafio (RM Pernambuco Norte, PE Sul, PE Oeste, RE Paraíba, RE Alagoas e RE Sergipe).");
          setUnlockSuccessMsg("");
          setShowInviteUnlockModal(true);
        } else {
          setJoinedChallenges(prev => ({ ...prev, [targetChallenge.id]: true }));
          setLocalCommunities(comms => comms.map(c => {
            if (c.id === targetChallenge.id) {
              const uids = c.participants || [];
              if (currentUser && !uids.includes(currentUser.id)) {
                uids.push(currentUser.id);
              }
              return { ...c, participants: uids, membersCount: uids.length };
            }
            return c;
          }));
          setUnlockSuccessMsg(`🎉 Bem-vindo ao "${targetChallenge.name}"! Você entrou com sucesso através do convite.`);
          setUnlockErrorMsg("");
          setShowInviteUnlockModal(true);
        }
      }
    }
  }, [currentUser, localCommunities]);

  const handleJoinLeaveToggle = async (commId: string) => {
    if (!currentUser) return;

    const challenge = localCommunities.find(c => c.id === commId);
    const isCurrentlyJoined = challenge?.participants?.includes(currentUser.id) || joinedChallenges[commId] === true;

    if (!isCurrentlyJoined && (commId === "comm-nordeste1" || commId?.toLowerCase().includes("nordeste 1"))) {
      if (!isAllowedRegion(currentUser.region)) {
        setUnlockErrorMsg("❌ Entrada Negada: Este desafio é de acesso exclusivo para membros da RM Pernambuco Norte, PE Sul, PE Oeste, RE Paraíba, RE Alagoas e RE Sergipe.");
        setUnlockSuccessMsg("");
        setShowInviteUnlockModal(true);
        setTimeout(() => {
          setShowInviteUnlockModal(false);
          setUnlockErrorMsg("");
        }, 6000);
        return;
      }
    }

    try {
      const endpoint = isCurrentlyJoined ? `/api/communities/${commId}/leave` : `/api/communities/${commId}/join`;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (firebaseAuth?.currentUser) {
        const token = await firebaseAuth.currentUser.getIdToken();
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ userId: currentUser.id })
      });

      if (res.ok) {
        const data = await res.json();
        // Update local state with the returned community in localCommunities
        setLocalCommunities(comms => comms.map(c => {
          if (c.id === commId) {
            return {
              ...c,
              participants: data.community.participants,
              membersCount: data.community.membersCount
            };
          }
          return c;
        }));

        setJoinedChallenges(prev => ({
          ...prev,
          [commId]: !isCurrentlyJoined
        }));
      }
    } catch (err) {
      console.error("Erro ao alternar participação no desafio:", err);
    }
  };

  const handleAcceptInvite = (invite: any) => {
    // Add to local list
    const newChallenge = {
      ...invite,
      participants: [...(invite.participants || []), currentUser?.id].filter(Boolean),
      membersCount: (invite.membersCount || 0) + 1
    };

    setLocalCommunities(prev => [...prev, newChallenge]);
    setJoinedChallenges(prev => ({ ...prev, [invite.id]: true }));
    // Remove from invite
    setReceivedInvites(prev => prev.filter(inv => inv.id !== invite.id));

    // Toast/Alert simulated success
    setUnlockSuccessMsg(`Felicitações! Você ingressou no desafio "${invite.name}" com sucesso! 🎉`);
    setShowInviteUnlockModal(true);
    setTimeout(() => {
      setShowInviteUnlockModal(false);
      setUnlockSuccessMsg("");
    }, 2500);
  };

  const handleRecuseInvite = (inviteId: string) => {
    setReceivedInvites(prev => prev.filter(inv => inv.id !== inviteId));
  };

  const handleSendIaMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!iaMessage.trim() || iaLoading || !selectedChallenge) return;

    const userPrompt = iaMessage;
    setIaMessage("");
    setIaHistory(prev => [...prev, { role: "user", content: userPrompt }]);
    setIaLoading(true);

    try {
      const res = await fetch(`/api/communities/${selectedChallenge.id}/ai-coach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser?.id, prompt: userPrompt })
      });
      if (res.ok) {
        const data = await res.json();
        setIaHistory(prev => [...prev, { role: "model", content: data.reply }]);
      } else {
        setIaHistory(prev => [...prev, { role: "model", content: "Erro ao consultar o Coach IA. Por favor, tente novamente." }]);
      }
    } catch (err) {
      console.error(err);
      setIaHistory(prev => [...prev, { role: "model", content: "Erro na conexão com o servidor." }]);
    } finally {
      setIaLoading(false);
    }
  };

  const handleAddCommunityEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evtTitle || !evtDate || !selectedChallenge) return;
    try {
      const res = await fetch(`/api/communities/${selectedChallenge.id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id,
          title: evtTitle,
          description: evtDesc,
          date: evtDate,
          location: evtLocation,
          category: evtCategory
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.community) {
          setSelectedChallenge(data.community);
          setEvtTitle("");
          setEvtDesc("");
          setEvtDate("");
          setEvtLocation("");
          setAdminMsg("Evento adicionado com sucesso!");
          setTimeout(() => setAdminMsg(""), 3000);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCommunityEvent = async (eventId: string) => {
    if (!selectedChallenge) return;
    try {
      const res = await fetch(`/api/communities/${selectedChallenge.id}/events/${eventId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser?.id })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.community) {
          setSelectedChallenge(data.community);
          setAdminMsg("Evento removido com sucesso!");
          setTimeout(() => setAdminMsg(""), 3000);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCommunityFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName || !fileUrl || !selectedChallenge) return;
    try {
      const res = await fetch(`/api/communities/${selectedChallenge.id}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id,
          name: fileName,
          description: fileDesc,
          url: fileUrl,
          category: fileCat
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.community) {
          setSelectedChallenge(data.community);
          setFileName("");
          setFileDesc("");
          setFileUrl("");
          setAdminMsg("Arquivo adicionado com sucesso!");
          setTimeout(() => setAdminMsg(""), 3000);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCommunityFile = async (fileId: string) => {
    if (!selectedChallenge) return;
    try {
      const res = await fetch(`/api/communities/${selectedChallenge.id}/files/${fileId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser?.id })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.community) {
          setSelectedChallenge(data.community);
          setAdminMsg("Arquivo removido com sucesso!");
          setTimeout(() => setAdminMsg(""), 3000);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCommunityNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle || !noticeDesc || !selectedChallenge) return;
    try {
      const res = await fetch(`/api/notices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: noticeType,
          title: noticeTitle,
          description: noticeDesc,
          color: noticeColor,
          communityId: selectedChallenge.id
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCommunityNotices(prev => [...prev, data]);
        setNoticeTitle("");
        setNoticeDesc("");
        setAdminMsg("Aviso fixado no mural!");
        setTimeout(() => setAdminMsg(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCommunityNotice = async (noticeId: string) => {
    try {
      const res = await fetch(`/api/notices/${noticeId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setCommunityNotices(prev => prev.filter(n => n.id !== noticeId));
        setAdminMsg("Aviso removido do mural!");
        setTimeout(() => setAdminMsg(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignMemberRole = async (targetUserId: string, roleName: string) => {
    if (!selectedChallenge) return;
    try {
      const res = await fetch(`/api/communities/${selectedChallenge.id}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id,
          targetUserId,
          roleName
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.community) {
          setSelectedChallenge(data.community);
          setAdminMsg("Cargo atribuído com sucesso!");
          setTimeout(() => setAdminMsg(""), 3000);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCommunity = async () => {
    if (!selectedChallenge) return;
    if (!window.confirm("ATENÇÃO: Deseja realmente excluir esta comunidade definitivamente? Esta ação é irreversível.")) return;
    try {
      const res = await fetch(`/api/communities/${selectedChallenge.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser?.id })
      });
      if (res.ok) {
        setSelectedChallenge(null);
        if (window.location) window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActivitySelection = (actId: string) => {
    if (activitiesSelected.includes(actId)) {
      setActivitiesSelected(activitiesSelected.filter((a) => a !== actId));
    } else {
      setActivitiesSelected([...activitiesSelected, actId]);
    }
  };

  const handleCreateChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedSubgroups = customSubgroupsInput.trim()
      ? customSubgroupsInput.split(",").map(s => s.trim()).filter(s => s.length > 0)
      : [];

    const payload = {
      name,
      description,
      rules: rules || "Incentivo e respeito incondicional.",
      enabledActivities: activitiesSelected,
      cover: cover || availableCovers[0].url,
      startDate,
      endDate,
      prize,
      privacy,
      gongyoMorningPoints,
      gongyoEveningPoints,
      daimokuPoints,
      exercisePoints,
      customSubgroups: parsedSubgroups,
      region: regionField,
      city: cityField,
      state: stateField,
      country: countryField,
      language: languageField,
      category: categoryField,
      joinCriteria,
      inviteCode: inviteCodeField
    };

    onAddCommunity(payload);

    // Optimistically update local collections
    const optimisticId = "optimistic-comm-" + Date.now();
    const mockCreated = {
      id: optimisticId,
      ...payload,
      creatorId: currentUser?.id || "user-1",
      membersCount: 1,
      participants: [currentUser?.id || "user-1"],
      roles: { [currentUser?.id || "user-1"]: "Fundador" },
      inviteToken: "GEN-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      nominalInvites: [],
      invitationHistory: []
    };

    setLocalCommunities(prev => [...prev, mockCreated]);
    setJoinedChallenges(prev => ({ ...prev, [optimisticId]: true }));

    // Reset Form fields
    setName("");
    setDescription("");
    setRules("");
    setPrize("Troféu + reconhecimento no mural");
    setPrivacy("public");
    setStartDate("2026-07-01");
    setEndDate("2026-12-31");
    setCover("");
    setCustomSubgroupsInput("");
    setRegionField("");
    setCityField("");
    setStateField("");
    setCountryField("Brasil");
    setLanguageField("Português");
    setCategoryField("Geral");
    setJoinCriteria("free");
    setInviteCodeField("");
    setShowForm(false);
  };

  const handleEditChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChallenge || !currentUser || !name.trim()) return;

    const parsedSubgroups = customSubgroupsInput.trim()
      ? customSubgroupsInput.split(",").map(s => s.trim()).filter(s => s.length > 0)
      : [];

    const payload = {
      userId: currentUser.id,
      name,
      description,
      rules: rules || "Incentivo e respeito incondicional.",
      enabledActivities: activitiesSelected,
      cover: cover || availableCovers[0].url,
      startDate,
      endDate,
      prize,
      privacy,
      gongyoMorningPoints,
      gongyoEveningPoints,
      daimokuPoints,
      exercisePoints,
      customSubgroups: parsedSubgroups,
      region: regionField,
      city: cityField,
      state: stateField,
      country: countryField,
      language: languageField,
      category: categoryField,
      joinCriteria,
      inviteCode: inviteCodeField
    };

    try {
      const res = await fetch(`/api/communities/${selectedChallenge.id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updatedComm = await res.json();
        setSelectedChallenge(updatedComm);
        setLocalCommunities(prevComms => 
          prevComms.map(c => c.id === updatedComm.id ? updatedComm : c)
        );
        setIsEditing(false);
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao atualizar desafio.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleKickMember = async (targetUserId: string) => {
    if (!selectedChallenge || !currentUser) return;
    if (!window.confirm("Tem certeza que deseja remover este participante do desafio?")) return;
    try {
      const res = await fetch(`/api/communities/${selectedChallenge.id}/kick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          targetUserId
        })
      });
      if (res.ok) {
        // Re-fetch ranking immediately
        const rRes = await fetch(`/api/communities/${selectedChallenge.id}/ranking`);
        if (rRes.ok) {
          setCommunityRanking(await rRes.json());
        }
        setSelectedChallenge((prev: any) => {
          if (!prev) return null;
          const nextParticipants = (prev.participants || []).filter((uid: string) => uid !== targetUserId);
          return {
            ...prev,
            participants: nextParticipants,
            membersCount: nextParticipants.length
          };
        });
        setLocalCommunities(prevComms => 
          prevComms.map(c => {
            if (c.id === selectedChallenge.id) {
              const nextParts = (c.participants || []).filter((uid: string) => uid !== targetUserId);
              return {
                ...c,
                participants: nextParts,
                membersCount: nextParts.length
              };
            }
            return c;
          })
        );
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao remover membro.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnlockPrivateGroupByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim() || !currentUser) return;

    let token = inviteCodeInput.trim();
    // If it's a URL, extract the token
    if (token.includes("/invite/") || token.includes("/community/")) {
      const parts = token.split('/');
      token = parts[parts.length - 1] || token;
    }
    // Clean query parameters if any
    if (token.includes("?")) {
      token = token.split("?")[0];
    }

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (firebaseAuth?.currentUser) {
        const idToken = await firebaseAuth.currentUser.getIdToken();
        headers["Authorization"] = `Bearer ${idToken}`;
      }
      const res = await fetch(`/api/communities/by-token/${token}/join`, {
        method: "POST",
        headers,
        body: JSON.stringify({ userId: currentUser.id })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUnlockSuccessMsg(`✅ Sucesso! Você ingressou na comunidade "${data.community.name}".`);
        setUnlockErrorMsg("");
        setInviteCodeInput("");
        
        // Update local state with the returned community
        setLocalCommunities(comms => {
          const exists = comms.some(c => c.id === data.community.id);
          if (exists) {
            return comms.map(c => c.id === data.community.id ? data.community : c);
          } else {
            return [...comms, data.community];
          }
        });
        setJoinedChallenges(prev => ({ ...prev, [data.community.id]: true }));
        setSelectedChallenge(data.community);
      } else {
        setUnlockErrorMsg(data.error || "Código de convite ou link inválido/revogado.");
        setUnlockSuccessMsg("");
      }
    } catch (err) {
      console.error(err);
      setUnlockErrorMsg("❌ Erro de conexão ao validar o convite.");
      setUnlockSuccessMsg("");
    }
  };

  const handleSendGroupMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!chatText.trim() && !selectedChatImage) || !currentUser || !selectedChallenge) return;

    const newMsg: ChatMessage = {
      id: `chat-msg-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.displayName || currentUser.name,
      userAvatar: currentUser.avatar,
      content: chatText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      image: selectedChatImage || undefined,
      reactions: {},
      isPinned: false
    };

    setChatText("");
    setSelectedChatImage(null);
    setShowEmojiPicker(false);
    setShowAttachmentPicker(false);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (firebaseAuth?.currentUser) {
        const token = await firebaseAuth.currentUser.getIdToken();
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch("/api/chats", {
        method: "POST",
        headers,
        body: JSON.stringify({
          communityId: selectedChallenge.id,
          message: newMsg
        })
      });
      if (res.ok) {
        const savedMsg = await res.json();
        const targetId = selectedChallenge.id;
        setChats(prev => ({
          ...prev,
          [targetId]: [...(prev[targetId] || []), savedMsg]
        }));
      }
    } catch (err) {
      console.error("Erro ao enviar mensagem de chat:", err);
    }
  };

  const handleTogglePinMessage = async (msgId: string) => {
    if (!selectedChallenge) return;
    const targetId = selectedChallenge.id;
    try {
      const headers: Record<string, string> = {};
      if (firebaseAuth?.currentUser) {
        const token = await firebaseAuth.currentUser.getIdToken();
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/chats/${msgId}/toggle-pin`, {
        method: "POST",
        headers
      });
      if (res.ok) {
        const updatedMsg = await res.json();
        setChats(prev => {
          const currentMsgs = prev[targetId] || [];
          return {
            ...prev,
            [targetId]: currentMsgs.map(m => m.id === msgId ? updatedMsg : m)
          };
        });
      }
    } catch (err) {
      console.error("Erro ao fixar mensagem:", err);
    }
  };

  const handleAddReaction = async (msgId: string, emoji: string) => {
    if (!selectedChallenge) return;
    const targetId = selectedChallenge.id;
    try {
      const res = await fetch(`/api/chats/${msgId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji })
      });
      if (res.ok) {
        const updatedMsg = await res.json();
        setChats(prev => {
          const currentMsgs = prev[targetId] || [];
          return {
            ...prev,
            [targetId]: currentMsgs.map(m => m.id === msgId ? updatedMsg : m)
          };
        });
      }
    } catch (err) {
      console.error("Erro ao reagir à mensagem:", err);
    }
  };

  // Custom scoring engine based on challenge's configured habits
  const getCommunityRanking = (comm: any) => {
    const allowed = comm.enabledActivities || ["gongyo", "daimoku", "exercise"];
    
    // Sum points strictly for activities conforming to rules and their weights
    return users.map(u => {
      const userActs = activities.filter(a => {
        if (a.userId !== u.id) return false;

        // Date period constraint checks (safely timezone-agnostic via ISO date string comparison)
        const aDateOnly = a.timestamp.split("T")[0];
        if (comm.startDate && aDateOnly < comm.startDate) return false;
        if (comm.endDate && aDateOnly > comm.endDate) return false;

        const activityType = a.type as string;
        if (activityType.startsWith("gongyo") && allowed.includes("gongyo")) return true;
        if (activityType === "daimoku" && allowed.includes("daimoku")) return true;
        if (activityType === "exercise" && allowed.includes("exercise")) return true;
        if (activityType === "bs" && allowed.includes("bs")) return true;
        if (activityType === "kofu" && allowed.includes("kofu")) return true;
        return false;
      });

      const points = userActs.reduce((sum, a) => {
        let actPts = a.points || 0;
        
        // Let's hook up flexible weight overrides configured for this specific challenge:
        if (a.type === "gongyo_morning" && comm.gongyoMorningPoints !== undefined) {
          actPts = comm.gongyoMorningPoints;
        } else if (a.type === "gongyo_evening" && comm.gongyoEveningPoints !== undefined) {
          actPts = comm.gongyoEveningPoints;
        } else if (a.type === "daimoku" && comm.daimokuPoints !== undefined) {
          // award points proportionately based on how many 30-min segments recorded
          const segments = Math.max(1, Math.floor((a.minutes || 30) / 30));
          actPts = segments * comm.daimokuPoints;
        } else if (a.type === "exercise" && comm.exercisePoints !== undefined) {
          actPts = comm.exercisePoints;
        }
        
        return sum + actPts;
      }, 0);
      
      return { user: u, points };
    }).sort((a, b) => b.points - a.points);
  };

  // Get only feed publications from participants of that specific challenge
  const getChallengePosts = (comm: any) => {
    return [];
  };

  const activeChallengeRooms = localCommunities.filter(c => {
    const participates = c.participants?.includes(currentUser?.id || "") || joinedChallenges[c.id];
    return participates;
  });

  const createdByMeRooms = localCommunities.filter(c => {
    return c.creatorId === currentUser?.id;
  });

  // Calculate SVG Graph Statistics for active selected challenge
  const computeChallengeStats = (comm: any) => {
    const allowed = comm.enabledActivities || [];
    const members = comm.participants || [];

    // Filter activities of these members matching enabled types
    const commActivities = activities.filter(a => {
      if (!members.includes(a.userId)) return false;
      if (a.type.startsWith("gongyo") && allowed.includes("gongyo")) return true;
      if (a.type === "daimoku" && allowed.includes("daimoku")) return true;
      if (a.type === "exercise" && allowed.includes("exercise")) return true;
      return false;
    });

    const sumPoints = commActivities.reduce((s, a) => s + (a.points || 0), 0) + (comm.membersCount * 12);
    const gongyoCount = commActivities.filter(a => a.type.startsWith("gongyo")).length + 24;
    const daimokuMinutes = commActivities.filter(a => a.type === "daimoku").reduce((s, a) => s + (a.minutes || 0), 0) + (comm.membersCount * 45);
    const exercisesDone = commActivities.filter(a => a.type === "exercise").length + 18;
    const activeRate = Math.min(100, Math.round(50 + (commActivities.length * 3.5)));

    return {
      points: sumPoints,
      gongyo: gongyoCount,
      daimoku: daimokuMinutes,
      exercise: exercisesDone,
      rate: activeRate
    };
  };

  const challengeStats = selectedChallenge ? computeChallengeStats(selectedChallenge) : null;
  const challengeRankingList = selectedChallenge ? getCommunityRanking(selectedChallenge) : [];
  const challengeFeedList = selectedChallenge ? getChallengePosts(selectedChallenge) : [];
  const activeChatMessages = selectedChallenge ? (chats[selectedChallenge.id] || []) : [];
  const pinnedChatMessages = activeChatMessages.filter(m => m.isPinned);
  const isCreator = currentUser && selectedChallenge && selectedChallenge.creatorId === currentUser.id;

  return (
    <div className="space-y-6" id="communities-reconstructed-wrapper">

      {/* HEADER HERO (MAIN SCREEN ONLY) */}
      {!selectedChallenge && (
        <div className="bg-gradient-to-r from-slate-900/40 via-slate-950/60 to-slate-900/40 border border-slate-800/60 p-6 rounded-3xl relative overflow-hidden text-left shadow-xl" id="platform-introduction-card">
          <div className="absolute top-0 right-0 p-8 text-indigo-500 opacity-[0.03]">
            <Layers className="w-24 h-24" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <span className="bg-[#1E294A] text-indigo-300 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider font-heading flex items-center gap-1.5 w-fit">
                <span>🤝 PLATAFORMA DE DESAFIOS INTEGRADOS</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              </span>
              <h2 className="text-2xl font-black font-heading text-slate-100 mt-2">
                BodhiShape Central de Missões
              </h2>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed max-w-2xl">
                O aplicativo é a plataforma. Os desafios são criados, regrados e liderados de forma autônoma pelos próprios usuários e administradores da comunidade budista Soka!
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 shrink-0 self-start md:self-center">
              <button
                onClick={() => setShowInviteUnlockModal(true)}
                className="px-4 py-2.5 bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer select-none"
              >
                <Key className="w-4 h-4 text-amber-400" />
                Desbloquear por Código
              </button>

              {currentUser && (
                <button
                  onClick={() => {
                    setShowForm(!showForm);
                  }}
                  className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-600 border border-indigo-550/20 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer select-none"
                >
                  <Plus className="w-4 h-4" />
                  Criar Comunidade
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA ENTRADA DE CÓDIGOS OU AVISOS */}
      {showInviteUnlockModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0C0F1D] border border-slate-800/80 p-6 rounded-3xl w-full max-w-sm text-left relative space-y-4 shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setShowInviteUnlockModal(false);
                setUnlockSuccessMsg("");
                setUnlockErrorMsg("");
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase bg-pink-500/10 text-pink-400 border border-pink-500/20 py-0.5 px-2.5 rounded-full tracking-wider font-mono">
                🔗 Link ou Token de Convite
              </span>
              <h3 className="text-base font-black font-heading text-slate-101 mt-1">Ingressar via Convite</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Cole o link de convite recebido (ex: <span className="text-slate-300 font-mono">https://bodhishape.app/invite/abc123xyz</span>) ou digite apenas o token identificador de 12 caracteres para entrar na comunidade correspondente.
              </p>
            </div>

            <form onSubmit={handleUnlockPrivateGroupByCode} className="space-y-3">
              <input
                type="text"
                placeholder="Cole o Link de Convite ou digite o Token"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value)}
                className="w-full text-xs font-bold border border-slate-800 bg-slate-950 text-indigo-300 px-3 py-2.5 rounded-xl text-center focus:border-indigo-505 outline-none font-mono"
              />

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
              >
                Validar Convite e Ingressar ➔
              </button>
            </form>

            {unlockSuccessMsg && (
              <p className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-xs text-emerald-400 font-medium leading-normal flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                {unlockSuccessMsg}
              </p>
            )}
            {unlockErrorMsg && (
              <p className="p-3 bg-rose-955/20 border border-rose-900/30 rounded-xl text-xs text-rose-350 leading-normal font-sans">
                {unlockErrorMsg}
              </p>
            )}
          </div>
        </div>
      )}

      {/* CREATE NEW CHALLENGE FORM (ACTIVE ON TOGGLE) */}
      {showForm && !selectedChallenge && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-800 p-6 shadow-xl space-y-5 text-left max-w-2xl mx-auto"
          id="create-challenge-form-wrapper"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-black font-heading text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Desenhar Novo Desafio Personalizado
            </h3>
            <button 
              onClick={() => setShowForm(false)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-250 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateChallenge} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">🏷️ Nome da Missão / Desafio:</label>
                <input
                  type="text"
                  placeholder="Ex: Força e Constância 60 Dias"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full text-xs border border-slate-800 px-3 py-2.5 bg-slate-950/60 text-slate-100 rounded-xl outline-none focus:border-indigo-505"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">📝 Objetivo geral do Desafio:</label>
                <input
                  type="text"
                  placeholder="Ex: Fomentar o foco do treino matinal e minutos daimoku."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full text-xs border border-slate-800 px-3 py-2.5 bg-slate-950/60 text-slate-100 rounded-xl outline-none focus:border-indigo-505"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">📅 Data de Início:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full text-xs border border-slate-800 px-3 py-2 bg-slate-950/60 text-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">📅 Data de Encerramento:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full text-xs border border-slate-800 px-3 py-2 bg-slate-950/60 text-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">🏆 Premiação Prevista:</label>
                <input
                  type="text"
                  placeholder="Ex: Troféu Digital + Medalha"
                  value={prize}
                  onChange={(e) => setPrize(e.target.value)}
                  className="w-full text-xs border border-slate-800 px-3 py-2.5 bg-slate-950/60 text-slate-100 rounded-xl outline-none focus:border-indigo-505"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">📜 Regras ou Determinações do Lema:</label>
                <input
                  type="text"
                  placeholder="Ex: Pontuações exclusivas baseadas nos hábitos habitados."
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  className="w-full text-xs border border-slate-800 px-3 py-2.5 bg-slate-950/60 text-slate-100 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">🌎 Nível de Privacidade:</label>
                <div className="grid grid-cols-3 gap-2 bg-slate-950/40 p-1.5 border border-slate-850 rounded-xl">
                  {[
                    { id: "public", label: "Público 🌎" },
                    { id: "private", label: "Privado 🔒" },
                    { id: "invite", label: "Convite 📨" }
                  ].map((pOpt) => (
                    <button
                      key={pOpt.id}
                      type="button"
                      onClick={() => setPrivacy(pOpt.id as any)}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all ${
                        privacy === pOpt.id 
                          ? "bg-indigo-600 text-white shadow" 
                          : "text-slate-400 hover:text-slate-350"
                      }`}
                    >
                      {pOpt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Rules Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">📊 Práticas Sincronizadas (Regras Customizadas):</label>
              <p className="text-[9px] text-slate-500 leading-none">Desafios que contam apenas hábitos específicos modificam o ranking e pontuação final.</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                {[
                  { id: "gongyo", label: "🪷 Gongyo", desc: "Soka Clássico" },
                  { id: "daimoku", label: "🔥 Daimoku", desc: "Minutos Rezados" },
                  { id: "exercise", label: "💪 Exercícios", desc: "Fitness do Treino" },
                  { id: "bs", label: "📰 Estudo BS", desc: "Brasil Seikyo" },
                  { id: "kofu", label: "❤️ Kofu", desc: "Contribuições" }
                ].map((act) => {
                  const isSelected = activitiesSelected.includes(act.id);
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => toggleActivitySelection(act.id)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-colors ${
                        isSelected
                          ? "bg-indigo-950/40 border-indigo-500/40 text-indigo-200"
                          : "bg-slate-950/60 border-slate-850 text-slate-500 hover:bg-slate-900"
                      }`}
                    >
                      <span className="text-xs font-extrabold">{act.label}</span>
                      <span className="text-[8px] opacity-70 mt-1">{act.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Weights Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-850 mt-2">
                {activitiesSelected.includes("gongyo") && (
                  <>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-450 block mb-1">🪷 Gongyo Manhã (Pts):</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="10" 
                        value={gongyoMorningPoints} 
                        onChange={(e) => setGongyoMorningPoints(Math.max(1, Number(e.target.value)))}
                        className="w-full text-xs border border-slate-800 px-2 py-1.5 bg-slate-950 text-amber-400 rounded-lg outline-none font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-450 block mb-1">🪷 Gongyo Noite (Pts):</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="10" 
                        value={gongyoEveningPoints} 
                        onChange={(e) => setGongyoEveningPoints(Math.max(1, Number(e.target.value)))}
                        className="w-full text-xs border border-slate-800 px-2 py-1.5 bg-slate-950 text-amber-400 rounded-lg outline-none font-mono font-bold"
                      />
                    </div>
                  </>
                )}
                {activitiesSelected.includes("daimoku") && (
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-450 block mb-1">🔥 Daimoku (Pts/30m):</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="10" 
                      value={daimokuPoints} 
                      onChange={(e) => setDaimokuPoints(Math.max(1, Number(e.target.value)))}
                      className="w-full text-xs border border-slate-800 px-2 py-1.5 bg-slate-950 text-amber-400 rounded-lg outline-none font-mono font-bold"
                    />
                  </div>
                )}
                {activitiesSelected.includes("exercise") && (
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-450 block mb-1">💪 Exercício (Pts/Treino):</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="10" 
                      value={exercisePoints} 
                      onChange={(e) => setExercisePoints(Math.max(1, Number(e.target.value)))}
                      className="w-full text-xs border border-slate-800 px-2 py-1.5 bg-slate-950 text-amber-400 rounded-lg outline-none font-mono font-bold"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Community Metadata & Criteria */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/20 p-3 rounded-2xl border border-slate-850/60 mt-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">📁 Categoria da Comunidade:</label>
                <select
                  value={categoryField}
                  onChange={(e) => setCategoryField(e.target.value)}
                  className="w-full text-xs border border-slate-800 px-3 py-2 bg-slate-950 text-slate-100 rounded-xl outline-none focus:border-indigo-505"
                >
                  <option value="Geral">Geral</option>
                  <option value="Bloco">Bloco Gakkai</option>
                  <option value="Distrito">Distrito Gakkai</option>
                  <option value="Subdistrito">Subdistrito Gakkai</option>
                  <option value="Área">Área Gakkai</option>
                  <option value="Regional">Regional Gakkai</option>
                  <option value="Outra">Outra Categoria</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">🔐 Critério de Entrada:</label>
                <select
                  value={joinCriteria}
                  onChange={(e) => setJoinCriteria(e.target.value)}
                  className="w-full text-xs border border-slate-800 px-3 py-2 bg-slate-950 text-slate-101 rounded-xl outline-none focus:border-indigo-505"
                >
                  <option value="invite_auto">Link de Convite (Entrada automática)</option>
                  <option value="invite_approval">Link de Convite (Requer aprovação)</option>
                  <option value="invite_nominal">Link de Convite (Apenas convidados nominais)</option>
                  <option value="free">Livre (Acesso Direto)</option>
                  <option value="approval">Aprovação Direta (Requer aval do Admin)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/20 p-3 rounded-2xl border border-slate-850/60 text-left">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">📍 Região Gakkai:</label>
                <input
                  type="text"
                  placeholder="Ex: Nordeste"
                  value={regionField}
                  onChange={(e) => setRegionField(e.target.value)}
                  className="w-full text-xs border border-slate-800 px-3 py-2.5 bg-slate-950 text-slate-101 rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">🏙️ Cidade:</label>
                <input
                  type="text"
                  placeholder="Ex: Salvador"
                  value={cityField}
                  onChange={(e) => setCityField(e.target.value)}
                  className="w-full text-xs border border-slate-800 px-3 py-2.5 bg-slate-950 text-slate-101 rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">📍 Estado:</label>
                <input
                  type="text"
                  placeholder="Ex: BA"
                  value={stateField}
                  onChange={(e) => setStateField(e.target.value)}
                  className="w-full text-xs border border-slate-800 px-3 py-2.5 bg-slate-950 text-slate-101 rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">🗣️ Idioma:</label>
                <input
                  type="text"
                  placeholder="Ex: Português"
                  value={languageField}
                  onChange={(e) => setLanguageField(e.target.value)}
                  className="w-full text-xs border border-slate-800 px-3 py-2.5 bg-slate-950 text-slate-101 rounded-xl outline-none"
                />
              </div>
            </div>

            {/* Custom Subgroups / Teams */}
            <div className="space-y-1 bg-slate-950/20 p-3 rounded-2xl border border-slate-850/60 text-left">
              <label className="text-[10px] uppercase font-black text-indigo-400 block font-heading">📍 Subgrupos ou Equipes da Comunidade:</label>
              <input 
                type="text"
                placeholder="Exemplo: Equipe Azul, Equipe Vermelha, Equipe Verde"
                value={customSubgroupsInput}
                onChange={(e) => setCustomSubgroupsInput(e.target.value)}
                className="w-full text-xs border border-slate-800 px-3 py-2 bg-slate-950/70 text-slate-101 rounded-xl outline-none focus:border-indigo-500/60 transition"
              />
              <span className="text-[9px] text-slate-550 block leading-tight mt-0.5">
                Utilize vírgula para separar os times. Se preenchido, um painel de classificação por equipe será ativado de forma exclusiva no desafio.
              </span>
            </div>

            {/* Campo para link de imagem de capa customizada */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">🖼️ Link da Imagem de Capa (Opcional):</label>
              <input
                type="text"
                placeholder="Insira a URL de uma imagem de capa (ex: https://exemplo.com/foto.jpg)"
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                className="w-full text-xs border border-slate-800 px-3 py-2 bg-slate-950/70 text-slate-101 rounded-xl outline-none focus:border-indigo-500/60 transition"
              />
              <span className="text-[9px] text-slate-550 block leading-tight mt-0.5">
                Cole o link de qualquer imagem para personalizar a capa da comunidade. Se deixado em branco, uma bela imagem abstrata padrão será utilizada.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-slate-400 hover:text-slate-205 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                Ativar Desafio Coletivo 🚀
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* EDIT CHALLENGE FORM MODAL */}
      {isEditing && selectedChallenge && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-w-2xl w-full text-left space-y-5 my-8"
            id="edit-challenge-form-wrapper"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black font-heading text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Editar Desafio: {selectedChallenge.name}
              </h3>
              <button 
                onClick={() => setIsEditing(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-250 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditChallenge} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">🏷️ Nome da Missão / Desafio:</label>
                  <input
                    type="text"
                    placeholder="Ex: Força e Constância 60 Dias"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full text-xs border border-slate-800 px-3 py-2.5 bg-slate-950/60 text-slate-101 rounded-xl outline-none focus:border-indigo-505"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">📝 Objetivo geral do Desafio:</label>
                  <input
                    type="text"
                    placeholder="Ex: Fomentar o foco do treino matinal e minutos daimoku."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="w-full text-xs border border-slate-800 px-3 py-2.5 bg-slate-950/60 text-slate-101 rounded-xl outline-none focus:border-indigo-505"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">🗓️ Data de Início da Campanha:</label>
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full text-xs border border-slate-800 px-3 py-2 bg-slate-950/60 text-slate-101 rounded-xl outline-none font-mono focus:border-indigo-505"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">🗓️ Encerramento da Campanha:</label>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full text-xs border border-slate-800 px-3 py-2 bg-slate-950/60 text-slate-101 rounded-xl outline-none font-mono focus:border-indigo-505"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">🏆 Premiação Exibida na Conclusão:</label>
                  <input 
                    type="text"
                    placeholder="Ex: Certificado Bodhi + 200 Karma Points"
                    value={prize}
                    onChange={(e) => setPrize(e.target.value)}
                    required
                    className="w-full text-xs border border-slate-800 px-3 py-2 bg-slate-950/60 text-slate-101 rounded-xl outline-none focus:border-indigo-505"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">🌎 Nível de Privacidade:</label>
                  <select 
                    value={privacy}
                    onChange={(e) => setPrivacy(e.target.value as any)}
                    className="w-full text-xs border border-slate-800 px-3 py-2.5 bg-slate-950/60 text-slate-101 rounded-xl outline-none focus:border-indigo-505"
                  >
                    <option value="public">Global Pública (Qualquer membro pode buscar e entrar)</option>
                    <option value="private">Missão Privada (Requer código de convite para acessar)</option>
                  </select>
                </div>
              </div>

              {/* Advanced Metadata Edit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/20 p-3 rounded-2xl border border-slate-850/60">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">📁 Categoria da Comunidade:</label>
                  <select
                    value={categoryField}
                    onChange={(e) => setCategoryField(e.target.value)}
                    className="w-full text-xs border border-slate-800 px-3 py-2 bg-slate-950 text-slate-100 rounded-xl outline-none focus:border-indigo-505"
                  >
                    <option value="Geral">Geral</option>
                    <option value="Bloco">Bloco Gakkai</option>
                    <option value="Distrito">Distrito Gakkai</option>
                    <option value="Subdistrito">Subdistrito Gakkai</option>
                    <option value="Área">Área Gakkai</option>
                    <option value="Regional">Regional Gakkai</option>
                    <option value="Outra">Outra Categoria</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">🔐 Critério de Entrada:</label>
                  <select
                    value={joinCriteria}
                    onChange={(e) => setJoinCriteria(e.target.value)}
                    className="w-full text-xs border border-slate-800 px-3 py-2 bg-slate-950 text-slate-101 rounded-xl outline-none focus:border-indigo-505"
                  >
                    <option value="invite_auto">Link de Convite (Entrada automática)</option>
                    <option value="invite_approval">Link de Convite (Requer aprovação)</option>
                    <option value="invite_nominal">Link de Convite (Apenas convidados nominais)</option>
                    <option value="free">Livre (Acesso Direto)</option>
                    <option value="approval">Aprovação Direta (Requer aval do Admin)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/20 p-3 rounded-2xl border border-slate-850/60 text-left">
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">📍 Região:</label>
                  <input
                    type="text"
                    value={regionField}
                    onChange={(e) => setRegionField(e.target.value)}
                    className="w-full text-xs border border-slate-800 px-2 py-1.5 bg-slate-950 text-slate-101 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">🏙️ Cidade:</label>
                  <input
                    type="text"
                    value={cityField}
                    onChange={(e) => setCityField(e.target.value)}
                    className="w-full text-xs border border-slate-800 px-2 py-1.5 bg-slate-950 text-slate-101 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">📍 Estado:</label>
                  <input
                    type="text"
                    value={stateField}
                    onChange={(e) => setStateField(e.target.value)}
                    className="w-full text-xs border border-slate-800 px-2 py-1.5 bg-slate-950 text-slate-101 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">🗣️ Idioma:</label>
                  <input
                    type="text"
                    value={languageField}
                    onChange={(e) => setLanguageField(e.target.value)}
                    className="w-full text-xs border border-slate-800 px-2 py-1.5 bg-slate-950 text-slate-101 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">📋 Regras Detalhadas e Acordos:</label>
                <textarea
                  placeholder="Ex: Diariamente registrar Daimoku. Exercícios mínimos de 30 minutos..."
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  className="w-full h-20 text-xs border border-slate-800 p-3 bg-slate-950/60 text-slate-101 rounded-xl outline-none focus:border-indigo-505 resize-none leading-relaxed"
                />
              </div>

              {/* Seletor de Hábitos Permitidos */}
              <div className="bg-slate-950/20 p-4 rounded-2xl border border-slate-850 space-y-3">
                <div>
                  <h4 className="text-[10px] uppercase font-black text-indigo-400 block font-heading">⚡ Atividades Contabilizadas neste Desafio:</h4>
                  <p className="text-[9px] text-slate-500 mt-0.5">Selecione quais registros somarão pontos para a classificação deste desafio.</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "gongyo", label: "🪷 Gongyo (Manhã e Noite)", icon: Shield },
                    { id: "daimoku", label: "🔥 Daimoku (Minutos)", icon: Zap },
                    { id: "exercise", label: "💪 Exercícios Físicos", icon: Dumbbell },
                    { id: "bs", label: "📰 Bloco de Estudo (BS/Dezembro)", icon: BookOpen },
                    { id: "kofu", label: "💰 Contribuição Kofu / Gratidão", icon: Award }
                  ].map((act) => {
                    const isSelected = activitiesSelected.includes(act.id);
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => toggleActivitySelection(act.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold text-left transition ${
                          isSelected 
                            ? "bg-indigo-650/15 border-indigo-500/30 text-indigo-300 shadow-sm cursor-pointer"
                            : "bg-slate-950/40 border-slate-850 text-slate-450 hover:text-slate-300 cursor-pointer"
                        }`}
                      >
                        <act.icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-indigo-400" : "text-slate-600"}`} />
                        <span className="truncate">{act.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Weights Configuration */}
                <div className="pt-2 border-t border-slate-850/60 grid grid-cols-2 gap-3 text-left">
                  {activitiesSelected.includes("gongyo") && (
                    <>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-450 block mb-1">🪷 Gongyo Manhã (Pts):</label>
                        <input 
                          type="number" 
                          min="1" 
                          max="10" 
                          value={gongyoMorningPoints} 
                          onChange={(e) => setGongyoMorningPoints(Math.max(1, Number(e.target.value)))}
                          className="w-full text-xs border border-slate-800 px-2 py-1.5 bg-slate-950 text-amber-400 rounded-lg outline-none font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-450 block mb-1">🪷 Gongyo Noite (Pts):</label>
                        <input 
                          type="number" 
                          min="1" 
                          max="10" 
                          value={gongyoEveningPoints} 
                          onChange={(e) => setGongyoEveningPoints(Math.max(1, Number(e.target.value)))}
                          className="w-full text-xs border border-slate-800 px-2 py-1.5 bg-slate-950 text-amber-400 rounded-lg outline-none font-mono font-bold"
                        />
                      </div>
                    </>
                  )}
                  {activitiesSelected.includes("daimoku") && (
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-450 block mb-1">🔥 Daimoku (Pts/30m):</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="10" 
                        value={daimokuPoints} 
                        onChange={(e) => setDaimokuPoints(Math.max(1, Number(e.target.value)))}
                        className="w-full text-xs border border-slate-800 px-2 py-1.5 bg-slate-950 text-amber-400 rounded-lg outline-none font-mono font-bold"
                      />
                    </div>
                  )}
                  {activitiesSelected.includes("exercise") && (
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-450 block mb-1">💪 Exercício (Pts/Treino):</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="10" 
                        value={exercisePoints} 
                        onChange={(e) => setExercisePoints(Math.max(1, Number(e.target.value)))}
                        className="w-full text-xs border border-slate-800 px-2 py-1.5 bg-slate-950 text-amber-400 rounded-lg outline-none font-mono font-bold"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Subgroups / Teams */}
              <div className="space-y-1 bg-slate-950/20 p-3 rounded-2xl border border-slate-850/60 text-left">
                <label className="text-[10px] uppercase font-black text-indigo-400 block font-heading">📍 Subgrupos ou Equipes da Comunidade:</label>
                <input 
                  type="text"
                  placeholder="Exemplo: Equipe Azul, Equipe Vermelha, Equipe Verde"
                  value={customSubgroupsInput}
                  onChange={(e) => setCustomSubgroupsInput(e.target.value)}
                  className="w-full text-xs border border-slate-800 px-3 py-2 bg-slate-950/70 text-slate-101 rounded-xl outline-none focus:border-indigo-500/60 transition"
                />
                <span className="text-[9px] text-slate-550 block leading-tight mt-0.5">
                  Utilize vírgula para separar os times. Se preenchido, um painel de classificação por equipe será ativado de forma exclusiva no desafio.
                </span>
              </div>

              {/* Campo para link de imagem de capa customizada */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">🖼️ Link da Imagem de Capa (Opcional):</label>
                <input
                  type="text"
                  placeholder="Insira a URL de uma imagem de capa (ex: https://exemplo.com/foto.jpg)"
                  value={cover}
                  onChange={(e) => setCover(e.target.value)}
                  className="w-full text-xs border border-slate-800 px-3 py-2 bg-slate-950/70 text-slate-101 rounded-xl outline-none focus:border-indigo-500/60 transition"
                />
                <span className="text-[9px] text-slate-550 block leading-tight mt-0.5">
                  Cole o link de qualquer imagem para personalizar a capa da comunidade. Se deixado em branco, uma bela imagem abstrata padrão será utilizada.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-205 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                >
                  Salvar Alterações 💾
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* DASHBOARD: MINHA COMUNIDADE HOME */}
      {!selectedChallenge && (
        <div className="space-y-8" id="minha-comunidade-dashboard-panels">
          
          {/* CONVITES RECEBIDOS */}
          {receivedInvites.length > 0 && (
            <div className="space-y-3 text-left" id="convites-recebidos-area">
              <h3 className="text-xs font-black font-heading tracking-widest text-[#D8B4FE] uppercase flex items-center gap-2">
                <span className="p-1 rounded-md bg-[#3F2B54]/40 text-[#D8B4FE]">📨</span>
                Convites Recebidos ({receivedInvites.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {receivedInvites.map((invite) => (
                  <div 
                    key={invite.id} 
                    className="p-4 bg-gradient-to-r from-[#17112E] to-slate-950 rounded-2xl border border-indigo-950/40 flex items-center justify-between gap-4 shadow-lg hover:border-indigo-900/45 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-indigo-900/30">
                        <img src={invite.cover} alt={invite.name} className="w-full h-full object-cover bg-slate-950" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-105 text-xs font-heading">{invite.name}</h4>
                          <span className="bg-amber-400/10 text-amber-300 text-[8px] font-bold px-1.5 py-0.2 rounded font-mono border border-amber-400/20">REGRAS CUSTOM</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 leading-tight">{invite.description}</p>
                        <p className="text-[9px] text-[#A7F3D0] mt-0.5 font-semibold">🏆 Prêmio: {invite.prize}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => handleAcceptInvite(invite)}
                        className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold text-[10px] rounded-lg shadow-sm transition"
                      >
                        Aceitar
                      </button>
                      <button
                        onClick={() => handleRecuseInvite(invite.id)}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-450 hover:text-slate-300 font-extrabold text-[10px] rounded-lg transition"
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DESAFIOS QUE PARTICIPA */}
          <div className="space-y-3.5 text-left" id="desafios-que-participa">
            <h3 className="text-xs font-black font-heading tracking-widest text-[#86AAFF] uppercase flex items-center gap-2">
              <span className="p-1 rounded bg-[#1D2744]/60 text-indigo-300">🪷</span>
              Desafios que Participo ({activeChallengeRooms.length})
            </h3>

            {activeChallengeRooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {activeChallengeRooms.map((comm) => {
                  const isJoined = joinedChallenges[comm.id] !== false;
                  return (
                    <div
                      key={comm.id}
                      className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-lg overflow-hidden flex flex-col justify-between hover:border-slate-700/60 transition group"
                    >
                      {/* Banner Imagem */}
                      <div className="h-28 relative">
                        <img 
                          src={comm.cover} 
                          alt={comm.name} 
                          className="w-full h-full object-cover filter brightness-75 bg-slate-950 transition-transform group-hover:scale-102 duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
                        
                        <span className="absolute left-3 top-3 bg-slate-950/90 text-indigo-300 font-extrabold text-[8px] uppercase tracking-wider py-0.5 px-2 rounded-full border border-slate-800 font-sans">
                          {comm.privacy === "public" ? "🌎 PÚBLICO" : comm.privacy === "private" ? "🔒 PRIVADO" : "📨 CONVITE"}
                        </span>

                        <h3 className="absolute bottom-3 left-3 right-3 text-white font-bold font-heading text-sm leading-tight truncate">
                          {comm.name}
                        </h3>
                      </div>

                      {/* Body */}
                      <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between text-left">
                        <div className="space-y-1.5">
                          <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2 min-h-[32px]">
                            {comm.description}
                          </p>
                          <div className="text-[9px] text-amber-300 font-medium bg-slate-950/40 px-2.5 py-1 rounded-lg border border-slate-850 w-fit">
                            🏆 Prêmio: {comm.prize}
                          </div>
                        </div>

                        <div className="space-y-3 pt-2.5 border-t border-slate-850">
                          <div className="flex justify-between items-center text-[10px] text-slate-450 font-medium">
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-slate-500" />
                              {comm.membersCount} ativos
                            </span>
                            <span className="text-[9px] text-slate-500">
                              📅 Até {new Date(comm.endDate).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleJoinLeaveToggle(comm.id)}
                              className="py-1.5 font-bold text-[10px] rounded-lg bg-slate-950/50 border border-slate-850 hover:bg-slate-900 text-slate-400 transition"
                            >
                              Sair
                            </button>
                            <button
                              onClick={() => setSelectedChallenge(comm)}
                              className="py-1.5 font-bold text-[10px] rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white shadow-md transition"
                            >
                              Entrar ➔
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-900/30 border border-slate-800 p-8 rounded-2xl text-center text-slate-400">
                <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs">Você não está em nenhum desafio ativo.</p>
                <p className="text-[10px] text-slate-500 mt-1">Inscreva-se nos desafios públicos abaixo ou use um código de acesso.</p>
              </div>
            )}
          </div>

          {/* DESAFIOS CRIADOS POR MIM */}
          <div className="space-y-3.5 text-left" id="desafios-criados-por-mim">
            <h3 className="text-xs font-black font-heading tracking-widest text-[#FCD34D] uppercase flex items-center gap-2">
              <span className="p-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">👑</span>
              Desafios Criados por Mim ({createdByMeRooms.length})
            </h3>

            {createdByMeRooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {createdByMeRooms.map((comm) => (
                  <div
                    key={comm.id}
                    className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow p-4 flex items-center justify-between gap-4 hover:border-slate-700/60 transition text-left"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                        <img src={comm.cover} alt={comm.name} className="w-full h-full object-cover bg-slate-950" />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-slate-105 text-xs font-heading truncate">{comm.name}</h4>
                        <div className="flex gap-1 items-center mt-0.5">
                          <span className="bg-indigo-950/40 text-indigo-300 text-[7px] font-bold py-0.2 px-1 rounded uppercase tracking-wider font-mono">
                            {comm.privacy.toUpperCase()}
                          </span>
                          <span className="text-[9px] text-slate-500">• {comm.membersCount} participantes</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedChallenge(comm)}
                      className="p-1 px-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-bold rounded-lg shrink-0 transition"
                    >
                      Gerenciar
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/20 border border-slate-800/40 p-5 rounded-2xl text-center text-slate-500 text-xs">
                Nenhuma comunidade criada de sua autoria. Clique em "+ Criar Comunidade" para iniciar seu próprio grupo!
              </div>
            )}
          </div>

          {/* EXPLORE OUTROS DESAFIOS COLETIVOS DISPONÍVEIS */}
          <div className="space-y-3.5 text-left pt-2 border-t border-slate-850" id="explore-outras-missoes">
            <div>
              <h3 className="text-xs font-black font-heading tracking-widest text-[#10B981] uppercase flex items-center gap-2">
                <span className="p-1 rounded bg-[#10B981]/10 text-[#10B981] border border-emerald-900/20">🌎</span>
                Explorar Novas Campanhas Públicas
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Junte seus hábitos a qualquer uma destas campanhas iniciadas por administradores ou blocos regionais.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {localCommunities.filter(c => !c.participants?.includes(currentUser?.id || "") && !joinedChallenges[c.id]).map((comm) => (
                <div
                  key={comm.id}
                  className="bg-slate-900/30 rounded-2xl border border-slate-850/60 shadow overflow-hidden flex flex-col justify-between hover:border-slate-700/40 transition text-left"
                >
                  <div className="h-20 relative">
                    <img src={comm.cover} alt={comm.name} className="w-full h-full object-cover filter brightness-75 bg-slate-950" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                    <h3 className="absolute bottom-2 left-3 right-3 text-white font-bold font-heading text-xs truncate">
                      {comm.name}
                    </h3>
                  </div>

                  <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                    <p className="text-slate-400 text-[10px] leading-relaxed line-clamp-2">
                      {comm.description}
                    </p>

                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-850">
                      <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider font-mono">
                        🎯 {comm.enabledActivities.join(" • ")}
                      </span>
                      
                      <button
                        onClick={() => handleJoinLeaveToggle(comm.id)}
                        className="p-1 px-3 bg-indigo-650/40 border border-indigo-500/20 text-indigo-200 text-[10px] font-black rounded-lg hover:bg-slate-950 transition"
                      >
                        Participar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* SPACE INTERNA DO DESAFIO SELECIONADO */}
      <AnimatePresence mode="wait">
        {selectedChallenge && (
          <motion.div
            key={selectedChallenge.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 text-left"
            id="challenge-workspace-interactive"
          >
            {/* Cover Header and Back controls */}
            <div className="bg-slate-900/60 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative">
              <div className="h-44 relative">
                <img
                  src={selectedChallenge.cover}
                  alt={selectedChallenge.name}
                  className="w-full h-full object-cover filter brightness-75 bg-slate-950"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                
                <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap z-10">
                  <button
                    onClick={() => setSelectedChallenge(null)}
                    className="bg-slate-950/90 hover:bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-slate-300 text-xs font-bold leading-none flex items-center gap-1.5 transition select-none cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                  </button>

                  {(() => {
                    const joined = localCommunities.filter(c => c.participants?.includes(currentUser?.id || ""));
                    if (joined.length > 1) {
                      return (
                        <select
                          value={selectedChallenge.id}
                          onChange={(e) => {
                            const found = localCommunities.find(c => c.id === e.target.value);
                            if (found) {
                              setSelectedChallenge(found);
                              setActiveTab("chat"); // reset to general tab
                            }
                          }}
                          className="bg-slate-950/90 border border-slate-800 hover:border-slate-750 text-indigo-300 text-xs font-bold rounded-xl px-3.5 py-1.5 outline-none cursor-pointer focus:border-indigo-505 shadow-lg select-none"
                        >
                          {joined.map(c => (
                            <option key={c.id} value={c.id}>
                              🏢 Alternar: {c.name}
                            </option>
                          ))}
                        </select>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <span className="bg-black/80 text-[9px] text-[#A7F3D0] font-black border border-slate-800 px-2.5 py-1 rounded-xl flex items-center gap-1 uppercase tracking-wider">
                    🏆 PREMIAÇÃO: {selectedChallenge.prize}
                  </span>
                </div>

                <div className="absolute bottom-4 left-5 right-5 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black font-heading text-white leading-tight flex items-center gap-2">
                      {selectedChallenge.name}
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 max-w-xl">{selectedChallenge.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-500" /> {selectedChallenge.membersCount} participantes
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-indigo-300">
                        🗓️ {new Date(selectedChallenge.startDate).toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' })} a {new Date(selectedChallenge.endDate).toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0 items-center bg-slate-950/90 p-2 rounded-xl border border-slate-850">
                    <div className="text-[10px] text-slate-450 font-mono px-1 flex items-center gap-1.5 border-r border-slate-800 mr-1.5 pr-2.5">
                      <Key className="w-3.5 h-3.5 text-pink-500" />
                      <span>CONVITE: <strong className="text-pink-400 font-extrabold select-all">{selectedChallenge.inviteToken || selectedChallenge.id}</strong></span>
                    </div>

                    {/* Copy Link Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const inviteLink = `${window.location.origin}/invite/${selectedChallenge.inviteToken || selectedChallenge.id}`;
                        navigator.clipboard.writeText(inviteLink);
                        setCopiedId("link");
                        setTimeout(() => setCopiedId(null), 2500);
                      }}
                      className="p-1 px-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-300 text-[9px] font-bold rounded-lg flex items-center gap-1 transition-all"
                    >
                      {copiedId === "link" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-405">Link Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Link className="w-3 h-3 text-pink-400" />
                          <span>Copiar Link de Convite</span>
                        </>
                      )}
                    </button>

                    {/* QR Code Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowQrModalFor(selectedChallenge);
                      }}
                      className="p-1 px-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-300 text-[9px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <QrCode className="w-3 h-3 text-purple-400" />
                      <span>QR Code</span>
                    </button>

                    {/* Botão de Editar (só creator) */}
                    {currentUser && selectedChallenge.creatorId === currentUser.id && (
                      <button
                        type="button"
                        onClick={() => {
                          setName(selectedChallenge.name || "");
                          setDescription(selectedChallenge.description || "");
                          setRules(selectedChallenge.rules || "");
                          setStartDate(selectedChallenge.startDate || "");
                          setEndDate(selectedChallenge.endDate || "");
                          setPrize(selectedChallenge.prize || "");
                          setPrivacy(selectedChallenge.privacy || "public");
                          setActivitiesSelected(selectedChallenge.enabledActivities || ["gongyo", "daimoku", "exercise"]);
                          setGongyoMorningPoints(selectedChallenge.gongyoMorningPoints !== undefined ? selectedChallenge.gongyoMorningPoints : 1);
                          setGongyoEveningPoints(selectedChallenge.gongyoEveningPoints !== undefined ? selectedChallenge.gongyoEveningPoints : 1);
                          setDaimokuPoints(selectedChallenge.daimokuPoints !== undefined ? selectedChallenge.daimokuPoints : 1);
                          setExercisePoints(selectedChallenge.exercisePoints !== undefined ? selectedChallenge.exercisePoints : 2);
                          setCover(selectedChallenge.cover || "");
                          setCustomSubgroupsInput(selectedChallenge.customSubgroups ? selectedChallenge.customSubgroups.join(", ") : "");
                          setRegionField(selectedChallenge.region || "");
                          setCityField(selectedChallenge.city || "");
                          setStateField(selectedChallenge.state || "");
                          setCountryField(selectedChallenge.country || "Brasil");
                          setLanguageField(selectedChallenge.language || "Português");
                          setCategoryField(selectedChallenge.category || "Geral");
                          setJoinCriteria(selectedChallenge.joinCriteria || "free");
                          setInviteCodeField(selectedChallenge.inviteCode || "");
                          setIsEditing(true);
                        }}
                        className="p-1 px-2.5 bg-indigo-950/40 border border-indigo-900/30 hover:border-indigo-800 hover:bg-indigo-900/50 text-indigo-300 text-[9px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Edit className="w-3 h-3 text-indigo-400" />
                        <span>Editar Desafio</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* TAB SECTOR CONTROLS */}
              <div className="px-5 border-t border-slate-850 bg-slate-950/40 flex flex-wrap items-center gap-2 py-2 text-xs font-bold">
                {(() => {
                  const tabs = [
                    { id: "chat", icon: MessageSquare, label: "💬 Bate-papo" },
                    { id: "feed", icon: Users, label: "👥 Feed Social" },
                    { id: "ranking", icon: Trophy, label: "🏆 Ranking" },
                    { id: "constancy_hall", icon: Zap, label: "🏅 Hall da Constância" },
                    { id: "mural_vitorias", icon: Award, label: "✨ Mural de Vitórias" },
                    { id: "dashboard", icon: BarChart, label: "📈 Estatísticas" },
                    { id: "avisos", icon: Bell, label: "📢 Avisos" },
                    { id: "eventos", icon: Calendar, label: "📅 Eventos & Lives" },
                    { id: "arquivos", icon: BookOpen, label: "📚 Biblioteca & Arquivos" },
                    { id: "ia_coach", icon: Sparkles, label: "🤖 IA da Comunidade" },
                    { id: "regras", icon: Shield, label: "📋 Regras" }
                  ];
                  if (selectedChallenge.customSubgroups && selectedChallenge.customSubgroups.length > 0) {
                    tabs.splice(4, 0, { id: "subgroups", icon: MapPin, label: "📍 Mapa / Equipes" });
                  }
                  if (isCreator) {
                    tabs.push({ id: "admin", icon: Settings, label: "⚙️ Painel Admin" });
                  }
                  return tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-1.5 px-3 rounded-lg border transition text-xs font-bold ${
                        activeTab === tab.id
                          ? "bg-indigo-650 text-white border-indigo-500/30"
                          : "bg-slate-900/40 text-slate-450 border-transparent hover:text-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ));
                })()}
              </div>
            </div>

            {/* PINNED MESSAGES BANNER IN REAL-TIME CHAT */}
            {activeTab === "chat" && pinnedChatMessages.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-hidden text-xs text-amber-300">
                  <Pin className="w-4 h-4 text-amber-400 shrink-0 transform rotate-45" />
                  <div className="truncate">
                    <span className="font-extrabold uppercase text-[9px] bg-amber-400/10 text-amber-400 border border-amber-400/20 px-1.5 py-0.2 rounded mr-1">Mensagem Fixada</span>
                    <span className="italic">"{pinnedChatMessages[0].content}"</span>
                  </div>
                </div>
                <button
                  onClick={() => handleTogglePinMessage(pinnedChatMessages[0].id)}
                  className="text-slate-450 hover:text-amber-300 text-[10px] font-bold"
                >
                  Desfixar
                </button>
              </div>
            )}

            {/* PRIMARY AREA CORRESPONDING TO THE TABS */}
            <div className="bg-slate-900/40 rounded-3xl border border-slate-800 p-6 shadow-xl">
              
              {/* 💬 GROUP REAL-TIME CHAT TAB */}
              {activeTab === "chat" && (
                <div className="space-y-4 flex flex-col h-[460px] justify-between">
                  {/* Messages list */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                    {activeChatMessages.length > 0 ? (
                      activeChatMessages.map((msg) => {
                        const isMe = msg.userId === currentUser?.id;
                        const msgUser = users?.find(u => u.id === msg.userId);
                        const chatAuthorName = msgUser ? (msgUser.displayName || msgUser.name) : msg.userName;
                        const chatAuthorAvatar = msgUser ? msgUser.avatar : msg.userAvatar;
                        return (
                          <div key={msg.id} className={`flex gap-3 items-start text-xs max-w-lg ${isMe ? "ml-auto flex-row-reverse text-right" : ""}`}>
                            <img
                              src={chatAuthorAvatar}
                              alt={chatAuthorName}
                              className="w-9 h-9 rounded-full object-cover shrink-0 bg-slate-950 border border-slate-800"
                            />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 leading-none">
                                <span className="text-[11px] font-extrabold text-[#86AAFF]">{chatAuthorName}</span>
                                <span className="text-[8px] text-slate-500 font-mono">{msg.timestamp}</span>
                                {!isMe && (
                                  <button 
                                    onClick={() => handleTogglePinMessage(msg.id)}
                                    title="Fixar esta mensagem"
                                    className="p-0.5 hover:bg-slate-800 text-slate-500 hover:text-amber-400 rounded transition"
                                  >
                                    {msg.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                              
                              <div className={`p-3 rounded-2xl border text-slate-205 leading-relaxed relative ${
                                isMe 
                                  ? "bg-indigo-950/20 border-indigo-900/40 text-slate-200" 
                                  : "bg-slate-950/50 border-slate-850"
                              }`}>
                                {msg.image && (
                                  <div className="mb-2 max-w-xs rounded-lg overflow-hidden">
                                    <img src={msg.image} alt="Enviada" className="w-full h-auto object-cover max-h-40" />
                                  </div>
                                )}
                                
                                <p className="font-sans whitespace-pre-line text-xs font-normal">
                                  {msg.content}
                                </p>

                                {/* Message Reactions list */}
                                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2.5">
                                    {Object.entries(msg.reactions).map(([emoji, count]) => (
                                      <span 
                                        key={emoji} 
                                        onClick={() => handleAddReaction(msg.id, emoji)}
                                        className="bg-slate-950 border border-slate-850 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 cursor-pointer hover:bg-slate-900 select-none"
                                      >
                                        <span>{emoji}</span>
                                        <span className="text-[8px] text-slate-450">{count}</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Action reaction buttons shown below bubble */}
                              <div className={`flex gap-1.5 items-center ${isMe ? "justify-end" : "justify-start"}`}>
                                {["❤️", "🔥", "💪", "👏", "🌟"].map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleAddReaction(msg.id, emoji)}
                                    className="text-[13px] hover:scale-120 transition-transform filter saturate-75 hover:saturate-100 p-0.5"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-20 space-y-3">
                        <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
                        <p className="text-xs font-bold text-slate-400">Ninguém conversou neste desafio ainda.</p>
                        <p className="text-[10px] text-slate-500 max-w-sm mx-auto">Mande uma mensagem calorosa de suporte na prática espiritual dos seus companheiros ou compartilhe seus resultados de flexões hoje!</p>
                      </div>
                    )}
                  </div>

                  {/* Attachment & Emoji & Mention panels */}
                  <form onSubmit={handleSendGroupMessage} className="pt-3 border-t border-slate-850 space-y-2.5">
                    
                    {/* Selected Image Preview */}
                    {selectedChatImage && (
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-850 flex items-center justify-between max-w-xs">
                        <div className="flex items-center gap-2 overflow-hidden text-xs text-slate-300">
                          <img src={selectedChatImage} alt="Preview" className="w-8 h-8 rounded object-cover shrink-0" />
                          <span className="truncate">Foto anexada de treino</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setSelectedChatImage(null)}
                          className="text-rose-450 hover:text-rose-400 text-xs"
                        >
                          Remover
                        </button>
                      </div>
                    )}

                    {/* Mentions Suggestion Bar */}
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-[10px] text-slate-400 border-b border-dashed border-slate-850/60 font-medium">
                      <span className="text-slate-500 uppercase text-[8px] font-bold tracking-wider mr-1">Mencionar:</span>
                      {users.map(u => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setChatText(prev => `${prev}@${(u.displayName || u.name).split(' ')[0]} `)}
                          className="px-2 py-0.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded text-slate-350 hover:text-indigo-300 transition-colors"
                        >
                          @{(u.displayName || u.name).split(' ')[0]}
                        </button>
                      ))}
                    </div>

                    {/* Quick Emojis selector list */}
                    {showEmojiPicker && (
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-850 flex items-center gap-2 flex-wrap">
                        {["❤️", "🔥", "💪", "👏", "🌟", "😊", "🪷", "🏆", "🚴‍♂️", "🏃‍♀️", "🚀", "🎯", "🙌", "💥"].map((em) => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => {
                              setChatText(prev => prev + em);
                              setShowEmojiPicker(false);
                            }}
                            className="text-lg hover:scale-120 transition"
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Quick Preset Attachments selector list */}
                    {showAttachmentPicker && (
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 space-y-2">
                        <p className="text-[9px] uppercase font-bold text-slate-500 font-heading">Selecione uma imagem de inspiração:</p>
                        <div className="grid grid-cols-4 gap-2">
                          {illustrativeImages.map((img) => (
                            <button
                              key={img.url}
                              type="button"
                              onClick={() => {
                                setSelectedChatImage(img.url);
                                setShowAttachmentPicker(false);
                              }}
                              className="relative aspect-video rounded-lg overflow-hidden border border-slate-800 hover:border-indigo-500 transition"
                            >
                              <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                              <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[7px] text-white py-0.5 text-center truncate">{img.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setShowEmojiPicker(!showEmojiPicker);
                          setShowAttachmentPicker(false);
                        }}
                        className="p-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-xl text-slate-400 hover:text-slate-205 transition"
                        title="Inserir Emoji"
                      >
                        <Smile className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowAttachmentPicker(!showAttachmentPicker);
                          setShowEmojiPicker(false);
                        }}
                        className="p-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-xl text-slate-400 hover:text-slate-205 transition"
                        title="Anexar Foto"
                      >
                        <Camera className="w-4 h-4" />
                      </button>

                      <input
                        type="text"
                        placeholder={`Conversar com os praticantes de "${selectedChallenge.name}"...`}
                        value={chatText}
                        onChange={(e) => setChatText(e.target.value)}
                        className="flex-1 border border-slate-800 bg-slate-950/60 text-slate-100 placeholder-slate-600 px-3.5 py-2.5 text-xs rounded-xl outline-none focus:border-indigo-505"
                      />

                      <button
                        type="submit"
                        disabled={!chatText.trim() && !selectedChatImage}
                        className="bg-indigo-650 hover:bg-indigo-600 disabled:opacity-50 text-white px-5 rounded-xl text-xs font-bold transition flex items-center justify-center shrink-0 shadow cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 👥 FEED COLETIVO TAB (Posts exclusive to challenge members) */}
              {activeTab === "feed" && (
                <div className="space-y-4">
                  <div className="border-b border-slate-850 pb-2 mb-2 text-left">
                    <h3 className="text-xs font-extrabold uppercase text-slate-350 tracking-wider font-heading">Feed Exclusivo do Desafio</h3>
                    <p className="text-[11px] text-slate-500">Compartilhe suas conquistas, fotos, vídeos, sentimentos e treinos exclusivamente com esta comunidade.</p>
                  </div>

                  <SocialFeed
                    posts={posts}
                    currentUser={currentUser}
                    allUsers={users}
                    communities={communities}
                    onComment={onComment || (() => {})}
                    onReact={onReact || (() => {})}
                    onNewPost={onNewPost || (() => {})}
                    onSubmitCombined={onSubmitCombined || (async () => ({ success: false, error: "Não implementado" }))}
                    onSelectUser={() => {}}
                    onPostCreated={() => {}}
                    firebaseAuth={firebaseAuth}
                    communityId={selectedChallenge.id}
                  />
                </div>
              )}

              {/* 🏆 CHALLENGE RANKING TAB */}
              {activeTab === "ranking" && (
                <div className="space-y-4">
                  <div className="text-left border-b border-slate-850 pb-2 mb-2 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest block font-heading">Classificação Interna da Campanha</h3>
                      <p className="text-[11px] text-slate-500">
                        Pontos somados calculados de acordo com os hábitos limitados na regra: <span className="text-indigo-400 font-extrabold font-mono uppercase bg-indigo-505/10 px-2 py-0.5 rounded border border-indigo-500/10 inline-block">{selectedChallenge.enabledActivities.join(" • ")}</span>
                      </p>
                    </div>

                    {selectedChallenge.customSubgroups && selectedChallenge.customSubgroups.length > 0 && (
                      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 shrink-0">
                        <button
                          onClick={() => setRankingView("general")}
                          className={`text-[10px] font-black px-3 py-1.5 rounded-lg transition-all ${
                            rankingView === "general" 
                              ? "bg-indigo-650 text-white" 
                              : "text-slate-500 hover:text-slate-350"
                          }`}
                        >
                          🏆 Geral
                        </button>
                        <button
                          onClick={() => setRankingView("subgroups")}
                          className={`text-[10px] font-black px-3 py-1.5 rounded-lg transition-all ${
                            rankingView === "subgroups" 
                              ? "bg-indigo-650 text-white" 
                              : "text-slate-500 hover:text-slate-350"
                          }`}
                        >
                          📍 Equipes
                        </button>
                      </div>
                    )}
                  </div>

                  {rankingLoading && communityRanking.length === 0 ? (
                    <p className="text-xs text-slate-400">Sincronizando classificação real-time...</p>
                  ) : communityRanking.length === 0 ? (
                    <p className="text-xs text-slate-500">Nenhuma atividade registrada por membros deste desafio no período ainda.</p>
                  ) : rankingView === "general" || !selectedChallenge.customSubgroups || selectedChallenge.customSubgroups.length === 0 ? (
                    <div className="bg-slate-950/30 rounded-2xl border border-slate-850 overflow-hidden divide-y divide-slate-850/60">
                      {communityRanking.map((item: any, index: number) => {
                        const isMe = item.userId === currentUser?.id;
                        return (
                          <div key={item.userId} className={`p-4 flex items-center justify-between text-xs font-medium transition ${isMe ? "bg-indigo-650/10" : ""}`}>
                            <div className="flex items-center gap-3">
                              <span className="w-5 text-center font-mono font-bold text-slate-550 text-xs">
                                {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                              </span>
                              <img
                                src={item.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                                alt={item.name}
                                className="w-8 h-8 rounded-full object-cover bg-slate-950 border border-slate-800"
                              />
                              <div className="text-left font-sans">
                                <span className="font-extrabold text-slate-100 block">
                                  {item.name} {isMe ? "(Você)" : ""}
                                </span>
                                <span className="text-[9px] text-slate-550 block leading-tight mt-0.5">
                                  {item.division} • {item.region}
                                </span>
                                <span className="text-[9px] text-slate-500 block leading-tight mt-1">
                                  {item.gongyoCount > 0 && `🪷 ${item.gongyoCount} gongyo`}
                                  {item.totalDaimokuMin > 0 && ` • 🔥 ${item.totalDaimokuMin}m daimoku`}
                                  {item.totalExerciseMin > 0 && ` • 💪 ${item.totalExerciseMin}m treino`}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center">
                              <div className="text-right">
                                <span className="text-amber-400 font-mono font-black text-sm">{item.totalPoints} pts</span>
                              </div>

                              {currentUser && selectedChallenge.creatorId === currentUser.id && item.userId !== currentUser.id && (
                                <button
                                  onClick={() => handleKickMember(item.userId)}
                                  title="Remover Membro"
                                  className="p-1 hover:bg-red-500/10 rounded-lg text-slate-550 hover:text-red-400 transition cursor-pointer select-none ml-2"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {selectedChallenge.customSubgroups.map((sub: string) => {
                        const getUserSubgroup = (entry: any) => {
                          const saved = localStorage.getItem(`soka_subgroup_${entry.userId}_${selectedChallenge.id}`);
                          if (saved && selectedChallenge.customSubgroups.includes(saved)) return saved;
                          const matched = selectedChallenge.customSubgroups.find((g: string) =>
                            entry.region?.toLowerCase().includes(g.toLowerCase()) || 
                            g.toLowerCase().includes(entry.region?.toLowerCase() || "") ||
                            g.toLowerCase().includes(entry.division?.toLowerCase() || "")
                          );
                          return matched || selectedChallenge.customSubgroups[0];
                        };

                        const subgroupMembers = communityRanking.filter(entry => getUserSubgroup(entry) === sub);
                        const subTotalPoints = subgroupMembers.reduce((sum, item) => sum + item.totalPoints, 0);

                        return (
                          <div key={sub} className="bg-slate-900/40 rounded-2xl border border-slate-850 overflow-hidden">
                            <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-850/60 flex items-center justify-between">
                              <h4 className="text-xs font-black font-heading text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                                <MapPin className="w-4 h-4 text-indigo-500" />
                                {sub}
                              </h4>
                              <span className="text-[10px] font-bold font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                Total: {subTotalPoints} pts
                              </span>
                            </div>

                            {subgroupMembers.length === 0 ? (
                              <p className="p-4 text-[11px] text-slate-500 text-center">Nenhum participante associado a esta equipe ainda.</p>
                            ) : (
                              <div className="divide-y divide-slate-850/40">
                                {subgroupMembers.map((item: any, index: number) => {
                                  const isMe = item.userId === currentUser?.id;
                                  return (
                                    <div key={item.userId} className={`p-4 flex items-center justify-between text-xs font-medium transition ${isMe ? "bg-indigo-650/10" : ""}`}>
                                      <div className="flex items-center gap-3">
                                        <span className="w-5 text-center font-mono font-bold text-slate-550 text-xs">
                                          {index + 1}
                                        </span>
                                        <img
                                          src={item.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                                          alt={item.name}
                                          className="w-8 h-8 rounded-full object-cover bg-slate-950 border border-slate-800"
                                        />
                                        <div className="text-left font-sans">
                                          <span className="font-extrabold text-slate-101 block">
                                            {item.name} {isMe ? "(Você)" : ""}
                                          </span>
                                          <span className="text-[9px] text-slate-550 block leading-tight mt-0.5">
                                            {item.division} • {item.region}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center">
                                        <div className="text-right">
                                          <span className="text-amber-400 font-mono font-black text-sm">{item.totalPoints} pts</span>
                                        </div>

                                        {currentUser && selectedChallenge.creatorId === currentUser.id && item.userId !== currentUser.id && (
                                          <button
                                            onClick={() => handleKickMember(item.userId)}
                                            title="Remover Membro"
                                            className="p-1 hover:bg-red-500/10 rounded-lg text-slate-550 hover:text-red-400 transition cursor-pointer select-none ml-2"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 📈 DYNAMIC SVG GRAPHS TAB */}
              {activeTab === "dashboard" && challengeStats && (
                <div className="space-y-6">
                  <div className="text-left border-b border-slate-850 pb-2">
                    <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest block font-heading">Resultados Coletivos Acumulados</h3>
                    <p className="text-[11px] text-slate-500">Métricas analíticas calculadas com base nas atividades do grupo no período.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* SVG Progress meters */}
                    <div className="space-y-4 bg-slate-950/45 p-4 rounded-2xl border border-slate-850 text-left">
                      <h4 className="text-[10px] uppercase font-extrabold text-indigo-400 font-heading">📊 Visão Geral de Hábitos</h4>
                      
                      <div className="space-y-3.5">
                        {/* Daimoku meter */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-350">
                            <span>🔥 Daimoku Acumulado</span>
                            <span className="font-mono font-bold text-indigo-300">{challengeStats.daimoku} minutos</span>
                          </div>
                          <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, challengeStats.daimoku / 5)}%` }} />
                          </div>
                        </div>

                        {/* Gongyo meter */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-350">
                            <span>🪷 Gongyo Acumulado</span>
                            <span className="font-mono font-bold text-indigo-300">{challengeStats.gongyo} orações</span>
                          </div>
                          <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                            <div className="h-full bg-[#10B981] rounded-full" style={{ width: `${Math.min(100, challengeStats.gongyo * 1.5)}%` }} />
                          </div>
                        </div>

                        {/* Exercises meter */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-350">
                            <span>💪 Exercícios Físicos</span>
                            <span className="font-mono font-bold text-indigo-300">{challengeStats.exercise} treinos</span>
                          </div>
                          <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, challengeStats.exercise * 2)}%` }} />
                          </div>
                        </div>

                        {/* Community engagements */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-350">
                            <span>📈 Participação Geral do Grupo</span>
                            <span className="font-mono font-bold text-indigo-300">{challengeStats.rate}% de constância</span>
                          </div>
                          <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${challengeStats.rate}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SVG comparative charts */}
                    <div className="bg-slate-950/45 p-4 rounded-2xl border border-slate-850 flex flex-col justify-between text-left">
                      <div>
                        <h4 className="text-[10px] uppercase font-extrabold text-indigo-400 font-heading">📈 Participação Semanal Coletiva</h4>
                        <p className="text-[10px] text-slate-500">Percentual de pontuação ganha por dia da semana corrente.</p>
                      </div>

                      {/* Stunning Native SVG Chart */}
                      <div className="h-40 w-full flex items-end justify-between px-2 pt-4 relative">
                        {/* Grid Lines */}
                        <div className="absolute inset-y-0 left-0 right-0 flex flex-col justify-between pointer-events-none opacity-10">
                          <div className="border-t border-slate-350 w-full" />
                          <div className="border-t border-slate-350 w-full" />
                          <div className="border-t border-slate-350 w-full" />
                          <div className="border-t border-slate-350 w-full" />
                        </div>

                        {/* Interactive Bars */}
                        {[
                          { day: "Seg", pts: 25, val: "25 pts", color: "from-indigo-600 to-indigo-500" },
                          { day: "Ter", pts: 48, val: "48 pts", color: "from-[#10B981] to-emerald-500" },
                          { day: "Qua", pts: 65, val: "65 pts", color: "from-indigo-600 to-indigo-500" },
                          { day: "Qui", pts: 30, val: "30 pts", color: "from-amber-600 to-amber-500" },
                          { day: "Sex", pts: 55, val: "55 pts", color: "from-indigo-600 to-indigo-500" },
                          { day: "Sáb", pts: 85, val: "85 pts", color: "from-rose-600 to-pink-500" },
                          { day: "Dom", pts: 40, val: "40 pts", color: "from-indigo-600 to-indigo-500" }
                        ].map((d) => (
                          <div key={d.day} className="flex flex-col items-center flex-1 space-y-1 relative group z-10">
                            {/* Hover tooltip */}
                            <span className="absolute -top-7 scale-0 group-hover:scale-100 transition-transform bg-slate-950 border border-slate-800 text-[8px] text-white py-0.5 px-1.5 rounded font-mono font-bold shadow pointer-events-none whitespace-nowrap">
                              {d.val}
                            </span>
                            
                            <div className="w-4 rounded-t bg-slate-900 h-28 relative overflow-hidden flex items-end">
                              <div 
                                className={`w-full bg-gradient-to-t ${d.color} rounded-t`} 
                                style={{ height: `${d.pts}%` }} 
                              />
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono">{d.day}</span>
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>

                  {/* Cumulative Score Summary Card */}
                  <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 rounded-2xl border border-slate-850 flex items-center justify-between text-left">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">🏆</span>
                      <div>
                        <span className="text-xs text-slate-400 block font-heading uppercase">Pontuação Acumulada da Comunidade</span>
                        <span className="text-slate-101 text-sm font-extrabold leading-tight block">Toda dedicação conta no progresso coletivo!</span>
                      </div>
                    </div>
                    <span className="text-amber-400 font-mono font-extrabold text-lg bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20 shadow-sm shrink-0">
                      {challengeStats.points} pts
                    </span>
                  </div>
                </div>
              )}

              {/* 📢 NOTICES TAB */}
              {activeTab === "avisos" && (
                <div className="space-y-6">
                  <div className="border-b border-slate-850 pb-2 mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest block font-heading">Mural de Avisos da Comunidade</h3>
                      <p className="text-[11px] text-slate-500">Mantenha-se informado sobre as metas, campanhas e estudos do seu bloco.</p>
                    </div>
                  </div>

                  {noticesLoading ? (
                    <div className="text-center py-8 text-xs text-slate-500">Carregando avisos...</div>
                  ) : communityNotices.length === 0 ? (
                    <div className="bg-slate-900/20 border border-slate-800/40 p-8 rounded-2xl text-center text-slate-500">
                      <Bell className="w-8 h-8 text-slate-700 mx-auto mb-2 animate-bounce" />
                      <p className="text-xs">Nenhum aviso publicado até o momento.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {communityNotices.map((notice) => (
                        <div
                          key={notice.id}
                          className="p-5 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-3 relative overflow-hidden text-left"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[8px] font-black uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 py-0.5 px-2 rounded-full font-mono">
                              {notice.type === "campaign" ? "🔥 Campanha" : notice.type === "study" ? "📖 Estudo" : "📢 Comunicado"}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono">
                              {new Date(notice.createdAt || Date.now()).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-200">{notice.title}</h4>
                          <p className="text-[11px] text-slate-455 leading-relaxed">{notice.description}</p>
                          {currentUser && selectedChallenge.creatorId === currentUser.id && (
                            <button
                              onClick={() => handleDeleteCommunityNotice(notice.id)}
                              className="text-[10px] text-rose-450 hover:text-rose-400 flex items-center gap-1 font-bold pt-1.5 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remover Aviso
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 📅 EVENTS & LIVES TAB */}
              {activeTab === "eventos" && (
                <div className="space-y-6">
                  <div className="border-b border-slate-850 pb-2 mb-4">
                    <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest block font-heading">Calendário de Atividades & Lives</h3>
                    <p className="text-[11px] text-slate-500">Acompanhe reuniões de bloco, treinos coletivos e transmissões virtuais.</p>
                  </div>

                  {/* Bodhi Lives Section */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-indigo-400 flex items-center gap-1.5">
                      <Play className="w-4 h-4 text-indigo-400 animate-pulse" />
                      Bodhi Lives Ativas ou Gravadas
                    </h4>
                    
                    {communityLives.length === 0 ? (
                      <div className="bg-slate-900/10 border border-slate-850/60 p-5 rounded-2xl text-center text-slate-500 text-xs">
                        Nenhuma transmissão ao vivo ativa.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {communityLives.map((live) => (
                          <div key={live.id} className="bg-slate-950/60 border border-slate-850 rounded-2xl overflow-hidden shadow">
                            <div className="h-40 bg-slate-900 flex items-center justify-center relative">
                              <img src={selectedChallenge.cover} className="w-full h-full object-cover opacity-30" />
                              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                                <Play className="w-10 h-10 text-indigo-400 bg-indigo-500/10 p-2.5 rounded-full border border-indigo-500/20 shadow animate-bounce" />
                                <span className="text-[9px] uppercase font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full tracking-wider animate-pulse">AO VIVO / GRAVADA</span>
                              </div>
                            </div>
                            <div className="p-4 space-y-1 text-left">
                              <h5 className="text-xs font-bold text-slate-101">{live.title}</h5>
                              <p className="text-[10px] text-slate-400 line-clamp-2">{live.description}</p>
                              <a 
                                href={live.videoUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-extrabold mt-2 cursor-pointer"
                              >
                                Assistir no YouTube <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Upcoming Events Section */}
                  <div className="space-y-4 pt-4 border-t border-slate-850/60">
                    <h4 className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      Calendário de Atividades do Grupo
                    </h4>

                    {communityEvents.length === 0 ? (
                      <div className="bg-slate-900/10 border border-slate-850/60 p-6 rounded-2xl text-center text-slate-500 text-xs">
                        Nenhum evento agendado para esta campanha.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {communityEvents.map((evt) => (
                          <div
                            key={evt.id}
                            className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[8px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 py-0.5 px-2 rounded-lg font-mono">
                                  {evt.category?.toUpperCase() || "EVENTO"}
                                </span>
                                <span className="text-[10px] text-slate-450 font-mono font-bold">
                                  📅 {new Date(evt.date).toLocaleDateString()}
                                </span>
                              </div>
                              <h5 className="text-xs font-extrabold text-slate-101">{evt.title}</h5>
                              <p className="text-[11px] text-slate-400">{evt.description}</p>
                              {currentUser && selectedChallenge.creatorId === currentUser.id && (
                                <button
                                  onClick={() => handleDeleteCommunityEvent(evt.id)}
                                  className="text-[10px] text-rose-450 hover:text-rose-400 font-bold flex items-center gap-1 mt-1.5 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Excluir Evento
                                </button>
                              )}
                            </div>
                            <div className="text-left sm:text-right shrink-0">
                              <span className="text-[9px] text-slate-500 block uppercase">Localização / Link:</span>
                              <span className="text-[11px] text-indigo-300 font-semibold">{evt.location}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 📚 SHARED FILES / LIBRARY TAB */}
              {activeTab === "arquivos" && (
                <div className="space-y-6">
                  <div className="border-b border-slate-850 pb-2 mb-4">
                    <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest block font-heading">Biblioteca Compartilhada</h3>
                    <p className="text-[11px] text-slate-500">Estudos, diretrizes, roteiros de daimoku e PDFs de apoio enviados pelos líderes.</p>
                  </div>

                  {communityFiles.length === 0 ? (
                    <div className="bg-slate-900/20 border border-slate-850/60 p-8 rounded-2xl text-center text-slate-500">
                      <BookOpen className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                      <p className="text-xs">Nenhum arquivo ou documento compartilhado na biblioteca.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {communityFiles.map((file) => (
                        <div
                          key={file.id}
                          className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl flex items-center justify-between gap-4 text-left"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-xl bg-indigo-950/50 border border-indigo-900/20 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div className="overflow-hidden">
                              <div className="flex items-center gap-1.5">
                                <h5 className="text-xs font-bold text-slate-101 truncate">{file.name}</h5>
                                <span className="bg-slate-900 text-slate-450 text-[7px] font-mono font-bold px-1 py-0.2 rounded border border-slate-800">
                                  {file.category?.toUpperCase() || "ESTUDO"}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-450 truncate mt-0.5">{file.description}</p>
                              {currentUser && selectedChallenge.creatorId === currentUser.id && (
                                <button
                                  onClick={() => handleDeleteCommunityFile(file.id)}
                                  className="text-[10px] text-rose-400 hover:text-rose-350 font-bold flex items-center gap-1 mt-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Remover
                                </button>
                              )}
                            </div>
                          </div>

                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 bg-indigo-600/10 hover:bg-indigo-600 hover:text-white border border-indigo-500/20 text-indigo-300 text-[10px] font-bold rounded-xl transition flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Baixar</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 🤖 COACH IA CHAT TAB */}
              {activeTab === "ia_coach" && (
                <div className="space-y-6">
                  <div className="border-b border-slate-850 pb-2 mb-4">
                    <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest block font-heading">Conversar com o Coach IA da Comunidade</h3>
                    <p className="text-[11px] text-slate-500">Esclareça dúvidas sobre os objetivos da campanha, receba incentivos baseados no Budismo Soka ou monte planos de treinos personalizados.</p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-850/80 rounded-2xl overflow-hidden shadow flex flex-col h-[400px]">
                    {/* Conversations area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                      {iaHistory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-500">
                          <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
                          <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wider">Seu Orientador Pessoal de Campanha</h4>
                          <p className="text-[10px] leading-relaxed max-w-sm">Pergunte, por exemplo: "Como posso atingir 300 minutos de Daimoku neste mês?" ou "Me dê uma frase de incentivo de Daisaku Ikeda para hoje!"</p>
                        </div>
                      ) : (
                        iaHistory.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex gap-2.5 max-w-[85%] text-left ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                          >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-[10px] ${
                              msg.role === "user" ? "bg-indigo-650 text-white" : "bg-emerald-900/30 text-emerald-400 border border-emerald-900/40"
                            }`}>
                              {msg.role === "user" ? "U" : "AI"}
                            </div>
                            <div className={`p-3 rounded-2xl text-[11px] leading-relaxed ${
                              msg.role === "user" ? "bg-indigo-650 text-white rounded-tr-none" : "bg-slate-900 border border-slate-800 text-slate-205 rounded-tl-none"
                            }`}>
                              {msg.content}
                            </div>
                          </div>
                        ))
                      )}

                      {iaLoading && (
                        <div className="flex gap-2.5 mr-auto max-w-[80%] text-left animate-pulse">
                          <div className="w-7 h-7 rounded-lg bg-emerald-950 flex items-center justify-center text-[10px] font-bold text-emerald-400 border border-emerald-900/20">AI</div>
                          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                            O Coach está refletindo sobre sua orientação...
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Compose area */}
                    <form onSubmit={handleSendIaMessage} className="p-3 bg-slate-950/80 border-t border-slate-850 flex gap-2">
                      <input
                        type="text"
                        placeholder="Digite sua dúvida ou pedido de orientação ao Coach..."
                        value={iaMessage}
                        onChange={(e) => setIaMessage(e.target.value)}
                        disabled={iaLoading}
                        className="flex-1 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl text-xs text-slate-101 outline-none focus:border-indigo-505"
                      />
                      <button
                        type="submit"
                        disabled={iaLoading || !iaMessage.trim()}
                        className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* ⚙️ LEADERS ADMINISTRATIVE PANEL TAB */}
              {activeTab === "admin" && isCreator && (
                <div className="space-y-6">
                  <div className="border-b border-slate-850 pb-2 mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest block font-heading">Painel de Liderança & Administração</h3>
                      <p className="text-[11px] text-slate-500">Configure metas, gerencie cargos, adicione avisos, eventos, arquivos e controle a comunidade.</p>
                    </div>
                    {adminMsg && (
                      <span className="text-[10px] bg-emerald-950/30 text-emerald-400 border border-emerald-900/40 px-3 py-1 rounded-xl font-bold animate-pulse">
                        ✓ {adminMsg}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Post Forms */}
                    <div className="lg:col-span-2 space-y-5">
                      {/* Form: Post Notice */}
                      <form onSubmit={handleAddCommunityNotice} className="bg-slate-950/40 border border-slate-850 p-4.5 rounded-2xl text-left space-y-3.5">
                        <h4 className="text-xs font-bold text-slate-201 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2">
                          <Bell className="w-4 h-4 text-indigo-400" />
                          Fixar Novo Aviso no Mural
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Título do Aviso:</label>
                            <input
                              type="text"
                              value={noticeTitle}
                              onChange={(e) => setNoticeTitle(e.target.value)}
                              required
                              placeholder="Ex: Novo Lema de Julho!"
                              className="w-full text-xs border border-slate-800 bg-slate-900 text-slate-100 px-3 py-2 rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Categoria:</label>
                            <select
                              value={noticeType}
                              onChange={(e) => setNoticeType(e.target.value as any)}
                              className="w-full text-xs border border-slate-800 bg-slate-900 text-slate-101 px-3 py-2 rounded-xl outline-none focus:border-indigo-505"
                            >
                              <option value="announcement">📢 Comunicado Comum</option>
                              <option value="campaign">🔥 Campanha do Bloco</option>
                              <option value="study">📖 Estudo Mensal</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Conteúdo do Aviso:</label>
                          <textarea
                            value={noticeDesc}
                            onChange={(e) => setNoticeDesc(e.target.value)}
                            required
                            placeholder="Descreva o aviso em detalhes para inspirar a comunidade..."
                            className="w-full h-16 text-xs border border-slate-800 bg-slate-900 text-slate-100 p-3 rounded-xl outline-none resize-none focus:border-indigo-505"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                        >
                          Publicar Aviso ➔
                        </button>
                      </form>

                      {/* Form: Add Event */}
                      <form onSubmit={handleAddCommunityEvent} className="bg-slate-950/40 border border-slate-850 p-4.5 rounded-2xl text-left space-y-3.5">
                        <h4 className="text-xs font-bold text-slate-201 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2">
                          <Calendar className="w-4 h-4 text-amber-500" />
                          Agendar Nova Atividade / Evento
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Título da Atividade:</label>
                            <input
                              type="text"
                              value={evtTitle}
                              onChange={(e) => setEvtTitle(e.target.value)}
                              required
                              placeholder="Ex: Treino em Grupo ou Reunião"
                              className="w-full text-xs border border-slate-800 bg-slate-900 text-slate-101 px-3 py-2 rounded-xl outline-none focus:border-indigo-505"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Data:</label>
                            <input
                              type="date"
                              value={evtDate}
                              onChange={(e) => setEvtDate(e.target.value)}
                              required
                              className="w-full text-xs border border-slate-800 bg-slate-900 text-slate-101 px-3 py-1.5 rounded-xl outline-none"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Local / Link Virtual:</label>
                            <input
                              type="text"
                              value={evtLocation}
                              onChange={(e) => setEvtLocation(e.target.value)}
                              placeholder="Ex: Auditório ou Link Zoom"
                              className="w-full text-xs border border-slate-800 bg-slate-900 text-slate-101 px-3 py-2 rounded-xl outline-none focus:border-indigo-505"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Categoria:</label>
                            <select
                              value={evtCategory}
                              onChange={(e) => setEvtCategory(e.target.value)}
                              className="w-full text-xs border border-slate-800 bg-slate-900 text-slate-101 px-3 py-2 rounded-xl outline-none focus:border-indigo-505"
                            >
                              <option value="reuniao">👥 Reunião / Estudo</option>
                              <option value="treino">💪 Treino / Exercício Coletivo</option>
                              <option value="campanha">🎯 Mobilização Geral</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Breve Descrição do Evento:</label>
                          <input
                            type="text"
                            value={evtDesc}
                            onChange={(e) => setEvtDesc(e.target.value)}
                            placeholder="Ex: Levar determinação escrita e roupas leves."
                            className="w-full text-xs border border-slate-800 bg-slate-900 text-slate-101 px-3 py-2 rounded-xl outline-none focus:border-indigo-505"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-550 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                        >
                          Criar Evento 📅
                        </button>
                      </form>

                      {/* Form: Add Library File */}
                      <form onSubmit={handleAddCommunityFile} className="bg-slate-950/40 border border-slate-850 p-4.5 rounded-2xl text-left space-y-3.5">
                        <h4 className="text-xs font-bold text-slate-201 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2">
                          <BookOpen className="w-4 h-4 text-emerald-400" />
                          Enviar Arquivo para a Biblioteca
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Nome do Documento:</label>
                            <input
                              type="text"
                              value={fileName}
                              onChange={(e) => setFileName(e.target.value)}
                              required
                              placeholder="Ex: Manual de Gongyo PDF"
                              className="w-full text-xs border border-slate-800 bg-slate-900 text-slate-101 px-3 py-2 rounded-xl outline-none focus:border-indigo-505"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Categoria do Arquivo:</label>
                            <select
                              value={fileCat}
                              onChange={(e) => setFileCat(e.target.value)}
                              className="w-full text-xs border border-slate-800 bg-slate-900 text-slate-101 px-3 py-2 rounded-xl outline-none focus:border-indigo-505"
                            >
                              <option value="estudo">📖 Material de Estudo</option>
                              <option value="treino">🏋️ Plano de Treino</option>
                              <option value="incentivo">❤️ Carta de Incentivo</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">URL de Acesso/Download:</label>
                            <input
                              type="text"
                              value={fileUrl}
                              onChange={(e) => setFileUrl(e.target.value)}
                              required
                              placeholder="Ex: https://link-para-pdf.com/arquivo.pdf"
                              className="w-full text-xs border border-slate-800 bg-slate-900 text-slate-101 px-3 py-2.5 rounded-xl outline-none focus:border-indigo-505"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Breve Descrição:</label>
                            <input
                              type="text"
                              value={fileDesc}
                              onChange={(e) => setFileDesc(e.target.value)}
                              placeholder="Ex: Contém as orientações completas para novatos."
                              className="w-full text-xs border border-slate-800 bg-slate-900 text-slate-101 px-3 py-2.5 rounded-xl outline-none focus:border-indigo-505"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                        >
                          Disponibilizar Arquivo ➔
                        </button>
                      </form>
                    </div>

                    {/* Right Column: Member Management */}
                    <div className="space-y-5">
                      <div className="bg-slate-950/40 border border-slate-850 p-4.5 rounded-2xl text-left space-y-4">
                        <h4 className="text-xs font-bold text-slate-201 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2">
                          <Users className="w-4 h-4 text-sky-400" />
                          Membros Ativos ({(() => {
                            const aligned = users.filter(u => selectedChallenge.participants?.includes(u.id));
                            return aligned.length;
                          })()})
                        </h4>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                          {users
                            .filter(u => selectedChallenge.participants?.includes(u.id))
                            .map(u => {
                              const role = selectedChallenge.roles?.[u.id] || "Membro";
                              return (
                                <div key={u.id} className="p-3 bg-slate-900 border border-slate-850/60 rounded-xl space-y-2 flex flex-col justify-between">
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0">
                                      <img src={u.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="overflow-hidden">
                                      <h5 className="text-[11px] font-bold text-slate-101 truncate">{u.name}</h5>
                                      <span className="text-[9px] uppercase font-bold text-amber-400 font-mono">
                                        💼 {role}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Change cargo / Kick action */}
                                  {u.id !== selectedChallenge.creatorId && (
                                    <div className="flex items-center gap-1.5 justify-between pt-1 border-t border-slate-850/40">
                                      <select
                                        value={role}
                                        onChange={(e) => handleAssignMemberRole(u.id, e.target.value)}
                                        className="text-[10px] bg-slate-950 text-slate-300 font-bold border border-slate-800 rounded px-1.5 py-0.5 outline-none cursor-pointer"
                                      >
                                        <option value="Membro">Membro</option>
                                        <option value="Administrador">Administrador</option>
                                        <option value="Responsável pelos Eventos">Responsável Eventos</option>
                                        <option value="Moderador">Moderador</option>
                                      </select>

                                      <button
                                        onClick={() => handleKickMember(u.id)}
                                        className="text-[9px] text-rose-455 hover:text-rose-400 font-bold flex items-center gap-0.5 cursor-pointer"
                                      >
                                        <UserX className="w-3.5 h-3.5" /> Remover
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      {/* Pending Approvals (for joinCriteria === approval) */}
                      {selectedChallenge.joinCriteria === "approval" && (
                        <div className="bg-slate-950/40 border border-slate-850 p-4.5 rounded-2xl text-left space-y-4">
                          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2">
                            <Lock className="w-4 h-4 text-amber-500 animate-pulse" />
                            Aprovações Pendentes
                          </h4>

                          {(() => {
                            const pendingUsers = users.filter(u => selectedChallenge.pendingRequests?.includes(u.id));
                            if (pendingUsers.length === 0) {
                              return <p className="text-[10px] text-slate-500 text-center">Nenhuma solicitação pendente.</p>;
                            }
                            return (
                              <div className="space-y-3">
                                {pendingUsers.map(u => (
                                  <div key={u.id} className="p-3 bg-slate-900 border border-slate-850 rounded-xl flex items-center justify-between gap-2 text-xs">
                                    <span className="font-bold text-slate-200 truncate">{u.name}</span>
                                    <div className="flex gap-1 shrink-0">
                                      <button
                                        onClick={async () => {
                                          const res = await fetch(`/api/communities/${selectedChallenge.id}/approve`, {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ userId: currentUser?.id, targetUserId: u.id })
                                          });
                                          if (res.ok) {
                                            const data = await res.json();
                                            if (data.success && data.community) {
                                              setSelectedChallenge(data.community);
                                              setAdminMsg("Membro aprovado!");
                                              setTimeout(() => setAdminMsg(""), 3000);
                                            }
                                          }
                                        }}
                                        className="p-1 bg-emerald-650 hover:bg-emerald-600 text-white rounded font-bold text-[9px] flex items-center gap-0.5 cursor-pointer"
                                      >
                                        <UserCheck className="w-3.5 h-3.5" /> Sim
                                      </button>
                                      <button
                                        onClick={async () => {
                                          const res = await fetch(`/api/communities/${selectedChallenge.id}/reject`, {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ userId: currentUser?.id, targetUserId: u.id })
                                          });
                                          if (res.ok) {
                                            const data = await res.json();
                                            if (data.success && data.community) {
                                              setSelectedChallenge(data.community);
                                              setAdminMsg("Membro rejeitado!");
                                              setTimeout(() => setAdminMsg(""), 3000);
                                            }
                                          }
                                        }}
                                        className="p-1 bg-slate-800 hover:bg-slate-750 text-slate-350 rounded font-bold text-[9px] cursor-pointer"
                                      >
                                        Não
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* GESTÃO DE CONVITES & LINKS */}
                      <div className="bg-slate-950/40 border border-slate-850 p-4.5 rounded-2xl text-left space-y-4">
                        <h4 className="text-xs font-bold text-slate-201 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2">
                          <Link className="w-4 h-4 text-pink-400" />
                          Gestão de Links & Convites
                        </h4>

                        {/* Invite Link display & Sharing */}
                        <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-3">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase font-mono tracking-wider block">
                            🔗 Link de Convite Ativo
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={`${window.location.origin}/invite/${selectedChallenge.inviteToken || selectedChallenge.id}`}
                              className="flex-1 text-[11px] bg-slate-950 text-pink-400 font-mono p-2 rounded-lg border border-slate-850 outline-none select-all font-bold"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const link = `${window.location.origin}/invite/${selectedChallenge.inviteToken || selectedChallenge.id}`;
                                navigator.clipboard.writeText(link);
                                setCopiedId("admin-link");
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                              className="p-2 bg-pink-950/20 border border-pink-900/30 rounded-lg hover:bg-pink-900/45 transition text-pink-400"
                              title="Copiar Link"
                            >
                              {copiedId === "admin-link" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>

                          {/* Action Sharing Buttons */}
                          <div className="grid grid-cols-3 gap-2">
                            <a
                              href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Participe da nossa comunidade " + selectedChallenge.name + " no BodhiShape! Entre pelo link de convite oficial: " + `${window.location.origin}/invite/${selectedChallenge.inviteToken || selectedChallenge.id}`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-emerald-900/10 transition text-center"
                            >
                              <span className="text-sm">💬</span>
                              <span className="text-[8px] font-bold uppercase tracking-wider">WhatsApp</span>
                            </a>

                            <a
                              href={`mailto:?subject=${encodeURIComponent("Convite para a comunidade " + selectedChallenge.name)}&body=${encodeURIComponent("Olá!\n\nGostaria de te convidar a participar da nossa comunidade '" + selectedChallenge.name + "' no BodhiShape.\n\nAcesse o link oficial de convite abaixo para se juntar a nós:\n" + `${window.location.origin}/invite/${selectedChallenge.inviteToken || selectedChallenge.id}` + "\n\nTe espero lá!")}`}
                              className="p-2 bg-indigo-950/20 border border-indigo-900/30 text-indigo-400 rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-indigo-905/10 transition text-center"
                            >
                              <span className="text-sm">✉️</span>
                              <span className="text-[8px] font-bold uppercase tracking-wider">E-mail</span>
                            </a>

                            <button
                              type="button"
                              onClick={() => setShowQrModalFor(selectedChallenge)}
                              className="p-2 bg-purple-950/20 border border-purple-900/30 text-purple-400 rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-purple-900/10 transition text-center"
                            >
                              <QrCode className="w-4 h-4 text-purple-400 mx-auto" />
                              <span className="text-[8px] font-bold uppercase tracking-wider">QR Code</span>
                            </button>
                          </div>

                          {/* Revoke current link button */}
                          <button
                            type="button"
                            onClick={async () => {
                              if (!window.confirm("Aviso de Segurança: Tem certeza de que deseja revogar o link de convite atual? O link antigo deixará de funcionar imediatamente e um novo será gerado para garantir a segurança.")) return;
                              try {
                                const authHeaders: Record<string, string> = { "Content-Type": "application/json" };
                                if (firebaseAuth?.currentUser) {
                                  const tokenVal = await firebaseAuth.currentUser.getIdToken();
                                  authHeaders["Authorization"] = `Bearer ${tokenVal}`;
                                }
                                const res = await fetch(`/api/communities/${selectedChallenge.id}/revoke-invite`, {
                                  method: "POST",
                                  headers: authHeaders,
                                  body: JSON.stringify({ userId: currentUser?.id })
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  if (data.success) {
                                    setSelectedChallenge(data.community);
                                    setLocalCommunities(prev => prev.map(c => c.id === selectedChallenge.id ? data.community : c));
                                    setAdminMsg("Link antigo revogado e novo gerado!");
                                    setTimeout(() => setAdminMsg(""), 3500);
                                  }
                                }
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="w-full py-2 bg-red-955/30 border border-red-900/40 text-red-405 font-extrabold hover:bg-red-900/25 text-[10px] uppercase rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            🔄 Revogar & Gerar Novo Link
                          </button>
                        </div>

                        {/* Privacy / Criteria configuration selection */}
                        <div className="space-y-2 text-left">
                          <label className="text-[9px] uppercase font-bold text-slate-450 block">🔒 Configurações do Link:</label>
                          <select
                            value={selectedChallenge.joinCriteria || "invite_auto"}
                            onChange={async (e) => {
                              const criteria = e.target.value;
                              try {
                                const authHeaders: Record<string, string> = { "Content-Type": "application/json" };
                                if (firebaseAuth?.currentUser) {
                                  const tokenVal = await firebaseAuth.currentUser.getIdToken();
                                  authHeaders["Authorization"] = `Bearer ${tokenVal}`;
                                }
                                const res = await fetch(`/api/communities/${selectedChallenge.id}/update`, {
                                  method: "POST",
                                  headers: authHeaders,
                                  body: JSON.stringify({ userId: currentUser?.id, joinCriteria: criteria })
                                });
                                if (res.ok) {
                                  const updated = await res.json();
                                  setSelectedChallenge(updated);
                                  setLocalCommunities(prev => prev.map(c => c.id === selectedChallenge.id ? updated : c));
                                  setAdminMsg("Critério atualizado com sucesso!");
                                  setTimeout(() => setAdminMsg(""), 3000);
                                }
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="w-full text-xs border border-slate-800 bg-slate-900 text-slate-101 px-3 py-2 rounded-xl outline-none focus:border-indigo-505 cursor-pointer"
                          >
                            <option value="invite_auto">Qualquer pessoa com o link entra automaticamente</option>
                            <option value="invite_approval">Quem possuir o link precisa de aprovação</option>
                            <option value="invite_nominal">Somente pessoas convidadas nominalmente</option>
                          </select>
                        </div>

                        {/* Nominal Invites management (only shown if invite_nominal) */}
                        {selectedChallenge.joinCriteria === "invite_nominal" && (
                          <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-3">
                            <span className="text-[10px] text-amber-400 font-extrabold uppercase font-mono tracking-wider block">
                              👥 Convidados Nominais Autorizados
                            </span>
                            <div className="flex gap-2">
                              <input
                                id="nominal-invite-email-input"
                                type="text"
                                placeholder="E-mail ou Apelido cadastrado"
                                className="flex-1 text-xs bg-slate-950 border border-slate-850 px-3 py-2 text-slate-100 rounded-xl outline-none"
                                onKeyDown={async (e) => {
                                  if (e.key === "Enter") {
                                    const input = e.currentTarget;
                                    const value = input.value.trim();
                                    if (!value) return;
                                    
                                    try {
                                      const authHeaders: Record<string, string> = { "Content-Type": "application/json" };
                                      if (firebaseAuth?.currentUser) {
                                        const tokenVal = await firebaseAuth.currentUser.getIdToken();
                                        authHeaders["Authorization"] = `Bearer ${tokenVal}`;
                                      }
                                      const res = await fetch(`/api/communities/${selectedChallenge.id}/nominal-invites`, {
                                        method: "POST",
                                        headers: authHeaders,
                                        body: JSON.stringify({ userId: currentUser?.id, email: value })
                                      });
                                      if (res.ok) {
                                        const updated = await res.json();
                                        setSelectedChallenge(updated.community);
                                        setLocalCommunities(prev => prev.map(c => c.id === selectedChallenge.id ? updated.community : c));
                                        input.value = "";
                                        setAdminMsg("Convidado nominal adicionado!");
                                        setTimeout(() => setAdminMsg(""), 3000);
                                      }
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={async () => {
                                  const input = document.getElementById("nominal-invite-email-input") as HTMLInputElement;
                                  const value = input?.value.trim();
                                  if (!value) return;
                                  
                                  try {
                                    const authHeaders: Record<string, string> = { "Content-Type": "application/json" };
                                    if (firebaseAuth?.currentUser) {
                                      const tokenVal = await firebaseAuth.currentUser.getIdToken();
                                      authHeaders["Authorization"] = `Bearer ${tokenVal}`;
                                    }
                                    const res = await fetch(`/api/communities/${selectedChallenge.id}/nominal-invites`, {
                                      method: "POST",
                                      headers: authHeaders,
                                      body: JSON.stringify({ userId: currentUser?.id, email: value })
                                    });
                                    if (res.ok) {
                                      const updated = await res.json();
                                      setSelectedChallenge(updated.community);
                                      setLocalCommunities(prev => prev.map(c => c.id === selectedChallenge.id ? updated.community : c));
                                      if (input) input.value = "";
                                      setAdminMsg("Convidado nominal adicionado!");
                                      setTimeout(() => setAdminMsg(""), 3000);
                                    }
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}
                                className="p-2 px-3 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                              >
                                Add
                              </button>
                            </div>
                            <p className="text-[9px] text-slate-500 leading-tight">
                              Apenas estas pessoas conseguirão entrar na comunidade com o link de convite.
                            </p>

                            {/* List of currently nominal invites */}
                            {selectedChallenge.nominalInvites && selectedChallenge.nominalInvites.length > 0 ? (
                              <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1 pt-1 border-t border-slate-850">
                                {selectedChallenge.nominalInvites.map((email: string) => (
                                  <div key={email} className="flex justify-between items-center bg-slate-950 p-1.5 px-2.5 rounded-lg border border-slate-850 text-[10px]">
                                    <span className="font-mono text-pink-400 font-bold truncate pr-2">{email}</span>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          const authHeaders: Record<string, string> = { "Content-Type": "application/json" };
                                          if (firebaseAuth?.currentUser) {
                                            const tokenVal = await firebaseAuth.currentUser.getIdToken();
                                            authHeaders["Authorization"] = `Bearer ${tokenVal}`;
                                          }
                                          const res = await fetch(`/api/communities/${selectedChallenge.id}/nominal-invites`, {
                                            method: "DELETE",
                                            headers: authHeaders,
                                            body: JSON.stringify({ userId: currentUser?.id, email })
                                          });
                                          if (res.ok) {
                                            const updated = await res.json();
                                            setSelectedChallenge(updated.community);
                                            setLocalCommunities(prev => prev.map(c => c.id === selectedChallenge.id ? updated.community : c));
                                            setAdminMsg("Convidado removido!");
                                            setTimeout(() => setAdminMsg(""), 3000);
                                          }
                                        } catch (err) {
                                          console.error(err);
                                        }
                                      }}
                                      className="text-rose-400 hover:text-rose-350 font-bold uppercase text-[8px] cursor-pointer"
                                    >
                                      Remover
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[9px] text-slate-500 text-center">Nenhum convidado nominal cadastrado ainda.</p>
                            )}
                          </div>
                        )}

                        {/* List of history: who joined via link */}
                        <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-3">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase font-mono tracking-wider block">
                            📋 Histórico de Entradas via Link
                          </span>
                          {selectedChallenge.invitationHistory && selectedChallenge.invitationHistory.length > 0 ? (
                            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                              {selectedChallenge.invitationHistory.map((item: any, idx: number) => (
                                <div key={idx} className="p-2.5 bg-slate-950 rounded-xl border border-slate-850/60 text-[10px] space-y-1 text-left font-sans">
                                  <div className="flex justify-between items-center">
                                    <strong className="text-slate-200">{item.userName}</strong>
                                    <span className="text-slate-500 text-[8px] font-mono">
                                      {new Date(item.joinedAt).toLocaleDateString()} {new Date(item.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center text-[9px]">
                                    <span className="text-slate-450 font-mono">Token: <span className="text-indigo-400 font-bold">{item.inviteToken}</span></span>
                                    <button
                                      type="button"
                                      onClick={() => handleKickMember(item.userId)}
                                      className="text-rose-405 hover:text-rose-400 font-bold text-[8px] uppercase tracking-wider flex items-center gap-0.5 cursor-pointer"
                                    >
                                      <UserX className="w-2.5 h-2.5" /> Revogar Acesso
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[9px] text-slate-500 text-center">Ninguém entrou via link de convite ainda.</p>
                          )}
                        </div>
                      </div>

                      {/* Critical Area: Delete Community */}
                      <div className="bg-rose-955/10 border border-rose-900/30 p-4.5 rounded-2xl text-left space-y-3.5">
                        <h4 className="text-xs font-bold text-rose-350 uppercase tracking-wider flex items-center gap-1.5 border-b border-rose-955/20 pb-2">
                          ⚠️ Zona de Perigo Crítica
                        </h4>
                        <p className="text-[10px] text-rose-455 leading-relaxed">A exclusão apagará permanentemente todos os registros, eventos, arquivos, mural de avisos e bate-papos deste desafio.</p>
                        <button
                          onClick={handleDeleteCommunity}
                          className="w-full py-2 bg-rose-900 hover:bg-rose-850 text-white font-extrabold text-[10px] rounded-xl transition cursor-pointer flex items-center justify-center gap-1 shadow"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>EXCLUIR CAMPANHA DEFINITIVAMENTE</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 🏅 HALL OF CONSTANCY TAB */}
              {activeTab === "constancy_hall" && (
                <div className="space-y-4">
                  <div className="border-b border-slate-850 pb-2 mb-2 text-left">
                    <h3 className="text-xs font-extrabold uppercase text-slate-350 tracking-wider font-heading">Hall da Constância do Desafio</h3>
                    <p className="text-[11px] text-slate-500">Acompanhe a constância de Daimoku e Exercícios Físicos dos membros deste grupo.</p>
                  </div>
                  <ConstancyHall
                    users={users}
                    activities={activities}
                    onSelectUser={() => {}}
                    communityId={selectedChallenge.id}
                  />
                </div>
              )}

              {/* ✨ VICTORY STORY MURAL TAB */}
              {activeTab === "mural_vitorias" && (
                <div className="space-y-4">
                  <div className="border-b border-slate-850 pb-2 mb-2 text-left">
                    <h3 className="text-xs font-extrabold uppercase text-slate-350 tracking-wider font-heading">Mural de Vitórias & Benefícios</h3>
                    <p className="text-[11px] text-slate-500">Compartilhe e celebre relatos inspiradores e vitórias inabaláveis conquistadas pelos membros deste desafio.</p>
                  </div>
                  <MuralVitorias
                    currentUser={currentUser}
                    onSelectUser={() => {}}
                    firebaseAuth={firebaseAuth}
                    communityId={selectedChallenge.id}
                  />
                </div>
              )}

              {/* 📋 CHALLENGE RULES TAB */}
              {activeTab === "regras" && (
                <div className="space-y-6">
                  <div className="border-b border-slate-850 pb-2 mb-2 text-left">
                    <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest block font-heading">Regras de Validação</h3>
                    <p className="text-[11px] text-slate-500">Verifique os regulamentos específicos estabelecidos pelo líder para este desafio.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300 font-normal leading-relaxed text-left">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold text-amber-400 block font-heading">📜 Diretrizes & Determinação Lema:</span>
                        <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl italic text-slate-350">
                          "{selectedChallenge.rules}"
                        </div>
                      </div>

                      <p>Nas campanhas de incentivo, ensina-se que a constância diária constrói caráter de aço. A rivalidade é substituída pelo suporte mútuo e amizade profunda (Sanshin).</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold text-indigo-400 block font-heading">📌 Métricas Pontuadas Neste Desafio:</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedChallenge.enabledActivities.map((actCode: string) => {
                            const mapNames: Record<string, string> = {
                              gongyo: "🪷 Gongyo",
                              daimoku: "🔥 Daimoku",
                              exercise: "💪 Exercício Físico",
                              bs: "📰 Brasil Seikyo",
                              kofu: "❤️ Kofu"
                            };
                            return (
                              <span key={actCode} className="bg-indigo-950/40 border border-indigo-900/30 text-indigo-300 font-mono font-bold px-3 py-1.5 rounded-lg text-[10px]">
                                ✓ {mapNames[actCode]?.toUpperCase() || actCode.toUpperCase()}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-normal">
                        Atividades lançadas no painel principal que envolvam estes hábitos marcados pontuarão automaticamente no ranking deste desafio privativo. Outras atividades serão salvas apenas no seu histórico pessoal.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 📍 MAP / SUBGROUPS TAB FOR CUSTOMIZED ORGANIZATION CHALLENGES */}
              {activeTab === "subgroups" && selectedChallenge.customSubgroups && selectedChallenge.customSubgroups.length > 0 && (
                <div className="space-y-6">
                  {/* Select user team override card */}
                  <div className="bg-[#050212]/90 p-4.5 rounded-2xl border border-fuchsia-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                    <div>
                      <h4 className="text-xs font-bold text-slate-205 font-heading uppercase flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-amber-500 animate-pulse" />
                        Sua Organização / Equipe neste Desafio
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Selecione a qual subgrupo você deseja somar seus minutos e pontos neste desafio específico.
                      </p>
                    </div>

                    <select
                      value={(() => {
                        const saved = localStorage.getItem(`soka_subgroup_${currentUser?.id}_${selectedChallenge.id}`);
                        if (saved) return saved;
                        // Match user region or default
                        const matched = selectedChallenge.customSubgroups.find((g: string) =>
                          currentUser?.region?.toLowerCase().includes(g.toLowerCase()) || 
                          g.toLowerCase().includes(currentUser?.region?.toLowerCase() || "") ||
                          g.toLowerCase().includes(currentUser?.horizontalGroup?.toLowerCase() || "")
                        );
                        return matched || selectedChallenge.customSubgroups[0];
                      })()}
                      onChange={(e) => {
                        if (currentUser) {
                          localStorage.setItem(`soka_subgroup_${currentUser.id}_${selectedChallenge.id}`, e.target.value);
                          // trigger component update by resetting selectedChallenge
                          setSelectedChallenge({ ...selectedChallenge });
                        }
                      }}
                      className="text-xs font-bold bg-[#050212] border border-fuchsia-500/10 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500/60 transition w-full sm:w-64"
                    >
                      {selectedChallenge.customSubgroups.map((sub: string) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>

                  {/* If "Missão Nordeste 1", show the highly interactive gamified SVG Map */}
                  {(selectedChallenge.id === "comm-nordeste1" || selectedChallenge.name?.toLowerCase().includes("nordeste 1")) ? (
                    <div className="space-y-4">
                      <div className="text-left border-b border-slate-850 pb-2 mb-2">
                        <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest block font-heading">Mapa Coletivo do Nordeste</h3>
                        <p className="text-[11px] text-slate-500">Métricas geográficas integradas com os estados participantes.</p>
                      </div>

                      <MissaoNordesteMap users={users} activities={activities} />
                    </div>
                  ) : (
                    /* Otherwise, show the dynamic Beautiful CSS grid of their customized Subgroups! */
                    <div className="space-y-6">
                      <div className="text-left border-b border-slate-850 pb-2 mb-2">
                        <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest block font-heading">Estatísticas por Equipe / Subgrupo</h3>
                        <p className="text-[11px] text-slate-500">Cada equipe acumula minutos e pontos baseados em seus integrantes.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
                        {(() => {
                          const subgroupColors = ["#0D0A8C", "#F25C05", "#F84C7F", "#F5B400", "#8F6BCB", "#6BCB77", "#06B6D4", "#EC4899", "#10B981"];
                          
                          return selectedChallenge.customSubgroups.map((subName: string, index: number) => {
                            // Find users aligned
                            const alignedUsers = users.filter(u => {
                              const saved = localStorage.getItem(`soka_subgroup_${u.id}_${selectedChallenge.id}`);
                              if (saved) return saved === subName;
                              const matched = selectedChallenge.customSubgroups.find((g: string) =>
                                u.region?.toLowerCase().includes(g.toLowerCase()) || 
                                g.toLowerCase().includes(u.region?.toLowerCase()) ||
                                g.toLowerCase().includes(u.horizontalGroup?.toLowerCase() || "")
                              );
                              return (matched || selectedChallenge.customSubgroups[0]) === subName;
                            });

                            const alignedUserIds = alignedUsers.map(u => u.id);
                            const daimokuMinutes = activities
                              .filter(a => a.type === "daimoku" && alignedUserIds.includes(a.userId))
                              .reduce((sum, a) => sum + (a.minutes || 0), 0);

                            const totalPoints = activities
                              .filter(a => alignedUserIds.includes(a.userId) && selectedChallenge.enabledActivities.includes(a.type))
                              .reduce((sum, a) => sum + (a.points || 0), 0);

                            const contributorsCount = alignedUsers.filter(u =>
                              activities.some(a => a.userId === u.id && a.type === "daimoku")
                            ).length;

                            const targetMins = 500; // standard dynamic target
                            const percentage = Math.min(100, Math.round((daimokuMinutes / targetMins) * 100));
                            const color = subgroupColors[index % subgroupColors.length];
                            const isMyTeam = alignedUsers.some(u => u.id === currentUser?.id);

                            return (
                              <div
                                key={subName}
                                className={`bg-[#050212]/40 rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                                  isMyTeam ? "border-indigo-500/25 ring-1 ring-indigo-500/10" : "border-slate-850 hover:border-slate-80"
                                }`}
                              >
                                {isMyTeam && (
                                  <div className="absolute top-2 right-2 bg-indigo-500/10 border border-indigo-500/20 text-[9px] text-indigo-400 font-extrabold px-2 py-0.5 rounded-lg font-heading animate-pulse">
                                    Sua Equipe ★
                                  </div>
                                )}

                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-500 block">Equipe #{index + 1}</span>
                                  <h4 className="font-extrabold font-heading text-sm mt-1 mb-3 truncate" style={{ color: color }}>
                                    {subName}
                                  </h4>

                                  {/* Progress bar */}
                                  <div className="space-y-1 mb-4">
                                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                                      <span>Progresso Daimoku</span>
                                      <span className="font-bold text-slate-200">{percentage}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                                      <div
                                        className="h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${percentage}%`, backgroundColor: color }}
                                      />
                                    </div>
                                  </div>

                                  {/* Metrics Grid */}
                                  <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-350 mb-4 font-mono">
                                    <div className="bg-[#050212]/60 p-2 rounded-xl text-left border border-slate-850/50">
                                      <span className="text-[9px] text-slate-500 block uppercase font-heading leading-tight">Integrantes</span>
                                      <span className="font-bold text-slate-200 text-xs">{alignedUsers.length}</span>
                                    </div>
                                    <div className="bg-[#050212]/60 p-2 rounded-xl text-left border border-slate-850/50">
                                      <span className="text-[9px] text-slate-500 block uppercase font-heading leading-tight">Daimoku</span>
                                      <span className="font-bold text-slate-200 text-xs">{daimokuMinutes} min</span>
                                    </div>
                                    <div className="bg-[#050212]/60 p-2 rounded-xl text-left border border-slate-850/50">
                                      <span className="text-[9px] text-slate-500 block uppercase font-heading leading-tight">Contribuidores</span>
                                      <span className="font-bold text-slate-200 text-xs">{contributorsCount}</span>
                                    </div>
                                    <div className="bg-[#050212]/60 p-2 rounded-xl text-left border border-slate-850/50">
                                      <span className="text-[9px] text-slate-500 block uppercase font-heading leading-tight font-sans">Pontos</span>
                                      <span className="font-bold text-slate-202 text-xs">{totalPoints} pts</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Join team button */}
                                {!isMyTeam && currentUser && (
                                  <button
                                    onClick={() => {
                                      localStorage.setItem(`soka_subgroup_${currentUser.id}_${selectedChallenge.id}`, subName);
                                      setSelectedChallenge({ ...selectedChallenge });
                                    }}
                                    className="w-full mt-2 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-750 rounded-xl text-xs font-bold text-slate-200 transition font-sans"
                                  >
                                    Entrar nesta Equipe ➔
                                  </button>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GLOBAL QR CODE / INVITE MODAL SCREEN */}
      {showQrModalFor && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0C0F1D] border border-slate-800 p-6 rounded-3xl w-full max-w-sm text-center relative space-y-4 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowQrModalFor(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 py-0.5 px-2.5 rounded-full tracking-wider font-mono">
                🪷 Convite Oficial BodhiShape
              </span>
              <h3 className="text-base font-black font-heading text-slate-100 mt-2">
                {showQrModalFor.name}
              </h3>
              <p className="text-[11px] text-slate-450 max-w-xs mx-auto">
                Aponte a câmera do celular para ler o QR Code ou compartilhe o link de convite para trazer companheiros!
              </p>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-4 rounded-2xl w-48 h-48 mx-auto flex items-center justify-center border border-slate-850 shadow">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`${window.location.origin}?join=${showQrModalFor.id}`)}`}
                alt="Convite QR Code"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Copy Button info */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850 space-y-2 text-left font-sans">
              <div className="text-[10px] text-slate-400 flex flex-col gap-0.5">
                <span className="text-[8px] text-indigo-400 uppercase font-bold font-mono">Endereço de Convite:</span>
                <span className="truncate font-mono font-medium text-slate-300">
                  {`${window.location.origin}?join=${showQrModalFor.id}`}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const inviteLink = `${window.location.origin}?join=${showQrModalFor.id}`;
                  navigator.clipboard.writeText(inviteLink);
                  setCopiedId("modal-link");
                  setTimeout(() => setCopiedId(null), 2000);
                }}
                className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 border border-indigo-550/20 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2"
              >
                {copiedId === "modal-link" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Link Copiado com sucesso!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Link de Convite</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
