import React, { useState } from 'react';
import { Shuffle, RefreshCw } from 'lucide-react';
import './LottoGenerator.css';

const LottoGenerator: React.FC = () => {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateLottoNumbers = () => {
    setIsGenerating(true);
    
    // 애니메이션 효과를 위한 지연
    setTimeout(() => {
      const lottoNumbers: number[] = [];
      
      while (lottoNumbers.length < 6) {
        const randomNumber = Math.floor(Math.random() * 45) + 1;
        if (!lottoNumbers.includes(randomNumber)) {
          lottoNumbers.push(randomNumber);
        }
      }
      
      // 오름차순 정렬
      lottoNumbers.sort((a, b) => a - b);
      setNumbers(lottoNumbers);
      setIsGenerating(false);
    }, 1000);
  };

  const getNumberColor = (number: number) => {
    if (number <= 10) return '#ff6b6b'; // 빨강
    if (number <= 20) return '#4ecdc4'; // 청록
    if (number <= 30) return '#45b7d1'; // 파랑
    if (number <= 40) return '#96ceb4'; // 초록
    return '#feca57'; // 노랑
  };

  return (
    <div className="lotto-container">
      <div className="lotto-header">
        <h1>🎯 이번주 로또 번호는?</h1>
        <p>1~45 중 6개의 행운의 번호를 추천해드려요!</p>
      </div>

      <div className="lotto-content">
        <button
          className={`generate-btn ${isGenerating ? 'generating' : ''}`}
          onClick={generateLottoNumbers}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <RefreshCw size={20} className="spinning" />
              번호 생성 중...
            </>
          ) : (
            <>
              <Shuffle size={20} />
              로또 번호 생성하기
            </>
          )}
        </button>

        {numbers.length > 0 && (
          <div className="numbers-container">
            <h3>🎉 추천 번호</h3>
            <div className="numbers-grid">
              {numbers.map((number, index) => (
                <div
                  key={index}
                  className="number-ball"
                  style={{ backgroundColor: getNumberColor(number) }}
                >
                  {number}
                </div>
              ))}
            </div>
            <p className="disclaimer">
              ⚠️ 이는 재미를 위한 추천 번호입니다. 실제 당첨을 보장하지 않습니다!
            </p>
          </div>
        )}

        {!isGenerating && numbers.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🎲</div>
            <p>버튼을 눌러서 행운의 번호를 생성해보세요!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LottoGenerator;
