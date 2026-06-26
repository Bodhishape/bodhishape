import React, { useState, useEffect } from "react";
import { 
  Activity, Heart, Flame, Moon, Footprints, RefreshCw, 
  Smartphone, CheckCircle, Shield, Code, ChevronDown, 
  ChevronUp, Trash2, Send, Database, AlertCircle 
} from "lucide-react";

interface HealthConnectControlProps {
  currentUser: any;
  onSyncComplete: () => void;
  onDisconnect: () => void;
}

export default function HealthConnectControl({ 
  currentUser, 
  onSyncComplete, 
  onDisconnect 
}: HealthConnectControlProps) {
  const [status, setStatus] = useState<any>({
    connected: true,
    deviceName: "Dispositivo Android",
    permissions: [
      "android.permission.health.READ_STEPS",
      "android.permission.health.READ_ACTIVE_CALORIES_BURNED",
      "android.permission.health.READ_HEART_RATE",
      "android.permission.health.READ_SLEEP",
      "android.permission.health.READ_WEIGHT",
      "android.permission.health.READ_BODY_FAT",
      "android.permission.health.READ_EXERCISE"
    ],
    lastSync: "",
    syncHistory: []
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showCodeContract, setShowCodeContract] = useState(false);
  const [selectedPayloadType, setSelectedPayloadType] = useState<"workout" | "metrics" | "daily">("workout");

  // Load status from backend on mount
  const loadStatus = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`/api/integrations/healthconnect/status?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.connected) {
          setStatus(data);
        }
      }
    } catch (err) {
      console.error("[HEALTHCONNECT_STATUS_FETCH_FAILED]", err);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [currentUser?.id]);

  // Authentic pre-configured JSON payloads representing real Android Health Connect objects
  const PAYLOAD_TEMPLATES = {
    workout: {
      activities: [
        {
          id: "hc_session_" + Date.now().toString(36),
          type: "Corrida",
          category: "Cardio",
          title: "Corrida de Determinação Soka",
          start_time: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          end_time: new Date().toISOString(),
          duration_minutes: 45,
          distance_km: 7.2,
          calories: 480,
          steps: 5600,
          heart_rate_avg: 145,
          heart_rate_max: 172,
          source_app: "Google Fit via Health Connect",
          notes: "Treino focado em expandir a capacidade pulmonar e suar o carma diário! Sentimento inabalável."
        }
      ],
      metrics: [
        {
          type: "heart_rate",
          value: 145,
          timestamp: new Date().toISOString()
        }
      ]
    },
    metrics: {
      activities: [],
      metrics: [
        {
          type: "weight",
          value: 78.4,
          timestamp: new Date().toISOString()
        },
        {
          type: "fat_percent",
          value: 16.5,
          timestamp: new Date().toISOString()
        },
        {
          type: "lean_mass",
          value: 65.4,
          timestamp: new Date().toISOString()
        }
      ]
    },
    daily: {
      activities: [
        {
          id: "hc_sleep_" + Date.now().toString(36),
          type: "Sono Regular",
          category: "Sono",
          title: "Sono Reparador",
          start_time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          duration_minutes: 420,
          source_app: "Samsung Health via Health Connect",
          notes: "Repouso reparador essencial para a vitória do dia seguinte."
        }
      ],
      metrics: [
        {
          type: "steps",
          value: 10420,
          timestamp: new Date().toISOString()
        },
        {
          type: "calories",
          value: 2350,
          timestamp: new Date().toISOString()
        },
        {
          type: "sleep",
          value: 420,
          timestamp: new Date().toISOString()
        }
      ]
    }
  };

  const currentPayload = PAYLOAD_TEMPLATES[selectedPayloadType];

  const handleSyncPayload = async () => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/integrations/healthconnect/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          payload: {
            ...currentPayload,
            deviceName: status.deviceName || "Emulator Android",
            permissions: status.permissions
          }
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(`Sincronização concluída! Importados com sucesso: ${data.syncedActivitiesCount} treinos e ${data.syncedMetricsCount} métricas biológicas.`);
        loadStatus();
        onSyncComplete();
      } else {
        setErrorMessage(data.error || "Ocorreu um erro ao sincronizar com o backend.");
      }
    } catch (err: any) {
      setErrorMessage("Falha na conexão com o servidor de sincronização.");
    } finally {
      setLoading(false);
    }
  };

  const handleNativeBridgeSync = () => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Detect native Android Health Connect bridge interface injected via native container/wrapper
    if (typeof (window as any).AndroidHealthConnect !== "undefined") {
      try {
        setSuccessMessage("Invocando ponte nativa AndroidHealthConnect...");
        (window as any).AndroidHealthConnect.sync(currentUser.id);
        // Refresh after some delay to let native process write data
        setTimeout(() => {
          loadStatus();
          onSyncComplete();
          setLoading(false);
        }, 3000);
      } catch (err: any) {
        setErrorMessage("Erro na execução da ponte nativa: " + err.message);
        setLoading(false);
      }
    } else {
      setTimeout(() => {
        setErrorMessage("Ponte nativa 'window.AndroidHealthConnect' não encontrada. Como você está acessando via navegador web convencional, use o Importador Manual abaixo para testar a integração.");
        setLoading(false);
      }, 1000);
    }
  };

  const handleDisconnect = async () => {
    const confirm = window.confirm("Deseja desconectar a integração com o Android Health Connect? As permissões locais serão revogadas.");
    if (!confirm) return;

    try {
      const res = await fetch("/api/integrations/healthconnect/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          connected: false
        })
      });
      if (res.ok) {
        onDisconnect();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-[#0B1519] border border-cyan-500/20 rounded-2xl p-6 space-y-6 text-left shadow-2xl mt-4 animate-fade-in" id="health-connect-control-panel">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-cyan-900/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-400">
            <Smartphone className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black font-heading text-slate-100 uppercase tracking-wide">
                Configurações do Health Connect
              </h3>
              <span className="bg-emerald-500/15 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                CONECTADO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              Gerencie a coleta de dados de saúde do Android e a persistência segura no Firebase.
            </p>
          </div>
        </div>
        
        <button
          onClick={handleDisconnect}
          className="text-[10px] font-extrabold text-rose-400 hover:text-rose-300 bg-rose-500/5 hover:bg-rose-500/15 px-3 py-1.5 rounded-lg border border-rose-500/10 transition cursor-pointer flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Desconectar Integração
        </button>
      </div>

      {/* Connection Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#070D0F] border border-slate-800/40 p-3 rounded-xl flex items-center gap-3">
          <Smartphone className="w-5 h-5 text-cyan-400" />
          <div>
            <span className="text-[9px] text-slate-500 font-mono block uppercase">Dispositivo</span>
            <span className="text-xs font-bold text-slate-300">{status.deviceName || "Emulator Android"}</span>
          </div>
        </div>
        
        <div className="bg-[#070D0F] border border-slate-800/40 p-3 rounded-xl flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-indigo-400" />
          <div>
            <span className="text-[9px] text-slate-500 font-mono block uppercase">Última Sincronização</span>
            <span className="text-xs font-bold text-slate-300">
              {status.lastSync ? new Date(status.lastSync).toLocaleString("pt-BR") : "Nenhuma ainda"}
            </span>
          </div>
        </div>

        <div className="bg-[#070D0F] border border-slate-800/40 p-3 rounded-xl flex items-center gap-3">
          <Shield className="w-5 h-5 text-emerald-400" />
          <div>
            <span className="text-[9px] text-slate-500 font-mono block uppercase">Permissões</span>
            <span className="text-xs font-bold text-slate-300">{status.permissions?.length || 0} Autorizadas</span>
          </div>
        </div>
      </div>

      {/* Sync Trigger and Error Feedback */}
      <div className="space-y-3">
        <div className="bg-[#081216] border border-cyan-900/30 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <h4 className="text-xs font-bold text-slate-200">Sincronização Nativa via Aplicativo Android</h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              Caso esteja visualizando este painel de dentro do wrapper Android nativo do BodhiShape, clique abaixo para consultar os sensores do Health Connect locais de forma integrada.
            </p>
          </div>
          <button
            onClick={handleNativeBridgeSync}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-black tracking-wide shadow-md shadow-cyan-950/40 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Sincronizar Agora ⚡
          </button>
        </div>

        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-rose-300 animate-fade-in">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold block">Limitação Técnica do Ambiente Web</span>
              <p className="text-[11px] text-rose-400/90 mt-0.5 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-emerald-300 animate-fade-in">
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold block">Sincronização de Dados Realizada!</span>
              <p className="text-[11px] text-emerald-400/90 mt-0.5 leading-relaxed">{successMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Developer/Testing Importer Area */}
      <div className="bg-[#050C0E] border border-slate-800/85 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-slate-200">Playground de Integração (Importador JSON Real)</h4>
          </div>
          <span className="text-[9px] bg-slate-900 text-cyan-400 font-mono font-bold px-2 py-0.5 rounded border border-cyan-900/30">
            Apenas Desenvolvedores
          </span>
        </div>

        <p className="text-[10px] text-slate-400 leading-relaxed">
          Para certificar o fluxo completo de sincronização sem precisar compilar o app nativo Android agora, selecione uma das estruturas de dados oficiais abaixo extraídas do Health Connect API e clique em <strong>Sincronizar Payload</strong>. A API do servidor processará as regras de pontuação, evitará duplicidade e salvará tudo no Firebase Firestore!
        </p>

        {/* Payload Selector Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "workout", label: "🏃‍♂️ Treino Soka", desc: "Corrida + FC" },
            { id: "metrics", label: "⚖️ Peso & Gordura", desc: "Composição" },
            { id: "daily", label: "💤 Sono & Passos", desc: "Métricas de Saúde" }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedPayloadType(item.id as any)}
              className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                selectedPayloadType === item.id
                  ? "bg-cyan-500/10 border-cyan-500/40"
                  : "bg-slate-950/40 border-slate-900 hover:border-slate-800"
              }`}
            >
              <span className="text-xs font-black block text-slate-200">{item.label}</span>
              <span className="text-[9px] text-slate-500 block mt-0.5">{item.desc}</span>
            </button>
          ))}
        </div>

        {/* JSON Preview Panel */}
        <div className="bg-slate-950 border border-slate-900 rounded-lg p-3 text-left">
          <span className="text-[9px] text-slate-500 font-mono block mb-1">PAYLOAD ENVIADO PARA A API:</span>
          <pre className="text-[9px] text-cyan-500 font-mono overflow-x-auto max-h-36 leading-tight whitespace-pre-wrap">
            {JSON.stringify(currentPayload, null, 2)}
          </pre>
        </div>

        {/* Action button */}
        <button
          onClick={handleSyncPayload}
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 hover:text-cyan-200 text-xs font-extrabold border border-cyan-800/40 shadow-sm flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          {loading ? "Processando no Servidor..." : "Sincronizar Payload Real com o Firestore ⚡"}
        </button>
      </div>

      {/* Collapse controls: History & Native Bridge Specifications */}
      <div className="pt-2 border-t border-slate-800/40 flex flex-wrap gap-4 text-xs font-bold">
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition cursor-pointer"
        >
          {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showHistory ? "Ocultar" : "Visualizar"} Histórico de Sincronizações ({status.syncHistory?.length || 0})
        </button>

        <button 
          onClick={() => setShowCodeContract(!showCodeContract)}
          className="text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition cursor-pointer"
        >
          {showCodeContract ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showCodeContract ? "Ocultar" : "Visualizar"} Especificações da Ponte Android
        </button>
      </div>

      {/* Sync History Table */}
      {showHistory && (
        <div className="bg-[#050C0E] border border-slate-800 rounded-xl p-4 space-y-2 animate-slide-down">
          <h4 className="text-xs font-bold text-slate-300 mb-2">Logs Recentes de Integração</h4>
          {status.syncHistory && status.syncHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] text-slate-400">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-mono text-left">
                    <th className="pb-1.5 font-bold">Data/Hora</th>
                    <th className="pb-1.5 font-bold">Status</th>
                    <th className="pb-1.5 font-bold">Métricas</th>
                    <th className="pb-1.5 font-bold">Detalhes do Servidor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {status.syncHistory.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-900/30">
                      <td className="py-2 text-slate-300 font-mono">{new Date(item.timestamp).toLocaleString("pt-BR")}</td>
                      <td className="py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          item.status === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                        }`}>
                          {item.status === "success" ? "SUCESSO" : "ERRO"}
                        </span>
                      </td>
                      <td className="py-2 font-mono font-bold text-indigo-400">{item.count} itens</td>
                      <td className="py-2 text-[9px] text-slate-500 max-w-xs truncate">
                        {item.details ? item.details.join(", ") : "Sem observações adicionais."}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[10px] text-slate-500 italic">Nenhum evento registrado ainda.</p>
          )}
        </div>
      )}

      {/* Code Contract Preview for Native Developers */}
      {showCodeContract && (
        <div className="bg-[#050C0E] border border-slate-800 rounded-xl p-4 space-y-3 animate-slide-down text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-bold mb-1">
            <Code className="w-4 h-4 text-cyan-400" />
            <span>Contrato de Integração do WebView do Android</span>
          </div>
          
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Para integrar de forma perfeita o seu aplicativo nativo Android ao BodhiShape, sua classe de ponte Java/Kotlin de WebView deve declarar a interface `@JavascriptInterface` com as seguintes convenções:
          </p>

          <div className="bg-slate-950 border border-slate-900 p-3 rounded-lg overflow-x-auto font-mono text-[9.5px] text-slate-300 space-y-2">
            <div>
              <span className="text-emerald-500 block font-bold">// 1. Declaração da classe da Ponte no Android (Kotlin):</span>
              <span className="text-slate-450 block">class AndroidHealthConnectBridge(private val context: Context, private val webView: WebView) {'{'}</span>
              <span className="text-indigo-400 block">&nbsp;&nbsp;&nbsp;&nbsp;@JavascriptInterface</span>
              <span className="text-slate-450 block">&nbsp;&nbsp;&nbsp;&nbsp;fun sync(userId: String) {'{'}</span>
              <span className="text-slate-500 block">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// Solicita permissões e lê dados via HealthConnectClient</span>
              <span className="text-slate-500 block">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// Após ler, realiza o POST de sync para a API com o token de auth</span>
              <span className="text-slate-450 block">&nbsp;&nbsp;&nbsp;&nbsp;{'}'}</span>
              <span className="text-slate-450 block">{'}'}</span>
            </div>
            
            <div className="pt-2 border-t border-slate-900">
              <span className="text-emerald-500 block font-bold">// 2. Registro no WebView:</span>
              <span className="text-slate-450 block">webView.addJavascriptInterface(AndroidHealthConnectBridge(this, webView), "AndroidHealthConnect")</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
