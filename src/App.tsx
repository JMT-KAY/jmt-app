import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import LottoGenerator from './components/LottoGenerator';
import CoffeeLottery from './components/CoffeeLottery';
import Sidebar from './components/Sidebar';
import LoadingSpinner from './components/LoadingSpinner';
import { Menu } from 'lucide-react';
import './App.css';

// 보호된 라우트 컴포넌트
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  console.log('ProtectedRoute 렌더링:', { user, loading });
  
  if (loading) {
    console.log('ProtectedRoute: 로딩 중이므로 로딩 화면 표시');
    return <LoadingSpinner fullScreen text="인증 확인 중..." />;
  }
  
  if (!user) {
    console.log('ProtectedRoute: 사용자가 없어서 로그인 페이지로 리다이렉트');
    return <Navigate to="/login" replace />;
  }
  
  console.log('ProtectedRoute: 사용자가 있으므로 메인 페이지 표시');
  return <>{children}</>;
};

// 메인 레이아웃 컴포넌트
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="main-layout">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="main-content">
        <div className="mobile-header">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={24} />
          </button>
        </div>
        
        <div className="content-area">
          {children}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  console.log('App 컴포넌트 렌더링');
  
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Home />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/lotto" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <LottoGenerator />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/coffee-lottery" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <CoffeeLottery />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
