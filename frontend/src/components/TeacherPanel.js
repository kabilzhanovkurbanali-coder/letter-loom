import React, { useMemo, useState } from 'react';
import { pictureUrl } from '../lib/api';
import {
  KID_NAME_PATTERN, MODULES, clearChildData, isLevelLocked, needsPractice, readActivityLevel, readProfiles,
  readStats, rememberProfile, setLevelLocked, todayKey, writeActivityLevel, writeProfiles
} from '../lib/progress';
import { MENU_TEXT, avatarForName } from './MainMenu';
import './TeacherPanel.css';

const TEXT = {
  EN: {
    title: 'Teacher mode', close: 'Close', children: 'Children', namePlaceholder: 'Child’s name', add: 'Add',
    nameError: 'Use letters only, up to 24', noChildren: 'No children yet. Add the first one.', pick: 'Choose a child on the left.',
    play: 'Play', sessions: 'sessions', tasks: 'tasks', days: 'days played', lastWeeks: 'Last 2 weeks',
    stat: '{tasks} tasks · {pct}% without help', notStarted: 'Not started', last: 'last {date}',
    practice: 'Worth practising together', level: 'Level',
    lock: 'Keep levels fixed', lockHint: 'Games will not change the level on their own',
    reset: 'Reset progress', remove: 'Remove from list',
    confirmReset: 'Reset all progress? This cannot be undone.', confirmRemove: 'Remove from the list and delete progress on this device?',
    yes: 'Yes', cancel: 'Cancel',
    privacy: 'All data stays on this device. The microphone records nothing.',
    offlineTitle: 'Offline use', offlineHint: 'Downloads the voice for every task in {lang} and all the pictures. For another language, switch the language and repeat.', offlineGo: 'Download', offlineProgress: '{done} of {total}',
    offlineDone: 'Done! The voice is saved.', offlineFailed: 'Not downloaded: {n}. Check the internet and try again.', offlineNoSw: 'To play without internet on the tablet itself, open the game over https.', langName: 'English',
    modules: { letters: 'Letters and words', speech: 'Speech', math: 'Math', memory: 'Memory', logic: 'Logic' }
  },
  RU: {
    title: 'Режим учителя', close: 'Закрыть', children: 'Дети', namePlaceholder: 'Имя ребёнка', add: 'Добавить',
    nameError: 'Только буквы, до 24 символов', noChildren: 'Пока нет детей. Добавьте первого ребёнка.', pick: 'Выберите ребёнка слева.',
    play: 'Играть', sessions: 'занятий', tasks: 'заданий', days: 'дней с играми', lastWeeks: 'Последние 2 недели',
    stat: '{tasks} заданий · {pct}% без подсказок', notStarted: 'Ещё не начато', last: 'последний раз {date}',
    practice: 'Стоит потренировать вместе', level: 'Уровень',
    lock: 'Зафиксировать уровни', lockHint: 'Игры не будут сами менять уровень',
    reset: 'Сбросить прогресс', remove: 'Убрать из списка',
    confirmReset: 'Сбросить весь прогресс? Это нельзя отменить.', confirmRemove: 'Убрать из списка и удалить прогресс на этом устройстве?',
    yes: 'Да', cancel: 'Отмена',
    privacy: 'Все данные хранятся только на этом устройстве. Микрофон ничего не записывает.',
    offlineTitle: 'Работа без интернета', offlineHint: 'Скачает голос всех заданий ({lang}) и все картинки. Для другого языка переключите язык и повторите.', offlineGo: 'Скачать', offlineProgress: '{done} из {total}',
    offlineDone: 'Готово! Голос сохранён.', offlineFailed: 'Не скачалось: {n}. Проверьте интернет и нажмите ещё раз.', offlineNoSw: 'Чтобы игра работала без интернета прямо на планшете, откройте её по https.', langName: 'русский',
    modules: { letters: 'Буквы и слова', speech: 'Произношение', math: 'Математика', memory: 'Память', logic: 'Логика' }
  },
  KG: {
    title: 'Мугалим режими', close: 'Жабуу', children: 'Балдар', namePlaceholder: 'Баланын аты', add: 'Кошуу',
    nameError: 'Тамгалар гана, 24кө чейин', noChildren: 'Азырынча балдар жок. Биринчи баланы кошуңуз.', pick: 'Сол жактан баланы тандаңыз.',
    play: 'Ойноо', sessions: 'сабак', tasks: 'тапшырма', days: 'ойногон күн', lastWeeks: 'Акыркы 2 жума',
    stat: '{tasks} тапшырма · {pct}% жардамсыз', notStarted: 'Баштала элек', last: 'акыркы жолу {date}',
    practice: 'Чогуу машыгуу керек', level: 'Деңгээл',
    lock: 'Деңгээлдерди бекитүү', lockHint: 'Оюндар деңгээлди өзү өзгөртпөйт',
    reset: 'Прогрессти тазалоо', remove: 'Тизмеден алып салуу',
    confirmReset: 'Бардык прогрессти тазалайсызбы? Муну кайтаруу мүмкүн эмес.', confirmRemove: 'Тизмеден алып, ушул түзмөктөгү прогрессти өчүрөсүзбү?',
    yes: 'Ооба', cancel: 'Жокко чыгаруу',
    privacy: 'Бардык маалымат ушул түзмөктө гана сакталат. Микрофон эч нерсе жазбайт.',
    offlineTitle: 'Интернетсиз иштөө', offlineHint: 'Бардык тапшырмалардын үнүн ({lang}) жана бардык сүрөттөрдү жүктөйт. Башка тил үчүн тилди алмаштырып, кайталаңыз.', offlineGo: 'Жүктөө', offlineProgress: '{total} ичинен {done}',
    offlineDone: 'Даяр! Үн сакталды.', offlineFailed: 'Жүктөлгөн жок: {n}. Интернетти текшерип, кайра басыңыз.', offlineNoSw: 'Оюн планшетте интернетсиз иштеши үчүн аны https аркылуу ачыңыз.', langName: 'кыргызча',
    modules: { letters: 'Тамгалар жана сөздөр', speech: 'Сүйлөө', math: 'Математика', memory: 'Эс тутум', logic: 'Логика' }
  },
  UZ: {
    title: 'O‘qituvchi rejimi', close: 'Yopish', children: 'Bolalar', namePlaceholder: 'Bolaning ismi', add: 'Qo‘shish',
    nameError: 'Faqat harflar, 24 tagacha', noChildren: 'Hozircha bolalar yo‘q. Birinchi bolani qo‘shing.', pick: 'Chap tomondan bolani tanlang.',
    play: 'O‘ynash', sessions: 'mashg‘ulot', tasks: 'topshiriq', days: 'o‘ynagan kun', lastWeeks: 'Oxirgi 2 hafta',
    stat: '{tasks} topshiriq · {pct}% yordamsiz', notStarted: 'Hali boshlanmagan', last: 'oxirgi marta {date}',
    practice: 'Birga mashq qilish kerak', level: 'Daraja',
    lock: 'Darajalarni qotirish', lockHint: 'O‘yinlar darajani o‘zi o‘zgartirmaydi',
    reset: 'Natijalarni tozalash', remove: 'Ro‘yxatdan olib tashlash',
    confirmReset: 'Barcha natijalar tozalansinmi? Buni qaytarib bo‘lmaydi.', confirmRemove: 'Ro‘yxatdan olib, shu qurilmadagi natijalarni o‘chirasizmi?',
    yes: 'Ha', cancel: 'Bekor qilish',
    privacy: 'Barcha ma’lumotlar faqat shu qurilmada saqlanadi. Mikrofon hech narsa yozib olmaydi.',
    offlineTitle: 'Internetsiz ishlash', offlineHint: 'Barcha topshiriqlar ovozini ({lang}) va barcha rasmlarni yuklab oladi. Boshqa til uchun tilni almashtirib, qaytaring.', offlineGo: 'Yuklab olish', offlineProgress: '{total} tadan {done}',
    offlineDone: 'Tayyor! Ovoz saqlandi.', offlineFailed: 'Yuklanmadi: {n}. Internetni tekshirib, qayta bosing.', offlineNoSw: 'O‘yin planshetda internetsiz ishlashi uchun uni https orqali oching.', langName: 'o‘zbekcha',
    modules: { letters: 'Harflar va so‘zlar', speech: 'Talaffuz', math: 'Matematika', memory: 'Xotira', logic: 'Mantiq' }
  }
};

// Our own month names: browsers on tablets often lack Kyrgyz and Uzbek date data ("M10 18").
const MONTHS = {
  EN: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  RU: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  KG: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  UZ: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek']
};

const formatDay = (day, lang) => {
  const [, month, date] = String(day || '').split('-').map(Number);
  if (!month || !date) return '';
  return `${date} ${(MONTHS[lang] || MONTHS.RU)[month - 1]}`;
};

const lastDays = (count) => Array.from({ length: count }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() - (count - 1 - index));
  return todayKey(date);
});

const summarize = (stats) => Object.values(stats.activities).reduce((sum, entry) => ({
  tasks: sum.tasks + (entry.tasks || 0),
  sessions: sum.sessions + (entry.sessions || 0)
}), { tasks: 0, sessions: 0 });

export function TeacherPanel({ lang, onClose, onPlayAs, onPrepareOffline }) {
  const t = TEXT[lang] || TEXT.RU;
  const menu = MENU_TEXT[lang] || MENU_TEXT.RU;
  const [profiles, setProfiles] = useState(readProfiles);
  const [selected, setSelected] = useState(() => readProfiles()[0] || null);
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState('');
  const [confirm, setConfirm] = useState(null);
  // bumped after every change so derived numbers are re-read from storage
  const [version, setVersion] = useState(0);
  const [offline, setOffline] = useState(null);
  const hasOfflineWorker = typeof navigator !== 'undefined' && Boolean(navigator.serviceWorker?.controller);

  const prepareOffline = async () => {
    if (!onPrepareOffline || offline?.running) return;
    setOffline({ running: true, done: 0, total: 0, failed: 0 });
    const result = await onPrepareOffline((progress) => setOffline({ running: true, ...progress }));
    setOffline({ running: false, ...result });
  };

  const stats = useMemo(() => (selected ? readStats(selected) : null), [selected, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const totals = useMemo(() => (stats ? summarize(stats) : null), [stats]);
  const days = useMemo(() => lastDays(14), []);
  const locked = selected ? isLevelLocked(selected) : false;
  const taskCounts = useMemo(() => Object.fromEntries(profiles.map((name) => [name, summarize(readStats(name)).tasks])), [profiles, version]); // eslint-disable-line react-hooks/exhaustive-deps

  const addChild = (event) => {
    event.preventDefault();
    const name = nameInput.trim().replace(/\s+/g, ' ');
    if (!KID_NAME_PATTERN.test(name)) {
      setNameError(t.nameError);
      return;
    }
    const existing = profiles.find((item) => item.toLowerCase() === name.toLowerCase());
    const next = existing ? profiles : rememberProfile(name);
    setProfiles(next);
    setSelected(existing || name);
    setNameInput('');
    setNameError('');
  };

  const setLevel = (activityId, level) => {
    writeActivityLevel(selected, activityId, level);
    setVersion((value) => value + 1);
  };

  const toggleLock = () => {
    setLevelLocked(selected, !locked);
    setVersion((value) => value + 1);
  };

  const runConfirmed = () => {
    if (!confirm || !selected) return;
    clearChildData(selected);
    if (confirm === 'remove') {
      const next = profiles.filter((item) => item !== selected);
      writeProfiles(next);
      setProfiles(next);
      setSelected(next[0] || null);
    }
    setConfirm(null);
    setVersion((value) => value + 1);
  };

  const maxDay = Math.max(1, ...days.map((day) => stats?.days[day] || 0));
  const activeDays = stats ? Object.values(stats.days).filter((count) => count > 0).length : 0;

  return (
    <div className="tp">
      <header className="tp-top">
        <div className="tp-title">
          <img src={pictureUrl('teacher')} alt="" />
          <h1>{t.title}</h1>
        </div>
        <button type="button" className="tp-btn tp-btn-ghost" onClick={onClose}>{t.close}</button>
      </header>

      <div className="tp-layout">
        <aside className="tp-side">
          <h2 className="tp-side-title">{t.children}</h2>
          <form className="tp-add" onSubmit={addChild}>
            <input
              className="tp-input"
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              placeholder={t.namePlaceholder}
              maxLength={24}
              autoComplete="off"
              aria-label={t.namePlaceholder}
            />
            <button type="submit" className="tp-btn tp-btn-primary" disabled={!nameInput.trim()}>{t.add}</button>
          </form>
          {nameError ? <p className="tp-error">{nameError}</p> : null}
          {profiles.length ? (
            <ul className="tp-kids">
              {profiles.map((name) => (
                <li key={name}>
                  <button type="button" className={`tp-kid ${name === selected ? 'is-active' : ''}`} onClick={() => setSelected(name)}>
                    <img src={pictureUrl(avatarForName(name))} alt="" />
                    <span className="tp-kid-name">{name}</span>
                    <span className="tp-kid-count">{taskCounts[name] || 0}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="tp-empty">{t.noChildren}</p>
          )}
          {onPrepareOffline ? (
            <section className="tp-offline">
              <h3>{t.offlineTitle}</h3>
              <p>{t.offlineHint.replace('{lang}', t.langName)}</p>
              {offline ? (
                <div className="tp-progress" aria-live="polite">
                  <span className="tp-progress-bar" style={{ '--p': offline.total ? offline.done / offline.total : 0 }} />
                  <span className="tp-progress-text">
                    {offline.running
                      ? t.offlineProgress.replace('{done}', offline.done).replace('{total}', offline.total || '…')
                      : (offline.failed ? t.offlineFailed.replace('{n}', offline.failed) : t.offlineDone)}
                  </span>
                </div>
              ) : null}
              <button type="button" className="tp-btn tp-btn-primary" onClick={prepareOffline} disabled={offline?.running}>{t.offlineGo}</button>
              {!hasOfflineWorker ? <p className="tp-offline-note">{t.offlineNoSw}</p> : null}
            </section>
          ) : null}
          <p className="tp-privacy">
            <img src={pictureUrl('lock')} alt="" />
            {t.privacy}
          </p>
        </aside>

        <main className="tp-main">
          {!selected ? (
            <p className="tp-empty tp-empty-main">{profiles.length ? t.pick : t.noChildren}</p>
          ) : (
            <>
              <section className="tp-child">
                <img className="tp-child-avatar" src={pictureUrl(avatarForName(selected))} alt="" />
                <div className="tp-child-meta">
                  <h2>{selected}</h2>
                  <div className="tp-chips">
                    <span className="tp-chip"><b>{totals.sessions}</b> {t.sessions}</span>
                    <span className="tp-chip"><b>{totals.tasks}</b> {t.tasks}</span>
                    <span className="tp-chip"><b>{activeDays}</b> {t.days}</span>
                  </div>
                </div>
                <button type="button" className="tp-btn tp-btn-play" onClick={() => onPlayAs?.(selected)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.2-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor" /></svg>
                  {t.play}
                </button>
              </section>

              <section className="tp-card tp-week">
                <h3>{t.lastWeeks}</h3>
                <div className="tp-days">
                  {days.map((day) => {
                    const count = stats.days[day] || 0;
                    return (
                      <div key={day} className={`tp-day ${day === todayKey() ? 'is-today' : ''}`} title={`${formatDay(day, lang)}: ${count}`}>
                        <span className={`tp-day-bar ${count ? '' : 'is-empty'}`} style={{ '--h': count ? 0.15 + (0.85 * count) / maxDay : 0 }} />
                        <span className="tp-day-label">{Number(day.slice(-2))}</span>
                      </div>
                    );
                  })}
                </div>
                <label className="tp-lock">
                  <input type="checkbox" checked={locked} onChange={toggleLock} />
                  <span className="tp-switch" aria-hidden="true" />
                  <span>
                    <b>{t.lock}</b>
                    <small>{t.lockHint}</small>
                  </span>
                </label>
              </section>

              <section className="tp-modules">
                {MODULES.map((module) => (
                  <div key={module.id} className={`tp-card tp-module tp-module-${module.id}`}>
                    <h3 className="tp-module-title">
                      <img src={pictureUrl(module.icon)} alt="" />
                      {t.modules[module.id]}
                    </h3>
                    {module.activities.map((activity) => {
                      const entry = stats.activities[activity.id];
                      const level = readActivityLevel(selected, activity.id, lang);
                      const pct = entry?.tasks ? Math.round((100 * entry.clean) / entry.tasks) : 0;
                      return (
                        <div key={activity.id} className="tp-activity" data-activity={activity.id}>
                          <div className="tp-activity-info">
                            <span className="tp-activity-name">{menu[activity.menuKey]}</span>
                            <span className="tp-activity-stat">
                              {entry?.tasks
                                ? `${t.stat.replace('{tasks}', entry.tasks).replace('{pct}', pct)} · ${t.last.replace('{date}', formatDay(entry.last, lang))}`
                                : t.notStarted}
                            </span>
                            {needsPractice(entry) ? <span className="tp-flag">{t.practice}</span> : null}
                          </div>
                          <div className="tp-levels" role="group" aria-label={`${t.level}: ${menu[activity.menuKey]}`}>
                            {[1, 2, 3].map((value) => (
                              <button
                                key={value}
                                type="button"
                                className={`tp-level ${value === level ? 'is-on' : ''} ${value < level ? 'is-below' : ''}`}
                                onClick={() => setLevel(activity.id, value)}
                                aria-pressed={value === level}
                                title={`${t.level} ${value}`}
                              >
                                {value}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </section>

              <section className="tp-danger">
                <button type="button" className="tp-btn tp-btn-ghost" onClick={() => setConfirm('reset')}>{t.reset}</button>
                <button type="button" className="tp-btn tp-btn-danger" onClick={() => setConfirm('remove')}>{t.remove}</button>
              </section>
            </>
          )}
        </main>
      </div>

      {confirm ? (
        <div className="tp-backdrop" onClick={() => setConfirm(null)}>
          <div className="tp-dialog" role="alertdialog" onClick={(event) => event.stopPropagation()}>
            <img src={pictureUrl(avatarForName(selected))} alt="" />
            <h3>{selected}</h3>
            <p>{confirm === 'reset' ? t.confirmReset : t.confirmRemove}</p>
            <div className="tp-dialog-actions">
              <button type="button" className="tp-btn tp-btn-ghost" onClick={() => setConfirm(null)}>{t.cancel}</button>
              <button type="button" className="tp-btn tp-btn-danger" onClick={runConfirmed}>{t.yes}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
