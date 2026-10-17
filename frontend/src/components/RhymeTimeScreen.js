import React, { useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';

const RHYME_TEXT = {
  EN: {
    title: 'Find the Rhyme',
    instruction: 'Which word rhymes with',
    hear: '🔊 Hear',
    correct: 'Great rhyme!',
    wrong: 'Almost! Let’s try again 🙂',
    round: 'Round',
    score: 'Score',
    win: 'Wonderful!',
    winScore: (s, total) => `${s} out of ${total}!`,
    again: 'Play Again',
    back: 'Back'
  },
  RU: {
    title: 'Найди рифму',
    instruction: 'Что рифмуется со словом',
    hear: '🔊 Слушать',
    correct: 'Рифма найдена!',
    wrong: 'Почти! Попробуем ещё 🙂',
    round: 'Раунд',
    score: 'Счёт',
    win: 'Замечательно!',
    winScore: (s, total) => `${s} из ${total}!`,
    again: 'Ещё раз',
    back: 'Назад'
  },
  KG: {
    title: 'Уйкаш тап',
    instruction: 'Кайсысы уйкаш?',
    hear: '🔊 Ук',
    correct: 'Уйкаш тапты!',
    wrong: 'Дээрлик! Дагы аракет кылалы 🙂',
    round: 'Раунд',
    score: 'Упай',
    win: 'Укмуш!',
    winScore: (s, total) => `${total}дон ${s}!`,
    again: 'Дагы',
    back: 'Артка'
  },
  UZ: {
    title: 'Qofiyani top',
    instruction: 'Qaysi so`z qofiyalanadi?',
    hear: '🔊 Tinglash',
    correct: 'Qofiya topildi!',
    wrong: 'Deyarli! Yana urinib ko‘ramiz 🙂',
    round: 'Raund',
    score: 'Ball',
    win: 'Ajoyib!',
    winScore: (s, total) => `${total} dan ${s}!`,
    again: 'Yana',
    back: 'Orqaga'
  }
};

// Пары рифм: { prompt, rhyme, distractors[] } — каждый вариант это слово + эмодзи
const RHYME_PAIRS = {
  RU: [
    { prompt: { word: 'КОТ', emoji: '🐱' }, rhyme: { word: 'РОТ', emoji: '👄' }, distractors: [{ word: 'ДОМ', emoji: '🏠' }, { word: 'ЛЕС', emoji: '🌲' }, { word: 'МЯЧ', emoji: '⚽' }] },
    { prompt: { word: 'ДОМ', emoji: '🏠' }, rhyme: { word: 'СОМ', emoji: '🐟' }, distractors: [{ word: 'КОТ', emoji: '🐱' }, { word: 'ЛЕС', emoji: '🌲' }, { word: 'РАК', emoji: '🦞' }] },
    { prompt: { word: 'МЫШКА', emoji: '🐭' }, rhyme: { word: 'КРЫШКА', emoji: '🪣' }, distractors: [{ word: 'СОБАКА', emoji: '🐶' }, { word: 'ПТИЦА', emoji: '🐦' }, { word: 'РЫБА', emoji: '🐟' }] },
    { prompt: { word: 'ЁЖИК', emoji: '🦔' }, rhyme: { word: 'НОЖИК', emoji: '🔪' }, distractors: [{ word: 'МИШКА', emoji: '🐻' }, { word: 'ЗАЙКА', emoji: '🐰' }, { word: 'ЛИСA', emoji: '🦊' }] },
    { prompt: { word: 'БОЧКА', emoji: '🪣' }, rhyme: { word: 'ТОЧКА', emoji: '🔵' }, distractors: [{ word: 'МЯЧИК', emoji: '⚽' }, { word: 'КОШКА', emoji: '🐱' }, { word: 'ПТИЦА', emoji: '🐦' }] },
    { prompt: { word: 'МАК', emoji: '🌹' }, rhyme: { word: 'РАК', emoji: '🦞' }, distractors: [{ word: 'ДОМ', emoji: '🏠' }, { word: 'КОТ', emoji: '🐱' }, { word: 'РЫБА', emoji: '🐟' }] },
    { prompt: { word: 'ЗАЙКА', emoji: '🐰' }, rhyme: { word: 'МАЙКА', emoji: '👕' }, distractors: [{ word: 'ЁЖИК', emoji: '🦔' }, { word: 'ПТИЦА', emoji: '🐦' }, { word: 'РЫБА', emoji: '🐟' }] },
    { prompt: { word: 'ЛУК', emoji: '🧅' }, rhyme: { word: 'ЖУК', emoji: '🐛' }, distractors: [{ word: 'КОТ', emoji: '🐱' }, { word: 'МЯЧ', emoji: '⚽' }, { word: 'ДОМ', emoji: '🏠' }] },
    { prompt: { word: 'ЦВЕТОК', emoji: '🌸' }, rhyme: { word: 'ЛИСТОК', emoji: '🍃' }, distractors: [{ word: 'МАШИНА', emoji: '🚗' }, { word: 'СОБАКА', emoji: '🐶' }, { word: 'КНИГА', emoji: '📖' }] },
    { prompt: { word: 'УТКА', emoji: '🦆' }, rhyme: { word: 'ШУТКА', emoji: '😄' }, distractors: [{ word: 'МЫШКА', emoji: '🐭' }, { word: 'РЫБКА', emoji: '🐟' }, { word: 'КОШКА', emoji: '🐱' }] },
    { prompt: { word: 'КОЗА', emoji: '🐐' }, rhyme: { word: 'ГРОЗА', emoji: '⛈️' }, distractors: [{ word: 'КОШКА', emoji: '🐱' }, { word: 'ПЕТУХ', emoji: '🐓' }, { word: 'УТКА', emoji: '🦆' }] },
    { prompt: { word: 'СОН', emoji: '😴' }, rhyme: { word: 'СЛОН', emoji: '🐘' }, distractors: [{ word: 'КОТ', emoji: '🐱' }, { word: 'ДОМ', emoji: '🏠' }, { word: 'МАК', emoji: '🌹' }] }
  ],
  KG: [
    { prompt: { word: 'АТ', emoji: '🐴' }, rhyme: { word: 'КАТ', emoji: '🚢' }, distractors: [{ word: 'ИТ', emoji: '🐶' }, { word: 'УЙ', emoji: '🏠' }, { word: 'АЮ', emoji: '🐻' }] },
    { prompt: { word: 'КУШ', emoji: '🐦' }, rhyme: { word: 'ТУШ', emoji: '🎺' }, distractors: [{ word: 'АТ', emoji: '🐴' }, { word: 'УЙ', emoji: '🏠' }, { word: 'МАЛ', emoji: '🐄' }] },
    { prompt: { word: 'АЮУ', emoji: '🐻' }, rhyme: { word: 'КАЮУ', emoji: '😢' }, distractors: [{ word: 'АЛМА', emoji: '🍎' }, { word: 'БАЛЫК', emoji: '🐟' }, { word: 'МЫШЫК', emoji: '🐱' }] },
    { prompt: { word: 'ГҮЛ', emoji: '🌸' }, rhyme: { word: 'КҮЛ', emoji: '😄' }, distractors: [{ word: 'АТ', emoji: '🐴' }, { word: 'УЙ', emoji: '🏠' }, { word: 'КУШ', emoji: '🐦' }] },
    { prompt: { word: 'ДАР', emoji: '🎁' }, rhyme: { word: 'КАР', emoji: '❄️' }, distractors: [{ word: 'АТ', emoji: '🐴' }, { word: 'КУШ', emoji: '🐦' }, { word: 'УЙ', emoji: '🏠' }] },
    { prompt: { word: 'ТАШ', emoji: '🪨' }, rhyme: { word: 'БАШ', emoji: '👤' }, distractors: [{ word: 'АЮУ', emoji: '🐻' }, { word: 'АЛМА', emoji: '🍎' }, { word: 'КУШ', emoji: '🐦' }] },
    { prompt: { word: 'МАЛ', emoji: '🐄' }, rhyme: { word: 'КАЛ', emoji: '✏️' }, distractors: [{ word: 'АТ', emoji: '🐴' }, { word: 'УЙ', emoji: '🏠' }, { word: 'ГҮЛ', emoji: '🌸' }] }
  ],
  UZ: [
    { prompt: { word: 'OT', emoji: '🐴' }, rhyme: { word: 'BOT', emoji: '🚢' }, distractors: [{ word: 'IT', emoji: '🐶' }, { word: 'UY', emoji: '🏠' }, { word: 'GUL', emoji: '🌸' }] },
    { prompt: { word: 'GUL', emoji: '🌸' }, rhyme: { word: 'KUL', emoji: '😄' }, distractors: [{ word: 'OT', emoji: '🐴' }, { word: 'UY', emoji: '🏠' }, { word: 'IT', emoji: '🐶' }] },
    { prompt: { word: 'NON', emoji: '🍞' }, rhyme: { word: 'TON', emoji: '🏔️' }, distractors: [{ word: 'OT', emoji: '🐴' }, { word: 'GUL', emoji: '🌸' }, { word: 'IT', emoji: '🐶' }] },
    { prompt: { word: 'SUV', emoji: '💧' }, rhyme: { word: 'KUV', emoji: '🫙' }, distractors: [{ word: 'NON', emoji: '🍞' }, { word: 'OT', emoji: '🐴' }, { word: 'UY', emoji: '🏠' }] },
    { prompt: { word: 'TOG', emoji: '🏔️' }, rhyme: { word: 'BOG', emoji: '🌳' }, distractors: [{ word: 'OT', emoji: '🐴' }, { word: 'GUL', emoji: '🌸' }, { word: 'NON', emoji: '🍞' }] },
    { prompt: { word: 'OLMA', emoji: '🍎' }, rhyme: { word: 'TOLMA', emoji: '🫑' }, distractors: [{ word: 'BALIQ', emoji: '🐟' }, { word: 'MUSHUK', emoji: '🐱' }, { word: 'DARAXT', emoji: '🌳' }] },
    { prompt: { word: 'QUŠ', emoji: '🐦' }, rhyme: { word: 'TUSH', emoji: '😴' }, distractors: [{ word: 'OT', emoji: '🐴' }, { word: 'GUL', emoji: '🌸' }, { word: 'IT', emoji: '🐶' }] }
  ],
  EN: [
    { prompt: { word: 'CAT', emoji: '🐱' }, rhyme: { word: 'HAT', emoji: '🎩' }, distractors: [{ word: 'DOG', emoji: '🐶' }, { word: 'SUN', emoji: '☀️' }, { word: 'FISH', emoji: '🐟' }] },
    { prompt: { word: 'DOG', emoji: '🐶' }, rhyme: { word: 'LOG', emoji: '🪵' }, distractors: [{ word: 'CAT', emoji: '🐱' }, { word: 'BIRD', emoji: '🐦' }, { word: 'STAR', emoji: '⭐' }] },
    { prompt: { word: 'SUN', emoji: '☀️' }, rhyme: { word: 'BUN', emoji: '🍞' }, distractors: [{ word: 'MOON', emoji: '🌙' }, { word: 'FISH', emoji: '🐟' }, { word: 'TREE', emoji: '🌳' }] },
    { prompt: { word: 'STAR', emoji: '⭐' }, rhyme: { word: 'CAR', emoji: '🚗' }, distractors: [{ word: 'SUN', emoji: '☀️' }, { word: 'DOG', emoji: '🐶' }, { word: 'FISH', emoji: '🐟' }] },
    { prompt: { word: 'FISH', emoji: '🐟' }, rhyme: { word: 'DISH', emoji: '🍽️' }, distractors: [{ word: 'BIRD', emoji: '🐦' }, { word: 'STAR', emoji: '⭐' }, { word: 'CAT', emoji: '🐱' }] },
    { prompt: { word: 'BEE', emoji: '🐝' }, rhyme: { word: 'TREE', emoji: '🌳' }, distractors: [{ word: 'DOG', emoji: '🐶' }, { word: 'CAT', emoji: '🐱' }, { word: 'SUN', emoji: '☀️' }] },
    { prompt: { word: 'CAKE', emoji: '🎂' }, rhyme: { word: 'LAKE', emoji: '🏞️' }, distractors: [{ word: 'FISH', emoji: '🐟' }, { word: 'DOG', emoji: '🐶' }, { word: 'CAT', emoji: '🐱' }] },
    { prompt: { word: 'MOON', emoji: '🌙' }, rhyme: { word: 'SPOON', emoji: '🥄' }, distractors: [{ word: 'SUN', emoji: '☀️' }, { word: 'STAR', emoji: '⭐' }, { word: 'FISH', emoji: '🐟' }] },
    { prompt: { word: 'BEAR', emoji: '🐻' }, rhyme: { word: 'CHAIR', emoji: '🪑' }, distractors: [{ word: 'DOG', emoji: '🐶' }, { word: 'CAT', emoji: '🐱' }, { word: 'FISH', emoji: '🐟' }] },
    { prompt: { word: 'PIG', emoji: '🐷' }, rhyme: { word: 'BIG', emoji: '🔍' }, distractors: [{ word: 'DOG', emoji: '🐶' }, { word: 'CAT', emoji: '🐱' }, { word: 'STAR', emoji: '⭐' }] }
  ]
};

const TOTAL_ROUNDS = 10;
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const buildRounds = (lang) => {
  const pool = RHYME_PAIRS[lang] || RHYME_PAIRS.RU;
  return shuffle(pool).slice(0, Math.min(TOTAL_ROUNDS, pool.length));
};

const buildOptions = (pair) => {
  const opts = shuffle([pair.rhyme, ...pair.distractors.slice(0, 3)]);
  return opts;
};

export function RhymeTimeScreen({ lang, currentTheme, speakText, onClose }) {
  const text = RHYME_TEXT[lang] || RHYME_TEXT.RU;

  const [rounds, setRounds] = useState(() => buildRounds(lang));
  const [currentRound, setCurrentRound] = useState(0);
  const [options, setOptions] = useState([]);
  const [picked, setPicked] = useState(null);
  const [result, setResult] = useState('idle');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const current = rounds[currentRound];

  const speakPrompt = useCallback(() => {
    if (!current || typeof speakText !== 'function') return;
    speakText(current.prompt.word, { pitch: 0.94, rate: 0.82, interrupt: true });
  }, [current, speakText]);

  useEffect(() => {
    if (gameOver || !current) return undefined;
    setOptions(buildOptions(current));
    const t = window.setTimeout(speakPrompt, 400);
    return () => window.clearTimeout(t);
  }, [currentRound, current, speakPrompt, gameOver]);

  useEffect(() => {
    setRounds(buildRounds(lang));
    setCurrentRound(0);
    setPicked(null);
    setResult('idle');
    setScore(0);
    setGameOver(false);
  }, [lang]);

  const handlePick = (opt) => {
    if (result !== 'idle') return;
    setPicked(opt.word);
    const isCorrect = opt.word === current.rhyme.word;
    if (isCorrect) {
      setResult('correct');
      setScore((s) => s + 1);
      confetti({ particleCount: 65, spread: 55, origin: { y: 0.65 } });
      window.setTimeout(advanceRound, 900);
    } else {
      setResult('wrong');
      window.setTimeout(advanceRound, 1200);
    }
  };

  const advanceRound = () => {
    const next = currentRound + 1;
    if (next >= Math.min(TOTAL_ROUNDS, rounds.length)) {
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
          <div style={{ fontSize: '4rem', marginBottom: '10px' }}>🎵</div>
          <div style={winTitle}>{text.win}</div>
          <div style={winSub}>{text.winScore(score, rounds.length)}</div>
          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap', margin: '16px 0' }}>
            {Array.from({ length: rounds.length }, (_, i) => (
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
          <div style={statsPill}>⭐ {score} &nbsp;|&nbsp; {text.round} {currentRound + 1}/{Math.min(TOTAL_ROUNDS, rounds.length)}</div>
        </div>

        {/* Слово-подсказка */}
        <div style={promptBox}>
          <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>{text.instruction}:</div>
          <div style={promptEmoji}>{current.prompt.emoji}</div>
          <div style={promptWord}>{current.prompt.word}</div>
          <button type="button" onClick={speakPrompt} style={hearBtn}>{text.hear}</button>
        </div>

        {/* Варианты ответа */}
        <div style={optionsGrid}>
          {options.map((opt) => {
            const isCorrect = result !== 'idle' && opt.word === current.rhyme.word;
            const isWrong = result === 'wrong' && opt.word === picked;
            return (
              <button
                key={opt.word}
                type="button"
                onClick={() => handlePick(opt)}
                disabled={result !== 'idle'}
                style={{
                  ...optionBtn,
                  background: isCorrect
                    ? 'linear-gradient(135deg,#2ed573,#7bed9f)'
                    : isWrong
                      ? 'linear-gradient(135deg,#ff4757,#ff6b81)'
                      : picked === opt.word
                        ? 'linear-gradient(135deg,#ffa502,#eccc68)'
                        : 'rgba(255,255,255,0.18)',
                  border: isCorrect ? '3px solid #2ed573' : isWrong ? '3px solid #ff4757' : '2px solid rgba(255,255,255,0.3)',
                  transform: isCorrect ? 'scale(1.06)' : 'scale(1)'
                }}
              >
                <span style={{ fontSize: '2.6rem' }}>{opt.emoji}</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginTop: '6px' }}>{opt.word}</span>
              </button>
            );
          })}
        </div>

        {result !== 'idle' && (
          <div style={{ marginTop: '10px', fontSize: '1.2rem', fontWeight: 'bold', color: result === 'correct' ? '#2ed573' : '#ffb347' }}>
            {result === 'correct' ? text.correct : `${text.wrong} → ${current.rhyme.word} ${current.rhyme.emoji}`}
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
const promptBox = { background: 'rgba(255,255,255,0.12)', borderRadius: '20px', padding: '16px', marginBottom: '18px' };
const promptEmoji = { fontSize: '3.5rem', lineHeight: 1.1 };
const promptWord = { fontSize: '2rem', fontWeight: 900, color: '#ffcc00', letterSpacing: '0.1em', textShadow: '1px 1px 4px rgba(0,0,0,0.3)', margin: '8px 0' };
const hearBtn = { background: 'rgba(255,255,255,0.2)', color: 'white', border: '2px solid rgba(255,255,255,0.4)', padding: '7px 18px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', marginTop: '8px' };
const optionsGrid = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', margin: '0 auto', maxWidth: '440px' };
const optionBtn = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 8px', borderRadius: '18px', cursor: 'pointer', minHeight: '100px', transition: 'transform 0.15s, box-shadow 0.15s', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' };
const winTitle = { fontSize: '2rem', fontWeight: 900, color: '#ffcc00', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' };
const winSub = { fontSize: '1.1rem', color: 'rgba(255,255,255,0.88)', marginTop: '8px' };
const primaryBtn = { background: 'linear-gradient(135deg,#ffd700,#ffa500)', color: '#333', border: 'none', padding: '14px 32px', borderRadius: '20px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 0 #b27300' };
const secondaryBtn = { background: 'rgba(255,255,255,0.2)', color: 'white', border: '2px solid rgba(255,255,255,0.4)', padding: '13px 28px', borderRadius: '20px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' };
