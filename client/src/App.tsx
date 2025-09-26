import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { UserProvider, useUser } from "./contexts/UserContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PublisherDashboard from "./pages/PublisherDashboard";
import AdvertiserDashboard from "./pages/AdvertiserDashboard";
import MatchingOptimization from "./pages/MatchingOptimization";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isLoggedIn, hydrated } = useUser();
  if (!hydrated) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
}

function RoleRoute({ children, role }: { children: JSX.Element; role: 'publisher' | 'advertiser' }) {
  const { isLoggedIn, userType, hydrated } = useUser();
  if (!hydrated) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (userType !== role) return <Navigate to={`/${userType ?? ''}`} replace />;
  return children;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            {/* Role-specific auth pages */}
            <Route path="/login" element={<Login />} />

            <Route element={<DashboardLayout />}>
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/publisher"
                element={
                  <RoleRoute role="publisher">
                    <PublisherDashboard />
                  </RoleRoute>
                }
              />
              <Route
                path="/advertiser"
                element={
                  <RoleRoute role="advertiser">
                    <AdvertiserDashboard />
                  </RoleRoute>
                }
              />
              <Route
                path="/matching"
                element={
                  <ProtectedRoute>
                    <MatchingOptimization />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;
