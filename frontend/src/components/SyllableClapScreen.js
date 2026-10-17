import React, { useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';

const CLAP_TEXT = {
  EN: {
    title: 'Clap the Syllables',
    instruction: 'Listen to the word. How many syllables do you hear?',
    hear: '🔊 Hear again',
    correct: 'Well done!',
    wrong: 'Try again!',
    round: 'Round',
    score: 'Score',
    win: 'Amazing!',
    winScore: (s) => `${s} out of 10 correct!`,
    again: 'Play Again',
    back: 'Back',
    syllables: (n) => n === 1 ? '1 syllable' : `${n} syllables`
  },
  RU: {
    title: 'Хлопни по слогам',
    instruction: 'Послушай слово. Сколько слогов ты слышишь?',
    hear: '🔊 Послушать снова',
    correct: 'Молодец!',
    wrong: 'Попробуй ещё!',
    round: 'Раунд',
    score: 'Счёт',
    win: 'Отлично!',
    winScore: (s) => `${s} из 10 правильно!`,
    again: 'Ещё раз',
    back: 'Назад',
    syllables: (n) => n === 1 ? '1 слог' : n < 5 ? `${n} слога` : `${n} слогов`
  },
  KG: {
    title: 'Муун сана',
    instruction: 'Сөздү ук. Канча муун бар?',
    hear: '🔊 Кайта ук',
    correct: 'Браво!',
    wrong: 'Дагы кара!',
    round: 'Раунд',
    score: 'Упай',
    win: 'Сонун!',
    winScore: (s) => `10дон ${s} туура!`,
    again: 'Дагы',
    back: 'Артка',
    syllables: (n) => `${n} муун`
  },
  UZ: {
    title: 'Bo`g`in sanash',
    instruction: 'So`zni tinglang. Nechta bo`g`in bor?',
    hear: '🔊 Yana tinglash',
    correct: 'Barakalla!',
    wrong: 'Qaytadan urining!',
    round: 'Raund',
    score: 'Ball',
    win: 'Ajoyib!',
    winScore: (s) => `10 dan ${s} to'g'ri!`,
    again: 'Yana',
    back: 'Orqaga',
    syllables: (n) => `${n} bo\`g\`in`
  }
};

// Слова с известным количеством слогов для каждого языка
const CLAP_WORDS = {
  RU: [
    { word: 'КОТ', syllables: 1, emoji: '🐱' },
    { word: 'ДОМ', syllables: 1, emoji: '🏠' },
    { word: 'РЫ-БА', syllables: 2, emoji: '🐟' },
    { word: 'МА-МА', syllables: 2, emoji: '👩' },
    { word: 'ЯБ-ЛО-КО', syllables: 3, emoji: '🍎' },
    { word: 'МО-ЛО-КО', syllables: 3, emoji: '🥛' },
    { word: 'СО-БА-КА', syllables: 3, emoji: '🐶' },
    { word: 'ДЕ-РЕ-ВО', syllables: 3, emoji: '🌳' },
    { word: 'МЫ-ШЬ', syllables: 1, emoji: '🐭' },
    { word: 'КНИ-ГА', syllables: 2, emoji: '📖' },
    { word: 'ЛЮ-ДИ', syllables: 2, emoji: '👫' },
    { word: 'ВЕ-ЛО-СИ-ПЕД', syllables: 4, emoji: '🚲' },
    { word: 'ЦВЕ-ТОК', syllables: 2, emoji: '🌸' },
    { word: 'СТО-ЛИК', syllables: 2, emoji: '🪑' },
    { word: 'МО-РО-ЖЕ-НОЕ', syllables: 4, emoji: '🍦' },
    { word: 'ЖУК', syllables: 1, emoji: '🐛' },
    { word: 'ЧА-ШКА', syllables: 2, emoji: '☕' },
    { word: 'КА-РАН-ДАШ', syllables: 3, emoji: '✏️' },
    { word: 'БА-БОЧ-КА', syllables: 3, emoji: '🦋' },
    { word: 'ЗА-ЯЦ', syllables: 2, emoji: '🐰' }
  ],
  KG: [
    { word: 'ИТ', syllables: 1, emoji: '🐶' },
    { word: 'АТ', syllables: 1, emoji: '🐴' },
    { word: 'МЫ-ШЫК', syllables: 2, emoji: '🐱' },
    { word: 'АЛ-МА', syllables: 2, emoji: '🍎' },
    { word: 'БА-ЛЫК', syllables: 2, emoji: '🐟' },
    { word: 'КЫЗ', syllables: 1, emoji: '👧' },
    { word: 'ДА-РАК', syllables: 2, emoji: '🌳' },
    { word: 'УЙ', syllables: 1, emoji: '🏠' },
    { word: 'КИ-ТЕП', syllables: 2, emoji: '📖' },
    { word: 'ЖЫЛ-ДЫЗ', syllables: 2, emoji: '⭐' },
    { word: 'ГҮЛ', syllables: 1, emoji: '🌸' },
    { word: 'АЮУ', syllables: 2, emoji: '🐻' },
    { word: 'КА-ЙЫК', syllables: 2, emoji: '⛵' },
    { word: 'КОЙ', syllables: 1, emoji: '🐑' },
    { word: 'КА-ЛЕМ', syllables: 2, emoji: '✏️' },
    { word: 'АР-СТАН', syllables: 2, emoji: '🦁' },
    { word: 'КУШ', syllables: 1, emoji: '🐦' },
    { word: 'КЕ-ЛИН', syllables: 2, emoji: '👰' },
    { word: 'МАЧ-ТЫ', syllables: 2, emoji: '🏆' },
    { word: 'ЖУ-МУР-ТКА', syllables: 3, emoji: '🥚' }
  ],
  UZ: [
    { word: 'IT', syllables: 1, emoji: '🐶' },
    { word: 'OT', syllables: 1, emoji: '🐴' },
    { word: 'MU-SHUK', syllables: 2, emoji: '🐱' },
    { word: 'OL-MA', syllables: 2, emoji: '🍎' },
    { word: 'BA-LIQ', syllables: 2, emoji: '🐟' },
    { word: 'UY', syllables: 1, emoji: '🏠' },
    { word: 'DA-RAXT', syllables: 2, emoji: '🌳' },
    { word: 'KI-TOB', syllables: 2, emoji: '📖' },
    { word: 'GUL', syllables: 1, emoji: '🌸' },
    { word: 'YUL-DUZ', syllables: 2, emoji: '⭐' },
    { word: 'A-YIQ', syllables: 2, emoji: '🐻' },
    { word: 'QU-YON', syllables: 2, emoji: '🐰' },
    { word: 'SHE-ER', syllables: 2, emoji: '🦁' },
    { word: 'QO-VUN', syllables: 2, emoji: '🍈' },
    { word: 'QO-VOQ', syllables: 2, emoji: '🎃' },
    { word: 'QO-GA-NOQ', syllables: 3, emoji: '🥚' },
    { word: 'MA-SHI-NA', syllables: 3, emoji: '🚗' },
    { word: 'QA-LAM', syllables: 2, emoji: '✏️' },
    { word: 'NON', syllables: 1, emoji: '🍞' },
    { word: 'SUV', syllables: 1, emoji: '💧' }
  ],
  EN: [
    { word: 'CAT', syllables: 1, emoji: '🐱' },
    { word: 'DOG', syllables: 1, emoji: '🐶' },
    { word: 'AP-PLE', syllables: 2, emoji: '🍎' },
    { word: 'TA-BLE', syllables: 2, emoji: '🪑' },
    { word: 'EL-E-PHANT', syllables: 3, emoji: '🐘' },
    { word: 'SUN', syllables: 1, emoji: '☀️' },
    { word: 'FLO-WER', syllables: 2, emoji: '🌸' },
    { word: 'BUT-TER-FLY', syllables: 3, emoji: '🦋' },
    { word: 'BOOK', syllables: 1, emoji: '📖' },
    { word: 'WIN-DOW', syllables: 2, emoji: '🪟' },
    { word: 'UM-BREL-LA', syllables: 3, emoji: '☂️' },
    { word: 'BIRD', syllables: 1, emoji: '🐦' },
    { word: 'PEN-CIL', syllables: 2, emoji: '✏️' },
    { word: 'BA-NA-NA', syllables: 3, emoji: '🍌' },
    { word: 'STAR', syllables: 1, emoji: '⭐' },
    { word: 'MO-THER', syllables: 2, emoji: '👩' },
    { word: 'COM-PU-TER', syllables: 3, emoji: '💻' },
    { word: 'FISH', syllables: 1, emoji: '🐟' },
    { word: 'WA-TER', syllables: 2, emoji: '💧' },
    { word: 'CAL-CU-LA-TOR', syllables: 4, emoji: '🧮' }
  ]
};

const TOTAL_ROUNDS = 10;
const MAX_SYLLABLES = 4;

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const buildRounds = (lang) => {
  const pool = CLAP_WORDS[lang] || CLAP_WORDS.RU;
  return shuffle(pool).slice(0, TOTAL_ROUNDS);
};

const getWordToSpeak = (item) => {
  // Убираем дефисы — произносим целое слово
  return item.word.replace(/-/g, '');
};

export function SyllableClapScreen({ lang, currentTheme, speakText, onClose }) {
  const text = CLAP_TEXT[lang] || CLAP_TEXT.RU;

  const [rounds, setRounds] = useState(() => buildRounds(lang));
  const [currentRound, setCurrentRound] = useState(0);
  const [picked, setPicked] = useState(null);
  const [result, setResult] = useState('idle');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [clapAnim, setClapAnim] = useState(false);

  const current = rounds[currentRound];

  const speakCurrent = useCallback(() => {
    if (!current || typeof speakText !== 'function') return;
    speakText(getWordToSpeak(current), { pitch: 0.96, rate: 0.78, interrupt: true });
  }, [current, speakText]);

  useEffect(() => {
    if (gameOver || !current) return undefined;
    const timer = window.setTimeout(speakCurrent, 400);
    return () => window.clearTimeout(timer);
  }, [currentRound, speakCurrent, gameOver, current]);

  useEffect(() => {
    const pool = buildRounds(lang);
    setRounds(pool);
    setCurrentRound(0);
    setPicked(null);
    setResult('idle');
    setScore(0);
    setGameOver(false);
  }, [lang]);

  const handlePick = (n) => {
    if (result !== 'idle') return;
    setPicked(n);
    const isCorrect = n === current.syllables;

    if (isCorrect) {
      setResult('correct');
      setScore((s) => s + 1);
      setClapAnim(true);
      setTimeout(() => setClapAnim(false), 700);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.65 } });
      window.setTimeout(advanceRound, 900);
    } else {
      setResult('wrong');
      window.setTimeout(advanceRound, 1100);
    }
  };

  const advanceRound = () => {
    const next = currentRound + 1;
    if (next >= TOTAL_ROUNDS) {
      setGameOver(true);
    } else {
      setCurrentRound(next);
      setPicked(null);
      setResult('idle');
    }
  };

  const handleRestart = () => {
    setRounds(buildRounds(lang));
    setCurrentRound(0);
    setPicked(null);
    setResult('idle');
    setScore(0);
    setGameOver(false);
  };

  if (gameOver) {
    return (
      <div style={wrap}>
        <button type="button" onClick={onClose} style={backBtn}>{text.back}</button>
        <div style={{ ...card, background: currentTheme.cardBg }}>
          <div style={{ fontSize: '5rem', marginBottom: '12px' }}>👏</div>
          <div style={winTitle}>{text.win}</div>
          <div style={winSub}>{text.winScore(score)}</div>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap', margin: '18px 0' }}>
            {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
              <span key={i} style={{ fontSize: '1.6rem', opacity: i < score ? 1 : 0.2 }}>⭐</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={handleRestart} style={primaryBtn}>{text.again}</button>
            <button type="button" onClick={onClose} style={secondaryBtn}>{text.back}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <button type="button" onClick={onClose} style={backBtn}>{text.back}</button>

      <div style={{ ...card, background: currentTheme.cardBg }}>
        <div style={header}>
          <div style={titlePill}>{text.title}</div>
          <div style={statsPill}>⭐ {score} &nbsp;|&nbsp; {text.round} {currentRound + 1}/10</div>
        </div>

        <div style={emojiBox}>
          <span style={{ fontSize: '5rem', display: 'block', lineHeight: 1.1, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}>
            {current.emoji}
          </span>
          <div style={wordDisplay}>
            {current.word}
          </div>
        </div>

        <div style={instRow}>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}>{text.instruction}</span>
          <button type="button" onClick={speakCurrent} style={hearBtn}>{text.hear}</button>
        </div>

        <div style={clapRow}>
          {Array.from({ length: MAX_SYLLABLES }, (_, i) => {
            const n = i + 1;
            const isCorrect = result !== 'idle' && n === current.syllables;
            const isWrong = result === 'wrong' && n === picked;
            return (
              <button
                key={n}
                type="button"
                onClick={() => handlePick(n)}
                style={{
                  ...clapBtn,
                  background: isCorrect
                    ? 'linear-gradient(135deg,#2ed573,#7bed9f)'
                    : isWrong
                      ? 'linear-gradient(135deg,#ff4757,#ff6b81)'
                      : picked === n
                        ? 'linear-gradient(135deg,#ffa502,#eccc68)'
                        : 'linear-gradient(135deg,#667eea,#764ba2)',
                  transform: clapAnim && isCorrect ? 'scale(1.25)' : 'scale(1)',
                  boxShadow: isCorrect ? '0 6px 20px rgba(46,213,115,0.5)' : '0 4px 12px rgba(0,0,0,0.2)'
                }}
                disabled={result !== 'idle'}
              >
                <span style={{ fontSize: '2rem', display: 'block' }}>👏</span>
                <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>{n}</span>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)' }}>{text.syllables(n)}</span>
              </button>
            );
          })}
        </div>

        {result !== 'idle' && (
          <div style={{
            marginTop: '12px',
            fontSize: '1.3rem',
            fontWeight: 'bold',
            color: result === 'correct' ? '#2ed573' : '#ff4757',
            animation: 'fadeIn 0.2s ease'
          }}>
            {result === 'correct' ? text.correct : text.wrong}
          </div>
        )}
      </div>
    </div>
  );
}

const wrap = { width: '100%', maxWidth: '680px', margin: '0 auto', padding: '16px', boxSizing: 'border-box', textAlign: 'center' };
const card = { borderRadius: '28px', padding: '28px 20px', backdropFilter: 'blur(10px)', border: '2px solid rgba(255,255,255,0.25)', boxShadow: '0 20px 40px rgba(0,0,0,0.18)' };
const backBtn = { background: 'rgba(255,255,255,0.25)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '14px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '14px' };
const header = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' };
const titlePill = { background: 'rgba(255,255,255,0.2)', color: 'white', padding: '6px 16px', borderRadius: '999px', fontWeight: 'bold', fontSize: '0.95rem' };
const statsPill = { background: 'rgba(255,255,255,0.15)', color: 'white', padding: '6px 14px', borderRadius: '999px', fontSize: '0.88rem' };
const emojiBox = { padding: '20px 0 10px', textAlign: 'center' };
const wordDisplay = { marginTop: '12px', fontSize: '2.2rem', fontWeight: 900, color: '#ffcc00', letterSpacing: '0.12em', textShadow: '2px 2px 6px rgba(0,0,0,0.35)' };
const instRow = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', margin: '14px 0' };
const hearBtn = { background: 'rgba(255,255,255,0.2)', color: 'white', border: '2px solid rgba(255,255,255,0.4)', padding: '8px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' };
const clapRow = { display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', margin: '14px 0' };
const clapBtn = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '16px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', minWidth: '90px', transition: 'transform 0.15s, box-shadow 0.15s' };
const winTitle = { fontSize: '2rem', fontWeight: 900, color: '#ffcc00', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' };
const winSub = { fontSize: '1.1rem', color: 'rgba(255,255,255,0.88)', marginTop: '8px' };
const primaryBtn = { background: 'linear-gradient(135deg,#ffd700,#ffa500)', color: '#333', border: 'none', padding: '14px 32px', borderRadius: '20px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 0 #b27300' };
const secondaryBtn = { background: 'rgba(255,255,255,0.2)', color: 'white', border: '2px solid rgba(255,255,255,0.4)', padding: '13px 28px', borderRadius: '20px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' };
