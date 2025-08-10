import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Coffee, Users, Gift, Trash2, Play } from 'lucide-react';
import './CoffeeLottery.css';

interface Participant {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL: string | null;
  joinedAt: Date;
}

interface Lottery {
  id: string;
  title: string;
  winnerCount: number;
  participants: Participant[];
  winners: string[];
  isActive: boolean;
  createdAt: Date;
}

const CoffeeLottery: React.FC = () => {
  const { user } = useAuth();
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [newLotteryTitle, setNewLotteryTitle] = useState('');
  const [newWinnerCount, setNewWinnerCount] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'coffeeLotteries'), (snapshot) => {
      const lotteryData: Lottery[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        lotteryData.push({
          id: doc.id,
          title: data.title,
          winnerCount: data.winnerCount,
          participants: data.participants || [],
          winners: data.winners || [],
          isActive: data.isActive,
          createdAt: data.createdAt.toDate(),
        });
      });
      setLotteries(lotteryData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    });

    return () => unsubscribe();
  }, []);

  const createLottery = async () => {
    if (!user || !newLotteryTitle.trim() || newWinnerCount < 1) return;

    setIsCreating(true);
    try {
      await addDoc(collection(db, 'coffeeLotteries'), {
        title: newLotteryTitle.trim(),
        winnerCount: newWinnerCount,
        participants: [],
        winners: [],
        isActive: true,
        createdAt: new Date(),
      });
      setNewLotteryTitle('');
      setNewWinnerCount(1);
    } catch (error) {
      console.error('커피 추첨 생성 오류:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const joinLottery = async (lotteryId: string) => {
    if (!user) return;

    const lottery = lotteries.find(l => l.id === lotteryId);
    if (!lottery || !lottery.isActive) return;

    const isAlreadyJoined = lottery.participants.some(p => p.userId === user.uid);
    if (isAlreadyJoined) return;

    try {
      const participant: Participant = {
        id: Date.now().toString(),
        userId: user.uid,
        userName: user.displayName,
        userPhotoURL: user.photoURL,
        joinedAt: new Date(),
      };

      await updateDoc(doc(db, 'coffeeLotteries', lotteryId), {
        participants: [...lottery.participants, participant]
      });
    } catch (error) {
      console.error('참가 오류:', error);
    }
  };

  const leaveLottery = async (lotteryId: string) => {
    if (!user) return;

    const lottery = lotteries.find(l => l.id === lotteryId);
    if (!lottery || !lottery.isActive) return;

    try {
      const updatedParticipants = lottery.participants.filter(p => p.userId !== user.uid);
      await updateDoc(doc(db, 'coffeeLotteries', lotteryId), {
        participants: updatedParticipants
      });
    } catch (error) {
      console.error('참가 취소 오류:', error);
    }
  };

  const drawWinners = async (lotteryId: string) => {
    const lottery = lotteries.find(l => l.id === lotteryId);
    if (!lottery || !lottery.isActive || lottery.participants.length < lottery.winnerCount) return;

    setIsDrawing(true);
    
    // 애니메이션 효과를 위한 지연
    setTimeout(async () => {
      try {
        const shuffled = [...lottery.participants].sort(() => Math.random() - 0.5);
        const winners = shuffled.slice(0, lottery.winnerCount).map(p => p.userId);

        await updateDoc(doc(db, 'coffeeLotteries', lotteryId), {
          winners,
          isActive: false
        });
      } catch (error) {
        console.error('추첨 오류:', error);
      } finally {
        setIsDrawing(false);
      }
    }, 2000);
  };

  const deleteLottery = async (lotteryId: string) => {
    if (!window.confirm('정말로 이 추첨을 삭제하시겠습니까?')) return;

    try {
      await deleteDoc(doc(db, 'coffeeLotteries', lotteryId));
    } catch (error) {
      console.error('삭제 오류:', error);
    }
  };

  const isParticipant = (lottery: Lottery) => {
    return lottery.participants.some(p => p.userId === user?.uid);
  };

  const isWinner = (lottery: Lottery) => {
    return lottery.winners.includes(user?.uid || '');
  };

  return (
    <div className="coffee-lottery-container">
      <div className="lottery-header">
        <h1>☕ 이번주 커피 당첨자는?</h1>
        <p>참가하고 추첨을 통해 커피를 받아보세요!</p>
      </div>

      {/* 새 추첨 생성 */}
      <div className="create-lottery-section">
        <h2>새 추첨 만들기</h2>
        <div className="create-form">
          <input
            type="text"
            placeholder="추첨 제목 (예: 이번주 커피 추첨)"
            value={newLotteryTitle}
            onChange={(e) => setNewLotteryTitle(e.target.value)}
            className="lottery-input"
          />
          <input
            type="number"
            min="1"
            max="10"
            value={newWinnerCount}
            onChange={(e) => setNewWinnerCount(parseInt(e.target.value) || 1)}
            className="lottery-input"
          />
          <button
            onClick={createLottery}
            disabled={isCreating || !newLotteryTitle.trim()}
            className="create-btn"
          >
            {isCreating ? '생성 중...' : '추첨 생성'}
          </button>
        </div>
      </div>

      {/* 추첨 목록 */}
      <div className="lotteries-section">
        <h2>진행 중인 추첨</h2>
        {lotteries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">☕</div>
            <p>아직 진행 중인 추첨이 없습니다.</p>
          </div>
        ) : (
          <div className="lotteries-grid">
            {lotteries.map((lottery) => (
              <div key={lottery.id} className={`lottery-card ${!lottery.isActive ? 'completed' : ''}`}>
                <div className="lottery-header">
                  <h3>{lottery.title}</h3>
                  {!lottery.isActive && <span className="status-badge">완료</span>}
                </div>
                
                <div className="lottery-info">
                  <p>🎁 당첨자 수: {lottery.winnerCount}명</p>
                  <p>👥 참가자 수: {lottery.participants.length}명</p>
                </div>

                {lottery.isActive ? (
                  <div className="lottery-actions">
                    {!isParticipant(lottery) ? (
                      <button
                        onClick={() => joinLottery(lottery.id)}
                        className="join-btn"
                      >
                        <Users size={16} />
                        참가하기
                      </button>
                    ) : (
                      <button
                        onClick={() => leaveLottery(lottery.id)}
                        className="leave-btn"
                      >
                        참가 취소
                      </button>
                    )}
                    
                    {lottery.participants.length >= lottery.winnerCount && (
                      <button
                        onClick={() => drawWinners(lottery.id)}
                        disabled={isDrawing}
                        className="draw-btn"
                      >
                        {isDrawing ? (
                          <>
                            <Play size={16} className="spinning" />
                            추첨 중...
                          </>
                        ) : (
                          <>
                            <Gift size={16} />
                            추첨하기
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="winners-section">
                    <h4>🎉 당첨자</h4>
                    <div className="winners-list">
                      {lottery.winners.map((winnerId) => {
                        const winner = lottery.participants.find(p => p.userId === winnerId);
                        return (
                          <div key={winnerId} className={`winner-item ${isWinner(lottery) ? 'current-user' : ''}`}>
                            {winner?.userPhotoURL ? (
                              <img src={winner.userPhotoURL} alt={winner.userName} className="winner-avatar" />
                            ) : (
                              <div className="winner-avatar-placeholder">
                                {winner?.userName.charAt(0)}
                              </div>
                            )}
                            <span>{winner?.userName}</span>
                            {isWinner(lottery) && <span className="winner-badge">나</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => deleteLottery(lottery.id)}
                  className="delete-btn"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoffeeLottery;
