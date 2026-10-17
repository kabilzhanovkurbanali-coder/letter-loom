import React from 'react';
import { Irbi } from './Irbi';
import { ValleyScene } from './ValleyScene';
import { pictureUrl } from '../lib/api';
import './GameShell.css';

// Shared frame for every mini-game: valley background, top bar with home / session stars /
// replay, Irbi with a speech bubble, and the end-of-session celebration.
export function GameShell({
  className = '',
  stars = 0,
  totalStars = 5,
  labels = {},
  onExit,
  onListen,
  bubble,
  irbiMood = 'idle',
  onIrbiTap,
  session,
  children
}) {
  return (
    <div className={`gs ${className}`.trim()}>
      <ValleyScene />
      <div className="gs-veil" aria-hidden="true" />

      <header className="gs-top">
        <button type="button" className="gs-round-btn" onClick={onExit} aria-label={labels.home} title={labels.home}>
          <img src={pictureUrl('house')} alt="" />
        </button>
        <div className="gs-stars" aria-label={`${stars} / ${totalStars}`}>
          {Array.from({ length: totalStars }, (_, index) => (
            <span key={index} className={`gs-star ${index < stars ? 'is-on' : ''}`}>
              <img src={pictureUrl('star')} alt="" />
            </span>
          ))}
        </div>
        {onListen ? (
          <button type="button" className="gs-round-btn" onClick={onListen} aria-label={labels.listen} title={labels.listen}>
            <img src={pictureUrl('speaker')} alt="" />
          </button>
        ) : <span className="gs-round-spacer" />}
      </header>

      <main className="gs-main">{children}</main>

      <aside className="gs-guide">
        {bubble ? (
          <button type="button" className="gs-bubble" key={bubble} onClick={onIrbiTap}>{bubble}</button>
        ) : null}
        <button type="button" className="gs-guide-irbi" onClick={onIrbiTap} aria-label="Irbi">
          <Irbi mood={irbiMood} size={180} />
        </button>
      </aside>

      {session?.open ? (
        <div className="gs-session">
          <div className="gs-session-card">
            <span className="gs-session-rays" aria-hidden="true" />
            <Irbi mood="cheer" size={170} />
            <h2 className="gs-session-title">{session.title}</h2>
            <div className="gs-session-pics">
              {(session.pictures || []).map((src, index) => (
                <img key={`${src}-${index}`} src={src} alt="" style={{ '--i': index }} />
              ))}
            </div>
            <div className="gs-session-actions">
              <button type="button" className="gs-next" onClick={session.onMore}>{session.moreLabel}</button>
              <button type="button" className="gs-secondary" onClick={session.onMenu}>{session.menuLabel}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Board: the cream card with a rainbow ribbon and a round activity badge on top.
export function GameBoard({ icon, className = '', children, ...rest }) {
  return (
    <section className={`gs-board ${className}`.trim()} {...rest}>
      {icon ? (
        <span className="gs-board-badge" aria-hidden="true">
          <img src={pictureUrl(icon)} alt="" />
        </span>
      ) : null}
      {children}
    </section>
  );
}

export function NextButton({ children, onClick }) {
  return (
    <button type="button" className="gs-next" onClick={onClick}>
      {children}
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.2-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor" /></svg>
    </button>
  );
}
