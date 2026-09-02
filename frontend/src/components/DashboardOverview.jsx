import React, { useMemo } from 'react';
import { FileText, Plus, Truck, Clock, Zap } from 'lucide-react';
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Overview Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Monitor heavy equipment operations and logs.</p>
        </div>
        <button 
          onClick={() => onNavigate('new-cardlog')}
          className="flex items-center px-4 py-2.5 bg-[#b52025] text-white rounded-md font-bold hover:bg-[#8c191c] transition-colors"
        >
          <Plus className="w-5 h-5 mr-1.5" />
          New Cardlog
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Cardlogs', value: stats.totalCardlogs, icon: FileText, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Unit Beroperasi', value: stats.activeUnits, icon: Truck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Total HM Terakumulasi', value: stats.totalHM, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Total Jam Charging', value: stats.totalCharging, icon: Zap, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-950 rounded-md p-6 border border-gray-200 dark:border-gray-800">
            <div className={`w-12 h-12 rounded-md ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</h3>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{loading ? '...' : stat.value}</p>
          </div>
        ))}
      </div>

      {/* Primary Chart */}
      <div className="bg-white dark:bg-gray-950 rounded-md p-6 border border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Tren Cardlog (7 Hari Terakhir)</h2>
        <div className="h-80 w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center text-gray-500">Loading chart...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b52025" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#b52025" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                />
                <Area type="monotone" dataKey="count" stroke="#b52025" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" name="Jumlah Cardlog" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* HM Per Unit */}
        <div className="bg-white dark:bg-gray-950 rounded-md p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Total HM per Unit (Top 10)</h2>
          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-500">Loading chart...</div>
            ) : hmPerUnitData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">Tidak ada data HM</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hmPerUnitData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="unit" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f3f4f6'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                  />
                  <Bar dataKey="hm" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total HM" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Distribusi Shift */}
        <div className="bg-white dark:bg-gray-950 rounded-md p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Distribusi Shift</h2>
          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-500">Loading chart...</div>
            ) : shiftData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">Tidak ada data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={shiftData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {shiftData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Frekuensi Masalah Checklist */}
        <div className="bg-white dark:bg-gray-950 rounded-md p-6 border border-gray-200 dark:border-gray-800 lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Frekuensi Kendala/Masalah per Item</h2>
          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-500">Loading chart...</div>
            ) : issueData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">Semua item checklist dalam kondisi baik! 🎉</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={issueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="item" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#fef2f2'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                  />
                  <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} name="Total Laporan Kendala" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
