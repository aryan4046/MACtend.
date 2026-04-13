import React from "react";
import { useNavigate } from "react-router";
import { GraduationCap, ShieldCheck, ArrowRight, Zap, Target, Cpu } from "lucide-react";

export function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-slate-50 flex items-center justify-center p-4 overflow-hidden selection:bg-blue-500/30">
      
      {/* Premium Animated Background (Light Theme Variants) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-blue-200/40 to-indigo-200/40 blur-[100px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-cyan-200/40 to-blue-200/40 blur-[120px] animate-[pulse_10s_ease-in-out_infinite_reverse]" />
        
        {/* Subtle dot matrix overlay for that tech feel (darkened for light mode) */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMCwyMCw1MCwwLjA0KSIvPjwvc3ZnPg==')] opacity-60 mix-blend-multiply mask-image:linear-gradient(to_bottom,black,transparent)]" />
      </div>

      <div className="w-full max-w-5xl z-10 flex flex-col items-center">
        
        {/* Main Header Sector */}
        <div className="text-center space-y-6 mb-16 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mx-auto animate-[fade-in-down_1s_ease-out]">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Intelligent Attendance Mesh</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 drop-shadow-sm">
            MAC<span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-600 to-indigo-600">tend</span>
            <span className="text-blue-600 animate-pulse">.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
            Next-generation automated gateway. Select your authorization protocol to access the ecosystem.
          </p>
        </div>

        {/* Selection Cards (Light Glassmorphism & Auto-Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full px-4">
          
          {/* Faculty Card */}
          <div 
            onClick={() => navigate("/teacher/login")}
            className="group relative h-[380px] rounded-[2.5rem] bg-white/80 border border-white backdrop-blur-2xl overflow-hidden hover:bg-white hover:border-blue-200 hover:shadow-[0_20px_50px_-12px_rgba(37,99,235,0.15)] shadow-xl shadow-slate-200/50 transition-all duration-700 cursor-pointer flex flex-col justify-end p-10 hover:-translate-y-2"
          >
            {/* Ambient inner glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-50/0 via-blue-50/0 to-blue-50/80 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* Top Icon Badge */}
            <div className="absolute top-10 right-10 w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-lg shadow-blue-100 group-hover:scale-110 group-hover:rotate-12 group-hover:bg-blue-600 transition-all duration-500">
               <ShieldCheck className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors duration-500" />
            </div>

            {/* Content block */}
            <div className="relative z-10 space-y-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Faculty<br/>Portal</h2>
              <p className="text-slate-500 text-sm leading-relaxed max-w-[80%]">
                Deploy live network sessions, manage admin roles, and secure classroom presence via MAC authentication.
              </p>
              
              <div className="pt-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-blue-200">
                  <ArrowRight className="w-5 h-5" />
                </div>
                <span className="text-blue-700 font-bold tracking-widest text-sm uppercase opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 delay-100">
                  Authenticate
                </span>
              </div>
            </div>
          </div>

          {/* Student Card */}
          <div 
            onClick={() => navigate("/student/register")}
             className="group relative h-[380px] rounded-[2.5rem] bg-white/80 border border-white backdrop-blur-2xl overflow-hidden hover:bg-white hover:border-cyan-200 hover:shadow-[0_20px_50px_-12px_rgba(6,182,212,0.15)] shadow-xl shadow-slate-200/50 transition-all duration-700 cursor-pointer flex flex-col justify-end p-10 hover:-translate-y-2"
          >
            {/* Ambient inner glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-50/0 via-cyan-50/0 to-cyan-50/80 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* Top Icon Badge */}
            <div className="absolute top-10 right-10 w-16 h-16 rounded-3xl bg-cyan-50 border border-cyan-100 flex items-center justify-center shadow-lg shadow-cyan-100 group-hover:scale-110 group-hover:-rotate-12 group-hover:bg-cyan-500 transition-all duration-500">
               <GraduationCap className="w-8 h-8 text-cyan-500 group-hover:text-white transition-colors duration-500" />
            </div>

            {/* Content block */}
            <div className="relative z-10 space-y-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Student<br/>Gateway</h2>
              <p className="text-slate-500 text-sm leading-relaxed max-w-[80%]">
                Register your local device signature. Presence is automated seamlessly over the air.
              </p>
              
              <div className="pt-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-cyan-200">
                  <Cpu className="w-5 h-5" />
                </div>
                <span className="text-cyan-600 font-bold tracking-widest text-sm uppercase opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 delay-100">
                  Initialize
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Floating Footer Tech Badge */}
        <div className="mt-20 flex items-center justify-center gap-8 text-slate-400 font-semibold uppercase tracking-[0.2em] text-[10px]">
          <div className="flex items-center gap-2 hover:text-slate-600 transition-colors duration-500">
            <Target className="w-3 h-3" /> Encrypted Access
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-300" />
          <div className="flex items-center gap-2 hover:text-slate-600 transition-colors duration-500">
            <Zap className="w-3 h-3" /> IoT Networked
          </div>
        </div>

      </div>

      <style>{`
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
