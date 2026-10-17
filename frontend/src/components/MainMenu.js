import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Irbi } from './Irbi';
import { ValleyScene } from './ValleyScene';
import { pictureUrl } from '../lib/api';
import { KID_NAME_PATTERN, readProfiles, rememberProfile as storeProfile } from '../lib/progress';
import { sayPhrase } from '../lib/voicePack';
import './MainMenu.css';

const AVATARS = ['rabbit', 'fox', 'bear', 'panda', 'owl', 'frog', 'lion', 'tiger', 'koala', 'penguin', 'hedgehog', 'unicorn'];
const LANGUAGE_OPTIONS = [
  { value: 'RU', label: 'Рус' },
  { value: 'KG', label: 'Кыр' },
  { value: 'UZ', label: 'O‘zb' },
  { value: 'EN', label: 'Eng' }
];

export const MENU_TEXT = {
  EN: {
    greet: "Hi! I'm Irbi. What's your name?",
    namePlaceholder: 'Your name',
    play: 'Play',
    whoPlays: 'Who is playing?',
    adults: 'For adults',
    teacher: 'Teacher mode',
    gateAsk: 'For grown-ups: solve this to continue',
    serverAdmin: 'Server administrator',
    chooseGame: "Let's play! Pick a game.",
    hello: 'Hi, {name}!',
    sectionWords: 'Letters and speech',
    sectionMath: 'Numbers and logic',
    sectionMore: 'More games',
    words: 'Build a word',
    syllables: 'Syllables',
    alphabet: 'Alphabet',
    firstSound: 'First sound',
    clap: 'Clap syllables',
    rhyme: 'Rhymes',
    soundQuiz: 'Guess the word',
    echo: 'Repeat the sound',
    sayIt: 'Say it in parts',
    blow: 'Blow the candles',
    odd: 'Odd one out',
    pattern: 'What comes next?',
    sort: 'Sort it',
    memory: 'Find a pair',
    missing: 'What’s missing?',
    sequence: 'Repeat after me',
    color: 'Coloring',
    mathCount: 'Counting',
    mathNumbers: 'Numbers',
    mathCompare: 'More or less',
    mathAdd: 'Adding',
    album: 'Album',
    achievements: 'Awards',
    settings: 'Settings',
    switchKid: 'Change player',
    admin: 'Panel',
    adminTitle: 'Sign in for adults',
    login: 'Login',
    password: 'Password',
    enter: 'Sign in',
    back: 'Back',
    nameError: 'Write your name with letters 🙂',
    stars: 'stars'
  },
  RU: {
    greet: 'Привет! Я Ирби. Как тебя зовут?',
    namePlaceholder: 'Твоё имя',
    play: 'Играть',
    whoPlays: 'Кто играет?',
    adults: 'Для взрослых',
    teacher: 'Режим учителя',
    gateAsk: 'Для взрослых: решите пример, чтобы продолжить',
    serverAdmin: 'Администратор сервера',
    chooseGame: 'Давай играть! Выбери игру.',
    hello: 'Привет, {name}!',
    sectionWords: 'Буквы и речь',
    sectionMath: 'Счёт и логика',
    sectionMore: 'Ещё игры',
    words: 'Собери слово',
    syllables: 'Слоги',
    alphabet: 'Азбука',
    firstSound: 'Первый звук',
    clap: 'Хлопай слоги',
    rhyme: 'Рифмы',
    soundQuiz: 'Угадай слово',
    echo: 'Повтори звук',
    sayIt: 'Скажи по слогам',
    blow: 'Подуй на свечки',
    odd: 'Найди лишнее',
    pattern: 'Продолжи бусы',
    sort: 'Разложи',
    memory: 'Найди пару',
    missing: 'Что исчезло?',
    sequence: 'Повтори',
    color: 'Раскраска',
    mathCount: 'Считаем',
    mathNumbers: 'Цифры',
    mathCompare: 'Больше-меньше',
    mathAdd: 'Сложение',
    album: 'Альбом',
    achievements: 'Награды',
    settings: 'Настройки',
    switchKid: 'Сменить игрока',
    admin: 'Панель',
    adminTitle: 'Вход для взрослых',
    login: 'Логин',
    password: 'Пароль',
    enter: 'Войти',
    back: 'Назад',
    nameError: 'Напиши имя буквами 🙂',
    stars: 'звёзд'
  },
  KG: {
    greet: 'Салам! Мен Ирбимин. Сенин атың ким?',
    namePlaceholder: 'Сенин атың',
    play: 'Ойноо',
    whoPlays: 'Ким ойнойт?',
    adults: 'Чоңдор үчүн',
    teacher: 'Мугалим режими',
    gateAsk: 'Чоңдор үчүн: улантуу үчүн мисалды чыгарыңыз',
    serverAdmin: 'Сервер администратору',
    chooseGame: 'Кел, ойнойлу! Оюн танда.',
    hello: 'Салам, {name}!',
    sectionWords: 'Тамгалар жана сүйлөө',
    sectionMath: 'Эсеп жана логика',
    sectionMore: 'Дагы оюндар',
    words: 'Сөз чогулт',
    syllables: 'Муундар',
    alphabet: 'Алиппе',
    firstSound: 'Биринчи үн',
    clap: 'Муунга кол чап',
    rhyme: 'Уйкаштар',
    soundQuiz: 'Сөздү тап',
    echo: 'Үндү кайтала',
    sayIt: 'Муун менен айт',
    blow: 'Шамды үйлө',
    odd: 'Артыгын тап',
    pattern: 'Мончокту улант',
    sort: 'Иреттеп сал',
    memory: 'Жубун тап',
    missing: 'Эмне жок?',
    sequence: 'Кайтала',
    color: 'Боёо',
    mathCount: 'Санайбыз',
    mathNumbers: 'Сандар',
    mathCompare: 'Көп-аз',
    mathAdd: 'Кошуу',
    album: 'Альбом',
    achievements: 'Сыйлыктар',
    settings: 'Орнотуулар',
    switchKid: 'Оюнчуну алмаштыруу',
    admin: 'Панель',
    adminTitle: 'Чоңдор үчүн кирүү',
    login: 'Логин',
    password: 'Сырсөз',
    enter: 'Кирүү',
    back: 'Артка',
    nameError: 'Атыңды тамгалар менен жаз 🙂',
    stars: 'жылдыз'
  },
  UZ: {
    greet: 'Salom! Men Irbiman. Isming nima?',
    namePlaceholder: 'Isming',
    play: 'O‘ynash',
    whoPlays: 'Kim o‘ynaydi?',
    adults: 'Kattalar uchun',
    teacher: 'O‘qituvchi rejimi',
    gateAsk: 'Kattalar uchun: davom etish uchun misolni yeching',
    serverAdmin: 'Server administratori',
    chooseGame: 'Keling, o‘ynaymiz! O‘yinni tanla.',
    hello: 'Salom, {name}!',
    sectionWords: 'Harflar va nutq',
    sectionMath: 'Sanash va mantiq',
    sectionMore: 'Yana o‘yinlar',
    words: 'So‘z yig‘',
    syllables: 'Bo‘g‘inlar',
    alphabet: 'Alifbo',
    firstSound: 'Birinchi tovush',
    clap: 'Bo‘g‘inga chapak',
    rhyme: 'Qofiyalar',
    soundQuiz: 'So‘zni top',
    echo: 'Tovushni takrorla',
    sayIt: 'Bo‘g‘inlab ayt',
    blow: 'Shamni pufla',
    odd: 'Ortiqchasini top',
    pattern: 'Munchoqni davom ettir',
    sort: 'Saralab qo‘y',
    memory: 'Juftini top',
    missing: 'Nima yo‘q?',
    sequence: 'Takrorla',
    color: 'Bo‘yash',
    mathCount: 'Sanaymiz',
    mathNumbers: 'Raqamlar',
    mathCompare: 'Ko‘p-kam',
    mathAdd: 'Qo‘shish',
    album: 'Albom',
    achievements: 'Mukofotlar',
    settings: 'Sozlamalar',
    switchKid: 'O‘yinchini almashtirish',
    admin: 'Panel',
    adminTitle: 'Kattalar uchun kirish',
    login: 'Login',
    password: 'Parol',
    enter: 'Kirish',
    back: 'Orqaga',
    nameError: 'Ismingni harflar bilan yoz 🙂',
    stars: 'yulduz'
  }
};

const GAME_SECTIONS = [
  {
    key: 'sectionWords',
    tone: 'words',
    games: [
      { key: 'words', icon: 'blocks', color: 'coral', action: { state: 'PLAYING', playMode: 'WORDS' } },
      { key: 'syllables', icon: 'puzzle', color: 'violet', action: { state: 'PLAYING', playMode: 'SYLLABLES' } },
      { key: 'alphabet', icon: 'alphabet', color: 'sky', action: { state: 'ALPHABET', playMode: 'ALPHABET' } },
      { key: 'firstSound', icon: 'magnifier', color: 'mint', action: { state: 'FIRST_SOUND' } },
      { key: 'echo', icon: 'speaking', color: 'orange', action: { state: 'SPEAK', speakMode: 'ECHO' } },
      { key: 'sayIt', icon: 'microphone', color: 'pink', action: { state: 'SPEAK', speakMode: 'SYLLABLES' } },
      { key: 'blow', icon: 'candle', color: 'teal', action: { state: 'SPEAK', speakMode: 'BLOW' } }
    ]
  },
  {
    key: 'sectionMath',
    tone: 'math',
    games: [
      { key: 'mathCount', icon: 'abacus', color: 'orange', action: { state: 'MATH_PLAYING', mathMode: 'COUNT' } },
      { key: 'mathNumbers', icon: 'numbers', color: 'sky', action: { state: 'MATH_PLAYING', mathMode: 'NUMBERS' } },
      { key: 'mathCompare', icon: 'scale', color: 'teal', action: { state: 'MATH_PLAYING', mathMode: 'COMPARE' } },
      { key: 'mathAdd', icon: 'plus', color: 'pink', action: { state: 'MATH_PLAYING', mathMode: 'ADD' } },
      { key: 'odd', icon: 'brain', color: 'violet', action: { state: 'LOGIC', logicMode: 'ODD' } },
      { key: 'pattern', icon: 'shapes', color: 'mint', action: { state: 'LOGIC', logicMode: 'PATTERN' } },
      { key: 'sort', icon: 'basket', color: 'sun', action: { state: 'LOGIC', logicMode: 'SORT' } }
    ]
  },
  {
    key: 'sectionMore',
    tone: 'more',
    games: [
      { key: 'memory', icon: 'cards', color: 'indigo', action: { state: 'MEMORY', memoryMode: 'PAIRS' } },
      { key: 'missing', icon: 'thinking', color: 'sun', action: { state: 'MEMORY', memoryMode: 'MISSING' } },
      { key: 'sequence', icon: 'paw', color: 'coral', action: { state: 'MEMORY', memoryMode: 'SEQUENCE' } },
      { key: 'clap', icon: 'clap', color: 'sun', action: { state: 'SYLLABLE_CLAP' } },
      { key: 'rhyme', icon: 'music', color: 'pink', action: { state: 'RHYME_TIME' } },
      { key: 'soundQuiz', icon: 'ear', color: 'teal', action: { state: 'SOUND_QUIZ' } },
      { key: 'color', icon: 'palette', color: 'lime', action: { state: 'COLOR_BY_NUMBER' } }
    ]
  }
];

const SKY_LETTERS = {
  EN: ['A', 'B', 'C', 'D', 'E', 'F'],
  RU: ['А', 'Б', 'В', 'Г', 'Д', 'Е'],
  KG: ['А', 'Б', 'Ө', 'Ү', 'Ң', 'Ж'],
  UZ: ['A', 'B', 'O‘', 'G‘', 'SH', 'CH']
};


export const avatarForName = (name) => {
  const hash = String(name || '').toLowerCase().split('').reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 9973, 7);
  return AVATARS[hash % AVATARS.length];
};

export function MainMenu({
  lang, setLang, setGameState,
  setPlayMode, setMathMode, setMemoryMode, setLogicMode, setSpeakMode,
  currentUser, handleLogout,
  handleKidLogin, handleAdminLogin,
  speakText
}) {
  const text = MENU_TEXT[lang] || MENU_TEXT.RU;
  const [nameInput, setNameInput] = useState('');
  const [profiles, setProfiles] = useState(readProfiles);
  const [irbiMood, setIrbiMood] = useState('idle');
  const [bubble, setBubble] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState('gate');
  const [gate, setGate] = useState({ a: 6, b: 7 });
  const [gateAnswer, setGateAnswer] = useState('');
  const [adminLogin, setAdminLogin] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const moodTimerRef = useRef(null);

  const say = useCallback((phrase, mood = 'talking') => {
    if (!phrase) return;
    setBubble(phrase);
    setIrbiMood(mood);
    speakText?.(phrase, { interrupt: true });
    if (moodTimerRef.current) window.clearTimeout(moodTimerRef.current);
    moodTimerRef.current = window.setTimeout(() => setIrbiMood('idle'), Math.min(4200, 900 + phrase.length * 65));
  }, [speakText]);

  useEffect(() => () => {
    if (moodTimerRef.current) window.clearTimeout(moodTimerRef.current);
  }, []);

  const greeting = currentUser ? text.hello.replace('{name}', currentUser.username) : text.greet;

  useEffect(() => {
    setBubble(currentUser ? `${greeting} ${text.chooseGame}` : greeting);
  }, [currentUser, greeting, text.chooseGame]);

  const rememberProfile = (name) => {
    setProfiles(storeProfile(name));
  };

  const enterAs = async (rawName) => {
    const name = String(rawName || '').trim().replace(/\s+/g, ' ');
    if (!KID_NAME_PATTERN.test(name)) {
      say(text.nameError, 'thinking');
      return;
    }
    setIsBusy(true);
    const user = await handleKidLogin(name);
    setIsBusy(false);
    if (!user) return;
    rememberProfile(user.username);
    setNameInput('');
    say(`${text.hello.replace('{name}', user.username)} ${text.chooseGame}`, 'happy');
  };

  const openGame = (game) => {
    if (game.action.playMode) setPlayMode(game.action.playMode);
    if (game.action.mathMode) setMathMode(game.action.mathMode);
    if (game.action.memoryMode) setMemoryMode(game.action.memoryMode);
    if (game.action.logicMode) setLogicMode(game.action.logicMode);
    if (game.action.speakMode) setSpeakMode(game.action.speakMode);
    speakText?.(text[game.key], { interrupt: true });
    setGameState(game.action.state);
  };

  // A sum young children cannot solve keeps them out of the grown-up screens without any password.
  const openAdultSheet = () => {
    const a = 3 + Math.floor(Math.random() * 7);
    const b = 3 + Math.floor(Math.random() * 7);
    setGate({ a, b });
    setGateAnswer('');
    setSheetMode('gate');
    setIsAdminOpen(true);
  };

  const submitGate = (event) => {
    event.preventDefault();
    if (Number(gateAnswer) === gate.a * gate.b) {
      setIsAdminOpen(false);
      setGameState('TEACHER');
      return;
    }
    openAdultSheet();
  };

  const submitAdmin = async (event) => {
    event.preventDefault();
    const ok = await handleAdminLogin(adminLogin.trim(), adminPassword);
    if (ok) {
      setIsAdminOpen(false);
      setAdminLogin('');
      setAdminPassword('');
    }
  };

  const languageSwitch = useMemo(() => (
    <div className="ll-lang" role="group" aria-label="Language">
      {LANGUAGE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`ll-lang-btn ${lang === option.value ? 'is-active' : ''}`}
          onClick={() => setLang(option.value)}
          aria-pressed={lang === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  ), [lang, setLang]);

  return (
    <div className="ll-menu">
      <ValleyScene letters={SKY_LETTERS[lang] || SKY_LETTERS.RU} />

      <header className="ll-topbar">
        {currentUser ? (
          <div className="ll-player-chip">
            <img src={pictureUrl(currentUser.isAdmin ? 'shield' : avatarForName(currentUser.username))} alt="" />
            <div className="ll-player-meta">
              <span className="ll-player-name">{currentUser.username}</span>
              {!currentUser.isAdmin ? (
                <span className="ll-player-stars">
                  <img src={pictureUrl('star')} alt="" /> {currentUser.score || 0}
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="ll-brand">Letter Loom</div>
        )}

        <div className="ll-topbar-right">
          {languageSwitch}
          {currentUser ? (
            <nav className="ll-icon-row">
              <IconButton icon="album" label={text.album} onClick={() => setGameState('ALBUM')} />
              <IconButton icon="trophy" label={text.achievements} onClick={() => setGameState('ACHIEVEMENTS')} />
              <IconButton icon="gear" label={text.settings} onClick={() => setGameState('SETTINGS')} />
              {currentUser.isAdmin ? (
                <IconButton icon="shield" label={text.admin} onClick={() => setGameState('ADMIN')} />
              ) : null}
              <IconButton icon="teacher" label={text.teacher} onClick={openAdultSheet} />
              <IconButton icon="door_exit" label={text.switchKid} onClick={handleLogout} />
            </nav>
          ) : null}
        </div>
      </header>

      <main className={`ll-stage ${currentUser ? 'is-chooser' : 'is-welcome'}`}>
        <section className="ll-guide">
          <button type="button" className="ll-bubble" onClick={() => say(bubble || greeting)}>
            <span>{bubble || greeting}</span>
            <img className="ll-bubble-sound" src={pictureUrl('speaker')} alt="" />
          </button>
          <button type="button" className="ll-guide-irbi" onClick={() => say(bubble || greeting, 'happy')} aria-label="Irbi">
            <Irbi mood={irbiMood} size={currentUser ? 190 : 270} followPointer />
          </button>
        </section>

        {!currentUser ? (
          <section className="ll-welcome-card">
            <form
              className="ll-name-form"
              onSubmit={(event) => {
                event.preventDefault();
                void enterAs(nameInput);
              }}
            >
              <input
                className="ll-name-input"
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                placeholder={text.namePlaceholder}
                maxLength={24}
                autoComplete="off"
                autoCapitalize="words"
                enterKeyHint="go"
                aria-label={text.namePlaceholder}
              />
              <button type="submit" className="ll-play-btn" disabled={isBusy || !nameInput.trim()}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.2-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor" /></svg>
                {text.play}
              </button>
            </form>

            {profiles.length ? (
              <div className="ll-profiles">
                <div className="ll-profiles-title">{text.whoPlays}</div>
                <div className="ll-profiles-row">
                  {profiles.map((name) => (
                    <div key={name} className="ll-profile">
                      <button type="button" className="ll-profile-btn" onClick={() => enterAs(name)} disabled={isBusy}>
                        <img src={pictureUrl(avatarForName(name))} alt="" />
                        <span>{name}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <button type="button" className="ll-adult-link" onClick={openAdultSheet}>
              <img src={pictureUrl('lock')} alt="" /> {text.adults}
            </button>
          </section>
        ) : (
          <section className="ll-games">
            {GAME_SECTIONS.map((section) => (
              <div key={section.key} className={`ll-game-section ll-tone-${section.tone}`}>
                <h2 className="ll-section-title">{text[section.key]}</h2>
                <div className="ll-game-grid">
                  {section.games.map((game, index) => (
                    <button
                      key={game.key}
                      type="button"
                      className={`ll-tile ll-tile-${game.color}`}
                      style={{ '--i': index }}
                      onClick={() => openGame(game)}
                    >
                      <span className="ll-tile-shine" />
                      <img className="ll-tile-icon" src={pictureUrl(game.icon)} alt="" draggable="false" />
                      <span className="ll-tile-title">{text[game.key]}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}
      </main>

      {isAdminOpen ? (
        <div className="ll-sheet-backdrop" onClick={() => setIsAdminOpen(false)}>
          {sheetMode === 'gate' ? (
            <form className="ll-sheet ll-admin-sheet" onClick={(event) => event.stopPropagation()} onSubmit={submitGate}>
              <h2 className="ll-sheet-title">
                <img src={pictureUrl('teacher')} alt="" /> {text.teacher}
              </h2>
              <p className="ll-gate-ask">{text.gateAsk}</p>
              <div className="ll-gate-sum">
                <span>{gate.a} × {gate.b} =</span>
                <input
                  className="ll-field ll-gate-input"
                  value={gateAnswer}
                  onChange={(event) => setGateAnswer(event.target.value.replace(/\D/g, '').slice(0, 3))}
                  inputMode="numeric"
                  autoComplete="off"
                  autoFocus
                  aria-label={`${gate.a} × ${gate.b}`}
                />
              </div>
              <button type="submit" className="ll-play-btn ll-play-btn-wide" disabled={!gateAnswer}>{text.enter}</button>
              {!currentUser ? (
                <button type="button" className="ll-sheet-link" onClick={() => setSheetMode('admin')}>{text.serverAdmin}</button>
              ) : null}
              <button type="button" className="ll-sheet-close" onClick={() => setIsAdminOpen(false)}>{text.back}</button>
            </form>
          ) : (
            <form className="ll-sheet ll-admin-sheet" onClick={(event) => event.stopPropagation()} onSubmit={submitAdmin}>
              <h2 className="ll-sheet-title">{text.adminTitle}</h2>
              <input className="ll-field" value={adminLogin} onChange={(event) => setAdminLogin(event.target.value)} placeholder={text.login} autoComplete="username" />
              <input className="ll-field" type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} placeholder={text.password} autoComplete="current-password" />
              <button type="submit" className="ll-play-btn ll-play-btn-wide" disabled={!adminLogin || !adminPassword}>{text.enter}</button>
              <button type="button" className="ll-sheet-close" onClick={() => setSheetMode('gate')}>{text.back}</button>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}

function IconButton({ icon, label, onClick }) {
  return (
    <button type="button" className="ll-icon-btn" onClick={onClick} aria-label={label} title={label}>
      <img src={pictureUrl(icon)} alt="" draggable="false" />
    </button>
  );
}

// What the menu says in `lang`, for the offline voice pack.
export const menuVoicePhrases = (lang) => {
  const text = MENU_TEXT[lang] || MENU_TEXT.RU;
  return [text.greet, text.chooseGame, text.nameError, ...GAME_SECTIONS.flatMap((section) => section.games.map((game) => text[game.key]))]
    .filter(Boolean)
    .map(sayPhrase);
};
