import React, { useState, useRef } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebase';
import { X, Image, Hash } from 'lucide-react';
import './CreateMemory.css';

interface CreateMemoryProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateMemory: React.FC<CreateMemoryProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (images.length + imageFiles.length > 5) {
      alert('이미지는 최대 5개까지 업로드할 수 있습니다.');
      return;
    }

    setImages(prev => [...prev, ...imageFiles]);
    
    // 미리보기 URL 생성
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrls(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#[\w가-힣]+/g;
    return text.match(hashtagRegex)?.map(tag => tag.slice(1)) || [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    if (!user) return;

    setLoading(true);

    try {
      // 이미지 업로드
      const uploadedImageUrls: string[] = [];
      
      for (const image of images) {
        const imageRef = ref(storage, `memories/${Date.now()}_${image.name}`);
        await uploadBytes(imageRef, image);
        const downloadURL = await getDownloadURL(imageRef);
        uploadedImageUrls.push(downloadURL);
      }

      // 해시태그 추출
      const extractedHashtags = extractHashtags(hashtags);

      // Firestore에 메모리 저장
      const memoryData = {
        userId: user.uid,
        userName: user.displayName,
        userPhotoURL: user.photoURL,
        content: content.trim(),
        hashtags: extractedHashtags,
        images: uploadedImageUrls,
        likes: [],
        comments: [],
        createdAt: new Date(),
        isEdited: false,
      };

      await addDoc(collection(db, 'memories'), memoryData);

      onSuccess();
    } catch (error) {
      console.error('메모리 생성 오류:', error);
      alert('메모리 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>새로운 추억 작성</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-group">
            <textarea
              placeholder="어떤 추억을 공유하고 싶으신가요?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="content-input"
              rows={4}
              maxLength={500}
            />
            <div className="char-count">{content.length}/500</div>
          </div>

          <div className="form-group">
            <div className="hashtag-input-container">
              <Hash className="hashtag-icon" />
              <input
                type="text"
                placeholder="해시태그 (예: #회식 #팀워크 #즐거움)"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="hashtag-input"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="image-upload-section">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="image-upload-btn"
                disabled={images.length >= 5}
              >
                <Image size={20} />
                <span>이미지 추가 ({images.length}/5)</span>
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>

            {imageUrls.length > 0 && (
              <div className="image-preview">
                {imageUrls.map((url, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={url} alt={`미리보기 ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="remove-image-btn"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              disabled={loading || !content.trim()}
            >
              {loading ? '업로드 중...' : '추억 공유하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMemory;
