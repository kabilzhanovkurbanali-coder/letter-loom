import React, { useEffect, useRef, useState } from 'react';
import { Irbi } from './Irbi';

const panelText = {
  EN: {
    badge: 'Cat friend',
    replay: 'Say again',
    placeholder: 'Ask anything...',
    send: 'Send',
    close: 'Close',
    menuGreeting: '',
    wordGreeting: 'We play in English today! Say the first sound and tap the matching letter.',
    wordHint: 'Say the first sound and tap the next letter.',
    syllableHint: 'Say the first piece and tap the next part.',
    mathGreeting: 'Math time in English! Let us count together.',
    mathHints: {
      COUNT_FRUITS: 'Count each fruit one by one.',
      FEED_MONSTER: 'Give the monster exactly the number it wants.',
      BIGGER_NUMBER: 'Look at both sides and pick the bigger one.',
      MATCH_PAIR: 'Find the same number again.',
      SPEED_ROUND: 'Answer fast and tap the right number.',
      LISTEN: 'Tap a number card and listen to how it sounds.',
      DEFAULT: 'We will do one tiny step at a time.'
    }
  },
  RU: {
    badge: 'Котик рядом',
    replay: 'Сказать ещё раз',
    placeholder: 'Спроси что-нибудь...',
    send: 'Отправить',
    close: 'Закрыть',
    menuGreeting: '',
    wordGreeting: 'Играем на русском языке! Скажи первый звук и нажми на нужную букву.',
    wordHint: 'Скажи первый звук и нажми на следующую букву.',
    syllableHint: 'Скажи первый кусочек и нажми на следующий слог.',
    mathGreeting: 'Считаем на русском! Давай вместе.',
    mathHints: {
      COUNT_FRUITS: 'Считай каждый фрукт по одному.',
      FEED_MONSTER: 'Дай монстрику ровно столько, сколько он хочет.',
      BIGGER_NUMBER: 'Посмотри на обе стороны и выбери, где больше.',
      MATCH_PAIR: 'Найди такое же число ещё раз.',
      SPEED_ROUND: 'Отвечай быстро и нажми на правильное число.',
      LISTEN: 'Нажимай на карточки и слушай, как звучат цифры.',
      DEFAULT: 'Будем делать всё по одному маленькому шагу.'
    }
  },
  KG: {
    badge: 'Мышык жанында',
    replay: 'Дагы айт',
    placeholder: 'Суроо бер...',
    send: 'Жибер',
    close: 'Жаап',
    menuGreeting: '',
    wordGreeting: 'Кыргызча ойнойбуз! Биринчи үндү айт да тамганы бас.',
    wordHint: 'Биринчи үндү айт да кийинки тамганы бас.',
    syllableHint: 'Биринчи бөлүктү айт да кийинки муунду бас.',
    mathGreeting: 'Кыргызча санайбыз! Кел, чогуу.',
    mathHints: {
      COUNT_FRUITS: 'Ар бир жемишти бирден сана.',
      FEED_MONSTER: 'Желмогуз каалаган санды так бер.',
      BIGGER_NUMBER: 'Эки жакты карап, чоңун танда.',
      MATCH_PAIR: 'Ошол эле санды кайра тап.',
      SPEED_ROUND: 'Тез жооп берип, туура санды бас.',
      LISTEN: 'Карточканы басып, сандын үнүн ук.',
      DEFAULT: 'Баарын бирден, жай кылабыз.'
    }
  },
  UZ: {
    badge: 'Mushuk yoningda',
    replay: 'Yana ayt',
    placeholder: 'Savol ber...',
    send: 'Yuborish',
    close: 'Yopish',
    menuGreeting: '',
    wordGreeting: "O'zbek tilida o'ynaymiz! Birinchi tovushni ayt va harfni bos.",
    wordHint: 'Avval birinchi tovushni ayt va keyingi harfni bos.',
    syllableHint: 'Avval birinchi bo`lakni ayt va keyingi bo`g`inni bos.',
    mathGreeting: "O'zbek tilida sanaymiz! Keling, birga.",
    mathHints: {
      COUNT_FRUITS: 'Har bir mevani bittadan sana.',
      FEED_MONSTER: 'Maxluqqa kerakli sonni aniq ber.',
      BIGGER_NUMBER: 'Ikki tomonga qarab, kattasini tanla.',
      MATCH_PAIR: 'Xuddi shu sonni yana top.',
      SPEED_ROUND: 'Tez javob berib, to`g`ri sonni bos.',
      LISTEN: 'Kartani bosib, raqam qanday aytilishini tingla.',
      DEFAULT: 'Hammasini bittadan, sekin qilamiz.'
    }
  }
};

const buildFallbackLine = ({ text, gameState, playMode, mathMode }) => {
  if (gameState === 'PLAYING') {
    return playMode === 'SYLLABLES'
      ? `${text.wordGreeting} ${text.syllableHint}`
      : text.wordGreeting;
  }
  if (gameState === 'MATH_PLAYING') {
    const mathHint = text.mathHints[mathMode] || text.mathHints.DEFAULT;
    return `${text.mathGreeting} ${mathHint}`;
  }
  return '';
};

const startSpeakingAnimation = ({ line, speakingTimerRef, setIsSpeaking }) => {
  setIsSpeaking(true);
  if (speakingTimerRef.current) window.clearTimeout(speakingTimerRef.current);
  speakingTimerRef.current = window.setTimeout(
    () => setIsSpeaking(false),
    Math.min(7000, Math.max(2500, line.length * 58))
  );
};

const speakCatLine = ({ line, speakText, speakingTimerRef, setIsSpeaking }) => {
  if (!line) return;
  startSpeakingAnimation({ line, speakingTimerRef, setIsSpeaking });
  if (typeof speakText === 'function') {
    speakText(line, { pitch: 0.8, rate: 0.92, volume: 1 });
  }
};

export function AiTutorPanel({ lang, context, visible, speakText, apiBaseUrl }) {
  const text = panelText[lang] || panelText.RU;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentLine, setCurrentLine] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const speakingTimerRef = useRef(null);
  const lastSceneRef = useRef('');
  const speakTextRef = useRef(speakText);
  const inputRef = useRef(null);
  speakTextRef.current = speakText;

  const sceneKey = [
    context.gameState,
    context.levelNumber || '',
    context.playMode || '',
    context.mathMode || ''
  ].join('|');

  const catMood = isSpeaking
    ? 'talking'
    : context.gameState === 'MATH_PLAYING'
      ? 'thinking'
      : 'idle';

  useEffect(() => () => {
    if (speakingTimerRef.current) window.clearTimeout(speakingTimerRef.current);
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (lastSceneRef.current === sceneKey) return;
    lastSceneRef.current = sceneKey;
    setChatHistory([]);

    const fallback = buildFallbackLine({
      text,
      gameState: context.gameState,
      playMode: context.playMode,
      mathMode: context.mathMode
    });

    if (!apiBaseUrl) {
      setCurrentLine(fallback);
      speakCatLine({ line: fallback, speakText: speakTextRef.current, speakingTimerRef, setIsSpeaking });
      return;
    }

    const aiType = context.gameState === 'PLAYING' || context.gameState === 'MATH_PLAYING'
      ? 'hint'
      : 'freeform';

    fetch(`${apiBaseUrl}/api/ai-tutor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: aiType, context, message: '' })
    })
      .then((res) => res.json())
      .then((data) => {
        const line = data.reply || fallback;
        setCurrentLine(line);
        speakCatLine({ line, speakText: speakTextRef.current, speakingTimerRef, setIsSpeaking });
      })
      .catch(() => {
        setCurrentLine(fallback);
        speakCatLine({ line: fallback, speakText: speakTextRef.current, speakingTimerRef, setIsSpeaking });
      });
  }, [sceneKey, visible, lang, apiBaseUrl, text, context]);

  useEffect(() => {
    if (isPanelOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isPanelOpen]);

  if (!visible) return null;

  const replayLine = () => {
    if (!currentLine) return;
    speakCatLine({ line: currentLine, speakText: speakTextRef.current, speakingTimerRef, setIsSpeaking });
  };

  const handleCatClick = () => {
    if (isPanelOpen) {
      setIsPanelOpen(false);
    } else {
      setIsPanelOpen(true);
      replayLine();
    }
  };

  const sendMessage = async () => {
    const msg = userInput.trim();
    if (!msg || isLoading) return;
    setUserInput('');
    const userEntry = { role: 'user', text: msg };
    setChatHistory((prev) => [...prev, userEntry]);
    setIsLoading(true);

    try {
      const res = await fetch(`${apiBaseUrl}/api/ai-tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'freeform', context, message: msg })
      });
      const data = await res.json();
      const reply = data.reply || '...';
      setChatHistory((prev) => [...prev, { role: 'cat', text: reply }]);
      setCurrentLine(reply);
      speakCatLine({ line: reply, speakText: speakTextRef.current, speakingTimerRef, setIsSpeaking });
    } catch {
      const fallback = buildFallbackLine({ text, gameState: context.gameState, playMode: context.playMode, mathMode: context.mathMode });
      setChatHistory((prev) => [...prev, { role: 'cat', text: fallback }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  return (
    <div className={`ai-tutor-shell ${isSpeaking ? 'is-speaking' : ''}`.trim()}>
      {isPanelOpen && (
        <div className="ai-tutor-chat-panel">
          <div className="ai-tutor-chat-header">
            <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{text.badge}</span>
            <button
              type="button"
              className="ai-tutor-chat-close"
              onClick={() => setIsPanelOpen(false)}
              aria-label={text.close}
            >
              ✕
            </button>
          </div>

          <div className="ai-tutor-chat-messages">
            {currentLine && chatHistory.length === 0 && (
              <div className="ai-tutor-message cat-message">
                <span>🐱</span>
                <span>{currentLine}</span>
              </div>
            )}
            {chatHistory.map((entry, i) => (
              <div
                key={i}
                className={`ai-tutor-message ${entry.role === 'cat' ? 'cat-message' : 'user-message'}`}
              >
                {entry.role === 'cat' && <span>🐱</span>}
                <span>{entry.text}</span>
              </div>
            ))}
            {isLoading && (
              <div className="ai-tutor-message cat-message">
                <span>🐱</span>
                <span className="ai-tutor-typing">...</span>
              </div>
            )}
          </div>

          <div className="ai-tutor-chat-input-row">
            <input
              ref={inputRef}
              type="text"
              className="ai-tutor-chat-input"
              placeholder={text.placeholder}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={300}
              disabled={isLoading}
            />
            <button
              type="button"
              className="ai-tutor-chat-send"
              onClick={sendMessage}
              disabled={isLoading || !userInput.trim()}
              aria-label={text.send}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className="ai-tutor-toggle"
        aria-label={text.replay}
        onClick={handleCatClick}
      >
        <Irbi mood={catMood} size={140} className="ai-tutor-toggle-cat" />
      </button>
    </div>
  );
}
