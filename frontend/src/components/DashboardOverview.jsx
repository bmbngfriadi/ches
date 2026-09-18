import React, { useMemo } from 'react';
import { FileText, Plus, Truck, Clock, Zap, Forklift } from 'lucide-react';
import { 
  AreaChart, Area, 
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

export default function DashboardOverview({ cardlogs, loading, onNavigate }) {
  // Compute actual statistics
  const stats = useMemo(() => {
    let totalHM = 0;
    let totalCharging = 0;
    const uniqueUnits = new Set();
    
    cardlogs.forEach(log => {
      uniqueUnits.add(log.unit_no);
      const hmDiff = parseFloat(log.hm_akhir) - parseFloat(log.hm_awal);
      if (!isNaN(hmDiff) && hmDiff > 0) totalHM += hmDiff;
      
      const charge = parseFloat(log.charging_durasi);
      if (!isNaN(charge) && charge > 0) totalCharging += charge;
    });

    return {
      totalCardlogs: cardlogs.length,
      activeUnits: uniqueUnits.size,
      totalHM: totalHM.toFixed(2),
      totalCharging: totalCharging.toFixed(2)
    };
  }, [cardlogs]);

  // Compute chart data (Cardlogs per day, last 7 days)
  const chartData = useMemo(() => {
    const dataMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dataMap[dateStr] = { date: dateStr, count: 0 };
    }
    
    cardlogs.forEach(log => {
      const dateStr = new Date(log.date).toISOString().split('T')[0];
      if (dataMap[dateStr] !== undefined) {
        dataMap[dateStr].count += 1;
      }
    });
    
    return Object.values(dataMap).map(item => ({
      ...item,
      displayDate: new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    }));
  }, [cardlogs]);

  // Compute HM per Unit
  const hmPerUnitData = useMemo(() => {
    const unitHMs = {};
    cardlogs.forEach(log => {
      const diff = parseFloat(log.hm_akhir) - parseFloat(log.hm_awal);
      if (!isNaN(diff) && diff > 0) {
        if (!unitHMs[log.unit_no]) unitHMs[log.unit_no] = 0;
        unitHMs[log.unit_no] += diff;
      }
    });
    return Object.entries(unitHMs)
      .map(([unit, hm]) => ({ unit, hm: parseFloat(hm.toFixed(2)) }))
      .sort((a,b) => b.hm - a.hm)
      .slice(0, 10); // top 10 units
  }, [cardlogs]);

  // Compute Checklist Issues
  const issueData = useMemo(() => {
    const issues = {};
    const checklistKeys = [
      'lampu_depan', 'lampu_belakang', 'ban_depan', 'ban_belakang',
      'klakson', 'alarm_mundur', 'rem_jalan', 'rem_parkir', 'sabuk_pengaman', 'kebersihan'
    ];
    cardlogs.forEach(log => {
      checklistKeys.forEach(k => {
        const val = log[k];
        if (val && val.toLowerCase() !== 'baik') {
          const label = k.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          if (!issues[label]) issues[label] = 0;
          issues[label]++;
        }
      });
    });
    return Object.entries(issues)
      .map(([item, count]) => ({ item, count }))
      .sort((a,b) => b.count - a.count);
  }, [cardlogs]);

  // Compute Shift Distribution
  const shiftData = useMemo(() => {
    const shifts = { 'Shift 1': 0, 'Shift 2': 0, 'Shift 3': 0 };
    cardlogs.forEach(log => {
      let s = log.shift_no;
      if (s === '1') s = 'Shift 1';
      else if (s === '2') s = 'Shift 2';
      else if (s === '3') s = 'Shift 3';
      
      if (shifts[s] !== undefined) shifts[s]++;
      else shifts[s] = 1;
    });
    return Object.entries(shifts)
      .map(([name, value]) => ({ name, value }))
      .filter(d => d.value > 0);
  }, [cardlogs]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Overview Dashboard</h1>
          <p>Monitor heavy equipment operations and logs.</p>
        </div>
        <button 
          onClick={() => onNavigate('new-cardlog')}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          New Cardlog
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {[
          { label: 'Total Cardlogs', value: stats.totalCardlogs, icon: FileText, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Unit Beroperasi', value: stats.activeUnits, icon: Forklift, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Total HM Terakumulasi', value: stats.totalHM, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Total Jam Charging', value: stats.totalCharging, icon: Zap, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        ].map((stat, i) => (
          <div key={i} className="stat-card">
            <div className={`stat-icon-box ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">{stat.label}</h3>
            <p className="text-3xl font-black text-[var(--text-primary)] mt-1 tracking-tight">{loading ? '...' : stat.value}</p>
          </div>
        ))}
      </div>

      {/* Primary Chart */}
      <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-color)] shadow-sm">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6">Tren Cardlog (7 Hari Terakhir)</h2>
        <div className="h-80 w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-[var(--primary-500)]/30 border-t-[var(--primary-500)] rounded-full animate-spin"></div></div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-500)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary-500)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 600}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--surface)' }}
                  labelStyle={{ fontWeight: '800', color: 'var(--text-primary)' }}
                  itemStyle={{ color: 'var(--primary-600)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="count" stroke="var(--primary-500)" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" name="Jumlah Cardlog" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* HM Per Unit */}
        <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-color)] shadow-sm">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6">Total HM per Unit (Top 10)</h2>
          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-[var(--primary-500)]/30 border-t-[var(--primary-500)] rounded-full animate-spin"></div></div>
            ) : hmPerUnitData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[var(--text-secondary)] font-medium">Tidak ada data HM</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hmPerUnitData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="unit" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 600}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 600}} />
                  <Tooltip 
                    cursor={{fill: 'var(--surface-hover)'}}
                    contentStyle={{ borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--surface)' }}
                    labelStyle={{ fontWeight: '800', color: 'var(--text-primary)' }}
                    itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="hm" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Total HM" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Distribusi Shift */}
        <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-color)] shadow-sm">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6">Distribusi Shift</h2>
          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-[var(--primary-500)]/30 border-t-[var(--primary-500)] rounded-full animate-spin"></div></div>
            ) : shiftData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[var(--text-secondary)] font-medium">Tidak ada data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={shiftData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={6}
                  >
                    {shiftData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--surface)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-secondary)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Frekuensi Masalah Checklist */}
        <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border-color)] shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6">Frekuensi Kendala/Masalah per Item</h2>
          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-[var(--primary-500)]/30 border-t-[var(--primary-500)] rounded-full animate-spin"></div></div>
            ) : issueData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">Semua item checklist dalam kondisi baik! 🎉</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={issueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="item" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 600}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 600}} />
                  <Tooltip 
                    cursor={{fill: 'var(--surface-hover)'}}
                    contentStyle={{ borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--surface)' }}
                    labelStyle={{ fontWeight: '800', color: 'var(--text-primary)' }}
                    itemStyle={{ color: '#ef4444', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" fill="#ef4444" radius={[6, 6, 0, 0]} name="Total Laporan Kendala" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
