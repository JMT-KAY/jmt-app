import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { X, Check } from 'lucide-react';
import './SpotTheDifference.css';

interface GameRecord {
  id: string;
  userName: string;
  time: number;
  createdAt: any;
}

interface Difference {
  x: number;
  y: number;
  side: 'left' | 'right';
  found: boolean;
}

const SpotTheDifference: React.FC = () => {
  const { user } = useAuth();
  const [memories, setMemories] = useState<any[]>([]);
  const [currentImage, setCurrentImage] = useState<string>('');
  const [differences, setDifferences] = useState<Difference[]>([]);
  const [foundDifferences, setFoundDifferences] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameTime, setGameTime] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWrongMark, setShowWrongMark] = useState(false);
  const [wrongPosition, setWrongPosition] = useState({ x: 0, y: 0 });

  // 게임 시간 측정
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && !gameCompleted) {
      interval = setInterval(() => {
        setGameTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameCompleted]);

  // 추억 사진들 가져오기
  const fetchMemories = useCallback(async () => {
    try {
      const memoriesQuery = query(
        collection(db, 'memories'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(memoriesQuery);
      
      const memoriesData: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.images && data.images.length > 0) {
          memoriesData.push({
            id: doc.id,
            images: data.images,
            userName: data.userName
          });
        }
      });
      
      setMemories(memoriesData);
      setLoading(false);
    } catch (error) {
      console.error('추억 가져오기 오류:', error);
      setLoading(false);
    }
  }, []);

  // 랭킹 기록 가져오기
  const fetchRecords = useCallback(async () => {
    try {
      const recordsQuery = query(
        collection(db, 'spotTheDifferenceRecords'),
        orderBy('time', 'asc')
      );
      const querySnapshot = await getDocs(recordsQuery);
      
      const recordsData: GameRecord[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        recordsData.push({
          id: doc.id,
          userName: data.userName,
          time: data.time,
          createdAt: data.createdAt
        });
      });
      
      setRecords(recordsData);
    } catch (error) {
      console.error('랭킹 가져오기 오류:', error);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
    fetchRecords();
  }, [fetchMemories, fetchRecords]);

  // 틀린그림 생성
  const generateDifferences = useCallback((imageUrl: string) => {
    const newDifferences: Difference[] = [];
    
    // 5개의 틀린 부분 생성
    for (let i = 0; i < 5; i++) {
      const side = Math.random() > 0.5 ? 'left' : 'right' as 'left' | 'right';
      const x = Math.random() * 80 + 10; // 10% ~ 90%
      const y = Math.random() * 80 + 10; // 10% ~ 90%
      
      newDifferences.push({
        x,
        y,
        side,
        found: false
      });
    }
    
    setDifferences(newDifferences);
    setFoundDifferences(0);
    setGameTime(0);
    setGameCompleted(false);
  }, []);

  // 게임 시작
  const startGame = useCallback(() => {
    if (memories.length === 0) return;
    
    const randomMemory = memories[Math.floor(Math.random() * memories.length)];
    const randomImage = randomMemory.images[Math.floor(Math.random() * randomMemory.images.length)];
    
    setCurrentImage(randomImage);
    generateDifferences(randomImage);
    setGameStarted(true);
  }, [memories, generateDifferences]);

  // 틀린 부분 클릭 처리
  const handleImageClick = useCallback((event: React.MouseEvent<HTMLDivElement>, side: 'left' | 'right') => {
    if (gameCompleted) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    // 틀린 부분과의 거리 확인
    const clickedDifference = differences.find(diff => 
      diff.side === side && 
      !diff.found &&
      Math.abs(diff.x - x) < 8 && 
      Math.abs(diff.y - y) < 8
    );
    
    if (clickedDifference) {
      // 정답!
      setDifferences(prev => 
        prev.map(diff => 
          diff === clickedDifference ? { ...diff, found: true } : diff
        )
      );
      setFoundDifferences(prev => prev + 1);
      
      // 모든 틀린 부분을 찾았는지 확인
      if (foundDifferences + 1 >= 5) {
        setGameCompleted(true);
        saveRecord();
      }
    } else {
      // 오답 - X 표시
      setWrongPosition({ x, y });
      setShowWrongMark(true);
      setTimeout(() => setShowWrongMark(false), 1000);
    }
  }, [differences, foundDifferences, gameCompleted, saveRecord]);

  // 기록 저장
  const saveRecord = useCallback(async () => {
    if (!user) return;
    
    try {
      await addDoc(collection(db, 'spotTheDifferenceRecords'), {
        userName: user.displayName || '익명',
        time: gameTime,
        createdAt: serverTimestamp()
      });
      
      fetchRecords(); // 랭킹 새로고침
    } catch (error) {
      console.error('기록 저장 오류:', error);
    }
  }, [user, gameTime, fetchRecords]);

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="spot-difference-container">
        <div className="loading-message">게임을 준비하는 중...</div>
      </div>
    );
  }

  return (
    <div className="spot-difference-container">
      <header className="game-header">
        <h1>틀린그림 찾기</h1>
        {gameStarted && !gameCompleted && (
          <div className="game-info">
            <span>시간: {formatTime(gameTime)}</span>
            <span>찾은 개수: {foundDifferences}/5</span>
          </div>
        )}
      </header>

      {!gameStarted ? (
        <div className="game-start">
          <p>기존 추억 사진으로 틀린그림 찾기 게임을 시작해보세요!</p>
          <button className="start-btn" onClick={startGame}>
            게임 시작
          </button>
        </div>
      ) : (
        <div className="game-area">
          <div className="images-container">
            {/* 왼쪽 이미지 */}
            <div className="image-wrapper">
              <div className="image-label">원본</div>
              <div 
                className="game-image left-image"
                onClick={(e) => handleImageClick(e, 'left')}
              >
                <img src={currentImage} alt="원본" />
                {differences
                  .filter(diff => diff.side === 'left' && diff.found)
                  .map((diff, index) => (
                    <div
                      key={index}
                      className="found-mark"
                      style={{ left: `${diff.x}%`, top: `${diff.y}%` }}
                    >
                      <Check size={20} />
                    </div>
                  ))}
                {showWrongMark && (
                  <div
                    className="wrong-mark"
                    style={{ left: `${wrongPosition.x}%`, top: `${wrongPosition.y}%` }}
                  >
                    <X size={20} />
                  </div>
                )}
              </div>
            </div>

            {/* 오른쪽 이미지 */}
            <div className="image-wrapper">
              <div className="image-label">틀린그림</div>
              <div 
                className="game-image right-image"
                onClick={(e) => handleImageClick(e, 'right')}
              >
                <img src={currentImage} alt="틀린그림" />
                {differences
                  .filter(diff => diff.side === 'right' && diff.found)
                  .map((diff, index) => (
                    <div
                      key={index}
                      className="found-mark"
                      style={{ left: `${diff.x}%`, top: `${diff.y}%` }}
                    >
                      <Check size={20} />
                    </div>
                  ))}
                {showWrongMark && (
                  <div
                    className="wrong-mark"
                    style={{ left: `${wrongPosition.x}%`, top: `${wrongPosition.y}%` }}
                  >
                    <X size={20} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {gameCompleted && (
            <div className="game-complete">
              <h2>🎉 게임 완료!</h2>
              <p>완료 시간: {formatTime(gameTime)}</p>
              <button className="restart-btn" onClick={startGame}>
                다시 시작
              </button>
            </div>
          )}
        </div>
      )}

      {/* 랭킹 */}
      <div className="ranking-section">
        <h3>🏆 최고 기록</h3>
        <div className="ranking-list">
          {records.slice(0, 10).map((record, index) => (
            <div key={record.id} className="ranking-item">
              <span className="rank">{index + 1}</span>
              <span className="name">{record.userName}</span>
              <span className="time">{formatTime(record.time)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpotTheDifference;
