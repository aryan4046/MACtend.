import { useState, useEffect } from "react";
import { Link } from "react-router";
import { 
  Users, Download, Check, X, Search, RefreshCw, AlertCircle, Laptop
} from "lucide-react";
import { getAttendance, toggleAttendance, getSessionStatus, EXPORT_URL } from "../api";

export function LiveAttendance() {
  const [logs, setLogs] = useState<any[]>([]);
  const [sessionStatus, setSessionStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const [attendRes, statusRes] = await Promise.all([
        getAttendance(),
        getSessionStatus()
      ]);

      if (attendRes.success) {
        setLogs(attendRes.logs);
      }
      if (statusRes.is_active) {
        setSessionStatus(statusRes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (studentId: string, subject: string, currentStatus: string) => {
    const isCurrentlyPresent = currentStatus !== "--:--";
    // Optimistic UI Update
    setLogs(prev => prev.map(log => 
      log.studentId === studentId 
        ? { ...log, time: isCurrentlyPresent ? "--:--" : new Date().toLocaleTimeString(), source: "manual" } 
        : log
    ));

    try {
      await toggleAttendance({
        studentId,
        subject,
        present: !isCurrentlyPresent,
        source: "manual"
      });
    } catch (err) {
      // Revert if failed
      alert("Failed to toggle attendance status.");
      fetchLogs();
    }
  };

  const filteredLogs = (logs || []).filter(l => 
    (l.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (l.enrollmentNumber || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-blue-600" /> Live Attendance Log
          </h1>
          <p className="text-slate-500">Real-time device tracking and connection log</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={fetchLogs} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="Refresh">
            <RefreshCw size={20} className={isLoading ? "animate-spin text-blue-600" : ""} />
          </button>
          <a
            href={EXPORT_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Download size={16} /> Export CSV
          </a>
        </div>
      </div>

      <div className="bg-white border text-left border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="relative max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-slate-400" size={18} />
            </div>
            <input
              type="text"
              placeholder="Search student or enrollment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Student Name</th>
                <th className="px-6 py-4 font-semibold">Enrollment No.</th>
                <th className="px-6 py-4 font-semibold">Subject</th>
                <th className="px-6 py-4 font-semibold">Network Status</th>
                <th className="px-6 py-4 font-semibold">Marked At</th>
                <th className="px-6 py-4 font-semibold text-center">Attendance</th>
                <th className="px-6 py-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <AlertCircle className="mx-auto mb-2 text-slate-400" size={32} />
                    {isLoading ? "Loading logs..." : "No attendance logs found for this session."}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{log.name}</td>
                    <td className="px-6 py-4 text-slate-600">{log.enrollmentNumber}</td>
                    <td className="px-6 py-4 text-slate-600">{log.subject}</td>
                    <td className="px-6 py-4">
                      {log.is_online ? (
                        <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Online
                        </span>
                      ) : (
                         <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                           <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                           Offline
                         </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{log.time || "--:--"}</td>
                    <td className="px-6 py-4 text-center">
                       <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold leading-5 ${
                         log.time !== "--:--" 
                           ? "bg-blue-100 text-blue-800" 
                           : "bg-rose-100 text-rose-800"
                       }`}>
                         {log.time !== "--:--" ? "Present" : "Absent"}
                       </span>
                       <div className="text-[10px] text-slate-400 mt-1 capitalize">{log.source}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <button
                         onClick={() => handleToggle(log.studentId, log.subject, log.time)}
                         className={`p-1.5 rounded-lg border transition-colors ${
                           log.time !== "--:--" 
                             ? "text-blue-600 border-blue-200 hover:bg-blue-50 bg-white" 
                             : "text-rose-600 border-rose-200 hover:bg-rose-50 bg-white"
                         }`}
                         title={`Mark as ${log.time !== "--:--" ? "Absent" : "Present"}`}
                       >
                         {log.time !== "--:--" ? <Check size={16} /> : <X size={16} />}
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {sessionStatus?.unmatched_macs && sessionStatus.unmatched_macs.length > 0 && (
          <div className="bg-slate-50 p-6 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Laptop size={16} /> Unregistered Devices Nearby ({sessionStatus.unmatched_macs.length})
            </h3>
            <div className="flex flex-wrap gap-3">
              {sessionStatus.unmatched_macs.map((mac: string) => (
                <div key={mac} className="bg-white border border-slate-200 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-sm hover:border-blue-200 transition-colors group">
                  <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-blue-400" />
                  <span className="font-mono text-sm text-slate-600 font-medium">{mac}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">UNLINKED</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-400 italic">
              Note: These devices are in the room but their Hardware ID isn't registered to a student in this class.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
