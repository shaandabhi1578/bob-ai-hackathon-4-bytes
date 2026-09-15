import React from 'react';
import {
  LayoutDashboard,
  Activity,
  CloudLightning,
  AlertTriangle,
  BarChart3,
  Users,
  Send,
  History,
  Settings,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { useGrid, NavigationTab } from '../../context/GridContext';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    criticalAssetsCount,
    availableCrewsCount,
  } = useGrid();

  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';

  const rawNavItems: {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
    badge?: string | number;
    badgeVariant?: 'critical' | 'neutral' | 'healthy' | 'warning';
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'asset-health',
      label: 'Asset Health',
      icon: Activity,
      badge: criticalAssetsCount > 0 ? `${criticalAssetsCount} Crit` : undefined,
      badgeVariant: 'critical',
    },
    {
      id: 'weather',
      label: 'Weather',
      icon: CloudLightning,
      badge: 'Alert',
      badgeVariant: 'warning',
    },
    {
      id: 'failure-prediction',
      label: 'Failure Prediction',
      icon: AlertTriangle,
      badge: 'AI Core',
      badgeVariant: 'neutral',
    },
    {
      id: 'work-analysis',
      label: 'Work & Data Analysis',
      icon: BarChart3,
    },
    {
      id: 'crew-management',
      label: isEmployee ? 'My Crew & Work Orders' : 'Crew Management',
      icon: Users,
      badge: isEmployee ? 'Read-Only' : `${availableCrewsCount} Avail`,
      badgeVariant: isEmployee ? 'neutral' : 'healthy',
    },
    {
      id: 'outage-notifications',
      label: isEmployee ? 'Outage Bulletins' : 'Outage Notifications',
      icon: Send,
      badge: isEmployee ? 'Advisories' : undefined,
      badgeVariant: 'neutral',
    },
    {
      id: 'incident-history',
      label: 'Incident History',
      icon: History,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  // Restrict Employee role from Settings
  const navItems = isEmployee
    ? rawNavItems.filter((item) => item.id !== 'settings')
    : rawNavItems;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-icon">
          <ShieldAlert size={18} color="#38bdf8" />
        </div>
        <div>
          <div className="brand-title">GridGuard AI</div>
          <div className="brand-subtitle">Transmission & Substation OS</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <div
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="nav-item-icon-label">
                <Icon
                  size={16}
                  color={isActive ? '#0f172a' : '#64748b'}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    backgroundColor:
                      item.badgeVariant === 'critical'
                        ? '#fef2f2'
                        : item.badgeVariant === 'warning'
                        ? '#fffbeb'
                        : item.badgeVariant === 'healthy'
                        ? '#f0fdf4'
                        : '#f1f5f9',
                    color:
                      item.badgeVariant === 'critical'
                        ? '#991b1b'
                        : item.badgeVariant === 'warning'
                        ? '#92400e'
                        : item.badgeVariant === 'healthy'
                        ? '#166534'
                        : '#475569',
                    border: `1px solid ${
                      item.badgeVariant === 'critical'
                        ? '#fecaca'
                        : item.badgeVariant === 'warning'
                        ? '#fde68a'
                        : item.badgeVariant === 'healthy'
                        ? '#bbf7d0'
                        : '#e2e8f0'
                    }`,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {isEmployee ? (
          <div
            style={{
              padding: '0.6rem 0.75rem',
              background: '#f0fdf4',
              borderRadius: '6px',
              border: '1px solid #bbf7d0',
              fontSize: '0.72rem',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <ShieldAlert size={14} color="#16a34a" />
            <div>
              <div style={{ fontWeight: 700 }}>Field Crew Profile</div>
              <div style={{ fontSize: '0.66rem', color: '#15803d' }}>Limited & Read-Only Access</div>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.75rem',
              color: '#64748b',
            }}
          >
            <HelpCircle size={14} />
            <span>SLDC Gujarat SCADA v4.2</span>
          </div>
        )}
      </div>
    </aside>
  );
};
