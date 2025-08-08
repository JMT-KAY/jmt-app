import React, { useState, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { db, storage, auth } from '../firebase';
import { X, Camera, User } from 'lucide-react';
import './ProfileEdit.css';

interface ProfileEditProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ProfileEdit: React.FC<ProfileEditProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.photoURL || null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setPhotoFile(file);
      
      // 미리보기 URL 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }

    if (!user) return;

    setLoading(true);

    try {
      let photoURL = user.photoURL;

      // 새 프로필 사진 업로드
      if (photoFile) {
        const photoRef = ref(storage, `profiles/${user.uid}_${Date.now()}`);
        await uploadBytes(photoRef, photoFile);
        photoURL = await getDownloadURL(photoRef);
      }

      // Firebase Auth 프로필 업데이트
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName.trim(),
          photoURL: photoURL
        });
      }

      // Firestore 사용자 정보 업데이트
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        photoURL: photoURL
      });

      onSuccess();
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      alert('프로필 업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>프로필 편집</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label className="form-label">프로필 사진</label>
            <div className="photo-upload-section">
              <div className="photo-preview">
                {photoPreview ? (
                  <img src={photoPreview} alt="프로필 사진" />
                ) : (
                  <div className="photo-placeholder">
                    <User size={40} />
                  </div>
                )}
              </div>
              
              <div className="photo-actions">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="photo-upload-btn"
                >
                  <Camera size={16} />
                  <span>사진 변경</span>
                </button>
                
                {photoPreview && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="photo-remove-btn"
                  >
                    사진 제거
                  </button>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">이름</label>
            <input
              type="text"
              placeholder="이름을 입력하세요"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="name-input"
              maxLength={20}
            />
            <div className="char-count">{displayName.length}/20</div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-btn"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading || !displayName.trim()}
            >
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEdit;
