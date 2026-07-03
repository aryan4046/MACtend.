import { useState, useEffect } from "react";
import { BarChart3, CalendarDays, Download, PieChart as PieChartIcon } from "lucide-react";
import { getAllAnalysisAttendance, EXPORT_EXCEL_URL } from "../api";
import CountUp from "react-countup";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";

export function AnalysisDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await getAllAnalysisAttendance();
      if (res.success) {
        setStats(res);
      } else {
        alert(res.error || "Failed to fetch data");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
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
    { name: "Absent", value: totalAbsent, color: "#fb7185" }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="text-blue-600" /> College-Wide Attendance Analysis
          </h1>
          <p className="text-slate-500">Automated global historical data aggregation</p>
        </div>
      </div>

      {stats && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
             <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               <CalendarDays className="text-blue-500" /> Daily Global Trends
             </h2>
             <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <span className="text-sm font-medium text-slate-600">Filter Date:</span>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm font-bold text-blue-600 cursor-pointer focus:ring-0"
                />
                {selectedDate && (
                  <button 
                    onClick={() => setSelectedDate("")}
                    className="text-xs text-slate-400 hover:text-red-500 ml-2 font-medium"
                  >
                    Clear
                  </button>
                )}
             </div>
           </div>

           <div className="mb-6 flex items-center gap-6">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex-1">
                 <div className="text-sm font-medium text-blue-600 mb-1">Total Enrolled Students</div>
                 <div className="text-3xl font-black text-blue-700">
                   <CountUp start={0} end={stats.total_students} duration={2} separator="," />
                 </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex-1">
                 <div className="text-sm font-medium text-slate-500 mb-1">Total Active Dates</div>
                 <div className="text-3xl font-black text-slate-700">
                   <CountUp start={0} end={displayHistory.length} duration={2} />
                 </div>
              </div>
           </div>

           {displayHistory.length > 0 ? (
             <div className="mt-8 space-y-12">
               {/* Bar Chart Section */}
               <div>
                 <div className="flex items-end gap-2 h-64 border-b border-slate-200 pb-2 overflow-x-auto pt-8 px-2">
                 {displayHistory.map((day: any, idx: number) => {
                   const presentPercent = stats.total_students > 0 ? Math.round((day.present / stats.total_students) * 100) : 0;
                   const absentPercent = stats.total_students > 0 ? Math.round((day.absent / stats.total_students) * 100) : 0;
                   return (
                     <div key={idx} className="flex flex-col items-center flex-1 min-w-[60px] group relative">
                       {/* Tooltip */}
                       <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                          {day.date}<br/>
                          Present: {day.present} ({presentPercent}%)
                       </div>
                       
                       <div className="w-full flex flex-col justify-end h-full gap-1">
                         <div 
                           className="bg-rose-400 w-full rounded-t-sm transition-all duration-500 hover:brightness-110" 
                           style={{ height: `${absentPercent}%` }}
                         />
                         <div 
                           className="bg-emerald-500 w-full rounded-b-sm transition-all duration-500 hover:brightness-110" 
                           style={{ height: `${presentPercent}%` }}
                         />
                       </div>
                       <div className="text-xs text-slate-500 mt-2 font-medium truncate w-full text-center" title={day.date}>
                         {day.date.split("-").slice(1).join("/")}
                       </div>
                     </div>
                   );
                 })}
               </div>
               <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                     <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Present
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                     <span className="w-3 h-3 rounded-full bg-rose-400 inline-block"></span> Absent
                  </div>
               </div>
               </div>

               {/* Advanced Pie Chart Section */}
               <div className="pt-8 border-t border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 justify-center">
                    <PieChartIcon className="text-indigo-500" /> Overall Attendance Distribution
                  </h3>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value: number) => [value, "Students"]}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
               </div>

             </div>
           ) : (
             <div className="py-12 text-center text-slate-500">
                No global attendance records found for this selection.
             </div>
           )}
        </div>
      )}

      {/* Floating Action Button for Export */}
      <a
        href={EXPORT_EXCEL_URL}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-8 right-8 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-full font-bold shadow-2xl hover:shadow-emerald-500/50 transition-all hover:-translate-y-1 z-50 group"
      >
        <Download size={20} className="group-hover:animate-bounce" /> 
        <span>Export Report</span>
      </a>
    </div>
  );
}
