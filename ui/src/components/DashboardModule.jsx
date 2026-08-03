import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Download, Share2, MessageSquare, Sparkles, ChevronDown, Calendar, 
  Globe, MoreVertical, ArrowUpRight, TrendingUp, ShieldCheck, Activity, Cpu, Zap 
} from 'lucide-react';

export const DashboardModule = () => {
  const [activeAssetTab, setActiveAssetTab] = useState('All Assets');

  return (
    <div className="space-y-6">
      
      {/* Top Section: Donut Chart, Area Chart, Global Attack Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 1. Left Card: "Invoice Cycle / Threat Allocation" (Segmented Donut) */}
        <div className="lg:col-span-4 glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Invoice Cycle</h3>
                <p className="text-xs text-slate-400">Expenses / Cycle / Spent / Backlog</p>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-xs text-slate-700 dark:text-slate-200 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#7C3AED]" /> Year to Date <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </div>

            {/* Stylized Segmented 3D Ring Chart */}
            <div className="relative w-56 h-56 mx-auto flex items-center justify-center my-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                {/* Background Ring Track */}
                <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(226, 232, 240, 0.5)" strokeWidth="18" />
                {/* Segment 1: Royal Violet */}
                <circle cx="60" cy="60" r="46" fill="none" stroke="#7C3AED" strokeWidth="18" strokeDasharray="289" strokeDashoffset="50" strokeLinecap="round" />
                {/* Segment 2: Lime Green */}
                <circle cx="60" cy="60" r="46" fill="none" stroke="#84CC16" strokeWidth="18" strokeDasharray="289" strokeDashoffset="180" strokeLinecap="round" />
                {/* Segment 3: Cyan */}
                <circle cx="60" cy="60" r="46" fill="none" stroke="#06B6D4" strokeWidth="18" strokeDasharray="289" strokeDashoffset="240" strokeLinecap="round" />
              </svg>

              {/* Center Icon & Metric */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-white mb-1 shadow-md">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">$890M</span>
                <span className="text-[10px] text-slate-400 font-medium">out of $60M Target</span>
              </div>
            </div>

            {/* Legend Labels */}
            <div className="space-y-3 text-xs font-medium">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Rent & Mortgage</div>
                    <div className="text-[10px] text-slate-400">Expenses and leftover</div>
                  </div>
                </div>
                <span className="font-mono text-slate-400">$420M</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#84CC16]" />
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Travel & Office</div>
                    <div className="text-[10px] text-slate-400">Expenses and leftover</div>
                  </div>
                </div>
                <span className="font-mono text-slate-400">$310M</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Middle & Right: "Dashboard / Area Chart & Country Matrix" */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="glass-card p-6">
            {/* Top Toolbar Ribbon */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200/80 dark:border-white/5">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Dashboard</h3>
                <p className="text-xs text-slate-400">Accounts / Profile / Transaction's / Customers etc</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer">
                  <FileText className="w-3.5 h-3.5 text-[#7C3AED]" /> File
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer">
                  <Download className="w-3.5 h-3.5 text-[#06B6D4]" /> Export
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer">
                  <Share2 className="w-3.5 h-3.5 text-indigo-500" /> Share
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-500" /> Chat
                </button>
                <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full pearl-btn-gradient text-white font-bold cursor-pointer">
                  <Sparkles className="w-3.5 h-3.5" /> Get insights
                </button>
              </div>
            </div>

            {/* Area Chart & Country Distribution Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Area Chart Area */}
              <div className="lg:col-span-8 relative">
                <div className="h-56 w-full">
                  <svg className="w-full h-full" viewBox="0 0 500 200">
                    <defs>
                      <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Y-axis gridlines */}
                    <line x1="30" y1="30" x2="490" y2="30" stroke="rgba(226, 232, 240, 0.6)" strokeDasharray="3 3" />
                    <line x1="30" y1="90" x2="490" y2="90" stroke="rgba(226, 232, 240, 0.6)" strokeDasharray="3 3" />
                    <line x1="30" y1="150" x2="490" y2="150" stroke="rgba(226, 232, 240, 0.6)" strokeDasharray="3 3" />

                    {/* Area fill */}
                    <polygon
                      points="30,150 70,120 120,70 170,40 220,90 270,120 320,60 370,100 420,50 470,120 470,180 30,180"
                      fill="url(#greenGradient)"
                    />

                    {/* Main Green Line */}
                    <path
                      d="M 30 150 L 70 120 L 120 70 L 170 40 L 220 90 L 270 120 L 320 60 L 370 100 L 420 50 L 470 120"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Interactive Tooltip Pin 1 */}
                    <circle cx="170" cy="40" r="4" fill="#10B981" />
                    <line x1="170" y1="40" x2="170" y2="20" stroke="#10B981" strokeWidth="1" strokeDasharray="2 2" />

                    {/* Interactive Tooltip Pin 2 */}
                    <circle cx="420" cy="50" r="4" fill="#F97316" />
                    <line x1="420" y1="50" x2="420" y2="30" stroke="#F97316" strokeWidth="1" strokeDasharray="2 2" />
                  </svg>

                  {/* Tooltip Overlay Badges */}
                  <div className="absolute top-2 left-[30%] px-2.5 py-1 rounded-full bg-white dark:bg-[#101726] shadow-md border border-slate-200 dark:border-white/10 text-[10px] font-mono flex items-center gap-1.5">
                    <span className="text-slate-400">28 July 02:02</span>
                    <span className="font-bold text-slate-900 dark:text-white">220,342.76</span>
                    <span className="text-emerald-500 font-bold">+8.4%</span>
                  </div>

                  <div className="absolute top-4 right-[15%] px-2.5 py-1 rounded-full bg-white dark:bg-[#101726] shadow-md border border-slate-200 dark:border-white/10 text-[10px] font-mono flex items-center gap-1.5">
                    <span className="text-slate-400">31 Aug 12:00</span>
                    <span className="font-bold text-slate-900 dark:text-white">876,42.76</span>
                    <span className="text-amber-500 font-bold">+2.4%</span>
                  </div>
                </div>
              </div>

              {/* Country Attack Origin Matrix */}
              <div className="lg:col-span-4 border-l border-slate-200/80 dark:border-white/5 pl-4 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <div className="flex items-center gap-2">
                    <span>Currency ∨</span>
                    <span>Timezone ∨</span>
                  </div>
                  <span>Country ∨</span>
                </div>

                {/* Country Progress Bars */}
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <div className="flex justify-between text-slate-700 dark:text-slate-300 font-bold mb-1">
                      <span>China</span>
                      <span>90%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#7C3AED] rounded-full" style={{ width: '90%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-700 dark:text-slate-300 font-bold mb-1">
                      <span>USA</span>
                      <span>8%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#06B6D4] rounded-full" style={{ width: '8%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-700 dark:text-slate-300 font-bold mb-1">
                      <span>Russia</span>
                      <span>1%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '1%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-700 dark:text-slate-300 font-bold mb-1">
                      <span>Brazil</span>
                      <span>1%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '1%' }} />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 3. Middle Stat Ribbon: 4 KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                <span>Total Net Volume</span>
                <MoreVertical className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">$756M</div>
              <div className="flex items-center justify-between text-[11px] mt-2">
                <span className="text-slate-400">out of $960M Target</span>
                <span className="text-emerald-500 font-bold font-mono">+9.0%</span>
              </div>
            </div>

            <div className="glass-card p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                <span>New Customers</span>
                <MoreVertical className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">20,000</div>
              <div className="flex items-center justify-between text-[11px] mt-2">
                <span className="text-slate-400">out of 340000 Target</span>
                <span className="text-emerald-500 font-bold font-mono">+9.0%</span>
              </div>
            </div>

            <div className="glass-card p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                <span>Paused Transaction's</span>
                <MoreVertical className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">$59M</div>
              <div className="flex items-center justify-between text-[11px] mt-2">
                <span className="text-slate-400">out of $90M Total</span>
                <span className="text-rose-500 font-bold font-mono">-2.7%</span>
              </div>
            </div>

            <div className="glass-card p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                <span>Succesfull Transaction's</span>
                <MoreVertical className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">$987M</div>
              <div className="flex items-center justify-between text-[11px] mt-2">
                <span className="text-slate-400">out of $960M Target</span>
                <span className="text-emerald-500 font-bold font-mono">+9.0%</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Section: Expenses Bar Chart, Sales Trend List, Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 4. Bottom Left: Expenses Bar Chart */}
        <div className="lg:col-span-4 glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Expenses</h3>
                <p className="text-xs text-slate-400">Yearly / Monthly / Weekly / Daily</p>
              </div>
            </div>

            {/* Highlight Badge */}
            <div className="w-full py-2 px-4 rounded-full bg-amber-500/10 text-amber-600 font-bold text-xs flex items-center justify-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4" /> 22.41%
            </div>

            <div className="mb-4">
              <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">$50M</div>
              <div className="text-xs text-slate-400">out of $60M Target</div>
            </div>

            <div className="flex items-center gap-2 mb-6 text-xs text-slate-500">
              <button className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10">
                <Calendar className="w-3 h-3 text-[#7C3AED]" /> May 03 - May 18 ∨
              </button>
              <button className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10">
                24 Hrs ∨
              </button>
            </div>

            {/* Vertical Bar Chart Graphic */}
            <div className="h-40 flex items-end justify-between gap-2 px-2">
              {[30, 45, 80, 60, 50, 95, 20, 15, 35, 25].map((height, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      idx === 2 || idx === 5 ? 'bg-[#7C3AED]' : 'bg-slate-200 dark:bg-white/10'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[9px] font-mono text-slate-400">
                    {['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'][idx]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Bottom Middle: Sales Trend List */}
        <div className="lg:col-span-4 glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Sales Trend</h3>
                <p className="text-xs text-slate-400">Quarterly / Yearly / All time sales</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Total Sales Assets</div>
              <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">$124,420.50</div>
              <div className="text-[11px] text-emerald-500 font-medium">You gained +$420.00 this week</div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 text-xs font-medium">
              {['All Assets', 'Crypto', 'Warehouse', 'Bank', 'Online Store'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveAssetTab(tab)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap cursor-pointer transition-all ${
                    activeAssetTab === tab
                      ? 'bg-[#7C3AED] text-white font-bold'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Asset Item Rows */}
            <div className="space-y-3 font-mono text-xs">
              {[
                { name: 'Bitcoin', val: '$28,340.20', pct: '+3.4%', isUp: true },
                { name: 'Dollars', val: '$95,890.30', pct: '-0.1%', isUp: false },
                { name: 'Online Store', val: '$28,340.20', pct: '+3.4%', isUp: true },
                { name: 'Physical Stores', val: '$118,080.30', pct: '-0.1%', isUp: false },
                { name: 'Warehouse Sales', val: '$28,340.20', pct: '+3.4%', isUp: true },
                { name: 'Other-Currency', val: '$85,050.30', pct: '-0.1%', isUp: false },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 dark:text-white">{item.val}</span>
                    <span className={`text-[10px] font-bold ${item.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>{item.pct}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 6. Bottom Right: Revenue Breakdown & Financial Cards */}
        <div className="lg:col-span-4 glass-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Revenue Breakdown</h3>
                <p className="text-xs text-slate-400">Check stream of revenue</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase">Opportunities</span>
                <div className="font-bold text-slate-900 dark:text-white font-mono text-base flex items-center gap-1">
                  6,4K <span className="text-emerald-500 text-xs">+3.4%</span>
                </div>
              </div>
              <button className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-xs">
                <Calendar className="w-3 h-3 text-[#7C3AED]" /> May 03 - May 18 ∨
              </button>
            </div>

            {/* Segmented Color Pill Progress Bar */}
            <div className="h-2.5 w-full rounded-full flex overflow-hidden gap-1 mb-4">
              <div className="flex-1 bg-[#7C3AED]" />
              <div className="flex-1 bg-[#06B6D4]" />
              <div className="flex-1 bg-[#F97316]" />
              <div className="flex-1 bg-[#84CC16]" />
              <div className="flex-1 bg-amber-400" />
            </div>

            {/* 3 Vibrant Colored Cards (Matching reference cyan, violet, orange blocks) */}
            <div className="grid grid-cols-3 gap-2 text-white font-mono mb-4 text-[10px]">
              <div className="p-3 rounded-2xl bg-[#06B6D4] space-y-1 shadow-md">
                <div className="opacity-80">Bank</div>
                <div className="font-bold text-sm">$ 153,560.00</div>
                <div className="opacity-70 text-[8px]">5282 3000 1445 3205</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#7C3AED] space-y-1 shadow-md">
                <div className="opacity-80">Store</div>
                <div className="font-bold text-sm">$ 567,560.00</div>
                <div className="opacity-70 text-[8px]">5282 3000 1445 3205</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#F97316] space-y-1 shadow-md">
                <div className="opacity-80">Warehouse</div>
                <div className="font-bold text-sm">$ 987,560.00</div>
                <div className="opacity-70 text-[8px]">5282 3000 1445 3205</div>
              </div>
            </div>

            {/* Asset Received / Outcome stats */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-center mb-4">
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5">
                <div className="text-[9px] text-slate-400">ASSET RECEIVED</div>
                <div className="font-bold text-slate-900 dark:text-white">230,000 <span className="text-emerald-500">+3.4%</span></div>
              </div>

              <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5">
                <div className="text-[9px] text-slate-400">ASSET OUTCOME</div>
                <div className="font-bold text-slate-900 dark:text-white">230,000 <span className="text-emerald-500">+3.4%</span></div>
              </div>
            </div>

            {/* Coral Line Chart */}
            <div className="h-16 w-full">
              <svg className="w-full h-full" viewBox="0 0 300 60">
                <path
                  d="M 10 40 L 35 48 L 60 25 L 85 45 L 110 15 L 135 35 L 160 30 L 185 50 L 210 20 L 235 42 L 260 18 L 285 45"
                  fill="none"
                  stroke="#F97316"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
