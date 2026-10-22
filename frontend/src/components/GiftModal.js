import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Irbi } from './Irbi';
import { pictureUrl } from '../lib/api';
import { AWARD_TITLES, FRIENDS, friendName } from '../lib/rewards';
import { sfxTada, sfxWhoosh } from '../lib/sfx';
import { sayPhrase } from '../lib/voicePack';
import './Rewards.css';

const TEXT = {
  EN: { title: 'A gift from Irbi!', tap: 'Tap the gift', newFriend: 'A new friend: {name}!', hooray: 'Hooray!', award: 'New award' },
  RU: { title: 'Подарок от Ирби!', tap: 'Нажми на подарок', newFriend: 'Новый друг: {name}!', hooray: 'Ура!', award: 'Новая награда' },
  KG: { title: 'Ирбиден белек!', tap: 'Белекти бас', newFriend: 'Жаңы дос: {name}!', hooray: 'Ура!', award: 'Жаңы сыйлык' },
  UZ: { title: 'Irbidan sovg‘a!', tap: 'Sovg‘ani bos', newFriend: 'Yangi do‘st: {name}!', hooray: 'Ura!', award: 'Yangi mukofot' }
};

// Irbi brings a wrapped box; one tap opens it and a new friend jumps out.
export function GiftModal({ lang, friendId, speakText, onOpen, onDone }) {
  const t = TEXT[lang] || TEXT.RU;
  const [opened, setOpened] = useState(false);
  const timerRef = useRef(null);
  // the app hands a new speak function on every render; only a new gift may reset the box
  const speakRef = useRef(speakText);
  speakRef.current = speakText;

  useEffect(() => {
    setOpened(false);
    timerRef.current = window.setTimeout(() => speakRef.current?.(t.title, { interrupt: true }), 300);
    return () => window.clearTimeout(timerRef.current);
  }, [friendId, t.title]);

  const open = () => {
    if (opened) return;
    setOpened(true);
    onOpen?.(friendId);
    sfxWhoosh();
    window.setTimeout(() => sfxTada(), 200);
    confetti({ particleCount: 140, spread: 90, origin: { y: 0.5 }, disableForReducedMotion: true });
    speakText?.(t.newFriend.replace('{name}', friendName(friendId, lang)), { interrupt: true });
  };

  return (
    <div className="gf" role="dialog" aria-label={t.title}>
      <div className="gf-card">
        <span className="gf-rays" aria-hidden="true" />
        <h2 className="gf-title">{opened ? t.newFriend.replace('{name}', friendName(friendId, lang)) : t.title}</h2>
        <div className="gf-stage">
          <Irbi mood={opened ? 'cheer' : 'happy'} size={150} />
          {opened ? (
            <div className="gf-friend" key="friend">
              <img src={pictureUrl(friendId)} alt="" draggable="false" />
            </div>
          ) : (
            <button type="button" className="gf-box" onClick={open} aria-label={t.tap}>
              <img src={pictureUrl('gift')} alt="" draggable="false" />
            </button>
          )}
        </div>
        {opened ? (
          <button type="button" className="gf-btn" onClick={onDone}>{t.hooray}</button>
        ) : (
          <button type="button" className="gf-btn gf-btn-open" onClick={open}>{t.tap}</button>
        )}
      </div>
    </div>
  );
}

// A small card that slides in when the child earns an award; a tap opens the album.
export function AwardToast({ lang, award, onOpen }) {
  const t = TEXT[lang] || TEXT.RU;
  const titles = AWARD_TITLES[lang] || AWARD_TITLES.RU;
  if (!award) return null;
  return (
    <button type="button" className="aw" key={award.id} onClick={onOpen}>
      <span className="aw-icon"><img src={pictureUrl(award.icon)} alt="" /></span>
      <span className="aw-text">
        <span className="aw-label">{t.award}</span>
        <span className="aw-title">{titles[award.id]}</span>
      </span>
    </button>
  );
}

export const awardPhrase = (lang, awardId) => {
  const t = TEXT[lang] || TEXT.RU;
  const titles = AWARD_TITLES[lang] || AWARD_TITLES.RU;
  return `${t.award}: ${titles[awardId]}!`;
};

// What gifts and award cards say in `lang`, for the offline voice pack.
export const giftVoicePhrases = (lang) => {
  const t = TEXT[lang] || TEXT.RU;
  const titles = AWARD_TITLES[lang] || AWARD_TITLES.RU;
  return [
    sayPhrase(t.title),
    ...FRIENDS.map((friend) => sayPhrase(t.newFriend.replace('{name}', friendName(friend.id, lang)))),
    ...Object.keys(titles).map((id) => sayPhrase(awardPhrase(lang, id)))
  ];
};
