import React from 'react';

export function Achievements({ achievements, allAchievementsList, onClose, lang }) {
  const t = {
    achievementsBtn: lang === 'EN' ? 'Trophies' : lang === 'KG' ? 'Сыйлыктар' : lang === 'UZ' ? 'Yutuqlar' : 'Награды',
    backBtn: lang === 'EN' ? 'Back' : lang === 'KG' ? 'Артка' : lang === 'UZ' ? 'Orqaga' : 'Назад',
    locked: lang === 'EN' ? 'Locked' : lang === 'KG' ? 'Кулпуланган' : lang === 'UZ' ? 'Yopiq' : 'Секрет'
  };

  return (
    <div style={{ width: '100%', maxWidth: '900px', textAlign: 'center', padding: '40px 20px' }}>
      <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.3)', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '20px' }}>
        🔙 {t.backBtn}
      </button>
      <h1 style={{ color: '#ffcc00', fontSize: '4rem', textShadow: '0 5px 15px rgba(0,0,0,0.5)', margin: 0 }}>🏆 {t.achievementsBtn}</h1>
      <div className="achievements-grid">
        {allAchievementsList.map(ach => {
          const isUnlocked = achievements.includes(ach.id);
          return (
            <div key={ach.id} className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
              <div className="ach-icon">{isUnlocked ? ach.icon : '🔒'}</div>
              <div className="ach-title">{isUnlocked ? ach.title : t.locked}</div>
              <div style={{ fontSize: '0.9rem', textAlign: 'center', opacity: isUnlocked ? 0.8 : 0.5 }}>{ach.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
