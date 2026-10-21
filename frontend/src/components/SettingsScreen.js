import React, { useState } from 'react';
import { ValleyScene } from './ValleyScene';
import { pictureUrl } from '../lib/api';
import './SettingsScreen.css';

const TEXT = {
  EN: {
    title: 'Settings', back: 'Back', voice: 'Irbi’s voice', slow: 'Slow', normal: 'Normal', fast: 'Fast', test: 'Listen',
    sample: 'Hi! I am Irbi. Let’s play!', music: 'Music', on: 'On', off: 'Off', volume: 'Volume',
    adults: 'For grown-ups', reset: 'Reset progress', resetAsk: 'Reset all progress of this child? This cannot be undone.',
    switchKid: 'Change player', yes: 'Yes', cancel: 'Cancel', done: 'Progress cleared'
  },
  RU: {
    title: 'Настройки', back: 'Назад', voice: 'Голос Ирби', slow: 'Медленно', normal: 'Обычно', fast: 'Быстро', test: 'Послушать',
    sample: 'Привет! Я Ирби. Давай играть!', music: 'Музыка', on: 'Вкл', off: 'Выкл', volume: 'Громкость',
    adults: 'Для взрослых', reset: 'Сбросить прогресс', resetAsk: 'Сбросить весь прогресс этого ребёнка? Это нельзя отменить.',
    switchKid: 'Сменить игрока', yes: 'Да', cancel: 'Отмена', done: 'Прогресс сброшен'
  },
  KG: {
    title: 'Орнотуулар', back: 'Артка', voice: 'Ирбинин үнү', slow: 'Жай', normal: 'Кадимки', fast: 'Тез', test: 'Угуу',
    sample: 'Салам! Мен Ирбимин. Келчи, ойнойлу!', music: 'Музыка', on: 'Күйүк', off: 'Өчүк', volume: 'Үнү',
    adults: 'Чоңдор үчүн', reset: 'Прогрессти тазалоо', resetAsk: 'Бул баланын бардык прогрессин тазалайсызбы? Муну кайтаруу мүмкүн эмес.',
    switchKid: 'Оюнчуну алмаштыруу', yes: 'Ооба', cancel: 'Жокко чыгаруу', done: 'Прогресс тазаланды'
  },
  UZ: {
    title: 'Sozlamalar', back: 'Orqaga', voice: 'Irbining ovozi', slow: 'Sekin', normal: 'Oddiy', fast: 'Tez', test: 'Tinglash',
    sample: 'Salom! Men Irbiman. Kel, o‘ynaymiz!', music: 'Musiqa', on: 'Yoqilgan', off: 'O‘chiq', volume: 'Ovoz balandligi',
    adults: 'Kattalar uchun', reset: 'Natijalarni tozalash', resetAsk: 'Bu bolaning barcha natijalari tozalansinmi? Buni qaytarib bo‘lmaydi.',
    switchKid: 'O‘yinchini almashtirish', yes: 'Ha', cancel: 'Bekor qilish', done: 'Natijalar tozalandi'
  }
};

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
