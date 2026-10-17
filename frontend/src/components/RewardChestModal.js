import React from 'react';

const modalText = {
  EN: {
    title: 'Treasure Chest',
    ready: 'A surprise chest is ready',
    open: 'Open chest',
    keep: 'Awesome',
    queue: 'Chests waiting',
    seasonal: 'Season exclusive',
    reward: 'New reward'
  },
  RU: {
    title: 'Сундук-сюрприз',
    ready: 'Тебя ждёт сундук с наградой',
    open: 'Открыть сундук',
    keep: 'Забрать',
    queue: 'Сундуков в очереди',
    seasonal: 'Сезонный эксклюзив',
    reward: 'Новая награда'
  },
  KG: {
    title: 'Сюрприз сандык',
    ready: 'Сени сюрприз сандык күтүп турат',
    open: 'Сандыкты ач',
    keep: 'Алуу',
    queue: 'Күтүп турган сандык',
    seasonal: 'Сезондук белек',
    reward: 'Жаңы сыйлык'
  },
  UZ: {
    title: 'Syurpriz sandiq',
    ready: 'Sizni syurpriz mukofot kutmoqda',
    open: 'Sandiqni ochish',
    keep: 'Olish',
    queue: 'Navbatdagi sandiq',
    seasonal: 'Mavsumiy eksklyuziv',
    reward: 'Yangi mukofot'
  }
};

const rarityColors = {
  COMMON: '#6fd08c',
  RARE: '#4ca6ff',
  SECRET: '#ffb347',
  SEASONAL: '#ff6f91'
};

export function RewardChestModal({ lang, reward, seasonTitle, opened, pendingCount, onReveal, onClose }) {
  if (!reward) return null;

  const text = modalText[lang] || modalText.RU;
  const rarityColor = rarityColors[reward.rarity] || '#ffffff';

  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        <div style={eyebrowStyle}>{text.title}</div>
        <h2 style={titleStyle}>{opened ? text.reward : text.ready}</h2>
        {pendingCount > 1 ? (
          <div style={queueStyle}>
            {text.queue}: {pendingCount}
          </div>
        ) : null}

        <div style={chestWrapStyle}>
          <div
            style={{
              ...chestStyle,
              transform: opened ? 'rotate(-4deg) scale(1.04)' : 'rotate(0deg) scale(1)',
              boxShadow: opened ? '0 18px 40px rgba(255, 164, 76, 0.35)' : '0 12px 28px rgba(0,0,0,0.25)'
            }}
          >
            <div style={rewardIconStyle}>{opened ? reward.icon : '🎁'}</div>
          </div>
        </div>

        {opened ? (
          <>
            <div style={{ ...pillStyle, background: `${rarityColor}22`, color: rarityColor, borderColor: `${rarityColor}55` }}>
              {reward.rarity}
            </div>
            <div style={rewardTitleStyle}>{reward.title}</div>
            <div style={rewardDescStyle}>{reward.desc}</div>
            {reward.season ? (
              <div style={seasonStyle}>
                {text.seasonal}: {seasonTitle}
              </div>
            ) : null}
            <button type="button" onClick={onClose} style={primaryButtonStyle}>
              {text.keep}
            </button>
          </>
        ) : (
          <button type="button" onClick={onReveal} style={primaryButtonStyle}>
            {text.open}
          </button>
        )}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(8, 14, 30, 0.72)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2600,
  padding: '20px'
};

const cardStyle = {
  width: '100%',
  maxWidth: '480px',
  background: 'linear-gradient(160deg, rgba(16,42,76,0.97), rgba(46,88,118,0.96))',
  borderRadius: '28px',
  padding: '28px 24px',
  color: 'white',
  textAlign: 'center',
  border: '1px solid rgba(255,255,255,0.16)',
  boxShadow: '0 28px 60px rgba(0,0,0,0.28)'
};

const eyebrowStyle = {
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
  opacity: 0.72,
  fontSize: '0.82rem'
};

const titleStyle = {
  margin: '10px 0 14px',
  fontSize: '2rem'
};

const queueStyle = {
  display: 'inline-block',
  marginBottom: '10px',
  padding: '8px 14px',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.1)'
};

const chestWrapStyle = {
  display: 'flex',
  justifyContent: 'center',
  margin: '14px 0 18px'
};

const chestStyle = {
  width: '152px',
  height: '152px',
  borderRadius: '28px',
  background: 'radial-gradient(circle at top, #ffd97a, #f3a93b 62%, #b86413)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.25s ease, box-shadow 0.25s ease'
};

const rewardIconStyle = {
  fontSize: '4.2rem'
};

const pillStyle = {
  display: 'inline-block',
  padding: '7px 14px',
  borderRadius: '999px',
  border: '1px solid transparent',
  fontWeight: 'bold',
  marginBottom: '10px'
};

const rewardTitleStyle = {
  fontSize: '1.55rem',
  fontWeight: 'bold',
  marginBottom: '8px'
};

const rewardDescStyle = {
  opacity: 0.88,
  lineHeight: 1.5,
  marginBottom: '12px'
};

const seasonStyle = {
  padding: '10px 12px',
  borderRadius: '16px',
  background: 'rgba(255,255,255,0.08)',
  marginBottom: '16px'
};

const primaryButtonStyle = {
  width: '100%',
  border: 'none',
  borderRadius: '18px',
  padding: '14px 18px',
  fontWeight: 'bold',
  fontSize: '1rem',
  background: '#ffd166',
  color: '#22304a',
  cursor: 'pointer'
};
