import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAlert } from '../context/AlertContext';

export default function InactivityTimeout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useAlert();
  const timeoutRef = useRef(null);

  // 10 minutes in milliseconds
  const TIMEOUT_MS = 10 * 60 * 1000;

  const handleLogout = () => {
    localStorage.removeItem('ches_token');
    localStorage.removeItem('ches_user');
    showAlert('Sesi Berakhir', 'Sesi Anda telah berakhir karena tidak ada aktivitas selama 10 menit. Silakan login kembali.', 'info');
    navigate('/login');
  };

  const resetTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Only set timeout if not on login page and logged in
    const isAuth = !!localStorage.getItem('ches_token');
    if (location.pathname !== '/login' && isAuth) {
      timeoutRef.current = setTimeout(handleLogout, TIMEOUT_MS);
    }
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    
    const activityListener = () => {
      resetTimeout();
    };

    // Initialize
    resetTimeout();

    // Add listeners
    events.forEach(event => window.addEventListener(event, activityListener));

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(event => window.removeEventListener(event, activityListener));
    };
  }, [location.pathname]);

  return <>{children}</>;
}
