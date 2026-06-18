import React, { useState } from "react";
import { 
  X, Check, Flame, Award, Dumbbell, Compass, RefreshCw, Sparkles, 
  BookOpen, Clock, Zap, MapPin, ChevronLeft, ChevronRight, UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface OnboardingProps {
  onClose: () => void;
}

export default function Onboarding({ onClose }: OnboardingProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Seja bem-vindo ao @BodhiShape!",
      subtitle: "💪 Corpo Forte. Mente Firme. Missão Maior.",
      description: "Uma plataforma social integrada para praticantes do Budismo de Nichiren Daishonin (BSGI) que aliam a saúde física e consistência espiritual para transformar o Karma em vitórias permanentes!",
      icon: <Sparkles className="w-14 h-14 text-amber-400" />,
      color: "from-amber-500/10 to-transparent",
      feature: "Gongyo, Daimoku e Atividades Físicas no mesmo altar da evolução!"
    },
    {
      title: "🌱 A Nossa História Real",
      subtitle: "Dos 'Bodhis do Shape' ao BodhiShape",
      description: "Inspirado no calor e dinamismo dos grupos de 'GymRats', praticantes entusiastas uniram-se decididos a associar o Daimoku e o Gongyo aos exercícios diários para obter fôlego de leão e saúde abundante! Nascia a egrégora informal dos 'Bodhis do Shape'. No início, todas as metas eram controladas por uma planilha eletrônica manual e suor. Daquela determinação sincera e inspiradora de polir o próprio espírito soka, nasceu o BodhiShape!",
      icon: <Compass className="w-14 h-14 text-orange-400" />,
      color: "from-orange-500/10 to-transparent",
      feature: "Nascido da determinação real de praticantes apaixonados por superação diária."
    },
    {
      title: "1️⃣ Prática Budista Harmoniosa",
      subtitle: "Gongyo e Daimoku Sistematizados",
      description: "Logue sua oração matinal e noturna em segundos. O Daimoku acumula tempo real e gera pontuações soka integradas para dinamizar a sua contância diária.",
      icon: <Clock className="w-14 h-14 text-indigo-400" />,
      color: "from-indigo-500/10 to-transparent",
      feature: "Estatísticas ricas, gráficos de bolhas dinâmicos e registro retrospectivo."
    },
    {
      title: "2️⃣ Saúde Física e Conectividade",
      subtitle: "Biblioteca de Treinos e Wearables",
      description: "Registros flexíveis de musculação, corrida, ciclismo, artes marciais e ioga. A estrutura já possui campos de integração nativa para dispositivos inteligentes como Apple Watch, Garmin e Fitbit.",
      icon: <Dumbbell className="w-14 h-14 text-emerald-400" />,
      color: "from-emerald-500/10 to-transparent",
      feature: "Campos para Calorias, Passos, Distância, Ritmo Cardíaco e Selo de Treino Verificado!"
    },
    {
      title: "3️⃣ Desafios de Elite (Gymrats Budista)",
      subtitle: "Regras customizáveis criadas por você",
      description: "Crie campanhas para o seu Bloco, Distrito ou RM de forma 100% livre! Cada desafio possui chat particular integrado, mural de publicações, regras de pontuação próprias e gráficos de engajamento do time.",
      icon: <Award className="w-14 h-14 text-pink-400" />,
      color: "from-pink-500/10 to-transparent",
      feature: "Privacidade flexível por convite ou código restrito para as equipes regionais."
    },
    {
      title: "4️⃣ IA Bodhisattva",
      subtitle: "O seu incentivo assistido por inteligência artificial",
      description: "O BodhiShape possui suporte à Inteligência Artificial do Google Gemini. Cada atividade postada no feed social gera comentários customizados, animados e carinhosos para que você nunca perca o foco!",
      icon: <Zap className="w-14 h-14 text-yellow-400" />,
      color: "from-yellow-400/10 to-transparent",
      feature: "Seu suor e orações com comentários alegres e motivadores da IA Soka."
    },
    {
      title: "Pronto para o Lançamento Coletivo?",
      subtitle: "Transformação do Karma em Estado de Budicidade",
      description: "Seu período de avaliação coletiva está ativo. Configure seus bons hábitos, estabeleça suas metas de curto prazo e compartilhe suas conquistas diárias com os companheiros sinceros!",
      icon: <UserCheck className="w-14 h-14 text-cyan-400" />,
      color: "from-cyan-500/10 to-transparent",
      feature: "Aperte o botão abaixo para ingressar na revolução humana do shape!"
    }
  ];

  const current = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md" id="onboarding-modal-backdrop">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl relative" id="onboarding-modal-container">
        
        {/* Progress Bar */}
        <div className="absolute top-0 inset-x-0 flex h-1 bg-slate-800">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-full flex-1 transition-all duration-300 ${
                i <= step ? "bg-indigo-500" : "bg-transparent"
              }`}
            />
          ))}
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 bg-slate-955/60 border border-slate-800/60 text-slate-400 hover:text-slate-205 rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Slide Content */}
        <div className={`p-8 bg-gradient-to-b ${current.color} space-y-6 pt-10 text-center`}>
          
          {/* Animated Icon Container */}
          <div className="mx-auto w-24 h-24 rounded-3xl bg-slate-950/60 border border-slate-800 flex items-center justify-center shadow-lg">
            {current.icon}
          </div>

          <div className="space-y-2">
            <span className="text-[10px] tracking-widest font-extrabold text-indigo-400 uppercase font-mono">
              BODHISHAPE ONBOARDING GUIDE
            </span>
            <h2 className="text-xl font-black font-heading text-slate-100 leading-tight">
              {current.title}
            </h2>
            <p className="text-amber-400 text-xs font-bold font-heading">
              {current.subtitle}
            </p>
          </div>

          <p className="text-slate-350 text-xs leading-relaxed max-w-sm mx-auto font-sans">
            {current.description}
          </p>

          <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-850 text-slate-250 text-xs inline-flex items-center gap-2 max-w-md mx-auto text-left">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{current.feature}</span>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="bg-slate-950/65 border-t border-slate-800/50 p-4 px-6 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={step === 0}
            className={`pe-3 py-2 text-xs font-bold flex items-center gap-1.5 rounded-xl transition ${
              step === 0 ? "text-slate-600 cursor-not-allowed" : "text-slate-400 hover:text-slate-205"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>

          <span className="text-[10px] font-mono text-slate-500 font-extrabold">
            {step + 1} de {steps.length}
          </span>

          <button
            onClick={handleNext}
            className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            {step === steps.length - 1 ? "Entrar Pro Shape 🚀" : "Seguinte"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
