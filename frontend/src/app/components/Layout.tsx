import { Outlet, Navigate, useLocation } from "react-router";
import { Navbar } from "./Navbar";
import { AuthProvider, useAuth } from "../AuthContext";

export function AppLayout() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200">
        <Navbar />
        {/* Main Content padding to account for fixed navbar */}
        <main className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[calc(100vh-64px)]">
          <Outlet />
        </main>
      </div>
    </AuthProvider>
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
