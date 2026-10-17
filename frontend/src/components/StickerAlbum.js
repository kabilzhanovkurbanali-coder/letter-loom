import React, { useEffect, useMemo, useState } from 'react';
import { uiText } from '../data/uiText';

const LANGUAGE_CODES = ['EN', 'RU', 'KG', 'UZ'];

export function StickerAlbum({
  wordsByLang,
  wordProgressByLang,
  syllablesByLang,
  syllableProgressByLang,
  rewardCollection,
  mathCollection,
  onClose,
  lang
}) {
  const text = uiText[lang] || uiText.RU;
  const extraText = {
    EN: { exclusives: 'Exclusive Rewards', seasonal: 'Season drop', exclusiveBadge: 'Exclusive', locked: 'Locked', none: 'No exclusive rewards in the album yet.', sections: { words: 'Words', syllables: 'Syllables', math: 'Math Adventure', rewards: 'Exclusive Rewards' }, mathEmpty: 'Solve math rounds to unlock your first math reward.' },
    RU: { exclusives: 'Эксклюзивные награды', seasonal: 'Сезонная серия', exclusiveBadge: 'Эксклюзив', locked: 'Секрет', none: 'Пока в альбоме нет эксклюзивных наград.', sections: { words: 'Слова', syllables: 'Слоги', math: 'Математика', rewards: 'Эксклюзивные награды' }, mathEmpty: 'Пройди математические раунды, чтобы открыть первую награду.' },
    KG: { exclusives: 'Эксклюзив сыйлыктар', seasonal: 'Сезондук серия', exclusiveBadge: 'Эксклюзив', locked: 'Жашыруун', none: 'Альбомдо азырынча эксклюзив сыйлык жок.', sections: { words: 'Сөздөр', syllables: 'Муундар', math: 'Математика', rewards: 'Эксклюзив сыйлыктар' }, mathEmpty: 'Математика ойноп биринчи белекти ач.' },
    UZ: { exclusives: 'Eksklyuziv mukofotlar', seasonal: 'Mavsumiy seriya', exclusiveBadge: 'Eksklyuziv', locked: 'Sir', none: 'Albomda hali eksklyuziv mukofotlar yo`q.', sections: { words: 'So`zlar', syllables: 'Bo`g`inlar', math: 'Matematika', rewards: 'Eksklyuziv mukofotlar' }, mathEmpty: 'Matematika bosqichlarini o`tib birinchi sovg`ani oching.' }
  }[lang] || { exclusives: 'Эксклюзивные награды', seasonal: 'Сезонная серия', exclusiveBadge: 'Эксклюзив', locked: 'Секрет', none: 'Пока в альбоме нет эксклюзивных наград.', sections: { words: 'Слова', syllables: 'Слоги', math: 'Математика', rewards: 'Эксклюзивные награды' }, mathEmpty: 'Пройди математические раунды, чтобы открыть первую награду.' };
  const [albumLang, setAlbumLang] = useState(lang);
  const [albumSection, setAlbumSection] = useState('WORDS');

  useEffect(() => {
    setAlbumLang(lang);
  }, [lang]);

  const visibleWords = wordsByLang?.[albumLang] || [];
  const visibleWordIds = wordProgressByLang?.[albumLang] || [];
  const visibleSyllables = syllablesByLang?.[albumLang] || [];
  const visibleSyllableIds = syllableProgressByLang?.[albumLang] || [];
  const visibleMathCollection = mathCollection || [];
  const visibleRewardCollection = rewardCollection || [];
  const sectionTabs = useMemo(() => ([
    { id: 'WORDS', label: extraText.sections.words },
    { id: 'SYLLABLES', label: extraText.sections.syllables },
    { id: 'MATH', label: extraText.sections.math },
    { id: 'REWARDS', label: extraText.sections.rewards }
  ]), [extraText.sections.math, extraText.sections.rewards, extraText.sections.syllables, extraText.sections.words]);

  return (
    <div style={overlayStyle}>
      <h1 style={{ marginBottom: '18px' }}>{text.stickers}</h1>
      <div style={panelStyle}>
        <div style={tabRowStyle}>
          {LANGUAGE_CODES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setAlbumLang(code)}
              style={{
                ...tabStyle,
                ...(albumLang === code ? activeTabStyle : null)
              }}
            >
              {code}
            </button>
          ))}
        </div>

        <div style={{ ...tabRowStyle, marginBottom: '26px' }}>
          {sectionTabs.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setAlbumSection(section.id)}
              style={{
                ...tabStyle,
                ...(albumSection === section.id ? activeTabStyle : secondaryTabStyle)
              }}
            >
              {section.label}
            </button>
          ))}
        </div>

        {albumSection === 'WORDS' ? (
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ marginTop: 0 }}>
              {text.albumWords} ({visibleWordIds.length} / {visibleWords.length})
            </h2>
            {visibleWords.length ? (
              <div style={wordGridStyle}>
                {visibleWords.map((word) => {
                  const isUnlocked = visibleWordIds.includes(word.id);
                  return (
                    <div
                      key={`${albumLang}-word-${word.id}`}
                      style={{ ...cardStyle, opacity: isUnlocked ? 1 : 0.42 }}
                    >
                      <div style={imageWrapStyle}>
                        <img
                          src={word.img}
                          alt={word.text}
                          style={{ ...imageStyle, filter: isUnlocked ? 'none' : 'grayscale(100%)' }}
                        />
                      </div>
                      <p style={labelStyle}>{isUnlocked ? word.text : '???'}</p>
                      <div style={{ ...rarityBadgeStyle, color: word.rarityColor, borderColor: `${word.rarityColor}55` }}>
                        {word.seasonalExclusive ? extraText.seasonal : word.rarity}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={emptyStyle}>Пока нет разгаданных слов.</p>
            )}
          </div>
        ) : null}

        {albumSection === 'SYLLABLES' ? (
          <div>
            <h2 style={{ marginTop: 0 }}>
              {text.albumSyllables} ({visibleSyllableIds.length} / {visibleSyllables.length})
            </h2>
            {visibleSyllables.length ? (
              <div style={syllableGridStyle}>
                {visibleSyllables.map((item) => {
                  const isUnlocked = visibleSyllableIds.includes(item.id);
                  return (
                    <div
                      key={`${albumLang}-syllable-${item.id}`}
                      style={{ ...cardStyle, opacity: isUnlocked ? 1 : 0.42 }}
                    >
                      <div style={imageWrapStyle}>
                        <img
                          src={item.img}
                          alt={item.text}
                          style={{ ...imageStyle, filter: isUnlocked ? 'none' : 'grayscale(100%)' }}
                        />
                      </div>
                      <p style={labelStyle}>{isUnlocked ? item.text : '???'}</p>
                      <div style={{ ...rarityBadgeStyle, color: item.rarityColor, borderColor: `${item.rarityColor}55` }}>
                        {item.seasonalExclusive ? extraText.seasonal : item.rarity}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={emptyStyle}>Пока нет разгаданных слогов.</p>
            )}
          </div>
        ) : null}

        {albumSection === 'MATH' ? (
          <div>
            <h2 style={{ marginTop: 0 }}>
              {extraText.sections.math} ({visibleMathCollection.length})
            </h2>
            {visibleMathCollection.length ? (
              <div style={rewardGridStyle}>
                {visibleMathCollection.map((reward) => (
                  <div key={reward.id} style={rewardCardStyle}>
                    <div style={rewardIconStyle}>{reward.icon}</div>
                    <div style={rewardNameStyle}>{reward.title || extraText.sections.math}</div>
                    <div style={rarityBadgeStyle}>{reward.type}</div>
                    {reward.desc ? <div style={rewardDescStyle}>{reward.desc}</div> : null}
                  </div>
                ))}
              </div>
            ) : (
              <p style={emptyStyle}>{extraText.mathEmpty}</p>
            )}
          </div>
        ) : null}

        {albumSection === 'REWARDS' ? (
          <div style={{ marginTop: '4px' }}>
            <h2 style={{ marginTop: 0 }}>
              {extraText.exclusives} ({visibleRewardCollection.length})
            </h2>
            {visibleRewardCollection.length ? (
              <div style={rewardGridStyle}>
                {visibleRewardCollection.map((reward) => (
                  <div key={reward.id} style={rewardCardStyle}>
                    <div style={rewardIconStyle}>{reward.icon}</div>
                    <div style={rewardNameStyle}>{reward.title}</div>
                    <div style={{ ...rarityBadgeStyle, color: reward.rarityColor || '#ffcc66', borderColor: `${reward.rarityColor || '#ffcc66'}55` }}>
                      {reward.season ? extraText.exclusiveBadge : reward.rarity}
                    </div>
                    <div style={rewardDescStyle}>{reward.desc}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={emptyStyle}>{extraText.none}</p>
            )}
          </div>
        ) : null}
      </div>
      <button onClick={onClose} style={closeButtonStyle}>{text.close}</button>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'rgba(0,0,0,0.85)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
  color: 'white',
  backdropFilter: 'blur(5px)',
  padding: '24px',
  boxSizing: 'border-box'
};

const panelStyle = {
  width: '90%',
  maxWidth: '980px',
  maxHeight: '72vh',
  overflowY: 'auto',
  padding: '20px',
  background: 'rgba(255,255,255,0.1)',
  borderRadius: '20px'
};

const tabRowStyle = {
  display: 'flex',
  justifyContent: 'center',
  flexWrap: 'wrap',
  gap: '12px',
  marginBottom: '22px'
};

const tabStyle = {
  minWidth: '88px',
  padding: '12px 18px',
  borderRadius: '999px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 'bold',
  background: 'rgba(255,255,255,0.88)',
  color: '#4a5568'
};

const activeTabStyle = {
  background: '#ffcc00',
  color: '#2d3748'
};

const secondaryTabStyle = {
  background: 'rgba(255,255,255,0.16)',
  color: 'white',
  border: '1px solid rgba(255,255,255,0.14)'
};

const wordGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))',
  gap: '15px'
};

const syllableGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: '15px'
};

const cardStyle = {
  textAlign: 'center'
};

const imageWrapStyle = {
  width: '80px',
  height: '80px',
  background: 'white',
  borderRadius: '15px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto'
};

const imageStyle = {
  width: '60px',
  height: '60px',
  objectFit: 'contain',
  display: 'block'
};

const labelStyle = {
  marginBottom: '6px'
};

const emptyStyle = {
  opacity: 0.8,
  marginBottom: '10px'
};

const closeButtonStyle = {
  marginTop: '20px',
  padding: '10px 30px',
  borderRadius: '20px',
  cursor: 'pointer'
};

const rarityBadgeStyle = {
  display: 'inline-block',
  padding: '4px 10px',
  borderRadius: '999px',
  border: '1px solid rgba(255,255,255,0.28)',
  fontSize: '0.72rem',
  fontWeight: 'bold'
};

const rewardGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '16px'
};

const rewardCardStyle = {
  background: 'rgba(255,255,255,0.08)',
  borderRadius: '20px',
  padding: '16px',
  textAlign: 'center',
  border: '1px solid rgba(255,255,255,0.12)'
};

const rewardIconStyle = {
  fontSize: '2.2rem',
  marginBottom: '8px'
};

const rewardNameStyle = {
  fontWeight: 'bold',
  marginBottom: '8px'
};

const rewardDescStyle = {
  marginTop: '10px',
  opacity: 0.84,
  fontSize: '0.9rem',
  lineHeight: 1.4
};
