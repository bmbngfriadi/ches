import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Register from './pages/Register';
import { ThemeProvider } from './context/ThemeContext';
import { AlertProvider } from './context/AlertContext';

import InactivityTimeout from './components/InactivityTimeout';

function App() {
  return (
    <ThemeProvider>
      <AlertProvider>
        <BrowserRouter>
          <InactivityTimeout>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </InactivityTimeout>
        </BrowserRouter>
      </AlertProvider>
    </ThemeProvider>
  );
}

export default App;
