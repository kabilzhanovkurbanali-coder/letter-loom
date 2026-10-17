import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Irbi } from './Irbi';
import { ValleyScene } from './ValleyScene';
import { pictureUrl } from '../lib/api';
import './MainMenu.css';

const PROFILES_STORAGE_KEY = 'll_profiles';
const MAX_PROFILES = 8;
const AVATARS = ['rabbit', 'fox', 'bear', 'panda', 'owl', 'frog', 'lion', 'tiger', 'koala', 'penguin', 'hedgehog', 'unicorn'];
const LANGUAGE_OPTIONS = [
  { value: 'RU', label: 'Рус' },
  { value: 'KG', label: 'Кыр' },
  { value: 'UZ', label: 'O‘zb' },
  { value: 'EN', label: 'Eng' }
];

const MENU_TEXT = {
  EN: {
    greet: "Hi! I'm Irbi. What's your name?",
    namePlaceholder: 'Your name',
    play: 'Play',
    whoPlays: 'Who is playing?',
    adults: 'For adults',
    chooseGame: "Let's play! Pick a game.",
    hello: 'Hi, {name}!',
    sectionWords: 'Letters and speech',
    sectionMath: 'Numbers',
    sectionMore: 'Memory and art',
    words: 'Build a word',
    syllables: 'Syllables',
    alphabet: 'Alphabet',
    firstSound: 'First sound',
    clap: 'Clap syllables',
    rhyme: 'Rhymes',
    soundQuiz: 'Guess the word',
    memory: 'Find a pair',
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
    chooseGame: 'Давай играть! Выбери игру.',
    hello: 'Привет, {name}!',
    sectionWords: 'Буквы и речь',
    sectionMath: 'Счёт',
    sectionMore: 'Память и творчество',
    words: 'Собери слово',
    syllables: 'Слоги',
    alphabet: 'Азбука',
    firstSound: 'Первый звук',
    clap: 'Хлопай слоги',
    rhyme: 'Рифмы',
    soundQuiz: 'Угадай слово',
    memory: 'Найди пару',
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
    chooseGame: 'Кел, ойнойлу! Оюн танда.',
    hello: 'Салам, {name}!',
    sectionWords: 'Тамгалар жана сүйлөө',
    sectionMath: 'Эсеп',
    sectionMore: 'Эс тутум жана чыгармачылык',
    words: 'Сөз чогулт',
    syllables: 'Муундар',
    alphabet: 'Алиппе',
    firstSound: 'Биринчи үн',
    clap: 'Муунга кол чап',
    rhyme: 'Уйкаштар',
    soundQuiz: 'Сөздү тап',
    memory: 'Жубун тап',
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
    chooseGame: 'Keling, o‘ynaymiz! O‘yinni tanla.',
    hello: 'Salom, {name}!',
    sectionWords: 'Harflar va nutq',
    sectionMath: 'Sanash',
    sectionMore: 'Xotira va ijod',
    words: 'So‘z yig‘',
    syllables: 'Bo‘g‘inlar',
    alphabet: 'Alifbo',
    firstSound: 'Birinchi tovush',
    clap: 'Bo‘g‘inga chapak',
    rhyme: 'Qofiyalar',
    soundQuiz: 'So‘zni top',
    memory: 'Juftini top',
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
      { key: 'clap', icon: 'clap', color: 'sun', action: { state: 'SYLLABLE_CLAP' } },
      { key: 'rhyme', icon: 'music', color: 'pink', action: { state: 'RHYME_TIME' } },
      { key: 'soundQuiz', icon: 'ear', color: 'teal', action: { state: 'SOUND_QUIZ' } }
    ]
  },
  {
    key: 'sectionMath',
    tone: 'math',
    games: [
      { key: 'mathCount', icon: 'abacus', color: 'orange', action: { state: 'MATH_PLAYING', mathMode: 'COUNT' } },
      { key: 'mathNumbers', icon: 'numbers', color: 'sky', action: { state: 'MATH_PLAYING', mathMode: 'NUMBERS' } },
      { key: 'mathCompare', icon: 'scale', color: 'teal', action: { state: 'MATH_PLAYING', mathMode: 'COMPARE' } },
      { key: 'mathAdd', icon: 'plus', color: 'pink', action: { state: 'MATH_PLAYING', mathMode: 'ADD' } }
    ]
  },
  {
    key: 'sectionMore',
    tone: 'more',
    games: [
      { key: 'memory', icon: 'cards', color: 'indigo', action: { state: 'MEMORY_FLIP' } },
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

const KID_NAME_PATTERN = /^[\p{L}\p{M}0-9' -]{1,24}$/u;

export const avatarForName = (name) => {
  const hash = String(name || '').toLowerCase().split('').reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 9973, 7);
  return AVATARS[hash % AVATARS.length];
};

const readProfiles = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string').slice(0, MAX_PROFILES) : [];
  } catch {
    return [];
  }
};

const writeProfiles = (profiles) => {
  try {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles.slice(0, MAX_PROFILES)));
  } catch {
    // storage can be unavailable (private mode); profiles are a convenience only
  }
};

export function MainMenu({
  lang, setLang, setGameState,
  setPlayMode, setMathMode,
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
    const next = [name, ...profiles.filter((item) => item.toLowerCase() !== name.toLowerCase())];
    setProfiles(next.slice(0, MAX_PROFILES));
    writeProfiles(next);
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

  const forgetProfile = (name) => {
    const next = profiles.filter((item) => item !== name);
    setProfiles(next);
    writeProfiles(next);
  };

  const openGame = (game) => {
    if (game.action.playMode) setPlayMode(game.action.playMode);
    if (game.action.mathMode) setMathMode(game.action.mathMode);
    speakText?.(text[game.key], { interrupt: true });
    setGameState(game.action.state);
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
                      <button type="button" className="ll-profile-forget" onClick={() => forgetProfile(name)} aria-label="×">×</button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <button type="button" className="ll-adult-link" onClick={() => setIsAdminOpen(true)}>
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
          <form className="ll-sheet ll-admin-sheet" onClick={(event) => event.stopPropagation()} onSubmit={submitAdmin}>
            <h2 className="ll-sheet-title">{text.adminTitle}</h2>
            <input className="ll-field" value={adminLogin} onChange={(event) => setAdminLogin(event.target.value)} placeholder={text.login} autoComplete="username" />
            <input className="ll-field" type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} placeholder={text.password} autoComplete="current-password" />
            <button type="submit" className="ll-play-btn ll-play-btn-wide" disabled={!adminLogin || !adminPassword}>{text.enter}</button>
            <button type="button" className="ll-sheet-close" onClick={() => setIsAdminOpen(false)}>{text.back}</button>
          </form>
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
