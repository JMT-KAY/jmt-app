import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { Memory } from '../types';
import MemoryCard from './MemoryCard';
import CreateMemory from './CreateMemory';
import ProfileEdit from './ProfileEdit';
import { Search, Settings, Plus, LogOut } from 'lucide-react';
import './Home.css';

const Home: React.FC = () => {
  const { user, signOut } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [users, setUsers] = useState<string[]>([]);

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      const memoriesQuery = query(
        collection(db, 'memories'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(memoriesQuery);
      
      const memoriesData: Memory[] = [];
      const uniqueUsers = new Set<string>();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const memory: Memory = {
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          userPhotoURL: data.userPhotoURL,
          content: data.content,
          hashtags: data.hashtags || [],
          images: data.images || [],
          likes: data.likes || [],
          comments: data.comments || [],
          createdAt: data.createdAt.toDate(),
          editedAt: data.editedAt?.toDate(),
          isEdited: data.isEdited || false,
        };
        memoriesData.push(memory);
        uniqueUsers.add(data.userName);
      });
      
      setMemories(memoriesData);
      setUsers(Array.from(uniqueUsers));
      setLoading(false);
    } catch (error) {
      console.error('메모리 가져오기 오류:', error);
      setLoading(false);
    }
  };

  const filteredMemories = memories.filter((memory) => {
    const matchesSearch = 
      memory.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memory.hashtags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      memory.userName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUser = selectedUser === 'all' || memory.userName === selectedUser;
    
    return matchesSearch && matchesUser;
  });

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchMemories();
  };

  const handleProfileUpdate = () => {
    setShowProfileModal(false);
    fetchMemories();
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading-message">추억을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* 헤더 */}
      <header className="home-header">
        <h1>JMT</h1>
        <div className="header-actions">
          <button 
            className="profile-settings-btn"
            onClick={() => setShowProfileModal(true)}
            title="프로필 설정"
          >
            <Settings size={24} />
          </button>
          <button 
            className="logout-btn"
            onClick={handleLogout}
            title="로그아웃"
          >
            <LogOut size={24} />
          </button>
        </div>
      </header>

      {/* 검색 및 필터 */}
      <div className="search-section">
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="추억 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="user-filter">
          <button
            className={`filter-btn ${selectedUser === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedUser('all')}
          >
            전체
          </button>
          {users.map((userName) => (
            <button
              key={userName}
              className={`filter-btn ${selectedUser === userName ? 'active' : ''}`}
              onClick={() => setSelectedUser(userName)}
            >
              {userName}
            </button>
          ))}
        </div>
      </div>

      {/* 메모리 피드 */}
      <div className="memories-container">
        {filteredMemories.length === 0 ? (
          <div className="empty-state">
            <p>아직 추억이 없어요</p>
            <p>첫 번째 추억을 공유해보세요!</p>
          </div>
        ) : (
          filteredMemories.map((memory, index) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              currentUser={user}
              onUpdate={fetchMemories}
              postNumber={index + 1}
            />
          ))
        )}
      </div>

      {/* 추억 작성 버튼 */}
      <button
        className="fab"
        onClick={() => setShowCreateModal(true)}
      >
        <Plus size={24} />
        <span>추억 +</span>
      </button>

      {/* 모달들 */}
      {showCreateModal && (
        <CreateMemory
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {showProfileModal && (
        <ProfileEdit
          onClose={() => setShowProfileModal(false)}
          onSuccess={handleProfileUpdate}
        />
      )}
    </div>
  );
};

export default Home;

