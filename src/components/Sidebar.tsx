import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Plus, 
  Coffee, 
  Hash,
  X
} from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();

  const menuItems = [
    {
      path: '/',
      icon: <Home size={20} />,
      label: '추억 피드',
      description: '팀원들의 소중한 순간들'
    },
    {
      path: '/create-memory',
      icon: <Plus size={20} />,
      label: '추억 올리기',
      description: '새로운 추억을 공유해보세요'
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
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
