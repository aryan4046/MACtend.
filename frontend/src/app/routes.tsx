import { createBrowserRouter, Navigate } from "react-router";
import { AppLayout, ProtectedRoute } from "./components/Layout";
import { TeacherLogin } from "./pages/TeacherLogin";
import { StudentRegistration } from "./pages/StudentRegistration";
import { TeacherDashboard } from "./pages/TeacherDashboard";
import { LiveAttendance } from "./pages/LiveAttendance";
import { RoleSelection } from "./pages/RoleSelection";
import { TeacherRegistration } from "./pages/TeacherRegistration";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <RoleSelection />,
      },
      {
        path: "login",
        element: <Navigate to="/teacher/login" replace />,
      },
      {
        path: "teacher/login",
        element: <TeacherLogin />,
      },
      {
        path: "teacher/register",
        element: <TeacherRegistration />,
      },
      {
        path: "student/register",
        element: <StudentRegistration />,
      },
      {
        path: "register",
        element: <Navigate to="/student/register" replace />,
      },
      {
        path: "admin",
        element: <ProtectedRoute><Navigate to="/admin/dashboard" replace /></ProtectedRoute>,
      },
      {
        path: "admin/dashboard",
        element: (
          <ProtectedRoute>
            <TeacherDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/attendance",
        element: (
          <ProtectedRoute>
            <LiveAttendance />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
