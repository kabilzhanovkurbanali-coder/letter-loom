import React from 'react';

export function Mascot({ mood }) {
  const isCompact = typeof window !== 'undefined' && window.innerWidth <= 768;
  const src = mood === 'happy' 
    ? "https://cdn-icons-png.flaticon.com/512/4712/4712109.png" 
    : "https://cdn-icons-png.flaticon.com/512/4712/4712009.png";
    
  return (
    <div 
      className={mood === 'happy' ? "bounce-animation" : ""} 
      style={{ position: 'fixed', bottom: isCompact ? '12px' : '20px', right: isCompact ? '10px' : '20px', width: isCompact ? '82px' : '120px', zIndex: 50 }}
    >
      <img src={src} alt="Panda" style={{ width: '100%' }} />
    </div>
  );
}
