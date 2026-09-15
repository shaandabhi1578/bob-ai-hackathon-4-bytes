import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GridProvider, useGrid } from './context/GridContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DemoTourBar } from './components/demo/DemoTourBar';
import { DashboardView } from './components/views/DashboardView';
import { AssetHealthView } from './components/views/AssetHealthView';
import { WeatherView } from './components/views/WeatherView';
import { FailurePredictionView } from './components/views/FailurePredictionView';
import { WorkAnalysisView } from './components/views/WorkAnalysisView';
import { CrewManagementView } from './components/views/CrewManagementView';
import { OutageNotificationsView } from './components/views/OutageNotificationsView';
import { IncidentHistoryView } from './components/views/IncidentHistoryView';
import { SettingsView } from './components/views/SettingsView';
import { CopilotDrawer } from './components/copilot/CopilotDrawer';
import { Toast } from './components/common/Toast';
import { LoginModal } from './components/auth/LoginModal';
import { RealtimeAlertBanner } from './components/common/RealtimeAlertBanner';

const AppContent: React.FC = () => {
  const { activeTab } = useGrid();
  const { isAuthenticated } = useAuth();

  return (
    <>
      {/* If not authenticated, require login modal */}
      {!isAuthenticated && <LoginModal />}

      <div className="app-container">
        {/* Left Navigation Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="main-wrapper">
          {/* Top Control Header */}
          <Header />

          {/* Guided Hackathon Walkthrough Bar (Steps 1–21) */}
          <DemoTourBar />

          {/* Dynamic Section Rendering */}
          <main style={{ flex: 1, overflowY: 'auto' }}>
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'asset-health' && <AssetHealthView />}
            {activeTab === 'weather' && <WeatherView />}
            {activeTab === 'failure-prediction' && <FailurePredictionView />}
            {activeTab === 'work-analysis' && <WorkAnalysisView />}
            {activeTab === 'crew-management' && <CrewManagementView />}
            {activeTab === 'outage-notifications' && <OutageNotificationsView />}
            {activeTab === 'incident-history' && <IncidentHistoryView />}
            {activeTab === 'settings' && <SettingsView />}
          </main>
        </div>

        {/* Slide-over Grounded AI Copilot */}
        <CopilotDrawer />

        {/* Real-time Cross-Device Alert Banner */}
        <RealtimeAlertBanner />

        {/* System Toast Alerts */}
        <Toast />
      </div>
    </>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <GridProvider>
        <AppContent />
      </GridProvider>
    </AuthProvider>
  );
};

export default App;
