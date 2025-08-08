import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import LoadingSpinner from './components/LoadingSpinner';
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
                  <Home />
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
