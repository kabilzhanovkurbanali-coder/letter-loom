import React from 'react';
import { themes } from '../data/themes';
import { uiText } from '../data/uiText';

export function SettingsScreen({
  lang,
  onClose,
  speechRate,
  setSpeechRate,
  toggleMusic,
  isMusicOn,
  musicVolume,
  onMusicVolumeChange,
  speechEngineStatus,
  speechRuntimeStatus,
  theme,
  setTheme,
  currentUser,
  handleResetProgress,
  handleLogout
}) {
  const text = uiText[lang] || uiText.RU;
  const settingsText = {
    EN: { themeLabel: 'Background theme', resetHint: 'Reset progress', logoutHint: 'Account', accountOnly: 'Available after sign in' },
    RU: { themeLabel: 'Фон', resetHint: 'Сброс прогресса', logoutHint: 'Аккаунт', accountOnly: 'Доступно после входа' },
    KG: { themeLabel: 'Фон', resetHint: 'Прогрессти тазалоо', logoutHint: 'Аккаунт', accountOnly: 'Киргенден кийин жеткиликтүү' },
    UZ: { themeLabel: 'Fon', resetHint: 'Progressni tozalash', logoutHint: 'Akkaunt', accountOnly: 'Kirgandan keyin ko`rinadi' }
  }[lang] || { themeLabel: 'Фон', resetHint: 'Сброс прогресса', logoutHint: 'Аккаунт', accountOnly: 'Доступно после входа' };

  const engineLabel = speechEngineStatus === 'NEURAL_AI'
    ? (text.speechEngineRemoteAi || 'Neural AI voice')
    : (text.speechEngineRemoteAi || 'Neural AI voice');
  const runtimeLabel = speechRuntimeStatus === 'LOCAL_AUDIO'
    ? text.speechRuntimeLocalAudio
    : speechRuntimeStatus === 'REMOTE_TTS'
      ? text.speechRuntimeRemoteTts
      : speechRuntimeStatus === 'BROWSER_VOICE'
        ? (text.speechRuntimeBrowserVoice || 'Browser voice fallback')
      : speechRuntimeStatus === 'REMOTE_ERROR'
          ? (text.speechRuntimeRemoteError || 'Remote error')
        : speechRuntimeStatus === 'UNAVAILABLE'
          ? text.speechRuntimeUnavailable
          : text.speechRuntimeIdle;

  return (
    <div style={{ width: '100%', maxWidth: '900px', padding: '32px 20px', color: 'white', textAlign: 'center' }}>
      <button onClick={onClose} style={backButtonStyle}>
        {text.back}
      </button>

      <h1 style={titleStyle}>{text.settings}</h1>

      <div style={panelStyle}>
        <div style={gridStyle}>
          <div style={{ ...fieldStyle, justifyContent: 'flex-end' }}>
            <span>{text.speechEngineLabel}</span>
            <div style={infoBoxStyle}>{engineLabel}</div>
            <span>{text.speechRuntimeLabel}</span>
            <div style={infoBoxStyle}>{runtimeLabel}</div>
          </div>

          <label style={fieldStyle}>
            <span>{text.speedLabel}</span>
            <select value={speechRate} onChange={(e) => setSpeechRate(e.target.value)} style={selectStyle}>
              <option value="SLOW">{text.speedSlow}</option>
              <option value="NORMAL">{text.speedNormal}</option>
              <option value="FAST">{text.speedFast}</option>
            </select>
          </label>

          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button onClick={toggleMusic} style={toggleButtonStyle}>
              🎵 {isMusicOn ? text.musicOn : text.musicOff}
            </button>
          </div>

          <label style={fieldStyle}>
            <span>{text.volumeLabel}: {musicVolume}%</span>
            <input type="range" min="0" max="100" value={musicVolume} onChange={(e) => onMusicVolumeChange(Number(e.target.value))} />
          </label>
        </div>

        <div style={dividerStyle} />

        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>{settingsText.themeLabel}</div>
          <div style={themeRowStyle}>
            {Object.keys(themes).map((themeKey) => (
              <button
                key={themeKey}
                type="button"
                aria-label={themes[themeKey].name}
                onClick={() => setTheme(themeKey)}
                style={{
                  ...themeDotStyle,
                  background: themes[themeKey].bg,
                  ...(theme === themeKey ? activeThemeDotStyle : null)
                }}
              />
            ))}
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>{settingsText.resetHint}</div>
          {currentUser ? (
            <button type="button" onClick={handleResetProgress} style={resetButtonStyle}>
              {text.reset}
            </button>
          ) : (
            <div style={mutedInfoStyle}>{settingsText.accountOnly}</div>
          )}
        </div>

        {currentUser ? (
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>{settingsText.logoutHint}</div>
            <button type="button" onClick={handleLogout} style={logoutButtonStyle}>
              🔐 {text.logout}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const backButtonStyle = {
  background: 'rgba(255,255,255,0.25)',
  color: 'white',
  border: 'none',
  padding: '12px 24px',
  borderRadius: '16px',
  cursor: 'pointer',
  fontWeight: 'bold',
  marginBottom: '18px'
};

const titleStyle = {
  marginTop: 0,
  fontSize: '3rem',
  color: '#ffcc00',
  textShadow: '0 4px 12px rgba(0,0,0,0.35)'
};

const panelStyle = {
  background: 'rgba(255,255,255,0.14)',
  border: '2px solid rgba(255,255,255,0.22)',
  borderRadius: '28px',
  padding: '24px',
  color: 'white',
  boxShadow: '0 18px 36px rgba(0,0,0,0.18)'
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '16px'
};

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  textAlign: 'left'
};

const selectStyle = {
  padding: '12px',
  borderRadius: '14px',
  border: 'none'
};

const infoBoxStyle = {
  minHeight: '46px',
  display: 'flex',
  alignItems: 'center',
  padding: '12px 14px',
  borderRadius: '14px',
  background: 'rgba(255,255,255,0.14)',
  border: '1px solid rgba(255,255,255,0.18)'
};

const toggleButtonStyle = {
  width: '100%',
  padding: '14px 18px',
  borderRadius: '16px',
  border: '3px solid white',
  background: 'rgba(255,255,255,0.16)',
  color: 'white',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontSize: '1rem'
};

const dividerStyle = {
  height: '1px',
  margin: '24px 0',
  background: 'rgba(255,255,255,0.18)'
};

const sectionStyle = {
  textAlign: 'left'
};

const sectionTitleStyle = {
  marginBottom: '14px',
  fontSize: '1.05rem',
  fontWeight: 'bold'
};

const themeRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '14px'
};

const themeDotStyle = {
  width: '62px',
  height: '62px',
  borderRadius: '999px',
  border: '5px solid rgba(255,255,255,0.92)',
  boxShadow: '0 8px 18px rgba(0, 0, 0, 0.16)',
  cursor: 'pointer'
};

const activeThemeDotStyle = {
  borderColor: '#ffc700',
  boxShadow: '0 0 0 4px rgba(255, 199, 0, 0.25), 0 8px 18px rgba(0, 0, 0, 0.16)'
};

const resetButtonStyle = {
  padding: '14px 22px',
  borderRadius: '18px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 'bold',
  color: 'white',
  background: 'linear-gradient(180deg, #3d556f 0%, #334b64 100%)',
  boxShadow: '0 8px 0 #22313f'
};

const logoutButtonStyle = {
  padding: '14px 22px',
  borderRadius: '18px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 'bold',
  color: 'white',
  background: 'linear-gradient(180deg, #3291f8 0%, #2784eb 100%)',
  boxShadow: '0 8px 0 #145fbd'
};

const mutedInfoStyle = {
  display: 'inline-flex',
  padding: '12px 16px',
  borderRadius: '16px',
  background: 'rgba(255,255,255,0.12)',
  color: 'rgba(255,255,255,0.78)'
};
