import React, { useState } from 'react';
import { doc, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { Memory, User, Comment } from '../types';
import EditMemory from './EditMemory';
import { Heart, MessageCircle, Trash2, Edit3, X } from 'lucide-react';
import './MemoryCard.css';

interface MemoryCardProps {
  memory: Memory;
  currentUser: User | null;
  onUpdate: () => void;
  postNumber: number;
}

const MemoryCard: React.FC<MemoryCardProps> = ({ 
  memory, 
  currentUser, 
  onUpdate,
  postNumber 
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(memory.likes.includes(currentUser?.uid || ''));
  const [likeCount, setLikeCount] = useState(memory.likes.length);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    if (diffInDays < 7) return `${diffInDays}일 전`;
    
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleLike = async () => {
    if (!currentUser) return;

    try {
      const memoryRef = doc(db, 'memories', memory.id);
      const newLikes = isLiked 
        ? memory.likes.filter(id => id !== currentUser.uid)
        : [...memory.likes, currentUser.uid];

      await updateDoc(memoryRef, {
        likes: newLikes
      });

      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    } catch (error) {
      console.error('좋아요 오류:', error);
    }
  };

  const handleComment = async () => {
    if (!currentUser || !newComment.trim()) return;

    try {
      const comment: Comment = {
        id: Date.now().toString(),
        userId: currentUser.uid,
        userName: currentUser.displayName,
        userPhotoURL: currentUser.photoURL,
        content: newComment.trim(),
        createdAt: new Date(),
      };

      const memoryRef = doc(db, 'memories', memory.id);
      await updateDoc(memoryRef, {
        comments: arrayUnion(comment)
      });

      setNewComment('');
      onUpdate();
    } catch (error) {
      console.error('댓글 추가 오류:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const memoryRef = doc(db, 'memories', memory.id);
      const updatedComments = memory.comments.filter(comment => comment.id !== commentId);
      
      await updateDoc(memoryRef, {
        comments: updatedComments
      });

      onUpdate();
    } catch (error) {
      console.error('댓글 삭제 오류:', error);
    }
  };

  const handleDeleteMemory = async () => {
    if (!window.confirm('정말로 이 추억을 삭제하시겠습니까?')) return;

    try {
      await deleteDoc(doc(db, 'memories', memory.id));
      onUpdate();
    } catch (error) {
      console.error('메모리 삭제 오류:', error);
    }
  };

  const isOwner = currentUser?.uid === memory.userId;

  return (
    <div className="memory-card">
      {/* 포스트 번호 */}
      <div className="post-number">#{postNumber}</div>
      
      {/* 헤더 */}
      <div className="memory-header">
        <div className="user-info">
          {memory.userPhotoURL ? (
            <img 
              src={memory.userPhotoURL} 
              alt={memory.userName} 
              className="user-avatar"
            />
          ) : (
            <div className="user-avatar-placeholder">
              {memory.userName.charAt(0)}
            </div>
          )}
          <div className="user-details">
            <div className="user-name">{memory.userName}</div>
            <div className="memory-date">
              {formatDate(memory.createdAt)}
              {memory.isEdited && ' (수정됨)'}
            </div>
          </div>
        </div>
        
        {isOwner && (
          <div className="memory-actions">
            <button 
              className="action-btn edit-btn"
              onClick={() => setShowEditModal(true)}
            >
              <Edit3 size={16} />
            </button>
            <button 
              className="action-btn delete-btn"
              onClick={handleDeleteMemory}
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 내용 */}
      <div className="memory-content">
        <p>{memory.content}</p>
        
        {/* 해시태그 */}
        {memory.hashtags.length > 0 && (
          <div className="hashtags">
            {memory.hashtags.map((tag, index) => (
              <span key={index} className="hashtag">#{tag}</span>
            ))}
          </div>
        )}
        
        {/* 이미지 */}
        {memory.images.length > 0 && (
          <div className="memory-images">
            {memory.images.map((image, index) => (
              <img 
                key={index} 
                src={image} 
                alt={`추억 이미지 ${index + 1}`} 
                className="memory-image"
              />
            ))}
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="memory-actions-bar">
        <button 
          className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
        >
          <Heart size={20} />
          <span>{likeCount}</span>
        </button>
        
        <div className="comment-count">
          <MessageCircle size={20} />
          <span>{memory.comments.length}</span>
        </div>
      </div>

      {/* 댓글 섹션 */}
      <div className="comments-section">
        {/* 댓글 입력 */}
        {currentUser && (
          <div className="comment-input-container">
            <input
              type="text"
              placeholder="댓글을 입력하세요..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleComment()}
              className="comment-input"
            />
            <button 
              onClick={handleComment}
              disabled={!newComment.trim()}
              className="comment-submit-btn"
            >
              게시
            </button>
          </div>
        )}

        {/* 댓글 목록 */}
        {memory.comments.length > 0 && (
          <div className="comments-list">
            {memory.comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-user">
                  {comment.userPhotoURL ? (
                    <img 
                      src={comment.userPhotoURL} 
                      alt={comment.userName} 
                      className="comment-avatar"
                    />
                  ) : (
                    <div className="comment-avatar-placeholder">
                      {comment.userName.charAt(0)}
                    </div>
                  )}
                  <div className="comment-details">
                    <div className="comment-user-name">{comment.userName}</div>
                    <div className="comment-content">{comment.content}</div>
                    <div className="comment-date">
                      {formatDate(comment.createdAt)}
                    </div>
                  </div>
                </div>
                
                {currentUser?.uid === comment.userId && (
                  <button
                    className="comment-delete-btn"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 편집 모달 */}
      {showEditModal && (
        <EditMemory
          memory={memory}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            onUpdate();
          }}
        />
      )}
    </div>
  );
};

export default MemoryCard;
