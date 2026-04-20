import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { Protected } from "./components/Protected";
import WorkerDashboard from "./pages/worker/WorkerDashboard";
import LogVisit from "./pages/worker/LogVisit";
import VisitHistory from "./pages/worker/VisitHistory";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Workforce from "./pages/admin/Workforce";
import AtRisk from "./pages/admin/AtRisk";
import SiteManagement from "./pages/admin/SiteManagement";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />

            <Route path="/worker" element={<Protected role="worker"><WorkerDashboard /></Protected>} />
            <Route path="/worker/log" element={<Protected role="worker"><LogVisit /></Protected>} />
            <Route path="/worker/history" element={<Protected role="worker"><VisitHistory /></Protected>} />

            <Route path="/admin" element={<Protected role="admin"><AdminDashboard /></Protected>} />
            <Route path="/admin/workforce" element={<Protected role="admin"><Workforce /></Protected>} />
            <Route path="/admin/at-risk" element={<Protected role="admin"><AtRisk /></Protected>} />
            <Route path="/admin/sites" element={<Protected role="admin"><SiteManagement /></Protected>} />
            <Route path="/admin/reports" element={<Protected role="admin"><Reports /></Protected>} />
            <Route path="/admin/settings" element={<Protected role="admin"><Settings /></Protected>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
