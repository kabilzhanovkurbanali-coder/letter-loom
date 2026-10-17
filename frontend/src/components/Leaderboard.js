import React from 'react';
import { uiText } from '../data/uiText';

export function Leaderboard({ leaderboard, onClose, lang = 'RU' }) {
  const text = uiText[lang] || uiText.RU;
  return (
    <div style={{ width: '100%', maxWidth: '600px', textAlign: 'center', padding: '40px 20px', color: 'white' }}>
      <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.3)', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px' }}>
        🔙 {text.back}
      </button>
      <h1 style={{ color: '#ffcc00', fontSize: '3.5rem', textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>👑 {text.topPlayers}</h1>
      
      <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '20px', padding: '20px' }}>
        {leaderboard.length === 0 ? <p>{text.noLeaders}</p> : null}
        {leaderboard.map((user, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '1.2rem' }}>
            <span style={{ fontWeight: 'bold' }}>
              {idx === 0 ? '🥇 ' : idx === 1 ? '🥈 ' : idx === 2 ? '🥉 ' : `${idx + 1}. `} 
              {user.username}
            </span>
            <span style={{ color: '#ffcc00', fontWeight: 'bold' }}>{user.score} {text.points}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
