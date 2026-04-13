import { Link, useNavigate, useLocation } from "react-router";
import { LogOut, LayoutDashboard, Users, UserPlus } from "lucide-react";
import { useAuth } from "../AuthContext";

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();
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
            <span className="text-xl flex items-center font-black tracking-tighter text-slate-800">
              MACtend<span className="text-blue-600 text-2xl leading-none -mt-1 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">.</span>
            </span>
            {isAuthenticated && (
              <div className="hidden md:flex gap-2">
                <NavItem to="/admin/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" />
                <NavItem to="/admin/attendance" icon={<Users size={18} />} label="Live Log" />
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
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
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
