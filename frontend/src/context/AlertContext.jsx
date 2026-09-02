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
    if (alertState.onConfirm) {
      alertState.onConfirm();
    } else {
      closeAlert();
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={alertState.type === 'loading' ? undefined : closeAlert}></div>
          
          <div className={`relative bg-white dark:bg-gray-900 w-full max-w-sm rounded-md shadow-lg overflow-hidden transform transition-all border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200`}>
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {getIcon(alertState.type)}
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {alertState.title}
                  </h3>
                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <p>{alertState.message}</p>
                  </div>
                </div>
                {alertState.type !== 'loading' && (
                  <button 
                    onClick={closeAlert}
                    className="ml-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            {alertState.type !== 'loading' && (
              <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex justify-end gap-3">
                {alertState.type === 'confirm' && (
                  <button
                    onClick={closeAlert}
                    className="px-5 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 text-sm font-semibold rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Batal
                  </button>
                )}
                <button
                  onClick={alertState.type === 'confirm' ? handleConfirm : closeAlert}
                  className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
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
