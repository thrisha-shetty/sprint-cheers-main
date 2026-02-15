import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Leaderboard from "./pages/Leaderboard";
import AdminDashboard from "./pages/AdminDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import { auth } from "@/lib/localStorage"; 

const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: string }) => {
  const user = auth.getCurrentUser();
  if (!user) return <Navigate to="/" replace />;
  // Fixed: Ensure checking for the correct role ID 'art-manager' instead of 'train-manager'
  if (role && user.role !== role) return <Navigate to="/home" replace />;
  return <>{children}</>;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        {/* Fixed role to match database art-manager */}
        <Route path="/manager" element={<ProtectedRoute role="art-manager"><ManagerDashboard /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
};

export default App;