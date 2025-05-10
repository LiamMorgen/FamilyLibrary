import { Switch, Route } from "wouter";
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
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { useTranslation } from "react-i18next";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 overflow-auto pb-16 md:pb-8">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/my-bookshelf" component={MyBookshelf} />
            <Route path="/family-bookshelf" component={FamilyBookshelf} />
            <Route path="/borrowing-records" component={BorrowingRecords} />
            <Route path="/reading-stats" component={ReadingStats} />
            <Route path="/add-book" component={AddBookPage} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

function App() {
  useTranslation();

  useEffect(() => {
    // Set the document title in Chinese
    document.title = "家庭图书管理系统";
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
