import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings as SettingsIcon, 
  LogOut, 
  Bell, 
  Search,
  Menu,
  X,
  Moon,
  Sun,
  Plus
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAlert } from '../context/AlertContext';
import api from '../api';

// Components
import DashboardOverview from '../components/DashboardOverview';
import CardlogList from '../components/CardlogList';
import CardlogForm from './CardlogForm';
import UserManagement from '../components/UserManagement';
import Settings from '../components/Settings';

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { showAlert } = useAlert();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [cardlogs, setCardlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('ches_user') || '{}'));
  
  const currentStateRef = React.useRef({ tab: 'overview', data: null });
  
  useEffect(() => {
    currentStateRef.current = { tab: activeTab, data: editData };
  }, [activeTab, editData]);

  const isDevAdmin = currentUser.role === 'administrator/dev';

  const executeLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    const handleProfileUpdate = () => {
      setCurrentUser(JSON.parse(localStorage.getItem('ches_user') || '{}'));
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    // Setup initial history state for native mobile back button behavior
    // If the app is launched as a PWA (history length 1), back button would close it instantly.
    // We push a dummy state first, then our real state, so that hitting back triggers popstate.
    if (!window.history.state || !window.history.state.tab) {
      window.history.replaceState({ isDummy: true }, '');
      window.history.pushState({ tab: 'overview', data: null, isRoot: true }, '');
    }

    const handlePopState = (event) => {
      if (window.isFormDirty) {
        // Trap the user back into the form
        window.history.pushState(currentStateRef.current, '');
        showAlert(
          'Konfirmasi Keluar',
          'Anda sedang mengisi data laporan. Apakah Anda yakin ingin kembali? Data yang sudah diisi akan hilang.',
          'confirm',
          () => {
            window.isFormDirty = false;
            window.history.back(); // Re-trigger back naturally
          }
        );
        return;
      }

      if (event.state && event.state.tab) {
        // Navigate back to previous internal state
        setActiveTab(event.state.tab);
        setEditData(event.state.data || null);
        setShowLogoutConfirm(false); // Hide logout if it was open
      } else {
        // Trap the user in dashboard to prevent going back to login screen or closing app
        // They hit the dummy state or an empty state. Push the dashboard root state back!
        window.history.pushState({ tab: 'overview', data: null, isRoot: true }, '');
        setActiveTab('overview');
        setShowLogoutConfirm(true); // Prompt logout
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Auto-logout after 15 minutes of inactivity
  useEffect(() => {
    let timeoutId;
    const INACTIVITY_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds
    
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Clear session instantly
        localStorage.clear();
        
        // Notify user and navigate to login
        showAlert(
          'Sesi Berakhir',
          'Anda telah logout otomatis karena tidak ada aktivitas selama 15 menit.',
          'info'
        );
        navigate('/login', { replace: true });
      }, INACTIVITY_TIME);
    };

    const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    
    // Add event listeners
    events.forEach(event => window.addEventListener(event, resetTimer));
    
    // Initialize timer
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, []);

  const handleNavigate = (tab, data = null) => {
    if (activeTab === tab && JSON.stringify(editData) === JSON.stringify(data)) return; // Prevent duplicate state
    window.history.pushState({ tab, data }, '');
    setActiveTab(tab);
    setEditData(data || null);
  };

  useEffect(() => {
    fetchCardlogs();
  }, []);

  const fetchCardlogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/cardlogs');
      setCardlogs(response.data);
    } catch (err) {
      console.error('Failed to fetch cardlogs', err);
    } finally {
      setLoading(false);
    }
  };

  const NavItem = ({ icon: Icon, label, tabId }) => (
    <button 
      onClick={() => handleNavigate(tabId)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === tabId ? 'bg-[var(--primary-500)] text-white shadow-[0_4px_12px_rgba(225,29,72,0.25)] font-bold' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:translate-x-1 hover:text-[var(--text-primary)] font-semibold'}`}
    >
      <Icon className={`w-5 h-5 ${activeTab === tabId ? '' : 'opacity-70'}`} />
      <span className="text-sm tracking-wide">{label}</span>
    </button>
  );

  const BottomNavItem = ({ icon: Icon, label, tabId }) => {
    const isActive = activeTab === tabId;
    return (
      <button 
        onClick={() => handleNavigate(tabId)}
        className="flex-1 flex flex-col items-center justify-center py-1 transition-all duration-300 group"
      >
        <div className={`w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full mb-1 transition-all duration-300 ${isActive ? 'bg-[var(--primary-50)] text-[var(--primary-600)] dark:bg-[var(--primary-900)]/30 dark:text-[var(--primary-400)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] group-hover:bg-[var(--surface-hover)]'}`}>
          <Icon className="w-5 h-5 sm:w-[22px] sm:h-[22px]" strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <span className={`text-[10px] sm:text-[11px] font-extrabold tracking-wide transition-all duration-300 ${isActive ? 'text-[var(--primary-600)] dark:text-[var(--primary-400)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>{label}</span>
      </button>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardOverview cardlogs={cardlogs} loading={loading} onNavigate={handleNavigate} />;
      case 'cardlogs':
        return <CardlogList cardlogs={cardlogs} loading={loading} onNavigate={handleNavigate} refreshLogs={fetchCardlogs} />;
      case 'new-cardlog':
        return <CardlogForm onClose={() => { handleNavigate('overview'); fetchCardlogs(); }} />;
      case 'edit-cardlog':
        return <CardlogForm initialData={editData} onClose={() => { handleNavigate('cardlogs'); fetchCardlogs(); }} />;
      case 'view-cardlog':
        return <CardlogForm initialData={editData} isReadOnly={true} onEdit={() => handleNavigate('edit-cardlog', editData)} onClose={() => { handleNavigate('cardlogs'); fetchCardlogs(); }} />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <Settings />;
      default:
        return <DashboardOverview cardlogs={cardlogs} loading={loading} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-default)] font-sans transition-colors duration-300">
      
      {/* Sidebar - Desktop */}
      <div className="hidden md:block w-64 xl:w-72 shrink-0 p-6 pr-0 sticky top-0 h-screen">
        <aside className="flex flex-col w-full h-full bg-[var(--bg-card)] rounded-[24px] border border-[var(--border-color)] shadow-sm overflow-hidden z-20">
          <div className="p-6 flex flex-col justify-center items-center relative overflow-hidden h-32 space-y-3 shrink-0">
            <div className="absolute inset-0 bg-[url('/bg-login.jpg')] bg-cover bg-center z-0" />
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(140,25,28,0.85)] to-[rgba(74,13,15,0.95)] z-0" />
            {/* Blueprint Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:20px_20px] z-0" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent z-0" />
            
            <div className="z-10 bg-white p-2.5 rounded-xl shadow-[0_4px_14px_0_rgba(0,0,0,0.15)] border border-white/20 transform transition-transform hover:scale-105">
              <img
                src="https://i.ibb.co.com/prMYS06h/LOGO-2025-03.png"
                alt="Logo"
                className="h-8 object-contain"
              />
            </div>
            <span className="z-10 text-[10px] font-extrabold text-white/95 uppercase tracking-widest text-center shadow-sm">Cardlog Heavy Equipment</span>
          </div>
          
          <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
            <NavItem icon={LayoutDashboard} label="Dashboard" tabId="overview" />
            <NavItem icon={FileText} label="Cardlogs" tabId="cardlogs" />
            {isDevAdmin && <NavItem icon={Users} label="User Management" tabId="users" />}
          </div>

          <div className="p-4 border-t border-[var(--border-color)] bg-[var(--surface-50)] space-y-3">
            {/* Profile Widget */}
            <div 
              onClick={() => handleNavigate('settings')}
              className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl hover:bg-[var(--surface-hover)] transition-all border border-[var(--border-color)]/50 hover:border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm"
            >
              {currentUser.profile_photo ? (
                <img src={currentUser.profile_photo} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-[var(--primary-500)]/30 shadow-sm shrink-0" />
              ) : (
                <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-700)] flex items-center justify-center text-white font-bold text-sm uppercase shadow-sm">
                  {(currentUser.full_name || currentUser.username || 'AD').substring(0, 2)}
                </div>
              )}
              <div className="text-sm overflow-hidden text-left flex-1">
                <p className="font-bold text-[var(--text-primary)] leading-tight tracking-tight truncate">{currentUser.full_name || currentUser.username || 'Admin User'}</p>
                <p className="text-xs text-[var(--text-secondary)] font-medium capitalize mt-0.5 truncate">{(currentUser.role || 'administrator').replace(/_/g, ' ')}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={toggleTheme}
                className="flex items-center justify-center p-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-xl transition-all border border-transparent hover:border-[var(--border-color)]"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <button 
                onClick={() => setShowLogoutConfirm(true)}
                className="flex-1 flex items-center justify-center space-x-2 p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-bold text-sm tracking-wide">Sign Out</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface)]/90 backdrop-blur-xl border-t border-[var(--border-color)] flex justify-around items-center px-1 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] transition-colors duration-300 rounded-t-2xl">
        <BottomNavItem icon={LayoutDashboard} label="Home" tabId="overview" />
        <BottomNavItem icon={FileText} label="Logs" tabId="cardlogs" />
        {isDevAdmin && <BottomNavItem icon={Users} label="Users" tabId="users" />}
        <BottomNavItem icon={SettingsIcon} label="Profile" tabId="settings" />
      </nav>

      {/* Floating Add Button - Bottom Right Mobile */}
      <button 
        onClick={() => handleNavigate('new-cardlog')}
        className="md:hidden fixed bottom-28 right-6 z-50 w-14 h-14 bg-[var(--primary-500)] hover:bg-[var(--primary-600)] rounded-full flex items-center justify-center text-white shadow-[0_8px_20px_rgba(225,29,72,0.4)] transform hover:scale-105 active:scale-95 transition-all duration-300"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Mobile Topbar - Modern Industrial */}
        <div className="md:hidden flex items-center justify-between relative overflow-hidden px-5 py-4 mb-6 shrink-0 shadow-md">
          <div className="absolute inset-0 bg-[url('/bg-login.jpg')] bg-cover bg-center z-0" />
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(140,25,28,0.85)] to-[rgba(74,13,15,0.95)] z-0" />
          {/* Blueprint Pattern */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:15px_15px] z-0" />
          
          <div className="flex items-center space-x-3 z-10 relative">
            <div className="bg-white p-1.5 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.12)] border border-white/20">
              <img
                src="https://i.ibb.co.com/prMYS06h/LOGO-2025-03.png"
                alt="Logo"
                className="h-7 object-contain"
              />
            </div>
            <span className="text-[13px] font-extrabold text-white uppercase tracking-widest drop-shadow-sm">CHES</span>
          </div>
          <div className="flex items-center space-x-1 z-10 relative">
            <button 
              onClick={toggleTheme}
              className="p-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all backdrop-blur-sm"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all backdrop-blur-sm ml-2"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Desktop Topbar */}
        <header className="hidden md:flex items-center justify-between px-6 lg:px-10 pt-6 pb-2 z-10 transition-colors duration-300 shrink-0 sticky top-0 bg-[var(--bg-default)]/80 backdrop-blur-xl">

          <div className="hidden md:flex items-center">
            <h1 className="text-2xl font-extrabold text-[var(--text-primary)] capitalize tracking-tight flex items-center gap-3">
              <div className="w-2 h-8 bg-[var(--primary-500)] rounded-full"></div>
              {activeTab.replace('-', ' ')}
            </h1>
          </div>

        </header>

        {/* Dynamic SPA Content */}
        <div className="flex-1 px-4 pb-28 md:pb-6 lg:px-10 lg:pb-10 w-full max-w-full">
          <div className="max-w-[1600px] mx-auto w-full relative">
            <div key={activeTab} className="animate-page-enter">
              {renderContent()}
            </div>
          </div>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && createPortal(
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative bg-[var(--surface)] rounded-t-[32px] sm:rounded-2xl shadow-2xl border border-[var(--border-color)] w-full max-w-md p-7 pb-10 sm:pb-7 animate-slide-up-sheet sm:animate-in sm:fade-in sm:zoom-in duration-200">
            <button onClick={() => setShowLogoutConfirm(false)} className="absolute top-5 right-5 p-2 rounded-full bg-[var(--surface-50)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-colors border border-[var(--border-color)]">
              <X className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-5 border border-red-100 dark:border-red-900/30">
              <LogOut className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-xl font-extrabold text-[var(--text-primary)] mb-2 tracking-tight">Konfirmasi Logout</h3>
            <p className="text-[var(--text-secondary)] mb-8 leading-relaxed font-medium">
              Apakah Anda yakin ingin keluar dari sistem? Anda harus login kembali untuk mengakses data.
            </p>
            <div className="flex flex-col-reverse sm:flex-row sm:space-x-3 gap-3 sm:gap-0 mt-2">
              <button 
                onClick={() => setShowLogoutConfirm(false)} 
                className="w-full sm:flex-1 px-4 py-3.5 bg-[var(--surface-50)] hover:bg-[var(--surface-hover)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-full sm:rounded-xl font-bold text-sm transition-all focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800"
              >
                Batal
              </button>
              <button 
                onClick={executeLogout} 
                className="w-full sm:flex-1 px-4 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-full sm:rounded-xl font-bold text-sm transition-all shadow-[0_4px_14px_0_rgba(220,38,38,0.39)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.23)] hover:-translate-y-0.5 focus:ring-4 focus:ring-red-600/30"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
