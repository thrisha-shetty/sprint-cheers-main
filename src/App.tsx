import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Leaderboard from "./pages/Leaderboard";

// Simple route guard
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // We check purely for the existence of user data in localStorage for simplicity
  const isAuthenticated = !!localStorage.getItem("sprintwise_current_user");
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />
        
        {/* Protected Routes */}
        <Route path="/home" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        
        <Route path="/leaderboard" element={
          <ProtectedRoute>
            <Leaderboard />
          </ProtectedRoute>
        } />

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Toast notifications */}
      <Toaster />
    </BrowserRouter>
  );
};

export default App;