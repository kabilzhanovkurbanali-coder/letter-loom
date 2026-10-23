import React, { useState } from 'react';
import { ValleyScene } from './ValleyScene';
import { pictureUrl } from '../lib/api';
import { NAME_SPEECH, SOUND_SPEECH, getLetterName, getLetterSound, readLetterMode, writeLetterMode } from '../lib/letters';
import './SettingsScreen.css';

const TEXT = {
  EN: {
    title: 'Settings', back: 'Back', voice: 'Irbi’s voice', slow: 'Slow', normal: 'Normal', fast: 'Fast', test: 'Listen',
    sample: 'Hi! I am Irbi. Let’s play!', music: 'Music', on: 'On', off: 'Off', volume: 'Volume',
    adults: 'For grown-ups', reset: 'Reset progress', resetAsk: 'Reset all progress of this child? This cannot be undone.',
    switchKid: 'Change player', yes: 'Yes', cancel: 'Cancel', done: 'Progress cleared',
    lettersTitle: 'Letters', letterSound: 'Sound', letterName: 'Name', lettersHint: 'Sounds are better for learning to read'
  },
  RU: {
    title: 'Настройки', back: 'Назад', voice: 'Голос Ирби', slow: 'Медленно', normal: 'Обычно', fast: 'Быстро', test: 'Послушать',
    sample: 'Привет! Я Ирби. Давай играть!', music: 'Музыка', on: 'Вкл', off: 'Выкл', volume: 'Громкость',
    adults: 'Для взрослых', reset: 'Сбросить прогресс', resetAsk: 'Сбросить весь прогресс этого ребёнка? Это нельзя отменить.',
    switchKid: 'Сменить игрока', yes: 'Да', cancel: 'Отмена', done: 'Прогресс сброшен',
    lettersTitle: 'Буквы', letterSound: 'Звук', letterName: 'Название', lettersHint: 'Для обучения чтению лучше звук'
  },
  KG: {
    title: 'Орнотуулар', back: 'Артка', voice: 'Ирбинин үнү', slow: 'Жай', normal: 'Кадимки', fast: 'Тез', test: 'Угуу',
    sample: 'Салам! Мен Ирбимин. Келчи, ойнойлу!', music: 'Музыка', on: 'Күйүк', off: 'Өчүк', volume: 'Үнү',
    adults: 'Чоңдор үчүн', reset: 'Прогрессти тазалоо', resetAsk: 'Бул баланын бардык прогрессин тазалайсызбы? Муну кайтаруу мүмкүн эмес.',
    switchKid: 'Оюнчуну алмаштыруу', yes: 'Ооба', cancel: 'Жокко чыгаруу', done: 'Прогресс тазаланды',
    lettersTitle: 'Тамгалар', letterSound: 'Тыбыш', letterName: 'Аты', lettersHint: 'Окууга үйрөнүү үчүн тыбыш жакшыраак'
  },
  UZ: {
    title: 'Sozlamalar', back: 'Orqaga', voice: 'Irbining ovozi', slow: 'Sekin', normal: 'Oddiy', fast: 'Tez', test: 'Tinglash',
    sample: 'Salom! Men Irbiman. Kel, o‘ynaymiz!', music: 'Musiqa', on: 'Yoqilgan', off: 'O‘chiq', volume: 'Ovoz balandligi',
    adults: 'Kattalar uchun', reset: 'Natijalarni tozalash', resetAsk: 'Bu bolaning barcha natijalari tozalansinmi? Buni qaytarib bo‘lmaydi.',
    switchKid: 'O‘yinchini almashtirish', yes: 'Ha', cancel: 'Bekor qilish', done: 'Natijalar tozalandi',
    lettersTitle: 'Harflar', letterSound: 'Tovush', letterName: 'Nomi', lettersHint: 'O‘qishni o‘rganish uchun tovush yaxshiroq'
  }
};

// the letter used to show the difference: M is "mmm" as a sound and "em" as a name
const EXAMPLE_LETTER = { EN: 'M', UZ: 'M', RU: 'М', KG: 'М' };

const SPEEDS = [
  { value: 'SLOW', icon: 'turtle', label: 'slow' },
  { value: 'NORMAL', icon: 'cat', label: 'normal' },
  { value: 'FAST', icon: 'rabbit', label: 'fast' }
];

export function SettingsScreen({
  lang, onClose, speechRate, setSpeechRate, speakText,
  toggleMusic, isMusicOn, musicVolume, onMusicVolumeChange,
  currentUser, handleResetProgress, handleLogout
}) {
  const t = TEXT[lang] || TEXT.RU;
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [letterMode, setLetterMode] = useState(() => readLetterMode());
  const example = EXAMPLE_LETTER[lang] || EXAMPLE_LETTER.RU;
  const letterModes = [
    { value: 'sound', label: t.letterSound, sample: getLetterSound(lang, example), speech: SOUND_SPEECH },
    { value: 'name', label: t.letterName, sample: getLetterName(lang, example), speech: NAME_SPEECH }
  ];

  // Irbi says the example right away, so grown-ups hear what the choice means
  const chooseLetterMode = (mode) => {
    setLetterMode(mode.value);
    writeLetterMode(mode.value);
    speakText?.(mode.value === 'name' ? example : mode.sample, { ...mode.speech, interrupt: true });
  };

  const chooseSpeed = (value) => {
    setSpeechRate(value);
  };

  const reset = () => {
    handleResetProgress();
    setConfirmReset(false);
    setResetDone(true);
  };

  return (
    <div className="st">
      <ValleyScene />
      <div className="st-veil" aria-hidden="true" />

      <header className="st-top">
        <button type="button" className="st-round" onClick={onClose} aria-label={t.back} title={t.back}>
          <img src={pictureUrl('house')} alt="" />
        </button>
        <h1 className="st-title">
          <img src={pictureUrl('gear')} alt="" />
          {t.title}
        </h1>
        <span className="st-round-spacer" />
      </header>

      <main className="st-main">
        <section className="st-card">
          <h2>{t.voice}</h2>
          <div className="st-speeds" role="radiogroup" aria-label={t.voice}>
            {SPEEDS.map((speed) => (
              <button
                key={speed.value}
                type="button"
                role="radio"
                aria-checked={speechRate === speed.value}
                className={`st-speed ${speechRate === speed.value ? 'is-on' : ''}`}
                onClick={() => chooseSpeed(speed.value)}
              >
                <img src={pictureUrl(speed.icon)} alt="" />
                <span>{t[speed.label]}</span>
              </button>
            ))}
          </div>
          <button type="button" className="st-btn st-btn-listen" onClick={() => speakText?.(t.sample, { interrupt: true })}>
            <img src={pictureUrl('speaker')} alt="" />
            {t.test}
          </button>
        </section>

        <section className="st-card">
          <h2>{t.music}</h2>
          <button type="button" className={`st-toggle ${isMusicOn ? 'is-on' : ''}`} onClick={toggleMusic} aria-pressed={isMusicOn}>
            <img src={pictureUrl('music')} alt="" />
            <span className="st-switch" aria-hidden="true" />
            <span>{isMusicOn ? t.on : t.off}</span>
          </button>
          <label className="st-volume">
            <span>{t.volume}: {musicVolume}%</span>
            <input type="range" min="0" max="100" value={musicVolume} onChange={(event) => onMusicVolumeChange(Number(event.target.value))} />
          </label>
        </section>

        <section className="st-card">
          <h2>{t.lettersTitle}</h2>
          <div className="st-letter-modes" role="radiogroup" aria-label={t.lettersTitle}>
            {letterModes.map((mode) => (
              <button
                key={mode.value}
                type="button"
                role="radio"
                aria-checked={letterMode === mode.value}
                className={`st-speed st-letter-mode ${letterMode === mode.value ? 'is-on' : ''}`}
                onClick={() => chooseLetterMode(mode)}
              >
                <span className="st-letter-sample">«{mode.sample}»</span>
                <span>{mode.label}</span>
              </button>
            ))}
          </div>
          <p className="st-hint">{t.lettersHint}</p>
        </section>

        {currentUser && !currentUser.isAdmin ? (
          <section className="st-card st-card-adult">
            <h2>{t.adults}</h2>
            <div className="st-adult-actions">
              <button type="button" className="st-btn st-btn-ghost" onClick={() => setConfirmReset(true)}>{t.reset}</button>
              <button type="button" className="st-btn st-btn-ghost" onClick={handleLogout}>
                <img src={pictureUrl('door_exit')} alt="" />
                {t.switchKid}
              </button>
            </div>
            {resetDone ? <p className="st-note">{t.done}</p> : null}
          </section>
        ) : null}
      </main>

      {confirmReset ? (
        <div className="st-backdrop" onClick={() => setConfirmReset(false)}>
          <div className="st-dialog" role="alertdialog" onClick={(event) => event.stopPropagation()}>
            <p>{t.resetAsk}</p>
            <div className="st-dialog-actions">
              <button type="button" className="st-btn st-btn-ghost" onClick={() => setConfirmReset(false)}>{t.cancel}</button>
              <button type="button" className="st-btn st-btn-danger" onClick={reset}>{t.yes}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
