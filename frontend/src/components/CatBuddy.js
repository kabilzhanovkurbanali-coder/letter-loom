import React from 'react';

const sizeMap = {
  sm: 48,
  md: 76,
  lg: 102
};

export function CatBuddy({ size = 'md', mood = 'happy', speaking = false, className = '' }) {
  const dimension = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`cat-buddy cat-buddy-${mood} ${speaking ? 'cat-buddy-speaking' : ''} ${className}`.trim()}
      style={{ '--cat-size': `${dimension}px` }}
      aria-hidden="true"
    >
      <div className="cat-buddy-shadow" />
      <div className="cat-buddy-tail" />
      <div className="cat-buddy-body">
        <div className="cat-buddy-chest" />
        <div className="cat-buddy-paw cat-buddy-paw-left" />
        <div className="cat-buddy-paw cat-buddy-paw-right" />
      </div>
      <div className="cat-buddy-collar" />
      <div className="cat-buddy-head">
        <div className="cat-buddy-ear cat-buddy-ear-left">
          <div className="cat-buddy-ear-inner" />
        </div>
        <div className="cat-buddy-ear cat-buddy-ear-right">
          <div className="cat-buddy-ear-inner" />
        </div>
        <div className="cat-buddy-forehead" />
        <div className="cat-buddy-eye cat-buddy-eye-left">
          <div className="cat-buddy-pupil" />
        </div>
        <div className="cat-buddy-eye cat-buddy-eye-right">
          <div className="cat-buddy-pupil" />
        </div>
        <div className="cat-buddy-blush cat-buddy-blush-left" />
        <div className="cat-buddy-blush cat-buddy-blush-right" />
        <div className="cat-buddy-snout">
          <div className="cat-buddy-nose" />
          <div className="cat-buddy-mouth" />
        </div>
        <div className="cat-buddy-whisker cat-buddy-whisker-left cat-buddy-whisker-top" />
        <div className="cat-buddy-whisker cat-buddy-whisker-left cat-buddy-whisker-bottom" />
        <div className="cat-buddy-whisker cat-buddy-whisker-right cat-buddy-whisker-top" />
        <div className="cat-buddy-whisker cat-buddy-whisker-right cat-buddy-whisker-bottom" />
      </div>
    </div>
  );
}
