import { useState, useEffect } from "react";
import { Link } from "react-router";
import { 
  PlayCircle, Square, Clock, Users, Laptop, Radio, Activity,
  ChevronRight, CalendarDays
} from "lucide-react";
import { 
  getSessionStatus, 
  getSessionStats, 
  getSections, 
  startSession, 
  stopSession 
} from "../api";

export function TeacherDashboard() {
  const [isActive, setIsActive] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [stats, setStats] = useState({ total_students: 0, present: 0, absent: 0, live_devices: 0 });
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  
  // Form State
  const [programme, setProgramme] = useState("");
  const [college, setCollege] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    checkStatus();
    
    // Poll stats if active
    const statsInterval = setInterval(() => {
      if (isActive) pollStats();
    }, 5000);

    // Sync status every 15 seconds to ensure timer is correct
    const syncInterval = setInterval(() => {
      if (isActive) checkStatus();
    }, 15000);
    
    return () => {
      clearInterval(statsInterval);
      clearInterval(syncInterval);
    };
  }, [isActive]);

  // Local Countdown Timer
  useEffect(() => {
    let timer: any;
    if (isActive && remainingSeconds > 0) {
      timer = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            setIsActive(false); // Auto-stop UI
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, remainingSeconds]);

  useEffect(() => {
    loadSections();
  }, [programme, college, branch, semester]);

  const checkStatus = async () => {
    try {
      const res = await getSessionStatus();
      setIsActive(res.is_active);
      if (res.is_active) {
        setSessionInfo(res);
        setRemainingSeconds(res.remaining_seconds || 0);
        pollStats();
      } else {
        setSessionInfo(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const pollStats = async () => {
    try {
      const res = await getSessionStats();
      setStats({
        total_students: res.total || 0,
        present: res.present || 0,
        absent: res.absent || 0,
        live_devices: res.live || 0
      });
    } catch (e) {
      console.error(e);
    }
  };


  const loadSections = async () => {
    try {
      const res = await getSections(programme, college, branch, semester);
      if (res.sections) {
        setAvailableSections(res.sections);
      }
    } catch (e) {
      console.error("Sections load failed", e);
    }
  };

  const toggleSection = (sec: string) => {
    if (selectedSections.includes(sec)) {
      setSelectedSections(selectedSections.filter(s => s !== sec));
    } else {
      setSelectedSections([...selectedSections, sec]);
    }
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSections.length === 0) {
      alert("Please select at least one section");
      return;
    }
    if (!subject) {
      alert("Please enter a subject name");
      return;
    }

    setIsStarting(true);
    try {
      const res = await startSession({ 
        programme, 
        college,
        branch, 
        semester, 
        sections: selectedSections, 
        subject 
      });
      if (res.success) {
        setIsActive(true);
        setRemainingSeconds(300); // 5 mins
        pollStats();
      } else {
        alert("Failed to start session: " + (res.message || res.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Cannot reach backend.");
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    if (!confirm("Are you sure you want to stop the active session?")) return;
    try {
      await stopSession();
      setIsActive(false);
      setStats({ total_students: 0, present: 0, absent: 0, live_devices: 0 });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Faculty Dashboard</h1>
          <p className="text-slate-500">Manage classes and live attendance networking</p>
        </div>
        {isActive && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-100 font-bold shadow-sm">
              <Clock size={18} />
              {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')}
            </div>
            <div className="flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-2 rounded-full border border-rose-100 font-semibold shadow-sm animate-pulse">
              <Radio size={18} className="animate-ping absolute opacity-20" />
              <Radio size={18} />
              Session In Progress
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Actions / Setup */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <PlayCircle className="text-blue-500" /> Session Controls
            </h2>

            {!isActive ? (
              <form onSubmit={handleStart} className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">College</label>
                    <select value={college} onChange={e => setCollege(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select College</option>
                      <option value="SOCET">SOCET</option>
                      <option value="ASOIT">ASOIT</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Programme</label>
                    <select value={programme} onChange={e => setProgramme(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Programme</option>
                      <option value="BTech">B.Tech</option>
                      <option value="MTech">M.Tech</option>
                      <option value="MCA">MCA</option>
                      <option value="BCA">BCA</option>
                      <option value="MBA">MBA</option>
                      <option value="Diploma">Diploma</option>
                      <option value="BSc">B.Sc</option>
                      <option value="MSc">M.Sc</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Branch</label>
                    <select value={branch} onChange={e => setBranch(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Branch</option>
                      <option value="CSE">CSE</option>
                      <option value="IT">IT</option>
                      <option value="ECE">ECE</option>
                      <option value="ME">ME</option>
                      <option value="Civil">Civil</option>
                      <option value="Chemical">Chemical</option>
                      <option value="Automobile">Automobile</option>
                      <option value="Electrical">Electrical</option>
                      <option value="AIML">AIML</option>
                      <option value="DS">Data Science</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Semester</label>
                    <select value={semester} onChange={e => setSemester(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Sem</option>
                      {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={String(s)}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Subject</label>
                  <select 
                    value={subject} 
                    onChange={e => setSubject(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Subject</option>
                    <option value="FSWD">FSWD</option>
                    <option value="AOC">AOC</option>
                    <option value="IOT">IOT</option>
                    <option value="AJ">AJ</option>
                    <option value="FAIML">FAIML</option>
                    <option value="ABDM">ABDM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-2">Select Sections (Use Checkboxes for Multiple Classes)</label>
                  <div className="flex flex-wrap gap-4 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                    {["A", "B", "C", "D"].map(sec => (
                      <label key={sec} className="flex items-center gap-2 cursor-pointer group">
                        <input
                           type="checkbox"
                           className="w-5 h-5 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                           checked={selectedSections.includes(sec)}
                           onChange={() => toggleSection(sec)}
                        />
                        <span className="text-slate-700 font-semibold group-hover:text-slate-900 transition-colors">Section {sec}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={isStarting} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold flex items-center justify-center gap-2 py-3 rounded-xl shadow-md transition-all">
                    <PlayCircle size={20} /> {isStarting ? "Starting Network Scanner..." : "Start Network Session"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-6">
                <Activity className="mx-auto text-rose-500 animate-pulse" size={48} />
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Scanner Network Active</h3>
                  
                  {sessionInfo && (
                    <div className="mt-4 flex flex-col items-center gap-2">
                       <div className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
                        {sessionInfo.subject}
                      </div>
                      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span className="font-semibold text-slate-700">{sessionInfo.college}</span>
                        <span className="text-slate-300">|</span>
                        <span>{sessionInfo.programme} - {sessionInfo.branch}</span>
                        <span className="text-slate-300">|</span>
                        <span>Sem {sessionInfo.semester}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Monitoring: <span className="text-slate-600 font-mono font-bold">Section {sessionInfo.sections?.join(", ")}</span>
                        <span className="mx-2 text-slate-300">•</span>
                        <span className={`font-bold ${stats.live_devices > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                          {stats.live_devices} Devices Online
                        </span>
                      </div>
                    </div>
                  )}

                  {!sessionInfo && (
                    <p className="text-slate-500 mt-1">
                      System is actively listening for registered student devices.
                    </p>
                  )}
                </div>
                <div className="flex gap-4 justify-center">
                  <Link to="/admin/attendance" className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 px-6 py-2.5 rounded-xl font-semibold transition-colors flex items-center gap-2">
                    <Users size={18} /> View Live Log
                  </Link>
                  <button onClick={handleStop} className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors shadow-mdflex items-center gap-2 flex">
                    <Square size={18} /> End Session
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Timetable & Stats */}
        <div className="space-y-6">
          {isActive && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
               <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Activity className="text-indigo-500" /> Live Stats
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-sm text-slate-500 mb-1">Present</div>
                  <div className="text-3xl font-bold text-emerald-600">{stats.present}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-sm text-slate-500 mb-1">Absent</div>
                  <div className="text-3xl font-bold text-rose-600">{stats.absent}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 col-span-2 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Active Network Devices</div>
                    <div className="text-2xl font-bold text-blue-600">{stats.live_devices}</div>
                  </div>
                  <Laptop className="text-blue-200" size={40} />
                </div>
              </div>
            </div>
          )}

      </div>
    </div>
  </div>
);
}
