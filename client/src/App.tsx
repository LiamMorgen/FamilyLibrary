import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import MyBookshelf from "@/pages/my-bookshelf";
import FamilyBookshelf from "@/pages/family-bookshelf";
import BorrowingRecords from "@/pages/borrowing-records";
import ReadingStats from "@/pages/reading-stats";
import AddBookPage from "@/pages/add-book";
import LoginPage from "@/pages/LoginPage";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { useTranslation } from "react-i18next";

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 overflow-auto pb-16 md:pb-8">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/my-bookshelf" element={<ProtectedRoute><MyBookshelf /></ProtectedRoute>} />
            <Route path="/family-bookshelf" element={<ProtectedRoute><FamilyBookshelf /></ProtectedRoute>} />
            <Route path="/borrowing-records" element={<ProtectedRoute><BorrowingRecords /></ProtectedRoute>} />
            <Route path="/reading-stats" element={<ProtectedRoute><ReadingStats /></ProtectedRoute>} />
            <Route path="/add-book" element={<ProtectedRoute><AddBookPage /></ProtectedRoute>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

function App() {
  useTranslation();

  useEffect(() => {
    document.title = "家庭图书管理系统";
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Toaster />
          <AppLayout />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
