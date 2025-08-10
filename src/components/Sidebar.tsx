import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Coffee, 
  Hash,
  X,
  Settings,
  LogOut,
  Search
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onProfileEdit: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, onProfileEdit }) => {
  const location = useLocation();
  const { signOut } = useAuth();

  const menuItems = [
    {
      path: '/',
      icon: <Home size={20} />,
      label: '추억 피드',
      description: '팀원들의 소중한 순간들'
    },
    {
      path: '/lotto',
      icon: <Hash size={20} />,
      label: '이번주 로또 번호는?',
      description: '1~45 중 6개 번호 추천'
    },
    {
      path: '/coffee-lottery',
      icon: <Coffee size={20} />,
      label: '이번주 커피 당첨자는?',
      description: '커피 사다리 게임'
    },
    {
      path: '/spot-difference',
      icon: <Search size={20} />,
      label: '틀린그림 찾기',
      description: '추억 사진으로 게임하기'
    }
  ];

  return (
    <>
      {/* 모바일 오버레이 */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onToggle} />
      )}
      
      {/* 사이드바 */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>JMT</h2>
          <button className="sidebar-close" onClick={onToggle}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={onToggle}
            >
              <div className="sidebar-item-icon">
                {item.icon}
              </div>
              <div className="sidebar-item-content">
                <div className="sidebar-item-label">{item.label}</div>
                <div className="sidebar-item-description">{item.description}</div>
              </div>
            </Link>
          ))}
          
          {/* 구분선 */}
          <div className="sidebar-divider"></div>
          
          {/* 설정 및 로그아웃 */}
          <button
            className="sidebar-item sidebar-action-item"
            onClick={() => {
              onProfileEdit();
              onToggle();
            }}
          >
            <div className="sidebar-item-icon">
              <Settings size={20} />
            </div>
            <div className="sidebar-item-content">
              <div className="sidebar-item-label">프로필 설정</div>
              <div className="sidebar-item-description">개인정보 수정</div>
            </div>
          </button>
          
          <button
            className="sidebar-item sidebar-action-item"
            onClick={async () => {
              try {
                await signOut();
                onToggle();
              } catch (error) {
                console.error('로그아웃 오류:', error);
              }
            }}
          >
            <div className="sidebar-item-icon">
              <LogOut size={20} />
            </div>
            <div className="sidebar-item-content">
              <div className="sidebar-item-label">로그아웃</div>
              <div className="sidebar-item-description">계정에서 나가기</div>
            </div>
          </button>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
