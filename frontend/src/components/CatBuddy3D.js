import React, { useEffect, useMemo, useRef, useState } from 'react';

const MODEL_SOURCES = ['/models/cat.glb', '/models/cat/cat.glb'];
const MODEL_VIEWER_URL = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';

let modelViewerLoadPromise = null;

const ensureModelViewer = () => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.customElements?.get('model-viewer')) return Promise.resolve(true);
  if (modelViewerLoadPromise) return modelViewerLoadPromise;

  modelViewerLoadPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = MODEL_VIEWER_URL;
    script.async = true;
    script.onload = () => resolve(Boolean(window.customElements?.get('model-viewer')));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return modelViewerLoadPromise;
};

const pickAnimation = ({ speaking, mood }) => {
  if (speaking) return 'meow';
  if (mood === 'thinking' || mood === 'static') return 'rest1';
  return 'idle';
};

export function CatBuddy3D({ mood = 'happy', speaking = false, className = '' }) {
  const [isReady, setIsReady] = useState(false);
  const [activeSourceIndex, setActiveSourceIndex] = useState(0);
  const viewerRef = useRef(null);
  const currentSrc = MODEL_SOURCES[activeSourceIndex];

  useEffect(() => {
    let isMounted = true;
    ensureModelViewer().then((ready) => {
      if (isMounted) setIsReady(ready);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady || !viewerRef.current) return undefined;
    const viewer = viewerRef.current;
    const onError = () => {
      setActiveSourceIndex((index) => {
        if (index + 1 < MODEL_SOURCES.length) return index + 1;
        return index;
      });
    };
    viewer.addEventListener('error', onError);
    return () => viewer.removeEventListener('error', onError);
  }, [isReady]);

  const animationName = useMemo(
    () => pickAnimation({ speaking, mood }),
    [speaking, mood]
  );

  if (!isReady) {
    return null;
  }

  return (
    <div className={`cat-buddy-3d ${className}`.trim()} aria-hidden="true">
      <model-viewer
        ref={viewerRef}
        src={currentSrc}
        disable-zoom
        interaction-prompt="none"
        shadow-intensity="0.8"
        camera-orbit={speaking ? '0deg 78deg 0.45m' : '0deg 78deg 0.5m'}
        min-camera-orbit="0deg 74deg 0.42m"
        max-camera-orbit="0deg 84deg 0.56m"
        field-of-view="18deg"
        environment-image="neutral"
        exposure="1.05"
        autoplay
        animation-name={animationName}
      />
    </div>
  );
}
