import { Suspense, lazy, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PageLoader } from "@/components/PageLoader";
import { SplashScreen } from "@/components/SplashScreen";

// Lazy load all pages for better code splitting
const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const FreelancerDashboard = lazy(() => import("./pages/FreelancerDashboard"));
const HirerDashboard = lazy(() => import("./pages/HirerDashboard"));
const LiveBoard = lazy(() => import("./pages/LiveBoard"));
const Messages = lazy(() => import("./pages/Messages"));
const HirerProfile = lazy(() => import("./pages/HirerProfile"));
const FreelancerProfile = lazy(() => import("./pages/FreelancerProfile"));
const HirerTasks = lazy(() => import("./pages/HirerTasks"));
const FreelancerJobs = lazy(() => import("./pages/FreelancerJobs"));
const FreelancerJobDetails = lazy(() => import("./pages/FreelancerJobDetails"));
const HirerPayments = lazy(() => import("./pages/HirerPayments"));
const FreelancerPayments = lazy(() => import("./pages/FreelancerPayments"));
const HirerSettings = lazy(() => import("./pages/HirerSettings"));
const FreelancerSettings = lazy(() => import("./pages/FreelancerSettings"));
const FreelancerBrowseJobs = lazy(() => import("./pages/FreelancerBrowseJobs"));
const HirerViewOffers = lazy(() => import("./pages/HirerViewOffers"));
const EmailConfirm = lazy(() => import("./pages/EmailConfirm"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Optimized QueryClient with caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash on first visit per session
    return !sessionStorage.getItem('splashShown');
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem('splashShown', 'true');
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/signup" element={<Auth />} />
              <Route path="/freelancer/dashboard" element={<FreelancerDashboard />} />
              <Route path="/freelancer/profile" element={<FreelancerProfile />} />
              <Route path="/freelancer/browse-jobs" element={<FreelancerBrowseJobs />} />
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
              <Route path="/auth/confirm" element={<EmailConfirm />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
