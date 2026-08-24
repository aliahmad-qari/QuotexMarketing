import React, { useState } from 'react';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { useMarketStream } from './hooks/useMarketStream';
import { AboutPage } from './pages/AboutPage';
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
      default:
        return <LandingPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        connectionStatus={status}
        activeMetadata={metadata}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {renderCurrentPage()}
      </main>
      <Footer onNavigate={setCurrentPage} />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
