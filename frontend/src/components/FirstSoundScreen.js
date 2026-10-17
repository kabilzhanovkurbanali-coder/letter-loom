import React, { useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { ALPHABET_BY_LANG } from '../data/alphabetEntries';

const FS_TEXT = {
  EN: {
    title: 'First Sound',
    instruction: 'Which picture starts with the sound',
    hear: '🔊 Hear sound',
    correct: 'That\'s right!',
    wrong: 'Almost! Let’s try again 🙂',
    round: 'Round',
    score: 'Score',
    win: 'Super!',
    winScore: (s) => `${s} out of 10!`,
    again: 'Play Again',
    back: 'Back'
  },
  RU: {
    title: 'Первый звук',
    instruction: 'Какая картинка начинается на звук',
    hear: '🔊 Услышать звук',
    correct: 'Правильно!',
    wrong: 'Почти! Попробуем ещё 🙂',
    round: 'Раунд',
    score: 'Счёт',
    win: 'Супер!',
    winScore: (s) => `${s} из 10!`,
    again: 'Ещё раз',
    back: 'Назад'
  },
  KG: {
    title: 'Биринчи үн',
    instruction: 'Кайсы сүрөт бул үндөн башталат?',
    hear: '🔊 Үндү ук',
    correct: 'Туура!',
    wrong: 'Дээрлик! Дагы аракет кылалы 🙂',
    round: 'Раунд',
    score: 'Упай',
    win: 'Зор!',
    winScore: (s) => `10дон ${s}!`,
    again: 'Дагы',
    back: 'Артка'
  },
  UZ: {
    title: 'Birinchi tovush',
    instruction: 'Qaysi rasm shu tovush bilan boshlanadi?',
    hear: '🔊 Tovushni tinglash',
    correct: 'To`g`ri!',
    wrong: 'Deyarli! Yana urinib ko‘ramiz 🙂',
    round: 'Raund',
    score: 'Ball',
    win: 'Super!',
    winScore: (s) => `10 dan ${s}!`,
    again: 'Yana',
    back: 'Orqaga'
  }
};

const TOTAL_ROUNDS = 10;
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const buildRounds = (lang) => {
  const entries = ALPHABET_BY_LANG[lang] || ALPHABET_BY_LANG.RU;
  // Берём только буквы у которых есть хорошее слово и эмодзи
  const pool = entries.filter((e) => e.word && e.emoji);
  const shuffled = shuffle(pool);
  const selected = shuffled.slice(0, TOTAL_ROUNDS);

  return selected.map((correct, i) => {
    // 3 дистрактора — другие буквы из оставшихся
    const others = shuffled.filter((e) => e.letter !== correct.letter);
    const distractors = shuffle(others).slice(0, 3);
    const options = shuffle([correct, ...distractors]);
    return { correct, options };
  });
};

export function FirstSoundScreen({ lang, currentTheme, speakText, onClose }) {
  const text = FS_TEXT[lang] || FS_TEXT.RU;

  const [rounds, setRounds] = useState(() => buildRounds(lang));
  const [currentRound, setCurrentRound] = useState(0);
  const [picked, setPicked] = useState(null);
  const [result, setResult] = useState('idle');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const current = rounds[currentRound];

  const speakLetter = useCallback(() => {
    if (!current || typeof speakText !== 'function') return;
    speakText(current.correct.letter, { kind: 'token', pitch: 1.1, rate: 0.8, interrupt: true });
  }, [current, speakText]);

  useEffect(() => {
    if (gameOver || !current) return undefined;
    const t = window.setTimeout(speakLetter, 500);
    return () => window.clearTimeout(t);
  }, [currentRound, speakLetter, gameOver, current]);

  useEffect(() => {
    setRounds(buildRounds(lang));
    setCurrentRound(0);
    setPicked(null);
    setResult('idle');
    setScore(0);
    setGameOver(false);
  }, [lang]);

  const handlePick = (entry) => {
    if (result !== 'idle') return;
    setPicked(entry.letter);
    const isCorrect = entry.letter === current.correct.letter;
    if (isCorrect) {
      setResult('correct');
      setScore((s) => s + 1);
      confetti({ particleCount: 65, spread: 55, origin: { y: 0.65 } });
      // Произносим слово после правильного ответа
      if (typeof speakText === 'function') {
        setTimeout(() => speakText(current.correct.word, { pitch: 0.96, rate: 0.85, interrupt: false }), 400);
      }
      window.setTimeout(advanceRound, 1100);
    } else {
      setResult('wrong');
      window.setTimeout(advanceRound, 1300);
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
          <div style={{ fontSize: '4rem', marginBottom: '10px' }}>🔤</div>
          <div style={winTitle}>{text.win}</div>
          <div style={winSub}>{text.winScore(score)}</div>
          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap', margin: '16px 0' }}>
            {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
              <span key={i} style={{ fontSize: '1.5rem', opacity: i < score ? 1 : 0.2 }}>⭐</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={handleRestart} style={primaryBtn}>{text.again}</button>
            <button type="button" onClick={onClose} style={secondaryBtn}>{text.back}</button>
          </div>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div style={wrap}>
      <button type="button" onClick={onClose} style={backBtn}>{text.back}</button>

      <div style={{ ...card, background: currentTheme.cardBg }}>
        <div style={header}>
          <div style={titlePill}>{text.title}</div>
          <div style={statsPill}>⭐ {score} &nbsp;|&nbsp; {text.round} {currentRound + 1}/{TOTAL_ROUNDS}</div>
        </div>

        {/* Буква-вопрос */}
        <div style={letterBox}>
          <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginBottom: '10px' }}>{text.instruction}:</div>
          <div style={bigLetter}>{current.correct.letter}</div>
          <button type="button" onClick={speakLetter} style={hearBtn}>{text.hear}</button>
        </div>

        {/* 4 варианта картинок */}
        <div style={optionsGrid}>
          {current.options.map((entry) => {
            const isCorrect = result !== 'idle' && entry.letter === current.correct.letter;
            const isWrong = result === 'wrong' && entry.letter === picked;
            return (
              <button
                key={entry.letter}
                type="button"
                onClick={() => handlePick(entry)}
                disabled={result !== 'idle'}
                style={{
                  ...optionBtn,
                  background: isCorrect
                    ? 'linear-gradient(135deg,#2ed573,#7bed9f)'
                    : isWrong
                      ? 'linear-gradient(135deg,#ff4757,#ff6b81)'
                      : picked === entry.letter
                        ? 'linear-gradient(135deg,#ffa502,#eccc68)'
                        : 'rgba(255,255,255,0.15)',
                  border: isCorrect ? '3px solid #2ed573' : isWrong ? '3px solid #ff4757' : '2px solid rgba(255,255,255,0.25)',
                  transform: isCorrect ? 'scale(1.06)' : 'scale(1)'
                }}
                onMouseEnter={() => {
                  if (result !== 'idle' || typeof speakText !== 'function') return;
                  speakText(entry.word, { pitch: 0.94, rate: 0.88, interrupt: false });
                }}
              >
                <span style={{ fontSize: '3rem', display: 'block' }}>{entry.emoji}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white', marginTop: '6px', letterSpacing: '0.04em' }}>
                  {entry.word.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>

        {result !== 'idle' && (
          <div style={{ marginTop: '12px', fontSize: '1.2rem', fontWeight: 'bold', color: result === 'correct' ? '#2ed573' : '#ffb347' }}>
            {result === 'correct'
              ? `${text.correct} ${current.correct.letter} — ${current.correct.word} ${current.correct.emoji}`
              : `${text.wrong} → ${current.correct.word} ${current.correct.emoji}`}
          </div>
        )}
      </div>
    </div>
  );
}

const wrap = { width: '100%', maxWidth: '680px', margin: '0 auto', padding: '16px', boxSizing: 'border-box', textAlign: 'center' };
const card = { borderRadius: '28px', padding: '24px 20px', backdropFilter: 'blur(10px)', border: '2px solid rgba(255,255,255,0.25)', boxShadow: '0 20px 40px rgba(0,0,0,0.18)' };
const backBtn = { background: 'rgba(255,255,255,0.25)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '14px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '14px' };
const header = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' };
const titlePill = { background: 'rgba(255,255,255,0.2)', color: 'white', padding: '6px 16px', borderRadius: '999px', fontWeight: 'bold', fontSize: '0.95rem' };
const statsPill = { background: 'rgba(255,255,255,0.15)', color: 'white', padding: '6px 14px', borderRadius: '999px', fontSize: '0.88rem' };
const letterBox = { background: 'rgba(255,255,255,0.12)', borderRadius: '20px', padding: '18px', marginBottom: '18px', textAlign: 'center' };
const bigLetter = { fontSize: '5rem', fontWeight: 900, color: '#ffcc00', textShadow: '2px 2px 8px rgba(0,0,0,0.4)', lineHeight: 1, marginBottom: '10px' };
const hearBtn = { background: 'rgba(255,255,255,0.2)', color: 'white', border: '2px solid rgba(255,255,255,0.4)', padding: '7px 18px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' };
const optionsGrid = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', margin: '0 auto', maxWidth: '440px' };
const optionBtn = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 8px', borderRadius: '18px', cursor: 'pointer', minHeight: '110px', transition: 'transform 0.15s, box-shadow 0.15s', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' };
const winTitle = { fontSize: '2rem', fontWeight: 900, color: '#ffcc00', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' };
const winSub = { fontSize: '1.1rem', color: 'rgba(255,255,255,0.88)', marginTop: '8px' };
const primaryBtn = { background: 'linear-gradient(135deg,#ffd700,#ffa500)', color: '#333', border: 'none', padding: '14px 32px', borderRadius: '20px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 0 #b27300' };
const secondaryBtn = { background: 'rgba(255,255,255,0.2)', color: 'white', border: '2px solid rgba(255,255,255,0.4)', padding: '13px 28px', borderRadius: '20px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' };
