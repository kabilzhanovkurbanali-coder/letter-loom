import React, { useEffect, useMemo, useState } from 'react';
import { uiText } from '../data/uiText';
import { CatBuddy3D } from './CatBuddy3D';

const GAME_CATALOG = {
  LETTER_LOOM: 'LETTER_LOOM',
  MATH_KIDS: 'MATH_KIDS',
  MEMORY_FLIP: 'MEMORY_FLIP',
  SOUND_QUIZ: 'SOUND_QUIZ',
  COLOR_BY_NUMBER: 'COLOR_BY_NUMBER'
};

export function MainMenu({
  lang, setLang, setGameState,
  playMode, setPlayMode,
  mathMode, setMathMode,
  rewardCollectionCount, mathCollectionCount = 0, mathPreviewRewards = [],
  currentUser, handleLogout, authMode, setAuthMode,
  usernameInput, setUsernameInput, passwordInput, setPasswordInput,
  selectedGame, setSelectedGame,
  showToast,
  handleLogin, handleRegister, fetchLeaderboard, apiBaseUrl
}) {
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const text = uiText[lang] || uiText.RU;
  const languageOptions = [
    { value: 'EN', label: 'English' },
    { value: 'RU', label: 'Русский' },
    { value: 'KG', label: 'Кыргызча' },
    { value: 'UZ', label: "O'zbekcha" }
  ];

  const menuText = useMemo(() => ({
    EN: {
      playButton: 'Play',
      gameSelect: 'Choose a game',
      gameSelectHint: 'Pick the activity that fits today.',
      letterTag: 'Letters and syllables',
      letterTitle: 'Word Garden',
      letterHint: 'Build words, collect stickers, and unlock rewards.',
      mathTag: 'Math',
      mathTitle: 'Count Quest',
      mathHint: 'Gentle counting and early number games for kids.',
      openGame: 'Open',
      comingSoon: 'Coming soon',
      statsTitle: 'Mode',
      stickersButton: 'Stickers',
      rewardsButton: 'Rewards',
      rankingButton: 'Leaderboard',
      settingsButton: 'Settings',
      settingsShort: 'Settings',
      signInButton: 'Sign in',
      logoutButton: 'Log out',
      seasonLabel: 'Season event',
      seasonAction: 'Rewards and stickers',
      albumButton: 'Album',
      mathSoonToast: 'Math game is coming in the next update.',
      mathPlayNow: 'Play',
      mathModeDigits: 'Digits',
      mathModeFruits: 'Fruits',
      mathModeListen: 'Listen',
      mathSelected: 'Selected mode',
      mathRewards: 'Math rewards',
      mathListenHint: 'Tap big number cards and hear every number clearly.',
      mathDigitsHint: 'Practice comparing, adding, and matching number cards.',
      mathFruitsHint: 'Count bright objects and solve gentle visual math.',
      mathRewardsEmpty: 'Your first math prizes will appear here.',
      memoryTag: 'Memory',
      memoryTitle: 'Find the Pair',
      memoryHint: 'Flip cards and match numbers with their emoji groups.',
      soundTag: 'Listen',
      soundTitle: 'Guess the Word',
      soundHint: 'Hear a word and tap the right picture.',
      colorTag: 'Art',
      colorTitle: 'Color by Number',
      colorHint: 'Fill in the grid by painting each cell the right color.',
      syllableTag: 'Speech',
      syllableTitle: 'Clap the Syllables',
      syllableHint: 'Listen to a word and tap how many syllables you hear. Great for speech development!',
      rhymeTag: 'Rhyme',
      rhymeTitle: 'Find the Rhyme',
      rhymeHint: 'Hear a word and find the one that rhymes. Builds phonological awareness.',
      firstSoundTag: 'Sounds',
      firstSoundTitle: 'First Sound',
      firstSoundHint: 'Hear a letter sound and find the picture that starts with it.'
    },
    RU: {
      playButton: 'Играть',
      gameSelect: 'Выбери игру',
      gameSelectHint: 'Открой занятие, которое подходит ребёнку сейчас.',
      letterTag: 'Слова и слоги',
      letterTitle: 'Словоград',
      letterHint: 'Собирай слова, открывай стикеры и получай награды.',
      mathTag: 'Математика',
      mathTitle: 'Считай-ка',
      mathHint: 'Мягкие задания на счёт и первые числа для малышей.',
      openGame: 'Играть',
      comingSoon: 'Скоро',
      statsTitle: 'Режим',
      stickersButton: 'Стикеры',
      rewardsButton: 'Награды',
      rankingButton: 'Рейтинг',
      settingsButton: 'Настройки',
      settingsShort: 'Настройки',
      signInButton: 'Войти',
      logoutButton: 'Выйти',
      seasonLabel: 'Сезонное событие',
      seasonAction: 'Награды и стикеры',
      albumButton: 'Альбом',
      mathSoonToast: 'Математическая игра появится в следующем обновлении.',
      mathPlayNow: 'Играть',
      mathModeDigits: 'Цифры',
      mathModeFruits: 'С фруктами',
      mathModeListen: 'Слушай цифры',
      mathSelected: 'Выбранный режим',
      mathRewards: 'Награды математики',
      mathListenHint: 'Нажимай на большие карточки и слушай, как звучит каждая цифра.',
      mathDigitsHint: 'Тренируй сравнение, сложение и поиск ответа с цифрами.',
      mathFruitsHint: 'Считай яркие предметы и решай мягкие задания на наглядной математике.',
      mathRewardsEmpty: 'Первые математические призы появятся здесь.',
      memoryTag: 'Память',
      memoryTitle: 'Найди пару',
      memoryHint: 'Переворачивай карточки и соединяй цифры с картинками.',
      soundTag: 'Слух',
      soundTitle: 'Угадай слово',
      soundHint: 'Послушай слово и нажми на нужную картинку.',
      colorTag: 'Рисование',
      colorTitle: 'Раскраска по цифрам',
      colorHint: 'Закрашивай клеточки нужным цветом по числовому коду.',
      syllableTag: 'Речь',
      syllableTitle: 'Хлопни по слогам',
      syllableHint: 'Послушай слово и хлопни столько раз, сколько слогов. Помогает при нарушениях речи.',
      rhymeTag: 'Рифмы',
      rhymeTitle: 'Найди рифму',
      rhymeHint: 'Услышь слово и найди рифму среди картинок. Тренирует фонематический слух.',
      firstSoundTag: 'Звуки',
      firstSoundTitle: 'Первый звук',
      firstSoundHint: 'Услышь звук буквы и найди картинку, название которой с него начинается.'
    },
    KG: {
      playButton: 'Ойноо',
      gameSelect: 'Оюнду танда',
      gameSelectHint: 'Бүгүнкүгө ылайыктуу сабакты ач.',
      letterTag: 'Сөздөр жана муундар',
      letterTitle: 'Сөз бакчасы',
      letterHint: 'Сөз чогулт, чаптамаларды ач жана белектерди ал.',
      mathTag: 'Математика',
      mathTitle: 'Сандар дүйнөсү',
      mathHint: 'Балдар үчүн жөнөкөй саноо жана алгачкы сандар.',
      openGame: 'Ачуу',
      comingSoon: 'Жакында',
      statsTitle: 'Режим',
      stickersButton: 'Чаптамалар',
      rewardsButton: 'Сыйлыктар',
      rankingButton: 'Рейтинг',
      settingsButton: 'Орнотуулар',
      settingsShort: 'Орнотуулар',
      signInButton: 'Кирүү',
      logoutButton: 'Чыгуу',
      seasonLabel: 'Сезондук окуя',
      seasonAction: 'Белектер жана чаптамалар',
      albumButton: 'Альбом',
      mathSoonToast: 'Математика оюну кийинки жаңыртууда келет.',
      mathPlayNow: 'Ойноо',
      mathModeDigits: 'Сандар',
      mathModeFruits: 'Мөмөлөр',
      mathModeListen: 'Сандарды ук',
      mathSelected: 'Тандалган режим',
      mathRewards: 'Математика белектери',
      mathListenHint: 'Чоң карточкаларды басып, ар бир санды так ук.',
      mathDigitsHint: 'Сандарды салыштырып, кошуп жана туура жоопту тап.',
      mathFruitsHint: 'Жаркыраган нерселерди санап, көрмө математика менен ойно.',
      mathRewardsEmpty: 'Биринчи математика белектери бул жерде көрүнөт.',
      memoryTag: 'Эс тутум',
      memoryTitle: 'Жупту тап',
      memoryHint: 'Карточкаларды которуп, сандарды сүрөттөр менен дал келтир.',
      soundTag: 'Угуу',
      soundTitle: 'Сөздү тап',
      soundHint: 'Сөздү угуп, туура сүрөткө бас.',
      colorTag: 'Сүрөт',
      colorTitle: 'Санга боёо',
      colorHint: 'Клеткаларды санга жараша туура түс менен боё.',
      syllableTag: 'Сүйлөм',
      syllableTitle: 'Муун сана',
      syllableHint: 'Сөздү угуп, канча муун барын кол чап. Сүйлөөдөгү кемчиликти оңдоого жардам берет.',
      rhymeTag: 'Уйкаш',
      rhymeTitle: 'Уйкаш тап',
      rhymeHint: 'Сөздү угуп, уйкаш сүрөттү тап. Фонематикалык угууну өнүктүрөт.',
      firstSoundTag: 'Үндөр',
      firstSoundTitle: 'Биринчи үн',
      firstSoundHint: 'Тамганын үнүн угуп, ошол үндөн башталган сүрөттү тап.'
    },
    UZ: {
      playButton: 'O`ynash',
      gameSelect: 'O`yinni tanlang',
      gameSelectHint: 'Bugunga mos mashg`ulotni oching.',
      letterTag: 'So`zlar va bo`g`inlar',
      letterTitle: 'So`z bog`i',
      letterHint: 'So`z yig`ing, stikerlarni oching va sovg`alar oling.',
      mathTag: 'Matematika',
      mathTitle: 'Sonlar olami',
      mathHint: 'Bolalar uchun sodda sanash va ilk raqamlar o`yini.',
      openGame: 'Ochish',
      comingSoon: 'Tez kunda',
      statsTitle: 'Rejim',
      stickersButton: 'Stikerlar',
      rewardsButton: 'Yutuqlar',
      rankingButton: 'Reyting',
      settingsButton: 'Sozlamalar',
      settingsShort: 'Sozlamalar',
      signInButton: 'Kirish',
      logoutButton: 'Chiqish',
      seasonLabel: 'Mavsumiy voqea',
      seasonAction: 'Sovg`alar va stikerlar',
      albumButton: 'Albom',
      mathSoonToast: 'Matematika o`yini keyingi yangilanishda chiqadi.',
      mathPlayNow: 'O`ynash',
      mathModeDigits: 'Raqamlar',
      mathModeFruits: 'Mevalar',
      mathModeListen: 'Raqamlarni tingla',
      mathSelected: 'Tanlangan rejim',
      mathRewards: 'Matematika sovg`alari',
      mathListenHint: 'Katta kartalarni bosing va har bir raqamni aniq eshiting.',
      mathDigitsHint: 'Raqamlarni solishtiring, qo`shing va javobni toping.',
      mathFruitsHint: 'Yorqin buyumlarni sanang va ko`rgazmali matematika bilan o`ynang.',
      mathRewardsEmpty: 'Birinchi matematika sovg`alari shu yerda ko`rinadi.',
      memoryTag: 'Xotira',
      memoryTitle: 'Juftni top',
      memoryHint: 'Kartalarni ag`darib, raqamlarni rasmlar bilan toping.',
      soundTag: 'Tinglash',
      soundTitle: 'So`zni top',
      soundHint: 'So`zni eshitib, to`g`ri rasmni bosing.',
      colorTag: 'Rasm',
      colorTitle: 'Raqam bo`yicha bo`yash',
      colorHint: 'Katakchalarni raqamga mos rang bilan bo`yang.',
      syllableTag: 'Nutq',
      syllableTitle: 'Bo`g`in sanash',
      syllableHint: 'So`zni eshiting va nechta bo`g`in borligini qo`l chaping. Nutq rivojiga yordam beradi.',
      rhymeTag: 'Qofiya',
      rhymeTitle: 'Qofiyani top',
      rhymeHint: 'So`zni eshitib, rasmlar orasidan qofiyasini toping. Fonetik eshitishni rivojlantiradi.',
      firstSoundTag: 'Tovushlar',
      firstSoundTitle: 'Birinchi tovush',
      firstSoundHint: 'Harf tovushini eshiting va u bilan boshlanadigan rasmni toping.'
    }
  }[lang] || {
    playButton: 'Играть',
    gameSelect: 'Выбери игру',
    gameSelectHint: 'Открой занятие, которое подходит ребёнку сейчас.',
    letterTag: 'Слова и слоги',
    letterTitle: 'Словоград',
    letterHint: 'Собирай слова, открывай стикеры и получай награды.',
    mathTag: 'Математика',
    mathTitle: 'Считай-ка',
    mathHint: 'Мягкие задания на счёт и первые числа для малышей.',
    openGame: 'Играть',
    comingSoon: 'Скоро',
    statsTitle: 'Режим',
    stickersButton: 'Стикеры',
    rewardsButton: 'Награды',
    rankingButton: 'Рейтинг',
    settingsButton: 'Настройки',
    settingsShort: 'Настройки',
    signInButton: 'Войти',
    logoutButton: 'Выйти',
    seasonLabel: 'Сезонное событие',
    seasonAction: 'Награды и стикеры',
    albumButton: 'Альбом',
    mathSoonToast: 'Математическая игра появится в следующем обновлении.',
    mathPlayNow: 'Играть',
    mathModeDigits: 'Цифры',
    mathModeFruits: 'С фруктами',
    mathModeListen: 'Слушай цифры',
    mathSelected: 'Выбранный режим',
    mathRewards: 'Награды математики',
    mathListenHint: 'Нажимай на большие карточки и слушай, как звучит каждая цифра.',
    mathDigitsHint: 'Тренируй сравнение, сложение и поиск ответа с цифрами.',
    mathFruitsHint: 'Считай яркие предметы и решай мягкие задания на наглядной математике.',
    mathRewardsEmpty: 'Первые математические призы появятся здесь.',
    memoryTag: 'Память',
    memoryTitle: 'Найди пару',
    memoryHint: 'Переворачивай карточки и соединяй цифры с картинками.',
    soundTag: 'Слух',
    soundTitle: 'Угадай слово',
    soundHint: 'Послушай слово и нажми на нужную картинку.',
    colorTag: 'Рисование',
    colorTitle: 'Раскраска по цифрам',
    colorHint: 'Закрашивай клеточки нужным цветом по числовому коду.',
    syllableTag: 'Речь',
    syllableTitle: 'Хлопни по слогам',
    syllableHint: 'Послушай слово и хлопни столько раз, сколько слогов.',
    rhymeTag: 'Рифмы',
    rhymeTitle: 'Найди рифму',
    rhymeHint: 'Услышь слово и найди рифму среди картинок.',
    firstSoundTag: 'Звуки',
    firstSoundTitle: 'Первый звук',
    firstSoundHint: 'Услышь звук буквы и найди картинку, которая начинается с него.'
  }), [lang]);

  useEffect(() => {
    if (authMode === 'WELCOME') {
      setSelectedGame(null);
    }
  }, [authMode, setSelectedGame]);

  useEffect(() => {
    setIsLanguageOpen(false);
  }, [lang]);

  const selectedLanguageLabel = languageOptions.find((languageOption) => languageOption.value === lang)?.label || 'Русский';
  const languageLabel = {
    EN: 'Language',
    RU: 'Выбор языка',
    KG: 'Тил тандоо',
    UZ: 'Til tanlash'
  }[lang] || 'Выбор языка';
  const passwordToastText = {
    EN: {
      empty: 'Enter your old and new password.',
      success: 'Password changed successfully.',
      error: 'Server connection error.'
    },
    RU: {
      empty: 'Введите старый и новый пароль!',
      success: 'Пароль успешно изменен! 🔒',
      error: 'Ошибка соединения с сервером!'
    },
    KG: {
      empty: 'Эски жана жаңы сырсөздү жазыңыз.',
      success: 'Сырсөз ийгиликтүү өзгөртүлдү.',
      error: 'Сервер менен байланыш катасы.'
    },
    UZ: {
      empty: 'Eski va yangi parolni kiriting.',
      success: 'Parol muvaffaqiyatli o`zgartirildi.',
      error: 'Server bilan ulanishda xatolik.'
    }
  }[lang] || {
    empty: 'Введите старый и новый пароль!',
    success: 'Пароль успешно изменен! 🔒',
    error: 'Ошибка соединения с сервером!'
  };

  const footerActions = [
    {
      key: 'album',
      label: menuText.albumButton,
      icon: '📒',
      className: 'menu-button menu-button-green',
      onClick: () => setGameState('ALBUM')
    },
    {
      key: 'settings',
      label: menuText.settingsButton,
      icon: '⚙️',
      className: 'menu-button menu-button-slate',
      onClick: () => setGameState('SETTINGS')
    }
  ];

  if (currentUser?.isAdmin) {
    footerActions.push({
      key: 'admin',
      label: text.adminPanel.replace('🛡️ ', ''),
      icon: '🛡️',
      className: 'menu-button menu-button-navy',
      onClick: () => setGameState('ADMIN')
    });
  }

  const showWelcomeScreen = !currentUser && authMode === 'WELCOME';
  const showGameChooser = (currentUser || authMode === 'READY') && !selectedGame;
  const showLetterLoomMenu = (currentUser || authMode === 'READY') && selectedGame === GAME_CATALOG.LETTER_LOOM;
  const showMathPlaceholder = (currentUser || authMode === 'READY') && selectedGame === GAME_CATALOG.MATH_KIDS;

  const handleChangePassword = async () => {
    if (!oldPwd || !newPwd) {
      showToast?.(passwordToastText.empty, 'error');
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser.username,
          oldPassword: oldPwd,
          newPassword: newPwd
        })
      });
      const data = await res.json();

      if (data.success) {
        showToast?.(passwordToastText.success, 'success');
        setIsChangingPwd(false);
        setOldPwd('');
        setNewPwd('');
      } else {
        showToast?.(data.error, 'error');
      }
    } catch {
      showToast?.(passwordToastText.error, 'error');
    }
  };

  const openMathSoon = () => setSelectedGame(GAME_CATALOG.MATH_KIDS);
  const selectedMathModeLabel = mathMode === 'LISTEN'
    ? menuText.mathModeListen
    : mathMode === 'DIGITS'
      ? menuText.mathModeDigits
      : menuText.mathModeFruits;
  const selectedMathModeHint = mathMode === 'LISTEN'
    ? menuText.mathListenHint
    : mathMode === 'DIGITS'
      ? menuText.mathDigitsHint
      : menuText.mathFruitsHint;

  const inputStyle = {
    width: '100%',
    padding: '16px',
    marginBottom: '14px',
    minHeight: '56px',
    borderRadius: '18px',
    border: '2px solid rgba(255,255,255,0.5)',
    fontSize: '1.05rem',
    outline: 'none',
    background: 'rgba(255,255,255,0.93)',
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
    boxSizing: 'border-box',
    boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.08)',
    touchAction: 'manipulation'
  };

  const modalPrimaryButton = (bg, shadow) => ({
    width: '100%',
    padding: '16px 20px',
    minHeight: '58px',
    background: bg,
    color: 'white',
    border: 'none',
    borderRadius: '18px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: `0 6px 0 ${shadow}`,
    marginBottom: '10px',
    touchAction: 'manipulation'
  });

  return (
    <div className="main-menu-shell">
      <div className="main-menu-panel">
        <div className="menu-top-strip">
          <div className="menu-top-bar">
            <div className="menu-language-select-wrap">
              <div className="menu-language-shell">
                <div className="menu-language-badge">🌐</div>
                <div className="menu-language-copy">
                  <span className="menu-language-label">{languageLabel}</span>
                  <button
                    type="button"
                    className={`menu-language-trigger ${isLanguageOpen ? 'is-open' : ''}`}
                    onClick={() => setIsLanguageOpen((prev) => !prev)}
                    aria-haspopup="listbox"
                    aria-expanded={isLanguageOpen}
                    aria-label={languageLabel}
                  >
                    <span className="menu-language-value">{selectedLanguageLabel}</span>
                  </button>
                  {isLanguageOpen ? (
                    <div className="menu-language-menu" role="listbox" aria-label={languageLabel}>
                      {languageOptions.filter((languageOption) => languageOption.value !== lang).map((languageOption) => (
                        <button
                          key={languageOption.value}
                          type="button"
                          className="menu-language-option"
                          onClick={() => {
                            setLang(languageOption.value);
                            setIsLanguageOpen(false);
                          }}
                        >
                          {languageOption.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="menu-utility-stickers">
              <button
                type="button"
                className="menu-top-sticker menu-top-sticker-orange"
                onClick={fetchLeaderboard}
                aria-label={menuText.rankingButton}
                title={menuText.rankingButton}
              >
                <span className="menu-top-sticker-icon">🥇</span>
              </button>
              <button
                type="button"
                className="menu-top-sticker menu-top-sticker-purple"
                onClick={() => setGameState('ACHIEVEMENTS')}
                aria-label={menuText.rewardsButton}
                title={menuText.rewardsButton}
              >
                <span className="menu-top-sticker-icon">🏆</span>
              </button>
            </div>
          </div>
        </div>

        <h1 className="menu-title">{text.title || 'Letter Loom'}</h1>

        <div className="menu-cat-display">
          <CatBuddy3D mood="static" speaking={false} className="menu-cat-buddy" />
        </div>

        {showWelcomeScreen ? (
          <div className="menu-welcome-card menu-entry-card">
            <div className="menu-welcome-pill">{text.welcomeTitle}</div>
            <div className="menu-welcome-actions">
              <button
                type="button"
                className="menu-welcome-button menu-welcome-button-primary"
                onClick={() => {
                  setAuthMode('READY');
                  setSelectedGame(null);
                }}
              >
                {menuText.playButton}
              </button>
              <button
                type="button"
                className="menu-welcome-button menu-welcome-button-tertiary"
                onClick={() => setAuthMode('LOGIN')}
              >
                {menuText.signInButton}
              </button>
            </div>

            <div className="menu-entry-grid">
              <button
                type="button"
                className="menu-entry-shortcut menu-button menu-button-green"
                onClick={() => setGameState('ALBUM')}
              >
                <span className="menu-button-icon">📒</span>
                <span className="menu-button-label">{menuText.albumButton}</span>
              </button>
              <button
                type="button"
                className="menu-entry-shortcut menu-button menu-button-slate"
                onClick={() => setGameState('SETTINGS')}
              >
                <span className="menu-button-icon">⚙️</span>
                <span className="menu-button-label">{menuText.settingsShort}</span>
              </button>
            </div>
          </div>
        ) : null}

        {showGameChooser ? (
          <div className="menu-games-shell">
            <div className="menu-games-head">
              <div className="menu-welcome-pill">{menuText.gameSelect}</div>
              <div className="menu-games-hint">{menuText.gameSelectHint}</div>
            </div>

            <div className="menu-games-grid">
              <div className="menu-game-card menu-game-card-primary">
                <div className="menu-game-glow" />
                <div className="menu-game-tag">{menuText.letterTag}</div>
                <div className="menu-game-title">{menuText.letterTitle}</div>
                <div className="menu-game-copy">{menuText.letterHint}</div>
                <div className="menu-game-actions">
                  <button
                    type="button"
                    className="menu-welcome-button menu-welcome-button-primary menu-game-action"
                    onClick={() => setSelectedGame(GAME_CATALOG.LETTER_LOOM)}
                  >
                    {menuText.openGame}
                  </button>
                </div>
              </div>

              <div className="menu-game-card menu-game-card-secondary">
                <div className="menu-game-glow menu-game-glow-math" />
                <div className="menu-game-tag">{menuText.mathTag}</div>
                <div className="menu-game-title">{menuText.mathTitle}</div>
                <div className="menu-game-copy">{menuText.mathHint}</div>
                <div className="menu-game-actions">
                  <button
                    type="button"
                    className="menu-welcome-button menu-welcome-button-secondary menu-game-action"
                    onClick={openMathSoon}
                  >
                    {menuText.mathPlayNow}
                  </button>
                </div>
              </div>

              <div className="menu-game-card menu-game-card-memory">
                <div className="menu-game-glow menu-game-glow-memory" />
                <div className="menu-game-tag">{menuText.memoryTag}</div>
                <div className="menu-game-title">{menuText.memoryTitle}</div>
                <div className="menu-game-copy">{menuText.memoryHint}</div>
                <div className="menu-game-actions">
                  <button
                    type="button"
                    className="menu-welcome-button menu-game-action"
                    style={{ background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)', color: 'white', border: 'none' }}
                    onClick={() => setGameState('MEMORY_FLIP')}
                  >
                    {menuText.openGame}
                  </button>
                </div>
              </div>

              <div className="menu-game-card menu-game-card-sound">
                <div className="menu-game-glow menu-game-glow-sound" />
                <div className="menu-game-tag">{menuText.soundTag}</div>
                <div className="menu-game-title">{menuText.soundTitle}</div>
                <div className="menu-game-copy">{menuText.soundHint}</div>
                <div className="menu-game-actions">
                  <button
                    type="button"
                    className="menu-welcome-button menu-game-action"
                    style={{ background: 'linear-gradient(135deg, #00d2d3, #01abc7)', color: 'white', border: 'none' }}
                    onClick={() => setGameState('SOUND_QUIZ')}
                  >
                    {menuText.openGame}
                  </button>
                </div>
              </div>

              <div className="menu-game-card menu-game-card-color">
                <div className="menu-game-glow menu-game-glow-color" />
                <div className="menu-game-tag">{menuText.colorTag}</div>
                <div className="menu-game-title">{menuText.colorTitle}</div>
                <div className="menu-game-copy">{menuText.colorHint}</div>
                <div className="menu-game-actions">
                  <button
                    type="button"
                    className="menu-welcome-button menu-game-action"
                    style={{ background: 'linear-gradient(135deg, #ff9f43, #ffd166)', color: 'white', border: 'none' }}
                    onClick={() => setGameState('COLOR_BY_NUMBER')}
                  >
                    {menuText.openGame}
                  </button>
                </div>
              </div>

              <div className="menu-game-card menu-game-card-memory">
                <div className="menu-game-glow" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,107,107,0.35), transparent 70%)' }} />
                <div className="menu-game-tag" style={{ background: 'rgba(255,107,107,0.18)', color: '#ff6b6b' }}>{menuText.syllableTag}</div>
                <div className="menu-game-title">{menuText.syllableTitle}</div>
                <div className="menu-game-copy">{menuText.syllableHint}</div>
                <div className="menu-game-actions">
                  <button
                    type="button"
                    className="menu-welcome-button menu-game-action"
                    style={{ background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)', color: 'white', border: 'none' }}
                    onClick={() => setGameState('SYLLABLE_CLAP')}
                  >
                    {menuText.openGame}
                  </button>
                </div>
              </div>

              <div className="menu-game-card menu-game-card-sound">
                <div className="menu-game-glow" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(72,219,251,0.35), transparent 70%)' }} />
                <div className="menu-game-tag" style={{ background: 'rgba(72,219,251,0.18)', color: '#48dbfb' }}>{menuText.rhymeTag}</div>
                <div className="menu-game-title">{menuText.rhymeTitle}</div>
                <div className="menu-game-copy">{menuText.rhymeHint}</div>
                <div className="menu-game-actions">
                  <button
                    type="button"
                    className="menu-welcome-button menu-game-action"
                    style={{ background: 'linear-gradient(135deg, #48dbfb, #0abde3)', color: 'white', border: 'none' }}
                    onClick={() => setGameState('RHYME_TIME')}
                  >
                    {menuText.openGame}
                  </button>
                </div>
              </div>

              <div className="menu-game-card menu-game-card-secondary">
                <div className="menu-game-glow" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(162,155,254,0.35), transparent 70%)' }} />
                <div className="menu-game-tag" style={{ background: 'rgba(162,155,254,0.18)', color: '#a29bfe' }}>{menuText.firstSoundTag}</div>
                <div className="menu-game-title">{menuText.firstSoundTitle}</div>
                <div className="menu-game-copy">{menuText.firstSoundHint}</div>
                <div className="menu-game-actions">
                  <button
                    type="button"
                    className="menu-welcome-button menu-game-action"
                    style={{ background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)', color: 'white', border: 'none' }}
                    onClick={() => setGameState('FIRST_SOUND')}
                  >
                    {menuText.openGame}
                  </button>
                </div>
              </div>
            </div>

            {!currentUser ? (
              <button type="button" className="menu-back-button" onClick={() => setAuthMode('WELCOME')}>
                {text.back}
              </button>
            ) : null}
          </div>
        ) : null}

        {showLetterLoomMenu ? (
          <>
            {currentUser ? (
              <div className="menu-user-card">
                <div className="menu-user-line">
                  {text.hello}, <span>{currentUser.username}</span>
                </div>
                <div className="menu-user-score">{text.score}: {currentUser.score}</div>
                {currentUser.isAdmin ? <div className="menu-admin-badge">{text.adminRole}</div> : null}

                {isChangingPwd ? (
                  <div className="menu-password-box">
                    <input
                      type="password"
                      placeholder={text.oldPassword}
                      value={oldPwd}
                      onChange={(e) => setOldPwd(e.target.value)}
                      style={inputStyle}
                    />
                    <input
                      type="password"
                      placeholder={text.newPassword}
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      style={inputStyle}
                    />
                    <div className="menu-password-actions">
                      <button type="button" className="menu-mini-btn menu-mini-btn-green" onClick={handleChangePassword}>
                        {text.save}
                      </button>
                      <button type="button" className="menu-mini-btn menu-mini-btn-red" onClick={() => setIsChangingPwd(false)}>
                        {text.cancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="menu-password-actions">
                    <button type="button" className="menu-mini-btn menu-mini-btn-orange" onClick={() => setIsChangingPwd(true)}>
                      ⚙️ {text.changePassword}
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            <div className={`menu-main-card ${currentUser ? '' : 'menu-main-card-guest'}`}>
              <div className="menu-card-header">
                <div className="menu-welcome-pill">
                  {currentUser ? menuText.statsTitle : menuText.gameSelectHint}
                </div>
                {!currentUser ? (
                  <div className="menu-guest-note">
                    {text.login}
                  </div>
                ) : null}
              </div>

              <div className="menu-card-title">{menuText.letterTitle}</div>

              <div className="menu-caption">{menuText.statsTitle}</div>
              <div className="menu-segment-row">
                <button
                  type="button"
                  className={`menu-segment menu-mode ${playMode === 'WORDS' ? 'is-active' : ''}`}
                  onClick={() => setPlayMode('WORDS')}
                >
                  {text.modeWords}
                </button>
                <button
                  type="button"
                  className={`menu-segment menu-mode ${playMode === 'SYLLABLES' ? 'is-active' : ''}`}
                  onClick={() => setPlayMode('SYLLABLES')}
                >
                  {text.modeSyllables}
                </button>
                <button
                  type="button"
                  className={`menu-segment menu-mode ${playMode === 'ALPHABET' ? 'is-active' : ''}`}
                  onClick={() => setPlayMode('ALPHABET')}
                >
                  {text.modeAlphabet || 'Азбука'}
                </button>
              </div>

              <div className="menu-action-row">
                <button
                  type="button"
                  className="menu-play-button"
                  onClick={() => setGameState(playMode === 'ALPHABET' ? 'ALPHABET' : 'PLAYING')}
                >
                  {text.start} 🚀
                </button>
              </div>

              <div className="menu-footer-grid">
                {footerActions.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    className={action.className}
                    onClick={action.onClick}
                  >
                    <span className="menu-button-icon">{action.icon}</span>
                    <span className="menu-button-label">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="menu-back-button"
              onClick={() => {
                setSelectedGame(null);
                setIsChangingPwd(false);
              }}
            >
              {text.back}
            </button>
          </>
        ) : null}

        {showMathPlaceholder ? (
          <>
            <div className={`menu-main-card ${currentUser ? '' : 'menu-main-card-guest'}`}>
              <div className="menu-card-header">
                <div className="menu-welcome-pill">
                  {currentUser ? menuText.statsTitle : menuText.gameSelectHint}
                </div>
                {!currentUser ? (
                  <div className="menu-guest-note">
                    {text.login}
                  </div>
                ) : null}
              </div>

              <div className="menu-card-title">{menuText.mathTitle}</div>

              <div className="menu-caption">{menuText.statsTitle}</div>
              <div className="menu-segment-row">
                <button
                  type="button"
                  className={`menu-segment menu-mode ${mathMode === 'DIGITS' ? 'is-active' : ''}`}
                  onClick={() => setMathMode('DIGITS')}
                >
                  {menuText.mathModeDigits}
                </button>
                <button
                  type="button"
                  className={`menu-segment menu-mode ${mathMode === 'FRUITS' ? 'is-active' : ''}`}
                  onClick={() => setMathMode('FRUITS')}
                >
                  {menuText.mathModeFruits}
                </button>
                <button
                  type="button"
                  className={`menu-segment menu-mode ${mathMode === 'LISTEN' ? 'is-active' : ''}`}
                  onClick={() => setMathMode('LISTEN')}
                >
                  {menuText.mathModeListen}
                </button>
              </div>

              <div className="menu-math-hero-card">
                <span className="menu-math-hero-icon">
                  {mathMode === 'LISTEN' ? '🔊' : mathMode === 'DIGITS' ? '🔢' : '🍎'}
                </span>
                <div className="menu-math-hero-name">{selectedMathModeLabel}</div>
                <div className="menu-math-hero-copy">{selectedMathModeHint}</div>
              </div>

              <div className="menu-action-row">
                <button
                  type="button"
                  className="menu-play-button"
                  onClick={() => setGameState('MATH_PLAYING')}
                >
                  {menuText.mathPlayNow}
                </button>
              </div>

              <div className="menu-footer-grid">
                {footerActions.map((action) => (
                  <button
                    key={`math-${action.key}`}
                    type="button"
                    className={action.className}
                    onClick={action.onClick}
                  >
                    <span className="menu-button-icon">{action.icon}</span>
                    <span className="menu-button-label">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="menu-back-button"
              onClick={() => setSelectedGame(null)}
            >
              {text.back}
            </button>
          </>
        ) : null}
      </div>

      {!currentUser && authMode === 'LOGIN' ? (
        <div className="menu-modal-overlay">
          <div className="menu-modal">
            <h2 className="menu-modal-title">{text.login}</h2>
            <input
              type="text"
              placeholder={text.username}
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder={text.password}
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              style={inputStyle}
            />
            <button type="button" style={modalPrimaryButton('#34c96b', '#219d53')} onClick={handleLogin}>
              {text.enterAccount}
            </button>
            <button type="button" className="menu-modal-switch" onClick={() => setAuthMode('REGISTER')}>
              {text.register}
            </button>
            <button
              type="button"
              className="menu-modal-ghost"
              onClick={() => {
                setUsernameInput('');
                setPasswordInput('');
                setAuthMode(selectedGame ? 'READY' : 'WELCOME');
              }}
            >
              {text.back}
            </button>
          </div>
        </div>
      ) : null}

      {!currentUser && authMode === 'REGISTER' ? (
        <div className="menu-modal-overlay">
          <div className="menu-modal">
            <h2 className="menu-modal-title">{text.registerWindow}</h2>
            <input
              type="text"
              placeholder={text.username}
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder={text.password}
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              style={inputStyle}
            />
            <button type="button" style={modalPrimaryButton('#2a86f4', '#0f63b8')} onClick={handleRegister}>
              {text.createAccount}
            </button>
            <button
              type="button"
              className="menu-modal-ghost"
              onClick={() => {
                setUsernameInput('');
                setPasswordInput('');
                setAuthMode('LOGIN');
              }}
            >
              {text.back}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
