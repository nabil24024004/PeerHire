import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import FreelancerDashboard from "./pages/FreelancerDashboard";
import HirerDashboard from "./pages/HirerDashboard";
import LiveBoard from "./pages/LiveBoard";
import Messages from "./pages/Messages";
import HirerProfile from "./pages/HirerProfile";
import FreelancerProfile from "./pages/FreelancerProfile";
import HirerTasks from "./pages/HirerTasks";
import FreelancerJobs from "./pages/FreelancerJobs";
import FreelancerJobDetails from "./pages/FreelancerJobDetails";
import HirerPayments from "./pages/HirerPayments";
import FreelancerPayments from "./pages/FreelancerPayments";
import HirerSettings from "./pages/HirerSettings";
import FreelancerSettings from "./pages/FreelancerSettings";
import FreelancerBrowseJobs from "./pages/FreelancerBrowseJobs";
import FreelancerSavedJobs from "./pages/FreelancerSavedJobs";
import HirerViewOffers from "./pages/HirerViewOffers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/signup" element={<Auth />} />
          <Route path="/freelancer/dashboard" element={<FreelancerDashboard />} />
          <Route path="/freelancer/profile" element={<FreelancerProfile />} />
          <Route path="/freelancer/browse-jobs" element={<FreelancerBrowseJobs />} />
          <Route path="/freelancer/saved-jobs" element={<FreelancerSavedJobs />} />
          <Route path="/freelancer/jobs" element={<FreelancerJobs />} />
          <Route path="/freelancer/job/:jobId" element={<FreelancerJobDetails />} />
          <Route path="/freelancer/payments" element={<FreelancerPayments />} />
          <Route path="/freelancer/settings" element={<FreelancerSettings />} />
          <Route path="/hirer/dashboard" element={<HirerDashboard />} />
          <Route path="/hirer/profile" element={<HirerProfile />} />
          <Route path="/hirer/profile/:userId" element={<FreelancerProfile />} />
          <Route path="/hirer/tasks" element={<HirerTasks />} />
          <Route path="/hirer/task/:taskId/offers" element={<HirerViewOffers />} />
          <Route path="/hirer/payments" element={<HirerPayments />} />
          <Route path="/hirer/settings" element={<HirerSettings />} />
          <Route path="/hirer/live-board" element={<LiveBoard />} />
          <Route path="/hirer/messages" element={<Messages />} />
          <Route path="/freelancer/messages" element={<Messages />} />
          <Route path="/messages" element={<Messages />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
