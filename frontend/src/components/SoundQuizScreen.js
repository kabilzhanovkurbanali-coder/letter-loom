import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

const QUIZ_DATA = {
  EN: [
    { word: 'cat', emoji: '🐱' }, { word: 'dog', emoji: '🐶' },
    { word: 'fish', emoji: '🐟' }, { word: 'bird', emoji: '🐦' },
    { word: 'apple', emoji: '🍎' }, { word: 'banana', emoji: '🍌' },
    { word: 'sun', emoji: '☀️' }, { word: 'moon', emoji: '🌙' },
    { word: 'tree', emoji: '🌳' }, { word: 'house', emoji: '🏠' },
    { word: 'car', emoji: '🚗' }, { word: 'boat', emoji: '⛵' },
    { word: 'flower', emoji: '🌸' }, { word: 'star', emoji: '⭐' },
    { word: 'elephant', emoji: '🐘' }, { word: 'rabbit', emoji: '🐰' },
    { word: 'frog', emoji: '🐸' }, { word: 'butterfly', emoji: '🦋' },
    { word: 'lion', emoji: '🦁' }, { word: 'bear', emoji: '🐻' }
  ],
  RU: [
    { word: 'кот', emoji: '🐱' }, { word: 'собака', emoji: '🐶' },
    { word: 'рыба', emoji: '🐟' }, { word: 'птица', emoji: '🐦' },
    { word: 'яблоко', emoji: '🍎' }, { word: 'банан', emoji: '🍌' },
    { word: 'солнце', emoji: '☀️' }, { word: 'луна', emoji: '🌙' },
    { word: 'дерево', emoji: '🌳' }, { word: 'дом', emoji: '🏠' },
    { word: 'машина', emoji: '🚗' }, { word: 'лодка', emoji: '⛵' },
    { word: 'цветок', emoji: '🌸' }, { word: 'звезда', emoji: '⭐' },
    { word: 'слон', emoji: '🐘' }, { word: 'кролик', emoji: '🐰' },
    { word: 'лягушка', emoji: '🐸' }, { word: 'бабочка', emoji: '🦋' },
    { word: 'лев', emoji: '🦁' }, { word: 'медведь', emoji: '🐻' }
  ],
  KG: [
    { word: 'мышык', emoji: '🐱' }, { word: 'ит', emoji: '🐶' },
    { word: 'балык', emoji: '🐟' }, { word: 'куш', emoji: '🐦' },
    { word: 'алма', emoji: '🍎' }, { word: 'банан', emoji: '🍌' },
    { word: 'күн', emoji: '☀️' }, { word: 'ай', emoji: '🌙' },
    { word: 'дарак', emoji: '🌳' }, { word: 'үй', emoji: '🏠' },
    { word: 'машина', emoji: '🚗' }, { word: 'кайык', emoji: '⛵' },
    { word: 'гүл', emoji: '🌸' }, { word: 'жылдыз', emoji: '⭐' },
    { word: 'пил', emoji: '🐘' }, { word: 'коён', emoji: '🐰' },
    { word: 'бака', emoji: '🐸' }, { word: 'капалек', emoji: '🦋' },
    { word: 'арстан', emoji: '🦁' }, { word: 'аюу', emoji: '🐻' }
  ],
  UZ: [
    { word: 'mushuk', emoji: '🐱' }, { word: 'it', emoji: '🐶' },
    { word: 'baliq', emoji: '🐟' }, { word: 'qush', emoji: '🐦' },
    { word: 'olma', emoji: '🍎' }, { word: 'banan', emoji: '🍌' },
    { word: 'quyosh', emoji: '☀️' }, { word: 'oy', emoji: '🌙' },
    { word: 'daraxt', emoji: '🌳' }, { word: 'uy', emoji: '🏠' },
    { word: 'mashina', emoji: '🚗' }, { word: 'qayiq', emoji: '⛵' },
    { word: 'gul', emoji: '🌸' }, { word: 'yulduz', emoji: '⭐' },
    { word: 'fil', emoji: '🐘' }, { word: 'quyon', emoji: '🐰' },
    { word: 'qurbaqa', emoji: '🐸' }, { word: 'kapalak', emoji: '🦋' },
    { word: 'sher', emoji: '🦁' }, { word: 'ayiq', emoji: '🐻' }
  ]
};

const QUIZ_TEXT = {
  EN: {
    title: 'Guess the Word',
    listen: 'Listen carefully',
    hear: '🔊 Hear',
    score: 'Score',
    round: 'Round',
    correct: 'Correct!',
    wrong: 'Almost! Let’s try again 🙂',
    win: 'Excellent!',
    winScore: (score) => `${score} out of 10`,
    again: 'Play Again',
    back: 'Back'
  },
  RU: {
    title: 'Угадай слово',
    listen: 'Слушай внимательно',
    hear: '🔊 Послушать',
    score: 'Счёт',
    round: 'Раунд',
    correct: 'Верно!',
    wrong: 'Почти! Попробуем ещё 🙂',
    win: 'Отлично!',
    winScore: (score) => `${score} из 10`,
    again: 'Ещё раз',
    back: 'Назад'
  },
  KG: {
    title: 'Сөздү тап',
    listen: 'Кунт коюп ук',
    hear: '🔊 Ук',
    score: 'Упай',
    round: 'Раунд',
    correct: 'Туура!',
    wrong: 'Дээрлик! Дагы аракет кылалы 🙂',
    win: 'Сонун!',
    winScore: (score) => `10дон ${score}`,
    again: 'Дагы',
    back: 'Артка'
  },
  UZ: {
    title: 'So`zni top',
    listen: 'Diqqat bilan tinglang',
    hear: '🔊 Tinglash',
    score: 'Ball',
    round: 'Raund',
    correct: 'To`g`ri!',
    wrong: 'Deyarli! Yana urinib ko‘ramiz 🙂',
    win: 'Ajoyib!',
    winScore: (score) => `10 dan ${score}`,
    again: 'Yana',
    back: 'Orqaga'
  }
};

const TOTAL_ROUNDS = 10;

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const buildQuestions = (lang) => {
  const pool = QUIZ_DATA[lang] || QUIZ_DATA.RU;
  return shuffle(pool).slice(0, TOTAL_ROUNDS);
};

const buildOptions = (correctItem, allItems) => {
  const distractors = allItems
    .filter((item) => item.emoji !== correctItem.emoji)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  return shuffle([correctItem, ...distractors]);
};

export function SoundQuizScreen({ lang, currentTheme, speakText, onClose }) {
  const text = QUIZ_TEXT[lang] || QUIZ_TEXT.RU;
  const allItems = QUIZ_DATA[lang] || QUIZ_DATA.RU;

  const [questions, setQuestions] = useState(() => buildQuestions(lang));
  const [currentRound, setCurrentRound] = useState(0);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState('idle');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Re-init on lang change
  useEffect(() => {
    const newQuestions = buildQuestions(lang);
    setQuestions(newQuestions);
    setCurrentRound(0);
    setSelected(null);
    setResult('idle');
    setScore(0);
    setGameOver(false);
  }, [lang]);

  // Build options whenever round or questions change
  useEffect(() => {
    if (gameOver) return;
    const correct = questions[currentRound];
    if (!correct) return;
    setOptions(buildOptions(correct, allItems));
  }, [currentRound, questions, allItems, gameOver]);

  // Speak word when round starts
  useEffect(() => {
    if (gameOver) return;
    const correct = questions[currentRound];
    if (!correct || typeof speakText !== 'function') return undefined;
    const timer = window.setTimeout(() => {
      speakText(correct.word, { pitch: 0.96, rate: 0.9, interrupt: true });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [currentRound, questions, speakText, gameOver]);

  const currentQuestion = questions[currentRound];

  const handleHear = () => {
    if (!currentQuestion || typeof speakText !== 'function') return;
    speakText(currentQuestion.word, { pitch: 0.96, rate: 0.9, interrupt: true });
  };

  const handlePick = (pickedItem, index) => {
    if (result !== 'idle') return;

    const isCorrect = pickedItem.emoji === currentQuestion.emoji;
    setSelected(index);

    if (isCorrect) {
      setResult('correct');
      setScore((prev) => prev + 1);
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 } });

      window.setTimeout(() => {
        advanceRound();
      }, 800);
    } else {
      setResult('wrong');

      window.setTimeout(() => {
        advanceRound();
      }, 1200);
    }
  };

  const advanceRound = () => {
    const nextRound = currentRound + 1;
    if (nextRound >= TOTAL_ROUNDS) {
      setGameOver(true);
    } else {
      setCurrentRound(nextRound);
      setSelected(null);
      setResult('idle');
    }
  };

  const handlePlayAgain = () => {
    const newQuestions = buildQuestions(lang);
    setQuestions(newQuestions);
    setCurrentRound(0);
    setSelected(null);
    setResult('idle');
    setScore(0);
    setGameOver(false);
  };

  const getButtonStyle = (item, index) => {
    const base = {
      ...emojiButtonBase
    };

    if (result === 'idle') return base;

    const isCorrectAnswer = item.emoji === currentQuestion.emoji;
    const isThisSelected = selected === index;

    if (isCorrectAnswer) {
      return { ...base, ...emojiButtonCorrect };
    }
    if (isThisSelected && result === 'wrong') {
      return { ...base, ...emojiButtonWrong };
    }
    return { ...base, ...emojiButtonDim };
  };

  if (gameOver) {
    return (
      <div style={outerWrapStyle}>
        <button type="button" onClick={onClose} style={backButtonStyle}>
          {text.back}
        </button>

        <div style={{ ...cardShellStyle, background: currentTheme.cardBg }}>
          <div style={winCatStyle}>🐱</div>
          <div style={winTitleStyle}>{text.win}</div>
          <div style={winScoreStyle}>{text.winScore(score)}</div>

          <div style={winStarsRowStyle}>
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} style={{ fontSize: '1.5rem', opacity: i < score ? 1 : 0.2 }}>⭐</span>
            ))}
          </div>

          <div style={winActionsStyle}>
            <button type="button" onClick={handlePlayAgain} style={playAgainButtonStyle}>
              {text.again}
            </button>
            <button type="button" onClick={onClose} style={backButtonSecondaryStyle}>
              {text.back}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={outerWrapStyle}>
      <button type="button" onClick={onClose} style={backButtonStyle}>
        {text.back}
      </button>

      <div style={{ ...cardShellStyle, background: currentTheme.cardBg }}>
        {/* Header */}
        <div style={headerRowStyle}>
          <div style={titlePillStyle}>{text.title}</div>
          <div style={statsRowStyle}>
            <div style={statPillStyle}>⭐ {text.score}: {score}</div>
            <div style={statPillStyle}>🎯 {text.round}: {currentRound + 1}/{TOTAL_ROUNDS}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={progressRailStyle}>
          <div
            style={{
              ...progressFillStyle,
              width: `${((currentRound) / TOTAL_ROUNDS) * 100}%`
            }}
          />
        </div>

        {/* Listen prompt */}
        <div style={listenPromptStyle}>
          <span style={catIconStyle}>🐱</span>
          <span style={listenTextStyle}>{text.listen}</span>
        </div>

        {/* Hear again button */}
        <button type="button" onClick={handleHear} style={hearButtonStyle}>
          {text.hear}
        </button>

        {/* Feedback badge */}
        {result !== 'idle' && (
          <div style={result === 'correct' ? feedbackCorrectStyle : feedbackWrongStyle}>
            {result === 'correct' ? text.correct : text.wrong}
          </div>
        )}

        {/* Emoji options grid */}
        <div style={optionsGridStyle}>
          {options.map((item, index) => (
            <button
              key={`${item.emoji}-${index}`}
              type="button"
              onClick={() => handlePick(item, index)}
              disabled={result !== 'idle'}
              style={getButtonStyle(item, index)}
            >
              <span style={emojiSpanStyle}>{item.emoji}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────── */

const outerWrapStyle = {
  width: '100%',
  maxWidth: '680px',
  margin: '10px auto 0',
  textAlign: 'center',
  padding: '18px 14px 40px',
  boxSizing: 'border-box'
};

const backButtonStyle = {
  background: 'rgba(255,255,255,0.24)',
  color: 'white',
  border: 'none',
  padding: '12px 22px',
  borderRadius: '18px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '1rem',
  marginBottom: '14px'
};

const cardShellStyle = {
  borderRadius: '36px',
  padding: '28px 22px 32px',
  border: '2px solid rgba(255,255,255,0.28)',
  boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
  color: 'white'
};

const headerRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '10px',
  marginBottom: '16px'
};

const titlePillStyle = {
  display: 'inline-flex',
  padding: '10px 18px',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.2)',
  fontWeight: 'bold',
  fontSize: '1.05rem'
};

const statsRowStyle = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  justifyContent: 'flex-end'
};

const statPillStyle = {
  background: 'rgba(255,255,255,0.18)',
  borderRadius: '999px',
  padding: '7px 14px',
  fontSize: '0.92rem',
  fontWeight: 'bold'
};

const progressRailStyle = {
  height: '12px',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.2)',
  overflow: 'hidden',
  marginBottom: '22px'
};

const progressFillStyle = {
  height: '100%',
  borderRadius: '999px',
  background: 'linear-gradient(90deg, #ffd166, #ff9f43)',
  transition: 'width 0.35s ease'
};

const listenPromptStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  marginBottom: '12px'
};

const catIconStyle = {
  fontSize: '2.4rem',
  lineHeight: 1
};

const listenTextStyle = {
  fontSize: '1.1rem',
  fontWeight: 'bold',
  color: 'rgba(255,255,255,0.92)'
};

const hearButtonStyle = {
  background: 'linear-gradient(135deg, #48dbfb, #0abde3)',
  color: 'white',
  border: 'none',
  borderRadius: '22px',
  padding: '14px 28px',
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 8px 18px rgba(10,189,227,0.38)',
  marginBottom: '20px',
  transition: 'transform 0.12s ease',
  display: 'inline-block'
};

const feedbackCorrectStyle = {
  background: 'linear-gradient(135deg, #1dd1a1, #00b894)',
  color: 'white',
  borderRadius: '18px',
  padding: '10px 24px',
  fontWeight: 'bold',
  fontSize: '1.15rem',
  display: 'inline-block',
  marginBottom: '16px',
  boxShadow: '0 6px 14px rgba(0,184,148,0.4)'
};

const feedbackWrongStyle = {
  background: 'linear-gradient(135deg, #ff7675, #d63031)',
  color: 'white',
  borderRadius: '18px',
  padding: '10px 24px',
  fontWeight: 'bold',
  fontSize: '1.15rem',
  display: 'inline-block',
  marginBottom: '16px',
  boxShadow: '0 6px 14px rgba(214,48,49,0.38)'
};

const optionsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '16px',
  maxWidth: '500px',
  margin: '0 auto'
};

const emojiButtonBase = {
  minHeight: '120px',
  minWidth: '120px',
  borderRadius: '28px',
  border: '3px solid rgba(255,255,255,0.35)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.97), rgba(245,240,255,0.95))',
  boxShadow: '0 10px 24px rgba(0,0,0,0.14)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.12s ease, box-shadow 0.12s ease',
  padding: '10px'
};

const emojiButtonCorrect = {
  background: 'linear-gradient(135deg, #1dd1a1, #00b894)',
  border: '3px solid #00b894',
  boxShadow: '0 10px 28px rgba(0,184,148,0.45)',
  transform: 'scale(1.06)'
};

const emojiButtonWrong = {
  background: 'linear-gradient(135deg, #ff7675, #d63031)',
  border: '3px solid #d63031',
  boxShadow: '0 10px 28px rgba(214,48,49,0.4)',
  transform: 'scale(0.96)'
};

const emojiButtonDim = {
  opacity: 0.45,
  cursor: 'default'
};

const emojiSpanStyle = {
  fontSize: '5rem',
  lineHeight: 1,
  display: 'block'
};

/* Win screen */
const winCatStyle = {
  fontSize: '5rem',
  marginBottom: '12px',
  display: 'block'
};

const winTitleStyle = {
  fontSize: '2.2rem',
  fontWeight: '900',
  color: 'white',
  marginBottom: '8px'
};

const winScoreStyle = {
  fontSize: '1.4rem',
  fontWeight: 'bold',
  color: 'rgba(255,255,255,0.88)',
  marginBottom: '20px'
};

const winStarsRowStyle = {
  display: 'flex',
  justifyContent: 'center',
  flexWrap: 'wrap',
  gap: '4px',
  marginBottom: '28px'
};

const winActionsStyle = {
  display: 'flex',
  gap: '14px',
  justifyContent: 'center',
  flexWrap: 'wrap'
};

const playAgainButtonStyle = {
  background: 'linear-gradient(135deg, #ffd166, #ff9f43)',
  color: 'white',
  border: 'none',
  borderRadius: '22px',
  padding: '16px 32px',
  fontSize: '1.05rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 10px 22px rgba(255,159,67,0.42)'
};

const backButtonSecondaryStyle = {
  background: 'rgba(255,255,255,0.22)',
  color: 'white',
  border: 'none',
  borderRadius: '22px',
  padding: '16px 32px',
  fontSize: '1.05rem',
  fontWeight: 'bold',
  cursor: 'pointer'
};
