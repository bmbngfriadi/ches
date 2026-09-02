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
    }
    closeAlert();
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
          
          <div className={`relative bg-white dark:bg-gray-900 w-[92%] sm:w-full sm:max-w-sm rounded-xl sm:rounded-md shadow-2xl overflow-hidden transform transition-all border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200`}>
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {getIcon(alertState.type)}
                </div>
                <div className="ml-4 flex-1 mt-0.5">
                  <h3 className="text-xl sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
                    {alertState.title}
                  </h3>
                  <div className="mt-3 text-[15px] sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
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
              <div className="bg-gray-50 dark:bg-gray-800/50 p-5 sm:px-6 sm:py-4 flex flex-col-reverse sm:flex-row justify-end gap-3">
                {alertState.type === 'confirm' && (
                  <button
                    onClick={closeAlert}
                    className="w-full sm:w-auto px-6 py-3.5 sm:py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 text-base sm:text-sm font-bold rounded-lg sm:rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Batal
                  </button>
                )}
                <button
                  onClick={alertState.type === 'confirm' ? handleConfirm : closeAlert}
                  className="w-full sm:w-auto px-6 py-3.5 sm:py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-base sm:text-sm font-bold rounded-lg sm:rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm"
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
