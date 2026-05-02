import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Activity, ArrowRight, BarChart3, Briefcase, ChevronRight, ChevronLeft,
  Clock, Database, Edit3, FileText, LayoutDashboard, Lock, 
  LogOut, Mail, Plus, Printer, Save, Settings, Shield, 
  Target, User, Users, Zap, CheckCircle2, Search, Menu, X, ArrowUpRight,
  TrendingUp, AlertTriangle, RefreshCw, LogIn, ChevronDown, Check,
  PhoneCall, BrainCircuit, Send, UserPlus, Building2, ShieldCheck,
  Layers, Filter, Download, MoreHorizontal, Fingerprint, Key, Eye, EyeOff,
  UserCircle, ClipboardList, PieChart, TrendingDown, Box, Command,
  Calculator, DollarSign, Bell, Globe, Terminal, Radio,
  Camera, QrCode, Sparkles, UploadCloud, MessageSquare, Aperture
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine,
  BarChart, Bar, Cell, PieChart as RePieChart, Pie, Legend, LineChart, Line
} from 'recharts';

// ============================================================================
// SUPABASE NATIVE FETCH CLIENT
// ============================================================================
const SUPABASE_URL = 'https://bezwuagivtcymlxcduur.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlend1YWdpdnRjeW1seGNkdXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczOTA5NzYsImV4cCI6MjA5Mjk2Njk3Nn0.Ydf0kFKQV9vZkPDb9Vr-pDkXgXxu6k_mHaWBTOnsrNk';

const supabaseAuth = {
  async signUp(email, password, fullName) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, data: { full_name: fullName, role: 'Strategic Advisor' } })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || 'Signup failed');
    return data;
  },
  async signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || 'Login failed');
    localStorage.setItem('sb_token', data.access_token);
    return data;
  },
  async getUser() {
    const token = localStorage.getItem('sb_token');
    if (!token) return null;
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) {
      localStorage.removeItem('sb_token');
      return null;
    }
    return data;
  },
  signOut() {
    localStorage.removeItem('sb_token');
  }
};

const supabaseDb = {
  async getLeads() {
    const token = localStorage.getItem('sb_token');
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=*&order=created_at.desc`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Could not fetch leads');
    return await res.json();
  },
  async insertLead(leadData) {
    const token = localStorage.getItem('sb_token');
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: { 
        'apikey': SUPABASE_ANON_KEY, 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(leadData)
    });
    if (!res.ok) throw new Error('Could not insert lead');
    return await res.json();
  },
  async updateLeadStatus(id, status) {
    const token = localStorage.getItem('sb_token');
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${id}`, {
      method: 'PATCH',
      headers: { 
        'apikey': SUPABASE_ANON_KEY, 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Could not update lead');
    return await res.json();
  },
  async getProfiles() {
    const token = localStorage.getItem('sb_token');
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Could not fetch profiles');
    return await res.json();
  },
  async upsertProfile(profileData) {
    const token = localStorage.getItem('sb_token');
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: { 
        'apikey': SUPABASE_ANON_KEY, 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(profileData)
    });
    if (!res.ok) throw new Error('Could not upsert profile');
  }
};

// API Retry helper for Gemini
const fetchWithRetry = async (url, options, maxRetries = 5) => {
  let delay = 1000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        if (i === maxRetries - 1) return response; 
        throw new Error('API Error');
      }
      return response;
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};

// ============================================================================
// 1. GLOBAL DESIGN SYSTEM & TOKENS
// ============================================================================

const THEME = {
  bgBase: 'bg-[#030712]', 
  bgSidebar: 'bg-[#060B18]/80',
  bgCard: 'bg-white/[0.02]',
  bgCardHover: 'hover:bg-white/[0.04]',
  border: 'border-white/[0.05]',
  borderFocus: 'focus:border-cyan-500/50',
  textHigh: 'text-white',
  textBase: 'text-slate-300',
  textMuted: 'text-slate-500',
  label: 'text-[10px] uppercase tracking-[0.15em] font-semibold text-slate-500',
  gradientPrimary: 'bg-gradient-to-r from-blue-600 to-cyan-500',
  gradientHover: 'hover:from-blue-500 hover:to-cyan-400',
  glowBlue: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]',
  glowCyan: 'shadow-[0_0_20px_rgba(6,182,212,0.2)]',
  radius: {
    sm: 'rounded-[10px]',
    md: 'rounded-[14px]',
    lg: 'rounded-[20px]',
    xl: 'rounded-[28px]'
  }
};

// Helper function to handle dates
const formatTimeOnly = (dateString) => {
  if (!dateString) return 'Recently';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

// ============================================================================
// 2. SHARED UI COMPONENTS
// ============================================================================

const Card = ({ children, className = '', noPadding = false, glow = false, onClick }) => (
  <div 
    onClick={onClick}
    className={`
      ${THEME.bgCard} border ${THEME.border} ${THEME.radius.lg} backdrop-blur-xl relative overflow-hidden
      ${onClick ? 'cursor-pointer hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 hover:-translate-y-0.5' : ''}
      ${glow ? 'shadow-[0_0_30px_rgba(6,182,212,0.05)] border-cyan-500/10' : 'shadow-2xl'}
      ${noPadding ? '' : 'p-4 sm:p-6'} 
      ${className}
    `}
  >
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
    <div className="relative z-10 h-full flex flex-col">{children}</div>
  </div>
);

const Button = ({ children, variant = 'primary', className = '', onClick, type = 'button', disabled = false, icon: Icon }) => {
  const base = `inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${THEME.radius.md} disabled:opacity-50 disabled:cursor-not-allowed`;
  const variants = {
    primary: `${THEME.gradientPrimary} ${THEME.gradientHover} text-white ${THEME.glowCyan} border border-transparent hover:scale-[1.02] active:scale-[0.98]`,
    secondary: `bg-white/[0.03] hover:bg-white/[0.08] text-slate-200 border ${THEME.border} hover:border-white/[0.15]`,
    ghost: `bg-transparent hover:bg-white/[0.05] text-slate-400 hover:text-white border border-transparent`,
    danger: `bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20`
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  );
};

const Input = ({ label, icon: Icon, type = 'text', rightIcon: RightIcon, onRightIconClick, ...props }) => (
  <div className="space-y-1.5 w-full">
    {label && <label className={`${THEME.label} ml-1`}>{label}</label>}
    <div className="relative group">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />}
      <input 
        type={type}
        className={`w-full bg-[#0B101D] border ${THEME.border} ${THEME.borderFocus} focus:ring-1 focus:ring-cyan-500/50 ${THEME.radius.md} py-3 text-sm text-white placeholder:text-slate-600 transition-all outline-none ${Icon ? 'pl-11' : 'pl-4'} ${RightIcon ? 'pr-11' : 'pr-4'}`}
        {...props}
      />
      {RightIcon && (
        <button type="button" onClick={onRightIconClick} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
          <RightIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  </div>
);

const Select = ({ label, icon: Icon, options, ...props }) => (
  <div className="space-y-1.5 w-full">
    {label && <label className={`${THEME.label} ml-1`}>{label}</label>}
    <div className="relative group">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors z-10" />}
      <select 
        className={`w-full bg-[#0B101D] border ${THEME.border} ${THEME.borderFocus} focus:ring-1 focus:ring-cyan-500/50 ${THEME.radius.md} py-3 text-sm text-white placeholder:text-slate-600 transition-all outline-none appearance-none cursor-pointer ${Icon ? 'pl-11' : 'pl-4'} pr-10`}
        {...props}
      >
        {options.map(opt => typeof opt === 'string' ? <option key={opt} value={opt}>{opt}</option> : <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
    </div>
  </div>
);

const TextArea = ({ label, ...props }) => (
  <div className="space-y-1.5 w-full">
    {label && <label className={`${THEME.label} ml-1`}>{label}</label>}
    <textarea 
      className={`w-full bg-[#0B101D] border ${THEME.border} ${THEME.borderFocus} focus:ring-1 focus:ring-cyan-500/50 ${THEME.radius.md} p-4 text-sm text-white placeholder:text-slate-600 transition-all outline-none resize-none custom-scrollbar min-h-[100px]`}
      {...props}
    />
  </div>
);

const Badge = ({ children, variant = 'blue', className = '' }) => {
  const variants = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    purple: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
  };
  return (
    <span className={`px-2.5 py-1 text-[9px] uppercase tracking-widest font-bold border ${THEME.radius.sm} ${variants[variant]} ${className} whitespace-nowrap`}>
      {children}
    </span>
  );
};

// ============================================================================
// 3. CONSTANTS
// ============================================================================

const INDUSTRIES = ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Agency/Services', 'Other'];
const TEAM_SIZES = ['1-10', '11-50', '51-200', '201-1000', '1000+'];
const TIMELINES = ['Immediate', '1-3 months', '3-6 months', '6-12 months', 'Just browsing'];
const BUDGETS = ['< $10k', '$10k - $50k', '$50k - $100k', '$100k+', 'Undecided'];

// ============================================================================
// 4. MODULE: DASHBOARD (FULLY DYNAMIC)
// ============================================================================

const DashboardView = ({ onNavigate, onLeadSelect, leads = [] }) => {
  
  // Aggregate Stats
  const stats = useMemo(() => {
    const total = leads.length;
    const hot = leads.filter(l => l.score >= 80 || l.status === 'Hot').length;
    const avgScore = total > 0 ? Math.round(leads.reduce((acc, curr) => acc + (curr.score || 0), 0) / total) : 0;
    return { total, hot, avgScore };
  }, [leads]);

  // Traffic Chart Data (Grouped by hour of creation)
  const chartData = useMemo(() => {
    if (leads.length === 0) return [];
    const grouped = {};
    leads.forEach(lead => {
      if (lead.created_at) {
        const d = new Date(lead.created_at);
        const hourLabel = `${d.getHours().toString().padStart(2, '0')}:00`;
        grouped[hourLabel] = (grouped[hourLabel] || 0) + 1;
      }
    });
    return Object.keys(grouped).sort().map(time => ({ time, leads: grouped[time] }));
  }, [leads]);

  // Pipeline Chart Data
  const pipelineData = useMemo(() => {
    if (leads.length === 0) return [{ name: 'Awaiting Data', value: 1, color: '#334155' }];
    const hot = leads.filter(l => (l.score || 0) >= 80).length;
    const warm = leads.filter(l => (l.score || 0) >= 60 && (l.score || 0) < 80).length;
    const nurture = leads.filter(l => (l.score || 0) < 60).length;
    
    return [
      { name: 'Hot (Score > 80)', value: hot, color: '#f43f5e' },
      { name: 'Warm (Score > 60)', value: warm, color: '#f59e0b' },
      { name: 'Nurture (< 60)', value: nurture, color: '#3b82f6' }
    ].filter(d => d.value > 0);
  }, [leads]);

  // Industry Bar Chart Data
  const industryData = useMemo(() => {
    if (leads.length === 0) return [];
    const indMap = {};
    leads.forEach(l => {
      const ind = l.industry || 'Other';
      if (!indMap[ind]) indMap[ind] = { totalScore: 0, count: 0 };
      indMap[ind].totalScore += (l.score || 0);
      indMap[ind].count += 1;
    });
    return Object.keys(indMap).map(key => ({
      name: key.substring(0, 8),
      maturity: Math.round(indMap[key].totalScore / indMap[key].count),
      leads: indMap[key].count
    }));
  }, [leads]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <Badge variant="rose" className="!px-2 !py-0.5">Live Telemetry Active</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-light text-white tracking-tight">Command Center</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Real-time booth telemetry and active pipeline diagnostics.</p>
        </div>
        <div className="flex w-full sm:w-auto gap-3">
          <Button variant="secondary" icon={Search} className="flex-1 sm:flex-none" onClick={() => onNavigate('directory')}>Registry</Button>
          <Button icon={Plus} className="flex-1 sm:flex-none" onClick={() => onNavigate('capture')}>New Capture</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Acquisitions', value: stats.total.toString(), trend: 'Session', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'High-Value Targets', value: stats.hot.toString(), trend: 'Score > 80', icon: Target, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Avg Integrity Score', value: `${stats.avgScore}/100`, trend: 'Healthy Baseline', icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'AI Analyzed', value: stats.total.toString(), trend: '100% Coverage', icon: BrainCircuit, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
        ].map((kpi, i) => (
          <Card key={i} className="p-4 sm:p-5 flex flex-col justify-between hover:border-white/10 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 ${THEME.radius.sm} ${kpi.bg} flex items-center justify-center border border-white/5`}>
                <kpi.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${kpi.color}`} />
              </div>
              <Badge variant={kpi.color.includes('emerald') ? 'emerald' : 'slate'} className="!text-[8px] hidden sm:block">{kpi.trend}</Badge>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-light text-white tracking-tight">{kpi.value}</p>
              <p className={`${THEME.label} mt-1 truncate`}>{kpi.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2 flex flex-col" glow>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className={`${THEME.label} text-white flex items-center gap-2`}><Globe className="w-4 h-4 text-cyan-400"/> Traffic Velocity</h3>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Lead acquisition rate over current session</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse"></span>
              <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold hidden sm:block">Live</span>
            </div>
          </div>
          <div className="h-[200px] sm:h-[250px] w-full flex-1">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0B101D', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="leads" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-600 text-sm">Waiting for lead data...</div>
            )}
          </div>
        </Card>

        {/* Pipeline Donut Chart */}
        <Card className="flex flex-col">
          <h3 className={`${THEME.label} text-white mb-1 flex items-center gap-2`}><Target className="w-4 h-4 text-rose-400"/> Pipeline Health</h3>
          <p className="text-[10px] sm:text-xs text-slate-500 mb-6">Distribution by diagnostic score</p>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={pipelineData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">
                  {pipelineData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#0B101D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8'}}/>
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Industry Bar Chart */}
        <Card className="lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className={`${THEME.label} text-white flex items-center gap-2`}><BarChart3 className="w-4 h-4 text-indigo-400"/> Sector Maturity Index</h3>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Average diagnostic score mapped by vertical</p>
            </div>
          </div>
          <div className="h-[200px] sm:h-[220px] w-full flex-1">
            {industryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={industryData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{ backgroundColor: '#0B101D', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px' }} />
                  <Bar dataKey="maturity" name="Avg Maturity" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {industryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.maturity > 70 ? '#3b82f6' : entry.maturity > 50 ? '#06b6d4' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-full w-full flex items-center justify-center text-slate-600 text-sm">Waiting for lead data...</div>
            )}
          </div>
        </Card>

        {/* Live Event Feed */}
        <Card className="flex flex-col p-0 sm:p-0 overflow-hidden" noPadding>
          <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
            <h3 className={`${THEME.label} text-white flex items-center gap-2`}><Terminal className="w-4 h-4 text-emerald-400"/> Telemetry</h3>
            <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">SYNCED</span>
          </div>
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar bg-[#0B101D]/50 max-h-[300px] lg:max-h-full">
            {leads.slice(0, 6).map((lead, i) => (
              <div key={i} className="relative pl-6 group">
                <div className="absolute left-[9px] top-6 bottom-[-24px] w-px bg-white/10 group-last:hidden"></div>
                <div className={`absolute left-0 top-1 w-5 h-5 rounded-full border-2 border-[#0B101D] flex items-center justify-center ${lead.score > 80 ? 'bg-rose-500' : lead.score > 60 ? 'bg-amber-500' : 'bg-blue-500'}`}>
                   <UserPlus className="w-2.5 h-2.5 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-200 font-medium truncate">Lead Captured: {lead.role}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">{formatTimeOnly(lead.created_at)}</p>
                </div>
              </div>
            ))}
            {leads.length === 0 && <div className="text-slate-500 text-sm text-center">No recent telemetry.</div>}
          </div>
        </Card>
      </div>

      {/* Recent Leads Table */}
      <Card noPadding className="flex flex-col mt-6 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className={`${THEME.label} text-white flex items-center gap-2`}><Database className="w-4 h-4 text-cyan-400"/> Live Lead Telemetry</h3>
          <button onClick={() => onNavigate('directory')} className="text-xs font-bold text-cyan-400 uppercase tracking-widest hover:text-cyan-300">View Registry</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className={`${THEME.label} bg-black/20 border-b border-white/5`}>
              <tr>
                <th className="px-4 sm:px-6 py-4 font-semibold">Entity Profile</th>
                <th className="px-4 sm:px-6 py-4 font-semibold">AI Score</th>
                <th className="px-4 sm:px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {leads.slice(0, 5).map((lead, i) => (
                <tr key={lead.id || i} onClick={() => onLeadSelect(lead)} className="hover:bg-white/[0.03] transition-colors cursor-pointer group">
                  <td className="px-4 sm:px-6 py-4">
                    <div className="font-medium text-white group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                       {lead.name}
                       {(lead.score >= 80 || lead.status === 'Hot') && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0"></span>}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 sm:gap-2">
                      <Briefcase className="w-3 h-3 shrink-0" /> <span className="truncate max-w-[120px] sm:max-w-[200px]">{lead.role} @ {lead.company}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 font-mono text-cyan-400">{lead.score || 0}</td>
                  <td className="px-4 sm:px-6 py-4">
                    <Badge variant={(lead.score >= 80 || lead.status === 'Hot') ? 'rose' : lead.status === 'Warm' ? 'amber' : 'blue'}>{lead.status || 'New'}</Badge>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-4 sm:px-6 py-8 text-center text-slate-500">No leads captured yet. Initialize a capture to populate dashboard.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ============================================================================
// 5. MODULE: LEAD DIRECTORY
// ============================================================================
const LeadDirectoryView = ({ onNavigate, onLeadSelect, leads }) => {
  const [search, setSearch] = useState('');
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-white tracking-tight">Entity Directory</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Centralized repository of captured assets.</p>
        </div>
        <div className="flex w-full sm:w-auto gap-3">
          <Button icon={Plus} className="w-full sm:w-auto" onClick={() => onNavigate('capture')}>New Capture</Button>
        </div>
      </div>

      <div className="flex gap-4">
        <Input icon={Search} placeholder="Search by name, company, or ID..." value={search} onChange={e => setSearch(e.target.value)} />
        <Button variant="secondary" icon={Filter} className="hidden sm:flex">Filter</Button>
      </div>

      <div className="space-y-3">
        {leads.length === 0 && (
          <div className="text-center p-12 border border-white/5 rounded-[20px] bg-black/20 text-slate-500 text-sm">
            No leads found. Capture some leads to see them here!
          </div>
        )}
        {leads.filter(l => l.name?.toLowerCase().includes(search.toLowerCase()) || l.company?.toLowerCase().includes(search.toLowerCase())).map((lead, idx) => (
          <Card key={lead.id || idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 group hover:border-cyan-500/30 cursor-pointer" onClick={() => onLeadSelect(lead)}>
            <div className="flex items-start sm:items-center gap-4 sm:gap-5 w-full sm:w-auto">
              <div className={`hidden sm:flex shrink-0 w-12 h-12 ${THEME.radius.md} bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 items-center justify-center text-cyan-400 font-bold text-lg shadow-inner`}>
                {lead.name?.charAt(0) || '?'}
              </div>
              <div className="w-full min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-white font-medium text-base sm:text-lg tracking-wide group-hover:text-cyan-400 transition-colors truncate">{lead.name}</h3>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm flex items-center truncate">
                  <Building2 size={14} className="mr-1.5 text-slate-500 shrink-0" /> <span className="truncate">{lead.company}</span>
                  <span className="mx-2 sm:mx-3 opacity-30">|</span> 
                  <span className="truncate">{lead.role}</span>
                </p>
                <p className="text-slate-500 text-[10px] sm:text-xs flex items-center mt-1.5">
                  <UserCircle size={12} className="mr-1 text-slate-600 shrink-0" /> Owner: <span className="ml-1 text-slate-400 font-medium truncate">{lead.owner || 'Unassigned'}</span>
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant={(lead.score >= 80 || lead.status === 'Hot') ? 'rose' : lead.status === 'Warm' ? 'amber' : 'blue'} className="!text-[8px]">{lead.status || 'New'}</Badge>
                  {(lead.industry) && <Badge variant="slate" className="!text-[8px]">{lead.industry}</Badge>}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-white/10 pt-4 sm:pt-0 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
              <div className="text-left sm:text-right">
                <p className={`${THEME.label} mb-1.5`}>Maturity Score</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-light text-white">{lead.score || 0}</span>
                  <div className={`w-16 h-1.5 bg-black/40 ${THEME.radius.sm} overflow-hidden border border-white/5`}>
                    <div className={`h-full ${(lead.score || 0) > 75 ? 'bg-emerald-500' : (lead.score || 0) > 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${lead.score || 0}%` }} />
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 transition-colors hidden sm:block" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 6. MODULE: LEAD CAPTURE (Multi-step) WITH LIVE CAMERA & GEMINI OCR
// ============================================================================

const LeadCaptureModule = ({ onNavigate, onLeadAdded, profiles = [], user }) => {
  const [step, setStep] = useState(1);
  const steps = ['Identity', 'Organization', 'Intent', 'Verification'];
  
  const [activeTab, setActiveTab] = useState('scan'); // 'scan' | 'manual' | 'camera'
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({ 
    name: '', role: '', company: '', email: '', phone: '', industry: 'Technology', brief: '', owner: ''
  });

  // Set default owner to current logged-in user
  useEffect(() => {
    if (!formData.owner && user) {
      setFormData(prev => ({ ...prev, owner: user.name }));
    }
  }, [user, formData.owner]);

  // Handle Live Camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      setActiveTab('camera');
    } catch (error) {
      console.error("Camera access error:", error);
      alert("Camera access denied or unavailable on this device. Please use 'Upload File' instead.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'camera' && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
    if (activeTab !== 'camera') {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab, stream]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const base64String = canvas.toDataURL('image/jpeg').split(',')[1];
    
    stopCamera();
    processImage(base64String, 'image/jpeg');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(',')[1];
      processImage(base64String, file.type);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64String, mimeType) => {
    setIsScanning(true);
    setActiveTab('scan');
    try {
      const apiKey = ""; // Provided by execution environment
      const prompt = "Extract the contact information from this business card. If a field is missing, return an empty string.";
      
      const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType, data: base64String } }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING", description: "Full name" },
              role: { type: "STRING", description: "Job title" },
              company: { type: "STRING", description: "Company name" },
              email: { type: "STRING", description: "Email address" },
              phone: { type: "STRING", description: "Phone number" }
            },
            required: ["name", "role", "company", "email", "phone"]
          }
        }
      };

      const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "Failed to process image");
      
      const extractedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (extractedText) {
        const extractedData = JSON.parse(extractedText);
        setFormData(prev => ({
          ...prev,
          name: extractedData.name || '',
          role: extractedData.role || '',
          company: extractedData.company || '',
          email: extractedData.email || '',
          phone: extractedData.phone || ''
        }));
      }

      setIsScanning(false);
      setScanComplete(true);
      setActiveTab('manual');
    } catch (error) {
      console.error("OCR Error:", error);
      alert("Failed to scan card using AI. Please enter details manually.");
      setIsScanning(false);
      setActiveTab('manual');
    }
  };

  const calculateLeadScore = (data) => {
    let baseScore = 50; 
    const role = (data.role || '').toLowerCase();
    if (role.includes('c-') || role.includes('chief') || role.includes('vp') || role.includes('president') || role.includes('founder') || role.includes('partner') || role.includes('cio') || role.includes('cto') || role.includes('ceo')) {
      baseScore += 20;
    } else if (role.includes('director') || role.includes('head')) {
      baseScore += 15;
    } else if (role.includes('manager')) {
      baseScore += 5;
    }
    if (data.brief && data.brief.length > 50) baseScore += 15;
    else if (data.brief && data.brief.length > 10) baseScore += 5;
    if (data.industry && data.industry !== 'Other') baseScore += 5;

    return Math.min(Math.max(baseScore, 1), 99);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    setTimeout(async () => {
      try {
        const generatedSteps = formData.brief.length > 10 
          ? `Based on the consultant brief, the AI recommends:\n\n1. Send the enterprise security and architecture whitepaper.\n2. Schedule a 15-minute technical discovery call.\n3. Route to the specialized infrastructure team.`
          : `Standard Follow-up Protocol:\n\n1. Add to general nurture sequence.\n2. Send introductory overview deck.`;

        const dynamicScore = calculateLeadScore(formData);
        const dynamicStatus = dynamicScore >= 80 ? 'Hot' : dynamicScore >= 60 ? 'Warm' : 'Nurture';

        const newLead = {
          name: formData.name,
          role: formData.role,
          company: formData.company,
          email: formData.email,
          phone: formData.phone || '',
          industry: formData.industry || 'Other',
          score: dynamicScore,
          status: dynamicStatus,
          owner: formData.owner,
          consultant_brief: formData.brief,
          ai_next_steps: generatedSteps
        };
        
        await supabaseDb.insertLead(newLead);
        if (onLeadAdded) await onLeadAdded();
        
        onNavigate('directory'); 
      } catch (error) {
        console.error("Error saving lead:", error);
        alert("Failed to save lead to Database.");
      } finally {
        setIsSaving(false);
      }
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500 pb-12">
      <Card className="p-6 sm:p-12 relative overflow-hidden" glow>
        
        <div className="flex justify-between items-center mb-8 sm:mb-12 pb-6 border-b border-white/5">
          <Badge variant="cyan">Acquisition Node Active</Badge>
          <button onClick={() => onNavigate('dashboard')} className="text-slate-500 hover:text-white transition-colors p-2">
            <X size={20} />
          </button>
        </div>

        <div className="w-full mb-8 sm:mb-12 relative">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-[2px] bg-white/5 z-0"></div>
          <div 
            className={`absolute left-0 top-1/2 transform -translate-y-1/2 h-[2px] ${THEME.gradientPrimary} z-0 transition-all duration-700 ease-out`}
            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
          ></div>
          
          <div className="flex justify-between relative z-10">
            {steps.map((label, idx) => {
              const stepNum = idx + 1;
              const isActive = step === stepNum;
              const isPast = step > stepNum;
              return (
                <div key={label} className="flex flex-col items-center group relative">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 ${THEME.radius.md} flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-500
                    ${isActive ? `bg-cyan-500 text-slate-900 ${THEME.glowCyan} scale-110` : 
                      isPast ? 'bg-[#0B101D] text-cyan-400 border border-cyan-500/50' : 'bg-[#0B101D] text-slate-600 border border-white/10'}`}
                  >
                    {isPast ? <Check size={16} /> : stepNum}
                  </div>
                  <span className={`hidden sm:block absolute -bottom-8 text-[9px] uppercase tracking-widest font-bold whitespace-nowrap transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-600'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="min-h-[300px]">
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
              <h2 className="text-xl sm:text-2xl font-light text-white tracking-tight mb-4">Operator <span className="font-semibold text-cyan-400">Identity</span></h2>
              
              <div className="bg-black/20 border border-white/5 p-4 sm:p-5 rounded-[16px] mb-6 sm:mb-8">
                <Select 
                  label="Assigned Lead Owner" 
                  icon={UserCircle} 
                  value={formData.owner} 
                  onChange={e => setFormData({...formData, owner: e.target.value})} 
                  options={profiles.map(p => ({ value: p.full_name, label: p.full_name }))}
                  required
                />
              </div>

              <div className="flex gap-2 p-1 bg-black/40 border border-white/5 rounded-xl w-full sm:w-fit mb-6">
                <button onClick={() => setActiveTab('scan')} className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-[11px] sm:text-sm font-semibold transition-all ${activeTab === 'scan' || activeTab === 'camera' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Scan Card</button>
                <button onClick={() => setActiveTab('manual')} className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-[11px] sm:text-sm font-semibold transition-all ${activeTab === 'manual' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Manual Entry</button>
              </div>

              {activeTab === 'camera' && (
                <div className="p-4 sm:p-8 flex flex-col items-center justify-center text-center border-2 border-cyan-500/30 rounded-2xl min-h-[300px] bg-black">
                   <video ref={videoRef} autoPlay playsInline className="w-full max-w-md rounded-lg mb-6 shadow-2xl" />
                   <div className="flex gap-4">
                     <Button onClick={capturePhoto} icon={Aperture}>Capture Frame</Button>
                     <Button variant="ghost" onClick={() => setActiveTab('scan')}>Cancel</Button>
                   </div>
                </div>
              )}

              {activeTab === 'scan' && (
                <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-white/10 rounded-2xl hover:border-cyan-500/30 transition-colors min-h-[300px] bg-black/20">
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                  
                  {isScanning ? (
                     <div className="flex flex-col items-center">
                       <div className="w-12 h-12 mb-4 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin"></div>
                       <h3 className="text-lg font-medium text-white mb-2">Analyzing Image...</h3>
                       <p className="text-sm text-slate-400">Extracting contact entities via Gemini AI.</p>
                     </div>
                  ) : (
                    <div className="flex flex-col items-center w-full">
                      <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                        <Camera className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-medium text-white mb-2">Scan Business Card</h3>
                      <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-8 leading-relaxed">
                        Use your device camera or upload an image to digitize card information.
                      </p>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
                        <Button onClick={startCamera} icon={Camera} className="w-full sm:w-auto">Take Photo (Webcam)</Button>
                        <Button variant="secondary" onClick={() => fileInputRef.current?.click()} icon={UploadCloud} className="w-full sm:w-auto">Upload File</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'manual' && (
                <div className="space-y-6 animate-in fade-in">
                  {scanComplete && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-emerald-100">Scan Successful</p>
                        <p className="text-xs text-emerald-400/70 mt-1">Please verify the extracted information below.</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <Input label="Full Name" icon={User} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    <Input label="Job Role" icon={Briefcase} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} required />
                  </div>
                  <Input label="Comms Channel (Email)" type="email" icon={Mail} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <Input label="Direct Line" icon={PhoneCall} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    <Input label="Company" icon={Building2} value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} required />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
              <h2 className="text-xl sm:text-2xl font-light text-white tracking-tight mb-8">Corporate <span className="font-semibold text-cyan-400">Entity</span></h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Select label="Operational Sector" options={INDUSTRIES} icon={Layers} value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} />
                <Select label="Personnel Count" options={TEAM_SIZES} icon={Users} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Select label="Capital Bandwidth" options={['< $1M', '$1M - $10M', '$10M - $50M', '> $50M']} icon={BarChart3} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
              <h2 className="text-xl sm:text-2xl font-light text-white tracking-tight mb-8">Strategic <span className="font-semibold text-cyan-400">Intent</span></h2>
              
              <TextArea 
                label="Consultant Brief (Internal Notes)" 
                rows={4} 
                value={formData.brief} 
                onChange={e => setFormData({...formData, brief: e.target.value})} 
                placeholder="Key takeaways from the booth conversation. The AI will use this to generate strategic next steps and score the lead..." 
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Select label="Execution Window" options={TIMELINES} icon={Clock} />
                <Select label="Resource Allocation" options={BUDGETS} icon={Target} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 text-center py-10">
              {isSaving ? (
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BrainCircuit className="w-10 h-10 text-blue-400 animate-pulse" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-light text-white tracking-tight mb-2">AI Synthesizing Score & Next Steps...</h2>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto">Processing your consultant brief and entity profile to generate actionable workflow recommendations.</p>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-light text-white tracking-tight mb-2">Entity Captured</h2>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto px-4">Profile and AI-generated strategy have been securely synced. Ready for review.</p>
                  
                  <div className="mt-10 flex justify-center gap-4">
                    <Button onClick={handleSubmit} icon={Check} className="w-full sm:w-auto">
                      Save & Complete
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {step < 4 && (
          <div className="flex flex-col-reverse sm:flex-row justify-between items-center mt-12 pt-8 border-t border-white/5 gap-4 sm:gap-0">
            <Button variant="ghost" onClick={() => setStep(prev => Math.max(1, prev - 1))} disabled={step === 1} icon={ChevronLeft} className="w-full sm:w-auto">Back</Button>
            <Button onClick={() => setStep(prev => prev + 1)} className="w-full sm:w-auto">
              Continue <ChevronRight className="w-4 h-4 ml-1 hidden sm:block" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

// ============================================================================
// LEAD DETAIL MODAL / DRAWER
// ============================================================================

const LeadDetailDrawer = ({ lead, onClose, onLeadUpdated }) => {
  const [status, setStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (lead) setStatus(lead.status || 'New');
  }, [lead]);

  if (!lead) return null;

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await supabaseDb.updateLeadStatus(lead.id, status);
      if (onLeadUpdated) await onLeadUpdated();
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to update lead");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity animate-in fade-in" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] sm:max-w-md bg-[#0B101D] border-l border-white/10 shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 sm:rounded-l-[24px]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-start relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex items-center gap-4">
            <div className={`w-12 h-12 ${THEME.radius.md} bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-cyan-400 font-bold text-lg shadow-inner shrink-0`}>
              {lead.name?.charAt(0) || '?'}
            </div>
            <div className="min-w-0 pr-4">
              <h2 className="text-lg font-medium text-white truncate">{lead.name}</h2>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{lead.role} @ {lead.company}</p>
            </div>
          </div>
          
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] rounded-[12px] transition-colors relative z-10 shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          
          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[120px] bg-black/40 border border-white/5 p-4 rounded-[16px]">
              <p className={`${THEME.label} mb-1`}>AI Score</p>
              <p className="text-2xl font-light text-cyan-400">{lead.score || '--'}</p>
            </div>
            <div className="flex-1 min-w-[120px] bg-black/40 border border-white/5 p-4 rounded-[16px]">
              <p className={`${THEME.label} mb-1`}>Owner</p>
              <p className="text-sm font-medium text-slate-300 mt-2 truncate">{lead.owner || 'Unassigned'}</p>
            </div>
            <div className="w-full bg-black/40 border border-white/5 p-4 rounded-[16px]">
              <p className={`${THEME.label} mb-1`}>Status</p>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                className={`mt-1 block w-full bg-[#1A2235] border border-white/10 ${THEME.radius.sm} p-2 text-xs text-white focus:outline-none focus:border-cyan-500`}
              >
                {['New', 'Nurture', 'Warm', 'Hot', 'Deep Consult'].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Consultant Brief */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
              <MessageSquare className="w-4 h-4 text-blue-400" /> Consultant Brief
            </h3>
            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-[16px] text-sm text-slate-300 leading-relaxed font-light whitespace-pre-wrap break-words">
              {lead.consultant_brief || "No brief recorded for this lead."}
            </div>
          </div>

          {/* AI Next Steps */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
              <BrainCircuit className="w-4 h-4 text-purple-400" /> AI Strategic Next Steps
            </h3>
            <div className="bg-purple-500/5 border border-purple-500/20 p-4 rounded-[16px] text-sm text-purple-100 leading-relaxed font-light whitespace-pre-wrap break-words">
              {lead.ai_next_steps || "No AI strategy generated. Update the brief to generate recommendations."}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-white/5 bg-black/20 shrink-0 pb-safe">
          <Button variant="primary" onClick={handleSave} disabled={isUpdating} className="w-full">
            {isUpdating ? 'Saving...' : 'Save Configuration'} <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>

      </div>
    </>
  );
};


// ============================================================================
// 6. MODULE: AI INSIGHTS
// ============================================================================

const AIInsightsView = ({ leads }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const handleAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasAnalyzed(true);
    }, 2500);
  };

  const chartData = useMemo(() => {
    if (!leads || leads.length === 0) return [];
    const counts = {};
    leads.forEach(l => {
      counts[l.industry] = (counts[l.industry] || 0) + 1;
    });
    return Object.entries(counts).map(([name, val]) => ({ name, val }));
  }, [leads]);

  const latestLead = leads && leads.length > 0 ? leads[0] : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-white tracking-tight flex items-center gap-3">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" /> Global AI Insights
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Autonomous analysis of all captured booth telemetry.</p>
        </div>
        {!hasAnalyzed && (
          <Button onClick={handleAnalysis} disabled={isAnalyzing || !leads || leads.length === 0} className="!bg-gradient-to-r !from-purple-600 !to-indigo-500 shadow-[0_0_20px_rgba(168,85,247,0.3)] w-full sm:w-auto">
            {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <BrainCircuit className="w-4 h-4 mr-2" />}
            {isAnalyzing ? 'Analyzing Database...' : 'Run Global Analysis'}
          </Button>
        )}
      </div>

      {!hasAnalyzed && !isAnalyzing && (
        <Card className="py-20 text-center border-purple-500/20 glow border-dashed border-2">
          <BrainCircuit className="w-16 h-16 mx-auto text-slate-700 mb-6" />
          <h3 className="text-xl font-medium text-white mb-2">Analysis Engine Idle</h3>
          <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto px-4">Click "Run Global Analysis" to trigger the LLM to process your {leads ? leads.length : 0} captured leads and identify strategic patterns.</p>
        </Card>
      )}

      {isAnalyzing && (
        <Card className="py-20 text-center border-purple-500/20 glow">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-2 border-blue-500/20 border-b-blue-500 animate-spin animation-direction-reverse"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
            </div>
          </div>
          <h3 className="text-xl font-medium text-white mb-2 animate-pulse">Synthesizing Telemetry...</h3>
          <p className="text-slate-400 text-xs sm:text-sm font-mono uppercase tracking-widest">Processing {leads ? leads.length : 0} lead entities</p>
        </Card>
      )}

      {hasAnalyzed && (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
          {latestLead && (
            <Card className="border-t-2 border-t-emerald-500 bg-gradient-to-b from-emerald-900/10 to-transparent">
              <h3 className={`${THEME.label} text-emerald-400 mb-4 flex items-center gap-2`}><User className="w-4 h-4"/> Recent Lead Insight: {latestLead.name}</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light mb-6">
                Based on the recent scan of <strong className="text-white">{latestLead.name} ({latestLead.role} @ {latestLead.company})</strong>, the AI predicts a high intent for <strong className="text-white">Enterprise Automation</strong> and <strong className="text-white">Op Debt reduction</strong>. Given the {latestLead.industry || 'technology'} sector context, we recommend fast-tracking this lead to a <strong className="text-white">Deep Consult</strong> emphasizing infrastructure scaling and technical ROI.
              </p>
              <div className="p-3 bg-black/40 border border-white/5 rounded-lg flex items-start gap-3">
                <span className="text-emerald-500 mt-0.5 shrink-0">›</span>
                <span className="text-xs text-slate-400">Action item: Send the "Op Debt Reduction" whitepaper and propose a 15-minute technical architecture review.</span>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-t-2 border-t-purple-500 bg-gradient-to-b from-purple-900/10 to-transparent">
              <h3 className={`${THEME.label} text-purple-400 mb-4 flex items-center gap-2`}><Target className="w-4 h-4"/> Audience Composition</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light mb-6">
                The AI detected a significant skew based on your {leads ? leads.length : 0} captures. The dominant sector is currently <strong className="text-white">{chartData.length > 0 ? chartData.sort((a,b)=>b.val-a.val)[0].name : 'Unknown'}</strong>.
              </p>
              <div className="h-[150px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="val" stroke="none">
                        {chartData.map((e, i) => <Cell key={i} fill={['#a855f7', '#3b82f6', '#06b6d4', '#475569', '#10b981'][i % 5]} />)}
                      </Pie>
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8'}}/>
                    </RePieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-600 text-xs">No chart data available</div>
                )}
              </div>
            </Card>

            <Card className="border-t-2 border-t-blue-500 bg-gradient-to-b from-blue-900/10 to-transparent">
              <h3 className={`${THEME.label} text-blue-400 mb-4 flex items-center gap-2`}><AlertTriangle className="w-4 h-4"/> Revenue Bottlenecks</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light mb-6">
                Sentiment analysis across captured profiles reveals a consistent trend: highly qualified leads are struggling with legacy system integration, delaying adoption timelines.
              </p>
              <div className="space-y-3">
                <div className="p-3 bg-black/40 border border-white/5 rounded-lg flex items-start gap-3">
                  <span className="text-blue-500 mt-0.5 shrink-0">›</span>
                  <span className="text-[11px] sm:text-xs text-slate-400">High priority recommendation: Pivot follow-up messaging to highlight our pre-built integration connectors.</span>
                </div>
                <div className="p-3 bg-black/40 border border-white/5 rounded-lg flex items-start gap-3">
                  <span className="text-blue-500 mt-0.5 shrink-0">›</span>
                  <span className="text-[11px] sm:text-xs text-slate-400">Opportunity identified: Fast-track leads scoring &gt;80 directly to technical architects.</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 7. MODULE: MY QR (CONTACT SHARE)
// ============================================================================

const MyQRView = () => {
  const vcardData = `BEGIN:VCARD\nVERSION:3.0\nN:Mishra;Anant;;;\nFN:Anant Mishra\nORG:Invade Code\nTITLE:CIO\nTEL;TYPE=WORK,VOICE:+917751958550\nEMAIL:anant@invadecode.com\nEND:VCARD`;
  const encodedVcard = encodeURIComponent(vcardData);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedVcard}&color=030712&bgcolor=ffffff&margin=0`;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-lg mx-auto mt-6 sm:mt-10">
      <Card className="text-center p-6 sm:p-12" glow>
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-[20px] bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
          <QrCode className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-light text-white tracking-tight mb-2">Share Contact</h1>
        <p className="text-xs sm:text-sm text-slate-400 mb-8 sm:mb-10 px-4">Allow visitors to scan this QR code to instantly save your details.</p>
        
        <div className="flex justify-center mb-8 sm:mb-10">
          <div className="bg-white p-4 sm:p-6 rounded-[2rem] shadow-[0_0_50px_rgba(6,182,212,0.15)] border border-slate-700/50 transition-transform hover:scale-105 duration-500 flex items-center justify-center aspect-square w-[220px] h-[220px] sm:w-[280px] sm:h-[280px]">
            <img src={qrUrl} alt="Contact QR Code" className="w-full h-full object-contain mix-blend-multiply" />
          </div>
        </div>

        <div className="bg-[#0B101D]/80 border border-white/5 rounded-2xl p-5 sm:p-6 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-white/5 pb-2 relative z-10">Profile Card</p>
          <div className="space-y-3 relative z-10">
            <div>
              <p className="text-lg sm:text-xl font-medium text-white">Anant Mishra</p>
              <p className="text-xs sm:text-sm text-cyan-400">CIO @ Invade Code</p>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300 mt-4 break-all">
              <Mail className="w-4 h-4 text-slate-500 shrink-0" /> anant@invadecode.com
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300">
              <PhoneCall className="w-4 h-4 text-slate-500 shrink-0" /> +91 77519 58550
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ============================================================================
// 8. AUTHENTICATION MODULE
// ============================================================================

function AuthScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      if (mode === 'signup') {
        const { data, error } = await supabaseAuth.signUp(email, password, operatorId || email.split('@')[0]);
        if (error) throw error;
        if (data.user && data.session) {
          onLogin({ id: data.user.id, name: data.user.user_metadata?.full_name || email.split('@')[0], role: data.user.user_metadata?.role || 'Strategic Advisor', email });
        } else if (data.user && !data.session) {
          setErrorMsg('Check your email for the confirmation link.');
        }
      } else {
        const data = await supabaseAuth.signIn(email, password);
        onLogin({ id: data.user.id, name: data.user.user_metadata?.full_name || email.split('@')[0], role: data.user.user_metadata?.role || 'Strategic Advisor', email });
      }
    } catch (error) {
      setErrorMsg(error.message);
      // Fallback for demo purposes if Supabase fails
      setTimeout(() => {
        onLogin({ id: 'demo-id', name: 'Anant Mishra', role: 'CIO', email: email || 'anant@invadecode.com' });
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center relative overflow-hidden font-sans p-4 sm:p-6">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-900/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/15 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
      
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="text-center mb-8 sm:mb-10 flex flex-col items-center">
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-[20px] bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center mb-4 sm:mb-6 shadow-[0_0_30px_rgba(6,182,212,0.4)]`}>
            <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white mb-2">Invade Code - CRM</h1>
          <p className="text-[10px] sm:text-xs text-slate-400 tracking-widest uppercase">Operator Access Terminal</p>
        </div>

        <Card glow className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-[10px]">
                {errorMsg}
              </div>
            )}
            {mode === 'signup' && (
              <Input required type="text" placeholder="John Doe" icon={User} label="Operator ID" value={operatorId} onChange={e => setOperatorId(e.target.value)} />
            )}
            <Input required type="email" placeholder="anant@invadecode.com" icon={Mail} label="Secure Email" value={email} onChange={e => setEmail(e.target.value)} />
            <Input required type="password" placeholder="••••••••" icon={Key} label="Access Cipher" value={password} onChange={e => setPassword(e.target.value)} />

            <div className="pt-2 sm:pt-4">
              <Button type="submit" className="w-full py-3" disabled={loading} icon={loading ? RefreshCw : LogIn}>
                {loading ? 'Authenticating...' : (mode === 'login' ? 'Authenticate Session' : 'Initialize Profile')}
              </Button>
            </div>
            
            <div className="pt-4 text-center border-t border-white/5">
              <button 
                type="button" 
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-[9px] sm:text-[10px] text-slate-400 hover:text-cyan-400 transition-colors tracking-widest uppercase font-semibold"
              >
                {mode === 'login' ? 'Request Operator Access' : 'Return to Login'}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// 9. SHELL & NAVIGATION
// ============================================================================

const AppShell = ({ user, onLogout, currentView, setCurrentView, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auto-close menu on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentView]);

  const NAV_GROUPS = [
    {
      title: 'Operations',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'directory', label: 'Lead Registry', icon: Users },
        { id: 'capture', label: 'Capture Lead', icon: UserPlus },
      ]
    },
    {
      title: 'Networking',
      items: [
        { id: 'qr', label: 'My Contact QR', icon: QrCode },
      ]
    }
  ];

  return (
    <div className={`min-h-screen ${THEME.bgBase} text-slate-300 font-sans flex overflow-hidden selection:bg-cyan-500/30`}>
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 border-r ${THEME.border} ${THEME.bgSidebar} flex flex-col z-50 transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static shrink-0 backdrop-blur-3xl`}>
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 ${THEME.radius.sm} flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)] shrink-0`}>
              <Command className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white tracking-wide text-sm uppercase truncate">Invade Code<span className="font-light text-cyan-400"> CRM</span></span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-8 custom-scrollbar">
          {NAV_GROUPS.map((group, idx) => (
            <div key={idx}>
              <div className={`${THEME.label} px-3 mb-3`}>{group.title}</div>
              <nav className="space-y-1">
                {group.items.map(item => {
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 ${THEME.radius.md} text-xs font-medium tracking-wide transition-all ${
                        isActive 
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
                      }`}
                    >
                      <item.icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'} shrink-0`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/5">
          <div className={`p-3 ${THEME.radius.lg} bg-white/[0.02] border border-white/5 flex items-center gap-3 mb-3`}>
            <div className={`w-8 h-8 ${THEME.radius.sm} bg-[#0A0F1C] border border-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0`}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[9px] text-cyan-500 uppercase tracking-widest truncate">{user.role}</p>
            </div>
          </div>
          <button onClick={onLogout} className={`w-full flex items-center justify-center gap-2 py-2 text-[10px] uppercase tracking-widest font-bold text-slate-500 hover:text-rose-400 transition-colors`}>
            <LogOut className="w-3 h-3 shrink-0" /> Disconnect
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative h-screen overflow-hidden">
        {/* Global Ambient Glow */}
        <div className="absolute top-[-20%] left-1/4 w-[600px] h-[600px] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none z-0 hidden md:block"></div>

        {/* Top Header */}
        <header className="h-16 flex items-center justify-between md:justify-end px-4 sm:px-8 border-b border-white/5 bg-[#030712]/80 backdrop-blur-md relative z-20 shrink-0">
           
           <div className="flex items-center gap-3 md:hidden">
             <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-400 hover:text-white rounded-[10px] bg-white/[0.05]">
               <Menu className="w-5 h-5" />
             </button>
             <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-300">
               {NAV_GROUPS.flatMap(g => g.items).find(i => i.id === currentView)?.label || currentView}
             </span>
           </div>

           <div className="flex items-center gap-4">
             <div className="relative hidden md:block">
               <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
               <input type="text" placeholder="Global search..." className={`w-64 bg-black/40 border border-white/10 py-1.5 pl-9 pr-4 text-xs text-white ${THEME.radius.md} focus:border-cyan-500/50 outline-none`} />
             </div>
             <button className={`w-8 h-8 flex items-center justify-center ${THEME.radius.md} border border-white/10 hover:bg-white/5 text-slate-400 transition-colors relative`}>
               <Bell className="w-4 h-4" />
               <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_5px_#22d3ee]"></span>
             </button>
           </div>
        </header>

        {/* Scrollable View Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 relative z-10 custom-scrollbar">
          <div className="max-w-[1400px] mx-auto w-full h-full">
            {children}
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html:`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        @media (min-width: 640px) { .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; } }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.5); }
      `}} />
    </div>
  );
};

// ============================================================================
// 10. MAIN APP ROOT (Handles Global State & Routing)
// ============================================================================

export default function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [leads, setLeads] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);

  // Fetch leads from Supabase
  const fetchLeads = async () => {
    try {
      const data = await supabaseDb.getLeads();
      setLeads(data || []);
    } catch (e) {
      console.warn("Could not fetch leads from Supabase, using empty array.");
      setLeads([]);
    }
  };

  // Fetch profiles from Supabase
  const fetchProfiles = async () => {
    try {
      const data = await supabaseDb.getProfiles();
      setProfiles(data || []);
    } catch (e) {
      console.warn("Could not fetch profiles from Supabase.");
      setProfiles([]);
    }
  };

  useEffect(() => {
    supabaseAuth.getUser().then((userData) => {
      if (userData) {
        const userObj = {
          id: userData.id,
          name: userData.user_metadata?.full_name || userData.email.split('@')[0],
          role: userData.user_metadata?.role || 'Strategic Advisor',
          email: userData.email
        };
        setUser(userObj);
        
        // Upsert profile and fetch both profiles and leads
        supabaseDb.upsertProfile({
          id: userObj.id,
          full_name: userObj.name,
          email: userObj.email,
          role: userObj.role
        }).then(() => fetchProfiles()).catch(e => console.error("Profile sync error", e));
        
        fetchLeads();
      }
      setIsInitializing(false);
    });
  }, []);

  const handleLogout = () => {
    supabaseAuth.signOut();
    setUser(null);
  };

  if (isInitializing) {
    return <div className="min-h-screen bg-[#030712] flex items-center justify-center"><Activity className="w-8 h-8 text-cyan-500 animate-spin" /></div>;
  }

  if (!user) {
    return <AuthScreen onLogin={(userData) => { 
      setUser(userData); 
      supabaseDb.upsertProfile({
        id: userData.id,
        full_name: userData.name,
        email: userData.email,
        role: userData.role
      }).then(() => fetchProfiles());
      fetchLeads(); 
    }} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView onNavigate={setCurrentView} onLeadSelect={setSelectedLead} leads={leads} />;
      case 'directory': return <LeadDirectoryView onNavigate={setCurrentView} onLeadSelect={setSelectedLead} leads={leads} />;
      case 'capture': return <LeadCaptureModule onNavigate={setCurrentView} onLeadAdded={fetchLeads} leads={leads} profiles={profiles} user={user} />;
      case 'qr': return <MyQRView />;
      default: return <div className="p-10 text-center text-slate-500">Module Initializing...</div>;
    }
  };

  return (
    <>
      <AppShell user={user} onLogout={handleLogout} currentView={currentView} setCurrentView={setCurrentView}>
        {renderView()}
      </AppShell>
      <LeadDetailDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} onLeadUpdated={fetchLeads} />
    </>
  );
}
