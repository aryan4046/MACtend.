import { useState, useEffect } from "react";
import { 
  BarChart3, 
  CalendarDays, 
  Download, 
  PieChart as PieChartIcon, 
  ShieldAlert, 
  AlertTriangle, 
  Wifi, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Mail, 
  Cpu, 
  RefreshCw,
  Activity,
  Sliders,
  UserCheck
} from "lucide-react";
import { 
  getAllAnalysisAttendance, 
  getAtRiskStudents, 
  getProxyCheck, 
  getLiveRssi, 
  getDateDetails,
  EXPORT_EXCEL_URL 
} from "../api";
import CountUp from "react-countup";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { CustomModal } from "../components/CustomModal";

export function AnalysisDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("general");
  
  // At Risk State
  const [atRiskData, setAtRiskData] = useState<any>(null);
  const [isAtRiskLoading, setIsAtRiskLoading] = useState(false);
  
  // Proxy Check State
  const [proxyData, setProxyData] = useState<any>(null);
  const [isProxyLoading, setIsProxyLoading] = useState(false);
  
  // Live RSSI State
  const [rssiData, setRssiData] = useState<any>({});
  const [isRssiLoading, setIsRssiLoading] = useState(false);

  // Grid Date Details State
  const [gridDateDetails, setGridDateDetails] = useState<any>(null);
  const [selectedGridDate, setSelectedGridDate] = useState<string>("");
  const [isGridDetailsLoading, setIsGridDetailsLoading] = useState(false);

  // Modal Dialog State
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info" as 'success' | 'error' | 'warning' | 'info' | 'confirm',
    onConfirm: undefined as (() => void) | undefined
  });

  useEffect(() => {
    fetchGeneralStats();
  }, []);

  // Poll RSSI data every 5 seconds when on the diagnostics tab
  useEffect(() => {
    if (activeTab !== "diagnostics") return;
    
    fetchRssiData();
    const interval = setInterval(fetchRssiData, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Fetch sub-tab data dynamically on tab change
  useEffect(() => {
    if (activeTab === "at-risk") {
      fetchAtRiskData();
    } else if (activeTab === "proxy") {
      fetchProxyData();
    }
  }, [activeTab]);

  const showModal = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' | 'confirm' = 'info', onConfirm?: () => void) => {
    setModal({ isOpen: true, title, message, type, onConfirm });
  };

  const fetchGeneralStats = async () => {
    setIsLoading(true);
    try {
      const res = await getAllAnalysisAttendance();
      if (res.success) {
        setStats(res);
      } else {
        showModal("Error", res.error || "Failed to fetch general data", "error");
      }
    } catch (err) {
      console.error(err);
      showModal("Connection Error", "Could not load dashboard statistics.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAtRiskData = async () => {
    setIsAtRiskLoading(true);
    try {
      const res = await getAtRiskStudents();
      if (res.success) {
        setAtRiskData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAtRiskLoading(false);
    }
  };

  const fetchProxyData = async () => {
    setIsProxyLoading(true);
    try {
      const res = await getProxyCheck();
      if (res.success) {
        setProxyData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProxyLoading(false);
    }
  };

  const fetchRssiData = async () => {
    try {
      const res = await getLiveRssi();
      if (res.success) {
        setRssiData(res.data || {});
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGridDateDetails = async (date: string) => {
    setSelectedGridDate(date);
    setIsGridDetailsLoading(true);
    try {
      const res = await getDateDetails(date);
      if (res.success) {
        setGridDateDetails(res);
      } else {
        setGridDateDetails(null);
      }
    } catch (err) {
      console.error(err);
      setGridDateDetails(null);
    } finally {
      setIsGridDetailsLoading(false);
    }
  };

  const handleSendWarning = (student: any) => {
    showModal(
      "Send Warning Email",
      `Are you sure you want to send an official attendance warning to ${student.name} (${student.enrollment_number})? Their attendance rate is currently ${student.rate}%.`,
      "confirm",
      () => {
        // Simulate warning email send
        setTimeout(() => {
          showModal(
            "Success",
            `Warning notification has been queued and dispatched to ${student.name}'s registered student email.`,
            "success"
          );
        }, 300);
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium text-sm animate-pulse">Loading dashboard intelligence...</p>
      </div>
    );
  }

  const displayHistory = stats?.history?.filter((day: any) => 
    selectedDate ? day.date === selectedDate : true
  ) || [];

  const totalPresent = displayHistory.reduce((acc: number, day: any) => acc + day.present, 0);
  const totalAbsent = displayHistory.reduce((acc: number, day: any) => acc + day.absent, 0);

  const pieData = [
    { name: "Present", value: totalPresent, color: "#10b981" },
    { name: "Absent", value: totalAbsent, color: "#f43f5e" }
  ];

  // Helper calculation for scanner health average
  const rssiKeys = Object.keys(rssiData);
  const rssiCount = rssiKeys.length;
  const activeRssiValues = rssiKeys.map(k => rssiData[k]?.current).filter(v => v !== null);
  const avgRssi = activeRssiValues.length > 0 
    ? Math.round(activeRssiValues.reduce((sum, v) => sum + v, 0) / activeRssiValues.length)
    : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 px-4">
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <BarChart3 className="text-indigo-600" size={32} /> College Attendance Intelligence
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Automated local and Raspberry Pi network-wide aggregations</p>
        </div>
      </div>

      {/* Modern Horizontal Navigation Bar */}
      <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none gap-2 bg-slate-100/50 p-1.5 rounded-2xl border">
        <button
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === "general" 
              ? "bg-white text-indigo-600 shadow-md border-slate-200" 
              : "text-slate-600 hover:text-slate-800 hover:bg-white/50"
          }`}
        >
          <BarChart3 size={18} />
          <span>General Trends</span>
        </button>
        <button
          onClick={() => setActiveTab("heatmap")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === "heatmap" 
              ? "bg-white text-indigo-600 shadow-md border-slate-200" 
              : "text-slate-600 hover:text-slate-800 hover:bg-white/50"
          }`}
        >
          <CalendarDays size={18} />
          <span>Consistency Grid</span>
        </button>
        <button
          onClick={() => setActiveTab("at-risk")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === "at-risk" 
              ? "bg-white text-indigo-600 shadow-md border-slate-200" 
              : "text-slate-600 hover:text-slate-800 hover:bg-white/50"
          }`}
        >
          <AlertTriangle size={18} />
          <span>At-Risk Tracker</span>
        </button>
        <button
          onClick={() => setActiveTab("proxy")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === "proxy" 
              ? "bg-white text-indigo-600 shadow-md border-slate-200" 
              : "text-slate-600 hover:text-slate-800 hover:bg-white/50"
          }`}
        >
          <ShieldAlert size={18} />
          <span>Proxy and Integrity</span>
        </button>
        <button
          onClick={() => setActiveTab("diagnostics")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === "diagnostics" 
              ? "bg-white text-indigo-600 shadow-md border-slate-200" 
              : "text-slate-600 hover:text-slate-800 hover:bg-white/50"
          }`}
        >
          <Wifi size={18} />
          <span>Scanner Diagnostics</span>
        </button>
      </div>

      {/* Main Glassmorphic Display Panel */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl shadow-slate-100/50 border border-slate-200/60 min-h-[350px]">
        
        {/* TAB 1: GENERAL TRENDS */}
        {activeTab === "general" && stats && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Sliders className="text-indigo-500" size={20} /> Daily Attendance Metrics
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">Filter and visualize global attendance percentage</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-500">Filter Date:</span>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs font-bold text-indigo-600 cursor-pointer focus:ring-0"
                />
                {selectedDate && (
                  <button 
                    onClick={() => setSelectedDate("")}
                    className="text-xs text-slate-400 hover:text-rose-500 ml-2 font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-indigo-500/5 to-indigo-500/10 p-5 rounded-2xl border border-indigo-100 flex-1 hover:scale-[1.01] transition-transform duration-300">
                <div className="text-xs font-bold text-indigo-600 tracking-wider uppercase mb-1">Total Enrolled Students</div>
                <div className="text-4xl font-black text-indigo-700">
                  <CountUp start={0} end={stats.total_students} duration={1.5} separator="," />
                </div>
              </div>
              <div className="bg-gradient-to-br from-slate-500/5 to-slate-500/10 p-5 rounded-2xl border border-slate-100 flex-1 hover:scale-[1.01] transition-transform duration-300">
                <div className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-1">Total Active Dates</div>
                <div className="text-4xl font-black text-slate-700">
                  <CountUp start={0} end={displayHistory.length} duration={1.5} />
                </div>
              </div>
            </div>

            {displayHistory.length > 0 ? (
              <div className="space-y-12 mt-6">
                {/* Visual Bar Chart */}
                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  <div className="flex items-end gap-3 h-64 border-b border-slate-200 pb-2 overflow-x-auto pt-8 px-2">
                    {displayHistory.map((day: any, idx: number) => {
                      const presentPercent = stats.total_students > 0 ? Math.round((day.present / stats.total_students) * 100) : 0;
                      const absentPercent = stats.total_students > 0 ? Math.round((day.absent / stats.total_students) * 100) : 0;
                      return (
                        <div key={idx} className="flex flex-col items-center flex-1 min-w-[70px] group relative h-full justify-end">
                          {/* Hover Tooltip card */}
                          <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-2 px-3 rounded-xl whitespace-nowrap z-10 pointer-events-none shadow-xl flex flex-col items-start gap-0.5 border border-slate-700">
                            <span className="font-bold border-b border-slate-700 pb-0.5 w-full">{day.date}</span>
                            <span className="text-emerald-400">Present: {day.present} ({presentPercent}%)</span>
                            <span className="text-rose-400">Absent: {day.absent} ({absentPercent}%)</span>
                          </div>
                          
                          <div className="w-full flex flex-col justify-end h-full gap-1">
                            <div 
                              className="bg-rose-400 w-full rounded-t-md transition-all duration-300 hover:brightness-105" 
                              style={{ height: `${absentPercent}%` }}
                            />
                            <div 
                              className="bg-emerald-500 w-full rounded-b-md transition-all duration-300 hover:brightness-105" 
                              style={{ height: `${presentPercent}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-slate-500 mt-2 font-bold truncate w-full text-center">
                            {day.date.split("-").slice(1).join("/")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Present
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                      <span className="w-3 h-3 rounded-full bg-rose-400 inline-block"></span> Absent
                    </div>
                  </div>
                </div>

                {/* Recharts Pie Chart */}
                <div className="pt-8 border-t border-slate-100">
                  <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center justify-center gap-2">
                    <PieChartIcon className="text-indigo-500" size={18} /> Overall Attendance Ratio
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={6}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value: number) => [value, "Students"]}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: 'rgba(255, 255, 255, 0.9)', padding: '8px 12px' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 font-medium text-sm flex flex-col items-center gap-2 justify-center">
                <Search size={32} className="text-slate-300" />
                <span>No global attendance records found for this selection.</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CONSISTENCY GRID (HEATMAP) */}
        {activeTab === "heatmap" && stats && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <CalendarDays className="text-indigo-500" size={20} /> Consistency Calendar Grid
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">Historical overview of attendance rates by date</p>
            </div>

            {stats.history && stats.history.length > 0 ? (
              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                <div className="flex flex-wrap gap-3 pt-4">
                  {stats.history.map((day: any, idx: number) => {
                    const presentRate = stats.total_students > 0 ? Math.round((day.present / stats.total_students) * 100) : 0;
                    
                    // Determine color weight
                    let colorClass = "bg-slate-100 hover:bg-slate-200";
                    if (presentRate >= 90) colorClass = "bg-emerald-600 hover:bg-emerald-700 text-white";
                    else if (presentRate >= 75) colorClass = "bg-emerald-400 hover:bg-emerald-500 text-white";
                    else if (presentRate >= 50) colorClass = "bg-emerald-200 hover:bg-emerald-300 text-emerald-800";
                    else if (presentRate > 0) colorClass = "bg-amber-200 hover:bg-amber-300 text-amber-800";

                    return (
                      <div 
                        key={idx} 
                        onClick={() => fetchGridDateDetails(day.date)}
                        className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 select-none relative group border border-slate-200/50 ${colorClass}`}
                      >
                        <span className="text-[10px] font-bold">
                          {day.date.split("-").slice(2).join("/")}
                        </span>
                        <span className="text-[9px] opacity-80 font-medium">
                          {presentRate}%
                        </span>

                        {/* Details overlay */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-900 text-white text-[9px] py-1.5 px-2.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-20 border border-slate-700">
                          Date: {day.date}<br/>
                          Present: {day.present} / {stats.total_students}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Color Map Legend */}
                <div className="flex items-center gap-4 mt-8 border-t border-slate-200/60 pt-4 justify-end text-[11px] text-slate-500 font-semibold">
                  <span>Attendance:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-md bg-amber-200 border border-slate-200 inline-block"></span>
                    <span>Low (under 50%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-md bg-emerald-200 border border-slate-200 inline-block"></span>
                    <span>Moderate (50-75%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-md bg-emerald-400 border border-slate-200 inline-block"></span>
                    <span>High (75-90%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-md bg-emerald-600 border border-slate-200 inline-block"></span>
                    <span>Excellent (over 90%)</span>
                  </div>
                </div>

                {/* Selected Date Details Panel */}
                {selectedGridDate && (
                  <div className="mt-8 border-t border-slate-200/60 pt-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-base font-bold text-slate-800">
                          Attendance Details for {selectedGridDate}
                        </h3>
                        <p className="text-xs text-slate-400">Class lectures and aggregate outcomes for this date</p>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedGridDate("");
                          setGridDateDetails(null);
                        }}
                        className="text-xs text-rose-600 hover:text-rose-700 font-bold"
                      >
                        Close Details
                      </button>
                    </div>

                    {isGridDetailsLoading ? (
                      <div className="py-8 text-center text-slate-500 flex flex-col items-center gap-2">
                        <RefreshCw className="animate-spin text-indigo-500" size={20} />
                        <span className="text-xs font-semibold">Retrieving session records...</span>
                      </div>
                    ) : gridDateDetails && gridDateDetails.subjects?.length > 0 ? (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Summary metrics row */}
                        <div className="flex gap-4 text-xs font-bold">
                          <div className="bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 text-slate-700">
                            Total Lectures: <span className="font-extrabold">{gridDateDetails.subjects.length}</span>
                          </div>
                          <div className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl border border-emerald-100">
                            Marking Integrity Check: <span className="font-extrabold">Active</span>
                          </div>
                        </div>

                        {/* Details Table */}
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-200 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                                  <th className="p-4 w-24">Lecture No.</th>
                                  <th className="p-4">Subject Name</th>
                                  <th className="p-4">Faculty Name</th>
                                  <th className="p-4">Present / Total</th>
                                  <th className="p-4 text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-xs">
                                {gridDateDetails.subjects.map((sub: any, sIdx: number) => {
                                  return (
                                    <tr key={sIdx} className="hover:bg-slate-50/40 transition-colors">
                                      <td className="p-4 font-bold text-slate-600">{sIdx + 1}</td>
                                      <td className="p-4">
                                        <span className="font-extrabold text-slate-800 uppercase">{sub.subject_name}</span>
                                      </td>
                                      <td className="p-4 text-slate-500 font-bold">{sub.faculty_name}</td>
                                      <td className="p-4 font-mono font-bold text-slate-700">
                                        {sub.present_count} / {sub.total_count} ({sub.rate}%)
                                      </td>
                                      <td className="p-4 text-center">
                                        <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-black flex items-center justify-center text-[10px] mx-auto shadow-sm shadow-emerald-500/20">
                                          P
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-slate-400 font-medium text-xs border border-dashed border-slate-200 rounded-2xl">
                        No subject-wise attendance logs recorded for this date.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 font-medium text-sm flex flex-col items-center gap-2 justify-center">
                <Search size={32} className="text-slate-300" />
                <span>No grid logs to display. Initialize a session to record data.</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AT-RISK TRACKER */}
        {activeTab === "at-risk" && (
          <div className="space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <AlertTriangle className="text-indigo-500" size={20} /> At-Risk Attendance Monitoring
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">Identify and alert students below academic compliance standards</p>
              </div>
              {atRiskData && (
                <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs px-3 py-1.5 rounded-xl font-bold">
                  Subject: {atRiskData.subject || "All"}
                </span>
              )}
            </div>

            {isAtRiskLoading ? (
              <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-3">
                <RefreshCw className="animate-spin text-indigo-500" size={24} />
                <span className="text-xs font-semibold">Calculating attendance margins...</span>
              </div>
            ) : atRiskData && (atRiskData.critical?.length > 0 || atRiskData.borderline?.length > 0 || atRiskData.good?.length > 0) ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Critical Students */}
                <div className="bg-slate-50/50 border border-slate-200/50 p-5 rounded-2xl space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-rose-600 flex items-center gap-2 border-b border-rose-100 pb-2">
                    <XCircle size={16} /> Critical Limit (Under 75% Attendance)
                  </h3>
                  
                  {atRiskData.critical?.length > 0 ? (
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      {atRiskData.critical.map((student: any) => (
                        <div key={student.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex justify-between items-center hover:shadow transition-shadow">
                          <div className="space-y-1">
                            <p className="font-bold text-slate-800 text-sm">{student.name}</p>
                            <p className="text-xs text-slate-400 font-semibold">{student.enrollment_number} | Sec {student.section}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-rose-500 h-full" style={{ width: `${student.rate}%` }}></div>
                              </div>
                              <span className="text-xs font-black text-rose-500">{student.rate}%</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleSendWarning(student)}
                            className="bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 p-2 rounded-xl transition-all hover:scale-105 active:scale-95"
                            title="Send Warning Email"
                          >
                            <Mail size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-semibold py-4 text-center">No students inside critical limits.</p>
                  )}
                </div>

                {/* Borderline Students */}
                <div className="bg-slate-50/50 border border-slate-200/50 p-5 rounded-2xl space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-amber-600 flex items-center gap-2 border-b border-amber-100 pb-2">
                    <AlertTriangle size={16} /> Borderline Threshold (75% - 80% Attendance)
                  </h3>

                  {atRiskData.borderline?.length > 0 ? (
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      {atRiskData.borderline.map((student: any) => (
                        <div key={student.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex justify-between items-center hover:shadow transition-shadow">
                          <div className="space-y-1">
                            <p className="font-bold text-slate-800 text-sm">{student.name}</p>
                            <p className="text-xs text-slate-400 font-semibold">{student.enrollment_number} | Sec {student.section}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-amber-500 h-full" style={{ width: `${student.rate}%` }}></div>
                              </div>
                              <span className="text-xs font-black text-amber-500">{student.rate}%</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleSendWarning(student)}
                            className="bg-amber-50 border border-amber-100 hover:bg-amber-100 text-amber-600 p-2 rounded-xl transition-all hover:scale-105 active:scale-95"
                            title="Send Warning Email"
                          >
                            <Mail size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-semibold py-4 text-center">No students inside borderline parameters.</p>
                  )}
                </div>

                {/* Good Standing Students */}
                <div className="bg-slate-50/50 border border-slate-200/50 p-5 rounded-2xl space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-emerald-600 flex items-center gap-2 border-b border-emerald-100 pb-2">
                    <CheckCircle2 size={16} /> Good Standing (Above 80% Attendance)
                  </h3>

                  {atRiskData.good?.length > 0 ? (
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      {atRiskData.good.map((student: any) => (
                        <div key={student.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex justify-between items-center hover:shadow transition-shadow">
                          <div className="space-y-1">
                            <p className="font-bold text-slate-800 text-sm">{student.name}</p>
                            <p className="text-xs text-slate-400 font-semibold">{student.enrollment_number} | Sec {student.section}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full" style={{ width: `${student.rate}%` }}></div>
                              </div>
                              <span className="text-xs font-black text-emerald-500">{student.rate}%</span>
                            </div>
                          </div>
                          <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-lg">
                            Compliant
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-semibold py-4 text-center">No students inside good standing.</p>
                  )}
                </div>

              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 font-medium text-sm flex flex-col items-center gap-2 justify-center">
                <CheckCircle2 size={32} className="text-emerald-500" />
                <span className="font-bold text-slate-700 text-base">Compliant Standings</span>
                <span>All registered student accounts have attendance rates exceeding 80%.</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PROXY AND INTEGRITY */}
        {activeTab === "proxy" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ShieldAlert className="text-indigo-500" size={20} /> Academic Integrity and Device Scan Checks
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">Detect duplicate IP registrations and unregistered hardware signals</p>
            </div>

            {isProxyLoading ? (
              <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-3">
                <RefreshCw className="animate-spin text-indigo-500" size={24} />
                <span className="text-xs font-semibold">Running verification filters...</span>
              </div>
            ) : proxyData ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Duplicate Registered IP Check */}
                <div className="bg-slate-50/50 border border-slate-200/50 p-5 rounded-2xl space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-200 pb-2">
                    <ShieldAlert size={16} className="text-rose-500" /> Duplicate Registered IP Check
                  </h3>
                  
                  {proxyData.duplicate_ips?.length > 0 ? (
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      {proxyData.duplicate_ips.map((dup: any, idx: number) => (
                        <div key={idx} className="bg-white border border-rose-100 p-4 rounded-xl shadow-sm space-y-2 border-l-4 border-l-rose-500">
                          <p className="text-xs font-black text-rose-600 uppercase tracking-wide bg-rose-50 px-2.5 py-1 rounded-lg w-max">
                            IP: {dup.ip} ({dup.count} Devices)
                          </p>
                          <div className="space-y-1.5 pl-1">
                            {dup.students.map((st: any) => (
                              <p key={st.id} className="text-xs text-slate-600 font-bold">
                                • {st.name} ({st.enrollment_number}) - Section {st.section}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400 flex flex-col items-center gap-2">
                      <CheckCircle2 size={24} className="text-emerald-500" />
                      <span className="text-xs font-bold text-slate-700">No Duplicate Registrations</span>
                      <span className="text-[11px] text-slate-400">All registered devices are utilizing unique client IPs.</span>
                    </div>
                  )}
                </div>

                {/* Unmatched Bluetooth/Wi-Fi Signals */}
                <div className="bg-slate-50/50 border border-slate-200/50 p-5 rounded-2xl space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-200 pb-2">
                    <Wifi size={16} className="text-indigo-500" /> Unknown Local Signals In Range
                  </h3>

                  {proxyData.unmatched_macs?.length > 0 ? (
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      <p className="text-[11px] text-slate-400 leading-normal pl-1">
                        The following MAC addresses were captured by the Raspberry Pi scan cycle but do not match any registered student:
                      </p>
                      {proxyData.unmatched_macs.map((mac: string, idx: number) => (
                        <div key={idx} className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 font-mono text-xs text-slate-700 hover:border-indigo-200">
                          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                          {mac}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400 flex flex-col items-center gap-2">
                      <CheckCircle2 size={24} className="text-emerald-500" />
                      <span className="text-xs font-bold text-slate-700">Clean Local Workspace</span>
                      <span className="text-[11px] text-slate-400">No unregistered client devices detected near local scanners.</span>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 font-medium text-sm flex flex-col items-center gap-2 justify-center">
                <Search size={32} className="text-slate-300" />
                <span>Initialize an active session to process proxy detection algorithms.</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SCANNER DIAGNOSTICS */}
        {activeTab === "diagnostics" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Cpu className="text-indigo-500" size={20} /> IoT Scan Diagnostics
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">Real-time RSSI signal strengths from the active scanner</p>
              </div>
              <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span> Live Scanner Online
              </span>
            </div>

            {/* Health Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-xl flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Activity size={20} />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Active Clients</div>
                  <div className="text-lg font-black text-slate-700">{rssiCount} Clients</div>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-xl flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Wifi size={20} />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Average RSSI Strength</div>
                  <div className="text-lg font-black text-slate-700">{avgRssi ? `${avgRssi} dBm` : "No Readings"}</div>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-xl flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                  <UserCheck size={20} />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Active Scan Rate</div>
                  <div className="text-lg font-black text-slate-700">Every 5 Seconds</div>
                </div>
              </div>
            </div>

            {/* RSSI List */}
            {rssiCount > 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-200 font-bold text-xs text-slate-500 uppercase">
                        <th className="p-4">Device Reference</th>
                        <th className="p-4">Current Signal</th>
                        <th className="p-4">Average</th>
                        <th className="p-4">Stability</th>
                        <th className="p-4 text-center">Quality Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {rssiKeys.map((key) => {
                        const item = rssiData[key];
                        // Assign status styling
                        let qualityBg = "bg-slate-100 text-slate-700 border-slate-200";
                        if (item.quality === "Excellent" || item.quality === "Good") {
                          qualityBg = "bg-emerald-50 text-emerald-700 border-emerald-100";
                        } else if (item.quality === "Fair") {
                          qualityBg = "bg-amber-50 text-amber-700 border-amber-100";
                        } else if (item.quality === "Weak" || item.quality === "Very Weak") {
                          qualityBg = "bg-rose-50 text-rose-700 border-rose-100";
                        }

                        return (
                          <tr key={key} className="hover:bg-slate-50/40 transition-colors">
                            <td className="p-4">
                              <div>
                                <p className="font-bold text-slate-800">{key.substring(0, 12)}...</p>
                                <p className="text-[10px] text-slate-400 font-mono uppercase font-bold">Client ID Reference</p>
                              </div>
                            </td>
                            <td className="p-4 font-mono font-bold text-slate-700">{item.current} dBm</td>
                            <td className="p-4 font-mono text-slate-500">{item.average} dBm</td>
                            <td className="p-4 font-bold text-slate-600">
                              <div className="flex items-center gap-1.5">
                                <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-indigo-500 h-full" style={{ width: `${item.stability_pct}%` }}></div>
                                </div>
                                <span className="text-xs">{item.stability_pct}%</span>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border inline-block ${qualityBg}`}>
                                {item.quality}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 font-medium text-sm flex flex-col items-center gap-2 justify-center border border-dashed border-slate-200 rounded-2xl">
                <Wifi size={32} className="text-slate-300 animate-pulse" />
                <span className="font-bold text-slate-700 text-base">Waiting for client handshakes...</span>
                <span>No active client signals detected by the Raspberry Pi scanning core.</span>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Floating Action Button for Report Export */}
      <a
        href={EXPORT_EXCEL_URL}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-8 right-8 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-full font-bold shadow-2xl hover:shadow-emerald-500/50 transition-all hover:-translate-y-1 z-50 group border border-emerald-500"
      >
        <Download size={20} className="group-hover:animate-bounce" /> 
        <span>Export Report</span>
      </a>

      {/* Modal Integration */}
      <CustomModal 
        isOpen={modal.isOpen}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modal.onConfirm}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </div>
  );
}
