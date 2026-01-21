import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { GlobalNotificationProvider } from "./components/GlobalNotificationProvider";
import { DashboardLayout } from "./components/DashboardLayout";
import { AdminLayout } from "./components/admin/AdminLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import FeaturesPage from "./pages/FeaturesPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import FAQPage from "./pages/FAQPage";
import ContactPage from "./pages/ContactPage";
import TermsAndConditionsPage from "./pages/TermsAndConditionsPage";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const EditProfilePage = lazy(() => import("./pages/EditProfilePage"));
const StudentVerificationPage = lazy(() => import("./pages/StudentVerificationPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const ProjectDetailPage = lazy(() => import("./pages/ProjectDetailPage"));
const BidsPage = lazy(() => import("./pages/BidsPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const BuyCreditsPage = lazy(() => import("./pages/BuyCreditsPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminVerificationsPage = lazy(() => import("./pages/admin/AdminVerificationsPage"));
const AdminProjectsPage = lazy(() => import("./pages/admin/AdminProjectsPage"));
const AdminCollegesPage = lazy(() => import("./pages/admin/AdminCollegesPage"));
const AdminBlogsPage = lazy(() => import("./pages/admin/AdminBlogsPage"));
const AdminCreditsPage = lazy(() => import("./pages/admin/AdminCreditsPage"));

// Blog pages
const BlogPage = lazy(() => import("./pages/BlogPage"));
const BlogDetailPage = lazy(() => import("./pages/BlogDetailPage"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <GlobalNotificationProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
              <Route path="/blog" element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                  <BlogPage />
                </Suspense>
              } />
              <Route path="/blog/:slug" element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                  <BlogDetailPage />
                </Suspense>
              } />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Public project detail route (no sidebar) */}
              <Route 
                path="/projects/:id" 
                element={
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <ProjectDetailPage />
                  </Suspense>
                } 
              />
              
              {/* Dashboard routes with shared layout */}
              <Route element={<DashboardLayout />}>
                <Route 
                  path="/projects" 
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                      <ProjectsPage />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/dashboard" 
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                      <DashboardPage />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                      <ProfilePage />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/profile/edit" 
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                      <EditProfilePage />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/profile/verify" 
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                      <StudentVerificationPage />
                    </Suspense>
                  } 
                />
                <Route
                  path="/bids"
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                      <BidsPage />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/messages" 
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                      <MessagesPage />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/calendar" 
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                      <CalendarPage />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/community" 
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                      <CommunityPage />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/buy-credits" 
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                      <BuyCreditsPage />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/checkout" 
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                      <CheckoutPage />
                    </Suspense>
                  } 
                />
              </Route>

              {/* Admin routes */}
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <AdminDashboard />
                  </Suspense>
                } />
                <Route path="/admin/users" element={
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <AdminUsersPage />
                  </Suspense>
                } />
                <Route path="/admin/verifications" element={
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <AdminVerificationsPage />
                  </Suspense>
                } />
                <Route path="/admin/projects" element={
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <AdminProjectsPage />
                  </Suspense>
                } />
                <Route path="/admin/colleges" element={
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <AdminCollegesPage />
                  </Suspense>
                } />
                <Route path="/admin/blogs" element={
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <AdminBlogsPage />
                  </Suspense>
                } />
                <Route path="/admin/credits" element={
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <AdminCreditsPage />
                  </Suspense>
                } />
              </Route>
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </GlobalNotificationProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
