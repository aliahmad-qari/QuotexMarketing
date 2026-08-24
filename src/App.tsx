import React, { useState } from 'react';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { AuthProvider } from './context/AuthContext';
import { DemoTradingProvider } from './context/DemoTradingContext';
import { useMarketStream } from './hooks/useMarketStream';
import { AboutPage } from './pages/AboutPage';
import { AdminPage } from './pages/AdminPage';
import { DashboardPage } from './pages/DashboardPage';
import { LandingPage } from './pages/LandingPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { PerformancePage } from './pages/PerformancePage';
import { RiskDisclosurePage } from './pages/RiskDisclosurePage';
import { PageRoute } from './types/market';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<PageRoute>('landing');
  const { status, metadata } = useMarketStream('BTCUSDT', '1m');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={setCurrentPage} />;
      case 'dashboard':
        return <DashboardPage />;
      case 'performance':
        return <PerformancePage />;
      case 'methodology':
        return <MethodologyPage />;
      case 'risk-disclosure':
        return <RiskDisclosurePage />;
      case 'about':
        return <AboutPage />;
      case 'admin':
        return <AdminPage onNavigate={setCurrentPage} />;
      default:
        return <LandingPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        connectionStatus={status}
        activeMetadata={metadata}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {renderCurrentPage()}
      </main>

      {/* Persistent Footer */}
      <Footer onNavigate={setCurrentPage} />

      {/* Global Auth Modal */}
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DemoTradingProvider>
        <AppContent />
      </DemoTradingProvider>
    </AuthProvider>
  );
}
