import React, { useState, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Memory } from '../types';
import { X, Image, Hash } from 'lucide-react';
import './EditMemory.css';

interface EditMemoryProps {
  memory: Memory;
  onClose: () => void;
  onSuccess: () => void;
}

const EditMemory: React.FC<EditMemoryProps> = ({ memory, onClose, onSuccess }) => {
  const [content, setContent] = useState(memory.content);
  const [hashtags, setHashtags] = useState(memory.hashtags.join(' #'));
  const [existingImages, setExistingImages] = useState<string[]>(memory.images);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImageUrls, setNewImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    const totalImages = existingImages.length + newImages.length + imageFiles.length;
    if (totalImages > 5) {
      alert('이미지는 최대 5개까지 업로드할 수 있습니다.');
      return;
    }

    setNewImages(prev => [...prev, ...imageFiles]);
    
    // 미리보기 URL 생성
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewImageUrls(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImageUrls(prev => prev.filter((_, i) => i !== index));
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

    setLoading(true);

    try {
      // 새 이미지 업로드
      const uploadedImageUrls: string[] = [];
      
      for (const image of newImages) {
        const imageRef = ref(storage, `memories/${Date.now()}_${image.name}`);
        await uploadBytes(imageRef, image);
        const downloadURL = await getDownloadURL(imageRef);
        uploadedImageUrls.push(downloadURL);
      }

      // 해시태그 추출
      const extractedHashtags = extractHashtags(hashtags);

      // Firestore 업데이트
      const memoryRef = doc(db, 'memories', memory.id);
      await updateDoc(memoryRef, {
        content: content.trim(),
        hashtags: extractedHashtags,
        images: [...existingImages, ...uploadedImageUrls],
        editedAt: new Date(),
        isEdited: true,
      });

      onSuccess();
    } catch (error) {
      console.error('메모리 수정 오류:', error);
      alert('메모리 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const totalImages = existingImages.length + newImages.length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>추억 수정</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-form">
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
                disabled={totalImages >= 5}
              >
                <Image size={20} />
                <span>이미지 추가 ({totalImages}/5)</span>
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

            {/* 기존 이미지들 */}
            {existingImages.length > 0 && (
              <div className="image-preview">
                <h4>기존 이미지</h4>
                <div className="image-grid">
                  {existingImages.map((url, index) => (
                    <div key={`existing-${index}`} className="image-preview-item">
                      <img src={url} alt={`기존 이미지 ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="remove-image-btn"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 새 이미지들 */}
            {newImageUrls.length > 0 && (
              <div className="image-preview">
                <h4>새 이미지</h4>
                <div className="image-grid">
                  {newImageUrls.map((url, index) => (
                    <div key={`new-${index}`} className="image-preview-item">
                      <img src={url} alt={`새 이미지 ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="remove-image-btn"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
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
              {loading ? '수정 중...' : '수정 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMemory;
