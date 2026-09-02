import React, { useState, useEffect } from 'react';
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
      window.history.replaceState({ isDummy: true }, '', window.location.pathname);
      window.history.pushState({ tab: 'overview', data: null, isRoot: true }, '', window.location.pathname);
    }

    const handlePopState = (event) => {
      if (window.isFormDirty) {
        // Trap the user back into the form
        window.history.pushState(currentStateRef.current, '', window.location.pathname);
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
        window.history.pushState({ tab: 'overview', data: null, isRoot: true }, '', window.location.pathname);
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

  const handleNavigate = (tab, data = null) => {
    if (activeTab === tab && JSON.stringify(editData) === JSON.stringify(data)) return; // Prevent duplicate state
    window.history.pushState({ tab, data }, '', window.location.pathname);
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
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${activeTab === tabId ? 'bg-[#b52025] text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-semibold text-sm">{label}</span>
    </button>
  );

  const BottomNavItem = ({ icon: Icon, label, tabId }) => (
    <button 
      onClick={() => handleNavigate(tabId)}
      className={`flex-1 flex flex-col items-center justify-center py-2 transition-colors ${activeTab === tabId ? 'text-[#b52025]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
    >
      <Icon className={`w-7 h-7 mb-1 ${activeTab === tabId ? 'fill-current' : ''}`} />
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );

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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans transition-colors duration-200">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transition-colors duration-200">
        <div className="p-6 flex flex-col justify-center items-center border-b border-gray-100 dark:border-gray-800 h-28 space-y-3">
          <img
            src="https://i.ibb.co.com/prMYS06h/LOGO-2025-03.png"
            alt="Logo"
            className="h-10 object-contain drop-shadow-sm"
          />
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Cardlog Heavy Equipment</span>
        </div>
        
        <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <NavItem icon={LayoutDashboard} label="Dashboard" tabId="overview" />
          <NavItem icon={FileText} label="Cardlogs" tabId="cardlogs" />
          {isDevAdmin && <NavItem icon={Users} label="User Management" tabId="users" />}
          <NavItem icon={SettingsIcon} label="Profile" tabId="settings" />
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 flex justify-around items-center px-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] h-[72px]">
        <BottomNavItem icon={LayoutDashboard} label="Home" tabId="overview" />
        <BottomNavItem icon={FileText} label="Logs" tabId="cardlogs" />
        {isDevAdmin && <BottomNavItem icon={Users} label="Users" tabId="users" />}
        <BottomNavItem icon={SettingsIcon} label="Profile" tabId="settings" />
      </nav>

      {/* Floating Add Button - Bottom Right Mobile */}
      <button 
        onClick={() => handleNavigate('new-cardlog')}
        className="md:hidden fixed bottom-24 right-6 z-50 w-14 h-14 bg-[#b52025] hover:bg-[#8c191c] rounded-full flex items-center justify-center text-white shadow-xl transform hover:scale-105 transition-transform"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Topbar */}
        <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 transition-colors duration-200 shrink-0">
          <div className="flex items-center md:hidden">
            {/* Mobile Header Logo */}
            <img src="https://i.ibb.co.com/prMYS06h/LOGO-2025-03.png" alt="Logo" className="h-8 object-contain" />
          </div>
          <div className="hidden md:flex items-center">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white capitalize">
              {activeTab.replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <button 
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 mx-1 sm:mx-2" />
            <div 
              onClick={() => handleNavigate('settings')}
              className="flex items-center space-x-3 cursor-pointer p-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              {currentUser.profile_photo ? (
                <img src={currentUser.profile_photo} alt="Profile" className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#b52025] to-[#8c191c] flex items-center justify-center text-white font-bold text-sm uppercase">
                  {(currentUser.full_name || currentUser.username || 'AD').substring(0, 2)}
                </div>
              )}
              <div className="hidden sm:block text-sm">
                <p className="font-bold text-gray-700 dark:text-gray-200 leading-tight">{currentUser.full_name || currentUser.username || 'Admin User'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium capitalize">{(currentUser.role || 'administrator').replace(/_/g, ' ')}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic SPA Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8 bg-gray-50/50 dark:bg-gray-900/50 pb-32 md:pb-8 w-full max-w-full">
          <div className="max-w-7xl mx-auto relative min-h-full w-full">
            {renderContent()}
          </div>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-md shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center space-x-3 text-[#b52025] mb-4">
              <LogOut className="w-6 h-6" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Konfirmasi Logout</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Apakah Anda yakin ingin keluar? Anda harus memasukkan username dan password untuk login kembali ke sistem.
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)} 
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md font-bold text-sm transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={executeLogout} 
                className="flex-1 px-4 py-2.5 bg-[#b52025] hover:bg-[#8c191c] text-white rounded-md font-bold text-sm transition-colors"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
