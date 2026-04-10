import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import FeedPage from './pages/FeedPage';
import PublicFeedPage from './pages/PublicFeedPage';
import SubmitPage from './pages/SubmitPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import './styles/App.module.css';

function App() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar />
      <Routes>
        {/* Public Routes - No login required */}
        <Route path="/" element={<PublicFeedPage />} />
        <Route path="/feed" element={<PublicFeedPage />} />
        
        {/* Auth Page */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected Routes - Login required */}
        <Route 
          path="/submit" 
          element={currentUser ? <SubmitPage /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/profile" 
          element={currentUser ? <ProfilePage /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/dashboard" 
          element={currentUser ? <DashboardPage /> : <Navigate to="/auth" />} 
        />
      </Routes>
    </div>
  );
}

export default App;
