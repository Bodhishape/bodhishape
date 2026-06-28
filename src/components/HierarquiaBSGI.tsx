import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Users, BookOpen, Heart, Award, ShieldCheck, Dumbbell } from "lucide-react";

interface TreeNode { name: string; memberCount: number; totalDaimoku: number; totalExercise: number; bsCount: number; kofuCount: number; avgStreak: number; }
interface RegionNode extends TreeNode { districts: DistrictNode[] }
interface DistrictNode extends TreeNode { subDistricts: SubDistrictNode[] }
interface SubDistrictNode extends TreeNode { blocks: BlockNode[] }
interface BlockNode { name: string; memberCount: number; members: MemberInfo[] }
interface MemberInfo { id: string; name: string; avatar: string; division: string; city: string; streak: number; totalDaimoku: number; totalExercise: number; kofu: string; bs: string; lastActive: string; }

function AccordionNode({ label, count, defaultOpen, children }: { label: string; count: number; defaultOpen?: boolean; children: React.ReactNode; key?: React.Key }) {
  const [open, setOpen] = useState(defaultOpen || false);
  return (
    <div className="border border-slate-800/60 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-2.5 bg-slate-900/40 hover:bg-slate-800/40 transition text-left cursor-pointer">
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="w-3.5 h-3.5 text-indigo-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
          <span className="text-xs font-bold text-slate-200 font-heading">{label}</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono bg-slate-950/60 px-2 py-0.5 rounded-full border border-slate-800">{count} membros</span>
      </button>
      {open && <div className="p-2 space-y-1.5 border-t border-slate-800/40 bg-slate-950/30">{children}</div>}
    </div>
  );
}

function MemberCard({ m }: { m: MemberInfo; key?: React.Key }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-800/40 hover:bg-slate-800/30 transition">
      <div className="flex items-center gap-2.5 min-w-0">
        <img referrerPolicy="no-referrer" src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full shrink-0 bg-slate-950 border border-slate-800" />
        <div className="min-w-0 text-left">
          <p className="text-[11px] font-bold text-slate-200 truncate font-heading">{m.name}</p>
          <p className="text-[9px] text-slate-500">{m.division} • {m.city}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[9px] font-mono text-orange-400 bg-orange-950/30 px-1.5 py-0.5 rounded border border-orange-900/30">{m.streak}d</span>
        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${m.bs === "ativo" ? "text-emerald-400 bg-emerald-950/30 border-emerald-900/30" : "text-slate-600 bg-slate-950/60 border-slate-800"}`}>BS</span>
        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${m.kofu === "realizado" ? "text-emerald-400 bg-emerald-950/30 border-emerald-900/30" : "text-slate-600 bg-slate-950/60 border-slate-800"}`}>K</span>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-3 text-center">
      <p className="text-lg font-black font-mono" style={{ color }}>{value}</p>
      <p className="text-[9px] uppercase font-bold text-slate-400 mt-0.5 flex items-center justify-center gap-1">
        <Icon className="w-3 h-3" /> {label}
      </p>
    </div>
  );
}

export default function HierarquiaBSGI() {
  const [tree, setTree] = useState<RegionNode[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/hierarchy/tree")
      .then(r => r.json())
      .then(d => {
        setTree(d.tree || []);
        setSummary(d.summary || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-center text-sm text-slate-400">Carregando hierarquia...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-black font-heading text-slate-100 uppercase">Hierarquia BSGI</h3>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed text-left">Estrutura organizacional da BSGI por região, distrito, subdistrito, bloco e grupo horizontal.</p>
        {summary && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-4">
            <StatCard icon={Users} label="Membros" value={summary.totalMembers} color="#818cf8" />
            <StatCard icon={BookOpen} label="Daimoku (min)" value={summary.totalDaimoku} color="#f472b6" />
            <StatCard icon={Dumbbell} label="Exercícios" value={summary.totalExercise} color="#34d399" />
            <StatCard icon={Heart} label="BS Ativos" value={summary.totalBs} color="#fbbf24" />
            <StatCard icon={Award} label="Kofu" value={summary.totalKofu} color="#a78bfa" />
          </div>
        )}
        <input 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Buscar membro por nome..." 
          className="mt-4 w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 outline-none focus:border-indigo-500/40 text-left" 
        />
      </div>

      {tree.length === 0 && <div className="p-6 text-center text-sm text-slate-500">Nenhum dado hierárquico disponível.</div>}

      <div className="space-y-2 text-left">
        {tree
          .filter((r: RegionNode) => 
            !search || 
            r.districts.some((d) => 
              d.subDistricts.some((s) => 
                s.blocks.some((b) => 
                  b.members.some((m) => 
                    m.name.toLowerCase().includes(search.toLowerCase())
                  )
                )
              )
            )
          )
          .map((region: RegionNode) => (
            <AccordionNode key={region.name} label={`📍 ${region.name}`} count={region.memberCount} defaultOpen={!!search}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
                <div className="bg-slate-950/40 rounded-lg p-1.5 text-center"><span className="text-[10px] font-mono font-black text-pink-400">{region.totalDaimoku}</span><p className="text-[8px] text-slate-500 uppercase font-bold">Daimoku</p></div>
                <div className="bg-slate-950/40 rounded-lg p-1.5 text-center"><span className="text-[10px] font-mono font-black text-green-400">{region.totalExercise}</span><p className="text-[8px] text-slate-500 uppercase font-bold">Exercícios</p></div>
                <div className="bg-slate-950/40 rounded-lg p-1.5 text-center"><span className="text-[10px] font-mono font-black text-yellow-400">{region.bsCount}</span><p className="text-[8px] text-slate-500 uppercase font-bold">BS</p></div>
                <div className="bg-slate-950/40 rounded-lg p-1.5 text-center"><span className="text-[10px] font-mono font-black text-purple-400">{region.kofuCount}</span><p className="text-[8px] text-slate-500 uppercase font-bold">Kofu</p></div>
              </div>
              {region.districts
                .filter((d) => 
                  !search || 
                  d.subDistricts.some((s) => 
                    s.blocks.some((b) => 
                      b.members.some((m) => 
                        m.name.toLowerCase().includes(search.toLowerCase())
                      )
                    )
                  )
                )
                .map((dist: DistrictNode) => (
                  <AccordionNode key={dist.name} label={`🏛️ ${dist.name}`} count={dist.memberCount}>
                    {dist.subDistricts
                      .filter((s) => 
                        !search || 
                        s.blocks.some((b) => 
                          b.members.some((m) => 
                            m.name.toLowerCase().includes(search.toLowerCase())
                          )
                        )
                      )
                      .map((sub: SubDistrictNode) => (
                        <AccordionNode key={sub.name} label={`📂 ${sub.name}`} count={sub.memberCount}>
                          {sub.blocks.map((block: BlockNode) => (
                            <AccordionNode key={block.name} label={`📦 ${block.name}`} count={block.memberCount}>
                              {block.members
                                .filter((m) => !search || m.name.toLowerCase().includes(search.toLowerCase()))
                                .map((m: MemberInfo) => <MemberCard key={m.id} m={m} />)
                              }
                            </AccordionNode>
                          ))}
                        </AccordionNode>
                      ))
                    }
                  </AccordionNode>
                ))
              }
            </AccordionNode>
          ))
        }
      </div>
    </div>
  );
}
