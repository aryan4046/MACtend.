import { Link, useNavigate, useLocation } from "react-router";
import { LogOut, LayoutDashboard, Users, UserPlus, BarChart3, UserCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "../AuthContext";

export function Navbar() {
  const { isAuthenticated, faculty, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const NavItem = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 ${
          isActive 
            ? "bg-blue-500/10 text-blue-600 font-semibold" 
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        {icon}
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm border-slate-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl flex items-center font-black tracking-tighter text-slate-800 hover:opacity-80 transition-opacity">
              MACtend<span className="text-blue-600 text-2xl leading-none -mt-1 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">.</span>
            </Link>
            {isAuthenticated && (
              <div className="hidden md:flex gap-2">
                <NavItem to="/admin/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" />
                <NavItem to="/admin/attendance" icon={<Users size={18} />} label="Live Log" />
                <NavItem to="/admin/analysis" icon={<BarChart3 size={18} />} label="Analysis" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {!isAuthenticated && (
              <Link
                to="/register"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
              >
                <UserPlus size={16} />
                Student Registration
              </Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                {faculty && (
                  <div className="relative group">
                    <button 
                      className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <UserCircle size={16} className="text-blue-600" />
                      <span>{faculty.name}</span>
                    </button>
                    
                    {/* Hover Dropdown */}
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0">
                      <div className="px-4 pb-3 border-b border-slate-100">
                        <p className="text-sm font-bold text-slate-800 truncate">{faculty.name}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{faculty.email}</p>
                      </div>
                      <div className="px-4 pt-3 flex flex-col gap-2">
                        <span className="inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 w-full">
                          <ShieldCheck size={14} /> Administrator
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
              >
                Admin Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
