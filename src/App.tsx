import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { AboutPage } from './pages/public/AboutPage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { PlansPage } from './pages/public/PlansPage';
import { FaqPage } from './pages/public/FaqPage';
import { ContactPage } from './pages/public/ContactPage';
import { LegalPages } from './pages/public/LegalPages';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { ApiDocsPage } from './pages/public/ApiDocsPage';
import { TestsPage } from './pages/public/TestsPage';

// Dashboards
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { RunnerDashboard } from './pages/runner/RunnerDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [legalModalDoc, setLegalModalDoc] = useState<string | null>(null);

  const openLegalModal = (doc: string) => {
    setLegalModalDoc(doc);
    setCurrentTab('legal');
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'home':
        return <HomePage setCurrentTab={setCurrentTab} openLegalModal={openLegalModal} />;
      case 'about':
        return <AboutPage setCurrentTab={setCurrentTab} />;
      case 'how-it-works':
        return <HowItWorksPage setCurrentTab={setCurrentTab} />;
      case 'plans':
        return <PlansPage setCurrentTab={setCurrentTab} />;
      case 'faq':
        return <FaqPage setCurrentTab={setCurrentTab} />;
      case 'contact':
        return <ContactPage setCurrentTab={setCurrentTab} />;
      case 'api-docs':
        return <ApiDocsPage />;
      case 'tests':
        return <TestsPage />;
      case 'legal':
        return <LegalPages initialDoc={legalModalDoc || 'terms'} onClose={() => setCurrentTab('home')} />;
      case 'login':
        return <LoginPage setCurrentTab={setCurrentTab} />;
      case 'register':
        return <RegisterPage setCurrentTab={setCurrentTab} initialType="customer" />;
      case 'register-runner':
        return <RegisterPage setCurrentTab={setCurrentTab} initialType="runner" />;
      case 'dashboard':
        if (loading) {
          return (
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-neutral-500 font-medium">Loading M-PARTNER Portal...</p>
              </div>
            </div>
          );
        }
        if (!user) {
          return <LoginPage setCurrentTab={setCurrentTab} />;
        }
        if (user.role === 'customer') {
          return <CustomerDashboard />;
        }
        if (user.role === 'runner') {
          return <RunnerDashboard />;
        }
        if (user.role === 'admin') {
          return <AdminDashboard />;
        }
        return <HomePage setCurrentTab={setCurrentTab} openLegalModal={openLegalModal} />;
      default:
        return <HomePage setCurrentTab={setCurrentTab} openLegalModal={openLegalModal} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900 font-sans antialiased selection:bg-neutral-900 selection:text-white">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <main className="flex-1">
        {renderContent()}
      </main>
      <Footer setCurrentTab={setCurrentTab} openLegalModal={openLegalModal} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
