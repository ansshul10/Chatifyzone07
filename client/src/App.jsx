import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage"; // NEW: Import SettingsPage
import { UserContext, UserContextProvider } from "./context/UserContext";
import { Toaster } from "react-hot-toast";
import { useContext } from "react";

/**
 * CHATIFY CORE APP v4.2.0
 * Updated: Added /settings route with protected access
 */

function ProtectedRoute({ children }) {
  const { user, ready } = useContext(UserContext);

  if (!ready) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin"></div>
        <p className="text-[#FF0000] font-black uppercase tracking-[0.5em] text-[10px]">
          Auth Sync in Progress...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <UserContextProvider>
      <BrowserRouter>
        <Toaster 
          position="top-right" 
          reverseOrder={false} 
          toastOptions={{
            style: {
              background: '#0A0A0A',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.05)',
              fontSize: '12px',
              fontFamily: 'sans-serif',
              fontWeight: '900',
              textTransform: 'uppercase'
            }
          }}
        />
        
        <Navbar /> 

        <div className="pt-16 min-h-screen bg-[#050505]">
          <Routes>
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />

            {/* NEW: Settings Route */}
            <Route path="/settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />

            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </UserContextProvider>
  );
}

export default App;