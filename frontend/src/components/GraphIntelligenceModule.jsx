import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Share2, ShieldAlert, AlertTriangle, CheckCircle, RefreshCw, 
  Search, Info, ArrowRight, Zap, Layers, Network, Activity
} from 'lucide-react';
import { API_BASE_URL } from '../lib/api';

export function GraphIntelligenceModule() {
  const [networkData, setNetworkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedRing, setSelectedRing] = useState(null);
  const [filterRingType, setFilterRingType] = useState('ALL');

  const fetchGraphData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/graph/network`);
      if (res.ok) {
        const data = await res.json();
        setNetworkData(data);
        if (data.nodes && data.nodes.length > 0) {
          const highestRisk = [...data.nodes].sort((a, b) => b.risk_score - a.risk_score)[0];
          setSelectedNode(highestRisk);
        }
      }
    } catch (e) {
      console.warn("Backend offline or fallback simulation", e);
      setNetworkData({
        node_count: 24,
        edge_count: 18,
        rings_detected_count: 2,
        nodes: [
          { id: "C90101", label: "C90101", type: "CUSTOMER", risk_score: 0.94, flagged: true, in_degree: 2, out_degree: 2, total_degree: 4 },
          { id: "C90102", label: "C90102", type: "CUSTOMER", risk_score: 0.89, flagged: true, in_degree: 2, out_degree: 2, total_degree: 4 },
          { id: "C90103", label: "C90103", type: "CUSTOMER", risk_score: 0.91, flagged: true, in_degree: 2, out_degree: 2, total_degree: 4 },
          { id: "C90104", label: "C90104", type: "CUSTOMER", risk_score: 0.95, flagged: true, in_degree: 2, out_degree: 2, total_degree: 4 },
          { id: "C80999", label: "C80999 (Aggregator)", type: "CUSTOMER", risk_score: 0.96, flagged: true, in_degree: 4, out_degree: 1, total_degree: 5 },
          { id: "M80001", label: "M80001 (Cashout)", type: "MERCHANT", risk_score: 0.78, flagged: true, in_degree: 1, out_degree: 0, total_degree: 1 },
          { id: "C100001", label: "C100001", type: "CUSTOMER", risk_score: 0.05, flagged: false, in_degree: 1, out_degree: 1, total_degree: 2 },
          { id: "M50001", label: "M50001", type: "MERCHANT", risk_score: 0.04, flagged: false, in_degree: 3, out_degree: 0, total_degree: 3 },
        ],
        edges: [
          { source: "C90101", target: "C90102", amount: 120000, type: "TRANSFER" },
          { source: "C90102", target: "C90103", amount: 118000, type: "TRANSFER" },
          { source: "C90103", target: "C90104", amount: 115000, type: "TRANSFER" },
          { source: "C90104", target: "C90101", amount: 112000, type: "TRANSFER" },
          { source: "C80999", target: "M80001", amount: 310000, type: "CASH_OUT" }
        ],
        fraud_rings: [
          {
            ring_id: "RING-CYC-001",
            type: "CIRCULAR_MULE_CYCLE",
            severity: "CRITICAL",
            nodes: ["C90101", "C90102", "C90103", "C90104"],
            node_count: 4,
            estimated_laundered_volume: 465000,
            description: "Closed-loop money circulation involving 4 interconnected mule accounts"
          },
          {
            ring_id: "RING-DEV-108",
            type: "SHARED_DEVICE_SYNDICATE",
            severity: "HIGH",
            nodes: ["C90101", "C90102", "C90103", "C90104"],
            node_count: 4,
            shared_entity: "DEV_MULE_RING_X",
            description: "Hardware fingerprint 'DEV_MULE_RING_X' shared across 4 identities"
          }
        ]
      });
      setSelectedNode({ id: "C90101", label: "C90101", type: "CUSTOMER", risk_score: 0.94, flagged: true, in_degree: 2, out_degree: 2, total_degree: 4 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphData();
  }, []);

  const fraudRings = networkData?.fraud_rings || [];
  const filteredRings = fraudRings.filter(r => filterRingType === 'ALL' || r.type === filterRingType);

  return (
    <div className="space-y-6">
      
      {/* Top Banner Overview */}
      <div className="surface-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-zinc-950 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            <span>Graph Intelligence &amp; Mule Ring Forensics</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Uncovers hidden circular syndicates, smurfing funnels, and shared hardware device clusters using NetworkX.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-black/[0.04] text-zinc-800 font-semibold font-mono flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5 text-zinc-500" />
            <span>{networkData?.node_count || 24} Nodes</span>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200/60 font-semibold font-mono flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{networkData?.rings_detected_count || 2} Mule Rings</span>
          </span>
          <button 
            onClick={fetchGraphData}
            className="p-2 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] text-zinc-700 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Visualizer Canvas + Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Graph Canvas Visualizer (8 cols) */}
        <div className="lg:col-span-8 surface-card p-6 flex flex-col">
          
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-black/[0.05]">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Network className="w-4 h-4 text-blue-600" />
                <span>Entity Relationship Topology</span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Interactive topological projection of account transactions, mule cycles, and device clusters.
              </p>
            </div>

            {selectedRing && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>Active Ring: {selectedRing.ring_id}</span>
                <button 
                  onClick={() => setSelectedRing(null)}
                  className="ml-1 text-zinc-400 hover:text-zinc-800 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* SVG Layout Graph Canvas */}
          <div className="relative w-full h-96 mt-4 rounded-xl bg-[#0A0E1A] border border-black/[0.1] overflow-hidden flex items-center justify-center shadow-inner">
            
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:28px_28px]" />
            
            <svg className="w-full h-full">
              <defs>
                <marker id="arrowhead-light" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                </marker>
                <marker id="arrowhead-red" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                </marker>
              </defs>

              <line x1="220" y1="120" x2="380" y2="120" stroke={selectedRing?.ring_id === 'RING-CYC-001' ? '#ef4444' : 'rgba(255,255,255,0.2)'} strokeWidth={selectedRing?.ring_id === 'RING-CYC-001' ? 3 : 1.5} strokeDasharray={selectedRing?.ring_id === 'RING-CYC-001' ? "4" : "0"} markerEnd="url(#arrowhead-red)" className="transition-all duration-300" />
              <line x1="380" y1="120" x2="380" y2="280" stroke={selectedRing?.ring_id === 'RING-CYC-001' ? '#ef4444' : 'rgba(255,255,255,0.2)'} strokeWidth={selectedRing?.ring_id === 'RING-CYC-001' ? 3 : 1.5} strokeDasharray={selectedRing?.ring_id === 'RING-CYC-001' ? "4" : "0"} markerEnd="url(#arrowhead-red)" className="transition-all duration-300" />
              <line x1="380" y1="280" x2="220" y2="280" stroke={selectedRing?.ring_id === 'RING-CYC-001' ? '#ef4444' : 'rgba(255,255,255,0.2)'} strokeWidth={selectedRing?.ring_id === 'RING-CYC-001' ? 3 : 1.5} strokeDasharray={selectedRing?.ring_id === 'RING-CYC-001' ? "4" : "0"} markerEnd="url(#arrowhead-red)" className="transition-all duration-300" />
              <line x1="220" y1="280" x2="220" y2="120" stroke={selectedRing?.ring_id === 'RING-CYC-001' ? '#ef4444' : 'rgba(255,255,255,0.2)'} strokeWidth={selectedRing?.ring_id === 'RING-CYC-001' ? 3 : 1.5} strokeDasharray={selectedRing?.ring_id === 'RING-CYC-001' ? "4" : "0"} markerEnd="url(#arrowhead-red)" className="transition-all duration-300" />

              <line x1="520" y1="90" x2="560" y2="200" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" markerEnd="url(#arrowhead-light)" />
              <line x1="640" y1="120" x2="560" y2="200" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" markerEnd="url(#arrowhead-light)" />
              <line x1="560" y1="200" x2="680" y2="280" stroke="#f43f5e" strokeWidth="2.5" markerEnd="url(#arrowhead-red)" />

              <line x1="80" y1="100" x2="100" y2="220" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" markerEnd="url(#arrowhead-light)" />
              <line x1="100" y1="220" x2="80" y2="320" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" markerEnd="url(#arrowhead-light)" />
            </svg>

            {/* Nodes */}
            <div 
              onClick={() => setSelectedNode({ id: "C90101", label: "C90101", type: "MULE_MEMBER", risk_score: 0.94, in_degree: 2, out_degree: 2, flagged: true, details: "Mule Ring Member #1 (Cycle Origin)" })}
              className={`absolute top-[100px] left-[200px] -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                selectedNode?.id === 'C90101' ? 'scale-125 z-30' : 'hover:scale-110'
              }`}
            >
              <div className="relative flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-300 text-xs font-bold shadow-xs">
                  C1
                </div>
                <span className="mt-1 text-[9px] font-mono text-rose-300 font-semibold bg-black/60 px-1 rounded-sm">C90101 (94%)</span>
              </div>
            </div>

            <div 
              onClick={() => setSelectedNode({ id: "C90102", label: "C90102", type: "MULE_MEMBER", risk_score: 0.89, in_degree: 2, out_degree: 2, flagged: true, details: "Mule Ring Member #2" })}
              className={`absolute top-[100px] left-[360px] -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                selectedNode?.id === 'C90102' ? 'scale-125 z-30' : 'hover:scale-110'
              }`}
            >
              <div className="relative flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-300 text-xs font-bold shadow-xs">
                  C2
                </div>
                <span className="mt-1 text-[9px] font-mono text-rose-300 font-semibold bg-black/60 px-1 rounded-sm">C90102 (89%)</span>
              </div>
            </div>

            <div 
              onClick={() => setSelectedNode({ id: "C90103", label: "C90103", type: "MULE_MEMBER", risk_score: 0.91, in_degree: 2, out_degree: 2, flagged: true, details: "Mule Ring Member #3" })}
              className={`absolute top-[260px] left-[360px] -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                selectedNode?.id === 'C90103' ? 'scale-125 z-30' : 'hover:scale-110'
              }`}
            >
              <div className="relative flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-300 text-xs font-bold shadow-xs">
                  C3
                </div>
                <span className="mt-1 text-[9px] font-mono text-rose-300 font-semibold bg-black/60 px-1 rounded-sm">C90103 (91%)</span>
              </div>
            </div>

            <div 
              onClick={() => setSelectedNode({ id: "C90104", label: "C90104", type: "MULE_MEMBER", risk_score: 0.95, in_degree: 2, out_degree: 2, flagged: true, details: "Mule Ring Member #4" })}
              className={`absolute top-[260px] left-[200px] -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                selectedNode?.id === 'C90104' ? 'scale-125 z-30' : 'hover:scale-110'
              }`}
            >
              <div className="relative flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-300 text-xs font-bold shadow-xs">
                  C4
                </div>
                <span className="mt-1 text-[9px] font-mono text-rose-300 font-semibold bg-black/60 px-1 rounded-sm">C90104 (95%)</span>
              </div>
            </div>

            <div 
              onClick={() => setSelectedNode({ id: "C80999", label: "C80999", type: "AGGREGATOR", risk_score: 0.96, in_degree: 4, out_degree: 1, flagged: true, details: "High-Volume Mule Aggregator (Inflow Funnel)" })}
              className={`absolute top-[180px] left-[540px] -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                selectedNode?.id === 'C80999' ? 'scale-125 z-30' : 'hover:scale-110'
              }`}
            >
              <div className="relative flex flex-col items-center">
                <div className="w-11 h-11 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-amber-300 text-xs font-bold shadow-xs">
                  AGG
                </div>
                <span className="mt-1 text-[9px] font-mono text-amber-300 font-semibold bg-black/60 px-1 rounded-sm">C80999 (96%)</span>
              </div>
            </div>

            <div 
              onClick={() => setSelectedNode({ id: "M80001", label: "M80001", type: "MERCHANT_CASHOUT", risk_score: 0.78, in_degree: 1, out_degree: 0, flagged: true, details: "High-Volume Cashout Merchant" })}
              className={`absolute top-[260px] left-[660px] -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                selectedNode?.id === 'M80001' ? 'scale-125 z-30' : 'hover:scale-110'
              }`}
            >
              <div className="relative flex flex-col items-center">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center text-purple-300 text-xs font-bold shadow-xs">
                  M8
                </div>
                <span className="mt-1 text-[9px] font-mono text-purple-300 font-semibold bg-black/60 px-1 rounded-sm">M80001</span>
              </div>
            </div>

            <div 
              onClick={() => setSelectedNode({ id: "C100001", label: "C100001", type: "CUSTOMER_NORMAL", risk_score: 0.05, in_degree: 1, out_degree: 1, flagged: false, details: "Legitimate Retail Customer" })}
              className="absolute top-[180px] left-[80px] -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-all duration-300"
            >
              <div className="relative flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-300 text-[10px] font-bold">
                  OK
                </div>
                <span className="mt-1 text-[8px] font-mono text-emerald-300 bg-black/60 px-1 rounded-sm">C100001</span>
              </div>
            </div>

            {/* Bottom Floating Legend */}
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-zinc-400 bg-black/60 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Mule Ring Member</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Funnel Aggregator</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Normal Node</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">CLICK ANY NODE TO INSPECT</span>
            </div>

          </div>

        </div>

        {/* Node & Ring Inspector (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Selected Node Details Card */}
          <div className="surface-card p-5">
            <h4 className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Entity Inspector</span>
              {selectedNode?.flagged ? (
                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60 text-[10px] font-bold">FLAGGED MULE</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-bold">CLEAN</span>
              )}
            </h4>

            {selectedNode ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-zinc-900 font-mono">{selectedNode.id}</span>
                  <div className="text-right">
                    <div className="text-[10px] text-zinc-400 font-mono">Graph Centrality</div>
                    <div className={`text-base font-bold font-mono ${selectedNode.risk_score > 0.7 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {(selectedNode.risk_score * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-black/[0.02] p-3 rounded-xl border border-black/[0.05]">
                  <div>
                    <span className="text-zinc-400 text-[10px] block">Inflow Edges:</span>
                    <div className="font-bold text-zinc-800">{selectedNode.in_degree || 2} edges</div>
                  </div>
                  <div>
                    <span className="text-zinc-400 text-[10px] block">Outflow Edges:</span>
                    <div className="font-bold text-zinc-800">{selectedNode.out_degree || 2} edges</div>
                  </div>
                </div>

                <div className="text-xs text-zinc-600 leading-relaxed bg-black/[0.02] border border-black/[0.05] p-3 rounded-xl">
                  <div className="font-semibold text-zinc-900 mb-1 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    <span>Syndicate Telemetry Notes</span>
                  </div>
                  {selectedNode.details || "Part of an identified 4-node closed-loop cycle. Shared hardware fingerprint detected with other flagged nodes."}
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-400 font-mono text-center py-6">
                Click any node in the visualizer to view risk metrics.
              </div>
            )}
          </div>

          {/* Detected Fraud Rings List */}
          <div className="surface-card p-5">
            <h4 className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Identified Rings ({filteredRings.length})</span>
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            </h4>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {filteredRings.map((ring) => (
                <div 
                  key={ring.ring_id}
                  onClick={() => setSelectedRing(selectedRing?.ring_id === ring.ring_id ? null : ring)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedRing?.ring_id === ring.ring_id 
                      ? 'bg-rose-50/80 border-rose-300 shadow-xs' 
                      : 'bg-black/[0.02] hover:bg-black/[0.04] border-black/[0.05]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-rose-700">{ring.ring_id}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-600 text-white font-mono">{ring.severity}</span>
                  </div>
                  <div className="text-xs text-zinc-700 font-medium mb-1">{ring.description}</div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                    <span>{ring.node_count} Nodes</span>
                    {ring.estimated_laundered_volume && (
                      <span className="text-rose-600 font-semibold">${ring.estimated_laundered_volume.toLocaleString()} Vol</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
