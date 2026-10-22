import React, { useEffect, useState } from 'react';
import { ValleyScene } from './ValleyScene';
import { pictureUrl } from '../lib/api';
import { AWARD_TITLES, FRIENDS, GIFT_EVERY, friendName } from '../lib/rewards';
import { sayPhrase, wordPhrase } from '../lib/voicePack';
import './AlbumScreen.css';

const TABS = [
  { id: 'words', icon: 'blocks' },
  { id: 'syllables', icon: 'puzzle' },
  { id: 'friends', icon: 'gift' },
  { id: 'awards', icon: 'trophy' }
];

const AS_WORD = { kind: 'word', rate: 0.85 };

const TEXT = {
  EN: {
    title: 'My album', home: 'Home', words: 'Words', syllables: 'Syllables', friends: 'Friends', awards: 'Awards',
    collected: '{n} of {total}', allFriends: 'All the friends are with you!',
    nextGift: (n) => `Next gift: ${n} more ${n === 1 ? 'game' : 'games'}`,
    emptyWords: 'Build words in the games, and they will appear here'
  },
  RU: {
    title: 'Мой альбом', home: 'Домой', words: 'Слова', syllables: 'Слоги', friends: 'Друзья', awards: 'Награды',
    collected: '{n} из {total}', allFriends: 'Все друзья уже с тобой!',
    nextGift: (n) => `До подарка: ещё ${n} ${n === 1 ? 'игра' : 'игры'}`,
    emptyWords: 'Собирай слова в играх, и они появятся здесь'
  },
  KG: {
    title: 'Менин альбомум', home: 'Үйгө', words: 'Сөздөр', syllables: 'Муундар', friends: 'Достор', awards: 'Сыйлыктар',
    collected: '{total} ичинен {n}', allFriends: 'Бардык достор сени менен!',
    nextGift: (n) => `Белекке чейин: дагы ${n} оюн`,
    emptyWords: 'Оюндарда сөз чогулт, алар ушул жерде пайда болот'
  },
  UZ: {
    title: 'Mening albomim', home: 'Uyga', words: 'So‘zlar', syllables: 'Bo‘g‘inlar', friends: 'Do‘stlar', awards: 'Mukofotlar',
    collected: '{total} tadan {n}', allFriends: 'Hamma do‘stlar sen bilan!',
    nextGift: (n) => `Sovg‘agacha: yana ${n} ta o‘yin`,
    emptyWords: 'O‘yinlarda so‘z yig‘, ular shu yerda paydo bo‘ladi'
  }
};

const spoken = (text) => String(text || '').replace(/-/g, '').toLowerCase();

function Progress({ value, total, label }) {
  return (
    <div className="al-progress" aria-label={label}>
      <span className="al-progress-bar" style={{ '--p': total ? value / total : 0 }} />
      <span className="al-progress-text">{label}</span>
    </div>
  );
}

export function AlbumScreen({
  lang, initialTab = 'words', words = [], wordIds = [], syllables = [], syllableIds = [],
  friends = [], wins = 0, awards = [], speakText, onExit
}) {
  const t = TEXT[lang] || TEXT.RU;
  const titles = AWARD_TITLES[lang] || AWARD_TITLES.RU;
  const [tab, setTab] = useState(initialTab);

  useEffect(() => setTab(initialTab), [initialTab]);

  const say = (text, options = {}) => {
    if (text) speakText?.(text, { interrupt: true, ...options });
  };

  const chooseTab = (id) => {
    setTab(id);
    say(t[id]);
  };

  const renderCollection = (items, unlockedIds) => {
    const unlocked = new Set(unlockedIds);
    const count = items.filter((item) => unlocked.has(item.id)).length;
    return (
      <>
        <Progress value={count} total={items.length} label={t.collected.replace('{n}', count).replace('{total}', items.length)} />
        {count === 0 ? <p className="al-hint">{t.emptyWords}</p> : null}
        <div className="al-grid">
          {items.map((item, index) => {
            const isOpen = unlocked.has(item.id);
            return (
              <button
                key={item.id}
                type="button"
                className={`al-card ${isOpen ? 'is-open' : 'is-locked'}`}
                style={{ '--i': Math.min(index, 24) }}
                onClick={() => (isOpen ? say(spoken(item.text), AS_WORD) : null)}
                disabled={!isOpen}
                aria-label={isOpen ? spoken(item.text) : ''}
              >
                <img src={item.img} alt="" draggable="false" />
                {isOpen ? <span className="al-card-word">{String(item.text).replace(/-/g, '')}</span> : null}
              </button>
            );
          })}
        </div>
      </>
    );
  };

  const owned = new Set(friends);
  const left = GIFT_EVERY - (wins % GIFT_EVERY);

  return (
    <div className="al">
      <ValleyScene />
      <div className="al-veil" aria-hidden="true" />

      <header className="al-top">
        <button type="button" className="al-round" onClick={onExit} aria-label={t.home} title={t.home}>
          <img src={pictureUrl('house')} alt="" />
        </button>
        <h1 className="al-title">
          <img src={pictureUrl('album')} alt="" />
          {t.title}
        </h1>
        <span className="al-round-spacer" />
      </header>

      <nav className="al-tabs" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`al-tab ${tab === item.id ? 'is-on' : ''}`}
            onClick={() => chooseTab(item.id)}
          >
            <img src={pictureUrl(item.icon)} alt="" />
            <span>{t[item.id]}</span>
          </button>
        ))}
      </nav>

      <main className="al-page" key={tab}>
        {tab === 'words' ? renderCollection(words, wordIds) : null}
        {tab === 'syllables' ? renderCollection(syllables, syllableIds) : null}

        {tab === 'friends' ? (
          <>
            <Progress
              value={owned.size}
              total={FRIENDS.length}
              label={owned.size >= FRIENDS.length ? t.allFriends : t.nextGift(left)}
            />
            <div className="al-grid al-grid-friends">
              {FRIENDS.map((friend, index) => {
                const isOpen = owned.has(friend.id);
                return (
                  <button
                    key={friend.id}
                    type="button"
                    className={`al-card al-friend ${isOpen ? 'is-open' : 'is-locked'}`}
                    style={{ '--i': index }}
                    onClick={() => (isOpen ? say(friendName(friend.id, lang), AS_WORD) : null)}
                    disabled={!isOpen}
                    aria-label={isOpen ? friendName(friend.id, lang) : ''}
                  >
                    <img src={pictureUrl(friend.id)} alt="" draggable="false" />
                    {isOpen ? <span className="al-card-word">{friendName(friend.id, lang)}</span> : null}
                  </button>
                );
              })}
            </div>
          </>
        ) : null}

        {tab === 'awards' ? (
          <div className="al-awards">
            {awards.map((award, index) => (
              <button
                key={award.id}
                type="button"
                className={`al-award ${award.done ? 'is-done' : ''}`}
                style={{ '--i': index }}
                onClick={() => say(titles[award.id])}
              >
                <span className="al-award-icon">
                  <img src={pictureUrl(award.icon)} alt="" draggable="false" />
                  {award.done ? <span className="al-award-check" aria-hidden="true">✓</span> : null}
                </span>
                <span className="al-award-body">
                  <span className="al-award-title">{titles[award.id]}</span>
                  <span className="al-award-meter">
                    <span style={{ '--p': award.value / award.goal }} />
                  </span>
                  <span className="al-award-count">{award.value} / {award.goal}</span>
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </main>
    </div>
  );
}

// What the album says in `lang`, for the offline voice pack (tab names, friends, awards).
export const albumVoicePhrases = (lang) => {
  const t = TEXT[lang] || TEXT.RU;
  const titles = AWARD_TITLES[lang] || AWARD_TITLES.RU;
  return [
    ...TABS.map((item) => sayPhrase(t[item.id])),
    ...FRIENDS.map((friend) => wordPhrase(friendName(friend.id, lang), AS_WORD)),
    ...Object.values(titles).map((title) => sayPhrase(title))
  ];
};
