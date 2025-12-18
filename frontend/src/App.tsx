import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import LeadsDashboard from './components/Dashboards/LeadsDashboard';
import CustomerSuccessDashboard from './components/Dashboards/CustomerSuccessDashboard';
import CreativesDashboard from './components/Dashboards/CreativesDashboard';
import CustomerContactsList from './components/CustomerContacts/CustomerContactsList';
import ContactsList from './components/Contacts/ContactsList';
import AccountsList from './components/Accounts/AccountsList';
import ActivitiesList from './components/Activities/ActivitiesList';
import TasksList from './components/Tasks/TasksList';
import InteractionsList from './components/Interactions/InteractionsList';
import DiscoveryCallsList from './components/DiscoveryCalls/DiscoveryCallsList';
import LeadsList from './components/Leads/LeadsList';
import DealsList from './components/Deals/DealsList';
import DesignDraftsList from './components/Design/DesignDraftsList';
import CompletedLabelFormsList from './components/Creatives/CompletedLabelFormsList';
import TeamMembersList from './components/TeamMembers/TeamMembersList';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import VerifyEmail from './components/Auth/VerifyEmail';
import ResetPassword from './components/Auth/ResetPassword';
import AuthAction from './components/Auth/AuthAction';
import { authService } from './services/auth.service';
import type { AuthUser } from './services/auth.service';

function App() {
  const location = useLocation();
  const [activeView, setActiveView] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  // Check for special auth routes (email verification, password reset, auth action handler)
  const isAuthActionRoute = location.pathname === '/verify-email' ||
                             location.pathname === '/reset-password' ||
                             location.pathname === '/auth/action';

  useEffect(() => {
    // Check if user is already logged in
    const user = authService.getCurrentUser();
    if (user) {
      setIsAuthenticated(true);
      setCurrentUser(user);
    }
  }, []);

  const handleLogin = () => {
    const user = authService.getCurrentUser();
    setIsAuthenticated(true);
    setCurrentUser(user);
    setShowRegister(false);
  };

  const handleRegister = () => {
    // After registration with verification, don't auto-login
    setShowRegister(false);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setCurrentUser(null);
      setActiveView('dashboard');
      setShowRegister(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Special routes for email verification and password reset (accessible without auth)
  if (isAuthActionRoute) {
    return (
      <Routes>
        <Route path="/auth/action" element={<AuthAction />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    );
  }

  // If not authenticated, show login or register page
  if (!isAuthenticated) {
    if (showRegister) {
      return (
        <Register
          onRegister={handleRegister}
          onBackToLogin={() => setShowRegister(false)}
        />
      );
    }
    return (
      <Login
        onLogin={handleLogin}
        onShowRegister={() => setShowRegister(true)}
      />
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveView} />;
      case 'leads-dashboard':
        return <LeadsDashboard onNavigate={setActiveView} />;
      case 'customer-success-dashboard':
        return <CustomerSuccessDashboard onNavigate={setActiveView} />;
      case 'creatives-dashboard':
        return <CreativesDashboard onNavigate={setActiveView} />;
      case 'contacts':
        return <ContactsList />;
      case 'leads':
        return <LeadsList />;
      case 'deals':
        return <DealsList />;
      case 'activities':
        return <ActivitiesList />;
      case 'customer-contacts':
        return <CustomerContactsList />;
      case 'accounts':
        return <AccountsList />;
      case 'tasks':
        return <TasksList />;
      case 'interactions':
        return <InteractionsList onNavigate={setActiveView} />;
      case 'completed-label-forms':
        return <CompletedLabelFormsList />;
      case 'discovery-calls':
        return <DiscoveryCallsList />;
      case 'design-drafts':
        return <DesignDraftsList />;
      case 'team-members':
        return <TeamMembersList />;
      default:
        return <Dashboard onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="d-flex flex-column flex-root app-root" id="kt_app_root">
      <div className="app-page flex-column flex-column-fluid" id="kt_app_page">
        <Header currentUser={currentUser} onLogout={handleLogout} />
        <div className="app-wrapper flex-column flex-row-fluid" id="kt_app_wrapper">
          <Sidebar activeView={activeView} onViewChange={setActiveView} currentUser={currentUser} />
          <div className="app-main flex-column flex-row-fluid" id="kt_app_main">
            <div className="d-flex flex-column flex-column-fluid">
              <div className="app-content flex-column-fluid" id="kt_app_content">
                <div className="app-container container-xxl" id="kt_app_content_container">
                  {renderView()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
