import React, { useState, useEffect } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { LoginScreen } from './components/LoginScreen';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { Navbar } from './components/Navbar';
import { InspectionList } from './components/InspectionList';
import { InspectionExecutionPage } from './components/InspectionExecutionPage';
import { ReportDetailModal } from './components/ReportDetailModal';
import { InspectorUser, Institution, InspectionReport } from './types';
import { DEMO_INSPECTORS, INITIAL_INSTITUTIONS } from './data/mockData';

export default function App() {
  // App view state: 'splash' -> 'login' -> 'portal'
  const [currentView, setCurrentView] = useState<'splash' | 'login' | 'portal'>('splash');
  
  // Active logged-in inspector (with persistence for mobile app usage)
  const [currentInspector, setCurrentInspector] = useState<InspectorUser | null>(() => {
    try {
      const saved = localStorage.getItem('tracport_current_inspector');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Forgot password modal
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Network offline/online simulation & device state
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [pendingSyncReports, setPendingSyncReports] = useState<InspectionReport[]>(() => {
    try {
      const saved = localStorage.getItem('tracport_pending_sync');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  // Institutions state (persisted locally so status updates remain on phone)
  const [institutions, setInstitutions] = useState<Institution[]>(() => {
    try {
      const saved = localStorage.getItem('tracport_institutions');
      return saved ? JSON.parse(saved) : INITIAL_INSTITUTIONS;
    } catch {
      return INITIAL_INSTITUTIONS;
    }
  });

  // Completed reports history (persisted in phone storage)
  const [submittedReports, setSubmittedReports] = useState<InspectionReport[]>(() => {
    try {
      const saved = localStorage.getItem('tracport_submitted_reports');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active ongoing inspection modal
  const [activeInspectionInstitution, setActiveInspectionInstitution] = useState<Institution | null>(null);

  // Viewing report details modal
  const [viewingReport, setViewingReport] = useState<InspectionReport | null>(null);

  // Listen to native device online/offline events (phone switching to airplane mode or wifi)
  useEffect(() => {
    const handleDeviceOnline = () => {
      setIsOnline(true);
      // Auto-sync pending reports seamlessly
      setPendingSyncReports((pending) => {
        if (pending.length > 0) {
          try {
            localStorage.removeItem('tracport_pending_sync');
          } catch {}
          return [];
        }
        return pending;
      });
    };

    const handleDeviceOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleDeviceOnline);
    window.addEventListener('offline', handleDeviceOffline);

    return () => {
      window.removeEventListener('online', handleDeviceOnline);
      window.removeEventListener('offline', handleDeviceOffline);
    };
  }, []);

  // Save changes to localStorage for offline robustness
  useEffect(() => {
    try {
      localStorage.setItem('tracport_institutions', JSON.stringify(institutions));
    } catch {}
  }, [institutions]);

  useEffect(() => {
    try {
      localStorage.setItem('tracport_submitted_reports', JSON.stringify(submittedReports));
    } catch {}
  }, [submittedReports]);

  useEffect(() => {
    try {
      localStorage.setItem('tracport_pending_sync', JSON.stringify(pendingSyncReports));
    } catch {}
  }, [pendingSyncReports]);

  useEffect(() => {
    try {
      if (currentInspector) {
        localStorage.setItem('tracport_current_inspector', JSON.stringify(currentInspector));
      } else {
        localStorage.removeItem('tracport_current_inspector');
      }
    } catch {}
  }, [currentInspector]);

  // Splash complete -> Show Login Screen (or directly portal if session active)
  const handleSplashComplete = () => {
    if (currentInspector) {
      setCurrentView('portal');
    } else {
      setCurrentView('login');
    }
  };

  // Login handler
  const handleLogin = (user: InspectorUser) => {
    setCurrentInspector(user);
    setCurrentView('portal');
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentInspector(null);
    setCurrentView('login');
  };

  // Toggle network connectivity (Online / Offline)
  const handleToggleOnline = () => {
    setIsOnline((prev) => {
      const next = !prev;
      if (next && pendingSyncReports.length > 0) {
        setPendingSyncReports([]);
        try {
          localStorage.removeItem('tracport_pending_sync');
        } catch {}
      }
      return next;
    });
  };

  // Handle report submission
  const handleSubmitReport = (report: InspectionReport) => {
    setSubmittedReports((prev) => [report, ...prev]);

    // Update institution status to completed
    setInstitutions((prev) =>
      prev.map((inst) =>
        inst.id === report.institutionId
          ? {
              ...inst,
              status: 'COMPLETED',
              complianceGrade: report.grade,
              lastInspectionDate: report.date
            }
          : inst
      )
    );

    if (!isOnline) {
      setPendingSyncReports((prev) => [...prev, report]);
    }
    
    setSyncToastMessage('Inspection submitted successfully!');
    setTimeout(() => setSyncToastMessage(null), 3500);

    setActiveInspectionInstitution(null);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-blue-950 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* View 1: 3-Second Flash Screen */}
      {currentView === 'splash' && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}

      {/* View 2: Login Screen */}
      {currentView === 'login' && (
        <LoginScreen
          onLogin={handleLogin}
          onOpenForgotPassword={() => setIsForgotPasswordOpen(true)}
        />
      )}

      {/* View 3: MoSJE Real-Time Monitoring & Inspection Portal OR Full Inspection Page */}
      {currentView === 'portal' && currentInspector && (
        activeInspectionInstitution ? (
          <InspectionExecutionPage
            institution={activeInspectionInstitution}
            inspector={currentInspector}
            isOnline={isOnline}
            onBack={() => setActiveInspectionInstitution(null)}
            onSubmitInspection={handleSubmitReport}
          />
        ) : (
          <div className="flex flex-col min-h-screen">
            {/* 1. User Name on top left, 2. Online/offline and Logout on top right */}
            <Navbar
              inspector={currentInspector}
              isOnline={isOnline}
              onToggleOnline={handleToggleOnline}
              onLogout={handleLogout}
            />

            {/* Toast Notification */}
            {syncToastMessage && (
              <div className="fixed bottom-5 right-5 z-50 bg-blue-900 text-white px-4 py-3 rounded-xl shadow-lg border border-blue-700 text-xs flex items-center gap-2 animate-bounce">
                <span className="w-2 h-2 rounded-full bg-blue-300" />
                <span>{syncToastMessage}</span>
              </div>
            )}

            {/* Main Content Area: 4. Middle Portion (Closer Due Date) & 3. Bottom Half (List) */}
            <main className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 w-full flex-1">
              <InspectionList
                institutions={institutions}
                recentReports={submittedReports}
                onStartInspection={(inst) => setActiveInspectionInstitution(inst)}
                onViewReport={(rep) => setViewingReport(rep)}
              />
            </main>

            {/* Minimalist Blue/White Footer */}
            <footer className="py-5 border-t border-blue-100 bg-white text-center text-xs text-blue-600/70">
              <span>MoSJE Smart Real-Time Inspection & Verification Portal</span>
              <span className="mx-2">·</span>
              <span className="font-semibold text-blue-900">Erudites</span>
            </footer>
          </div>
        )
      )}

      {/* View Completed Report Modal */}
      {viewingReport && (
        <ReportDetailModal
          report={viewingReport}
          onClose={() => setViewingReport(null)}
        />
      )}

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />

    </div>
  );
}
