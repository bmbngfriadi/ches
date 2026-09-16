import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Info, X, AlertTriangle, Loader2 } from 'lucide-react';

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info', // 'success', 'error', 'info', 'confirm'
    onConfirm: null
  });

  const showAlert = useCallback((title, message, type = 'info', onConfirm = null) => {
    setAlertState({ isOpen: true, title, message, type, onConfirm });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleConfirm = () => {
    const callback = alertState.onConfirm;
    closeAlert();
    if (callback) {
      setTimeout(() => callback(), 150); // wait for close animation
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-8 h-8 text-green-500" />;
      case 'error': return <XCircle className="w-8 h-8 text-red-500" />;
      case 'confirm': return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
      case 'loading': return <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />;
      default: return <Info className="w-8 h-8 text-blue-500" />;
    }
  };

  const getColors = (type) => {
    switch (type) {
      case 'success': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30';
      case 'error': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30';
      case 'confirm': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/30';
      default: return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30';
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, closeAlert }}>
      {children}
      
      {/* Custom Modal Popup */}
      {alertState.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md transition-opacity" onClick={alertState.type === 'loading' ? undefined : closeAlert}></div>
          
          <div className={`relative bg-[var(--surface)] w-full sm:max-w-sm rounded-t-[32px] sm:rounded-2xl shadow-2xl overflow-hidden transform transition-all border border-[var(--border-color)] animate-slide-up-sheet sm:animate-in sm:fade-in sm:zoom-in-95 duration-200`}>
            <div className="p-6 sm:pb-6 pb-2">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {getIcon(alertState.type)}
                </div>
                <div className="ml-4 flex-1 mt-0.5">
                  <h3 className="text-xl sm:text-lg font-extrabold text-[var(--text-primary)] leading-tight">
                    {alertState.title}
                  </h3>
                  <div className="mt-3 text-[15px] sm:text-sm font-medium text-[var(--text-secondary)] leading-relaxed">
                    <p>{alertState.message}</p>
                  </div>
                </div>
                {alertState.type !== 'loading' && (
                  <button 
                    onClick={closeAlert}
                    className="ml-4 p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            {alertState.type !== 'loading' && (
              <div className="bg-[var(--surface-50)] border-t border-[var(--border-color)] p-5 sm:px-6 flex flex-col-reverse sm:flex-row justify-end gap-3">
                {alertState.type === 'confirm' && (
                  <button
                    onClick={closeAlert}
                    className="w-full sm:w-auto px-6 py-3 bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border-color)] text-base sm:text-sm font-bold rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                )}
                <button
                  onClick={alertState.type === 'confirm' ? handleConfirm : closeAlert}
                  className="w-full sm:w-auto px-6 py-3 bg-[var(--primary-500)] hover:bg-[var(--primary-600)] text-white text-base sm:text-sm font-bold rounded-xl transition-colors shadow-[0_4px_14px_0_rgba(225,29,72,0.39)]"
                >
                  {alertState.type === 'confirm' ? 'Ya, Lanjutkan' : 'Mengerti'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};
