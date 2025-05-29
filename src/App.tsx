import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import DetectorDePlacas from "./vistasplaca";
import Registros from "./components/registros";
import Sidebar2 from "./components/sidebar";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrapper de rutas protegidas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// Layout con sidebar para rutas protegidas
const LayoutWithSidebar = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: "flex" }}>
    <Sidebar2 />
    <div style={{ marginLeft: "220px", width: "100%" }}>
      {children}
    </div>
  </div>
);

// Rutas
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" /> : <Login />} 
      />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <LayoutWithSidebar>
              <Index />
            </LayoutWithSidebar>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/placas"
        element={
          <ProtectedRoute>
            <LayoutWithSidebar>
              <DetectorDePlacas />
            </LayoutWithSidebar>
          </ProtectedRoute>
        }
      />

      <Route
        path="/registros"
        element={
          <ProtectedRoute>
            <LayoutWithSidebar>
              <Registros />
            </LayoutWithSidebar>
          </ProtectedRoute>
        }
      />

      {/* Puedes quitar esto si Sidebar2 ya se usa en LayoutWithSidebar */}
      <Route path="/sidebar" element={<Sidebar2 />} />

      {/* Ruta por defecto */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// App principal
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
