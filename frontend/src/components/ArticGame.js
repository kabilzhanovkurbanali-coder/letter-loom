import React, { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { GameBoard, GameShell, NextButton } from './GameShell';
import { IrbiFace } from './IrbiFace';
import { pictureUrl } from '../lib/api';
import { isLevelLocked, readActivityLevel, readStats, recordSession, recordTask, writeActivityLevel } from '../lib/progress';
import { sfxClick, sfxNote, sfxPlace, sfxTada } from '../lib/sfx';
import { LABEL_KEYS, sayPhrase, textPhrases, wordPhrase } from '../lib/voicePack';
import './ArticGame.css';

// Mouth and tongue exercises the way speech therapists do them with preschoolers:
// Irbi shows the movement, then the child does it together with Irbi while they count to five.
// Nothing is checked, so nothing can go wrong. The optional mirror shows the child's own face
// from the front camera; the picture never leaves the screen and is never recorded.
const ACTIVITY_ID = 'artic:GYM';
const SESSION_SIZE = 4;
const COUNT_MS = 1150;

// kind: hold (keep one pose), alternate (switch between poses on every count), click (pony clicks)
export const EXERCISES = [
  { id: 'smile', level: 1, kind: 'hold', poses: ['smile'], icon: 'frog' },
  { id: 'tube', level: 1, kind: 'hold', poses: ['tube'], icon: 'elephant' },
  { id: 'open', level: 1, kind: 'hold', poses: ['open'], icon: 'window' },
  { id: 'cheeks', level: 1, kind: 'hold', poses: ['cheeks'], icon: 'balloon' },
  { id: 'spatula', level: 2, kind: 'hold', poses: ['spatula'], icon: 'spoon' },
  { id: 'needle', level: 2, kind: 'hold', poses: ['needle'], icon: 'pencil' },
  { id: 'frogTube', level: 2, kind: 'alternate', poses: ['smile', 'tube'], icon: 'frog' },
  { id: 'candy', level: 2, kind: 'alternate', poses: ['candyLeft', 'candyRight'], icon: 'chocolate' },
  { id: 'clock', level: 3, kind: 'alternate', poses: ['tongueLeft', 'tongueRight'], icon: 'clock' },
  { id: 'swing', level: 3, kind: 'alternate', poses: ['tongueUp', 'tongueDown'], icon: 'kite' },
  { id: 'jam', level: 3, kind: 'hold', poses: ['jam'], icon: 'strawberry' },
  { id: 'horse', level: 3, kind: 'click', poses: ['clickUp', 'clickDown'], icon: 'horse' }
];

const TEXT = {
  EN: {
    start: 'Do it like Irbi!', together: 'Now together!', count: ['one', 'two', 'three', 'four', 'five'],
    mirror: 'Mirror', mirrorOn: 'Look at yourself in the mirror', sessionDone: 'Hooray! Your tongue did its exercises!',
    next: 'Next', more: 'More', menu: 'Menu', listen: 'Show again', home: 'Home',
    praise: ['Great job!', 'Well done!', 'Amazing!', 'You did it!', 'Super!'],
    names: {
      smile: 'Froggy', tube: 'Elephant', open: 'Window', cheeks: 'Balloon', spatula: 'Spatula', needle: 'Needle',
      frogTube: 'Froggy and elephant', candy: 'Candy', clock: 'Clock', swing: 'Swing', jam: 'Yummy jam', horse: 'Pony'
    },
    how: {
      smile: 'Smile wide, so we can see your teeth', tube: 'Push your lips forward like a little trunk',
      open: 'Open your mouth wide', cheeks: 'Puff up your cheeks like a balloon',
      spatula: 'Open your mouth and rest your wide tongue on your lower lip', needle: 'Stick out your tongue thin and pointy, like a needle',
      frogTube: 'Smile, then push your lips into a trunk. And again!', candy: 'Push your tongue into one cheek, as if there were a candy. Now the other cheek!',
      clock: 'Open your mouth and move your tongue left and right: tick-tock', swing: 'Lift your tongue up towards your nose, then down towards your chin',
      jam: 'Lick your upper lip, as if there were jam on it', horse: 'Click your tongue like a pony’s hooves'
    }
  },
  RU: {
    start: 'Делай, как Ирби!', together: 'Теперь вместе!', count: ['раз', 'два', 'три', 'четыре', 'пять'],
    mirror: 'Зеркало', mirrorOn: 'Посмотри на себя в зеркало', sessionDone: 'Ура! Язычок сделал зарядку!',
    next: 'Дальше', more: 'Ещё', menu: 'Меню', listen: 'Показать ещё', home: 'Домой',
    praise: ['Молодец!', 'Отлично!', 'Умница!', 'Здорово!', 'Супер!'],
    names: {
      smile: 'Лягушка', tube: 'Слоник', open: 'Окошко', cheeks: 'Шарик', spatula: 'Лопаточка', needle: 'Иголочка',
      frogTube: 'Лягушка и слоник', candy: 'Конфетка', clock: 'Часики', swing: 'Качели', jam: 'Вкусное варенье', horse: 'Лошадка'
    },
    how: {
      smile: 'Улыбнись широко-широко, чтобы были видны зубки', tube: 'Вытяни губы вперёд трубочкой, как хоботок',
      open: 'Открой рот широко-широко', cheeks: 'Надуй щёки, как воздушный шарик',
      spatula: 'Открой рот и положи широкий язык на нижнюю губу', needle: 'Высунь язык узко-узко, как иголочку',
      frogTube: 'Улыбнись, а потом вытяни губы трубочкой. И снова!', candy: 'Упрись языком в щёку, будто там конфетка. Теперь в другую!',
      clock: 'Открой рот и води язычком вправо-влево, как часики: тик-так', swing: 'Поднимай язык вверх к носику, а потом вниз к подбородку',
      jam: 'Оближи верхнюю губу язычком, будто там варенье', horse: 'Пощёлкай язычком, как лошадка цокает копытами'
    }
  },
  KG: {
    start: 'Ирбидей жаса!', together: 'Эми чогуу!', count: ['бир', 'эки', 'үч', 'төрт', 'беш'],
    mirror: 'Күзгү', mirrorOn: 'Күзгүдөн өзүңдү кара', sessionDone: 'Ура! Тилиң көнүгүү жасады!',
    next: 'Кийинки', more: 'Дагы', menu: 'Меню', listen: 'Дагы көрсөт', home: 'Үйгө',
    praise: ['Азамат!', 'Мыкты!', 'Сонун!', 'Баракелде!', 'Жарайсың!'],
    names: {
      smile: 'Бака', tube: 'Пил', open: 'Терезе', cheeks: 'Шар', spatula: 'Күрөкчө', needle: 'Ийне',
      frogTube: 'Бака жана пил', candy: 'Момпосуй', clock: 'Саат', swing: 'Селкинчек', jam: 'Таттуу кыям', horse: 'Ат'
    },
    how: {
      smile: 'Кенен жылмай, тиштериң көрүнсүн', tube: 'Эриндериңди түтүкчө кылып алдыга чоз',
      open: 'Оозуңду кенен ач', cheeks: 'Жаагыңды шардай толтуруп үйлө',
      spatula: 'Оозуңду ачып, жалпак тилиңди астыңкы эриниңе кой', needle: 'Тилиңди ийнедей ичке кылып чыгар',
      frogTube: 'Жылмай, анан эриндериңди түтүкчө кыл. Дагы бир жолу!', candy: 'Тилиң менен жаагыңды түрт, ичинде момпосуй бардай. Эми башка жаагыңды!',
      clock: 'Оозуңду ачып, тилиңди оңго-солго жылдыр, сааттай: тик-так', swing: 'Тилиңди мурдуңа карай өйдө, анан ээгиңе карай ылдый кыл',
      jam: 'Үстүңкү эриниңди тилиң менен жала, ал жерде кыям бардай', horse: 'Тилиң менен аттын туягындай тык-тык этип чыкылдат'
    }
  },
  UZ: {
    start: 'Irbidek qil!', together: 'Endi birga!', count: ['bir', 'ikki', 'uch', 'to‘rt', 'besh'],
    mirror: 'Ko‘zgu', mirrorOn: 'Ko‘zguda o‘zingga qara', sessionDone: 'Ura! Tiling mashq qildi!',
    next: 'Keyingi', more: 'Yana', menu: 'Menyu', listen: 'Yana ko‘rsat', home: 'Uyga',
    praise: ['Barakalla!', 'Zo‘r!', 'Ajoyib!', 'Ofarin!', 'Qoyil!'],
    names: {
      smile: 'Qurbaqa', tube: 'Filcha', open: 'Deraza', cheeks: 'Shar', spatula: 'Kurakcha', needle: 'Igna',
      frogTube: 'Qurbaqa va filcha', candy: 'Konfet', clock: 'Soat', swing: 'Arg‘imchoq', jam: 'Shirin murabbo', horse: 'Otcha'
    },
    how: {
      smile: 'Keng-keng jilmay, tishlaring ko‘rinsin', tube: 'Lablaringni naycha qilib oldinga cho‘z',
      open: 'Og‘zingni katta-katta och', cheeks: 'Lunjlaringni shardek shishir',
      spatula: 'Og‘zingni ochib, keng tilingni pastki labingga qo‘y', needle: 'Tilingni ignadek ingichka qilib chiqar',
      frogTube: 'Jilmay, keyin lablaringni naycha qil. Yana bir bor!', candy: 'Tiling bilan lunjingni itar, go‘yo u yerda konfet bor. Endi boshqa lunjingni!',
      clock: 'Og‘zingni ochib, tilingni o‘ngga-chapga yurgiz, soatdek: tik-tak', swing: 'Tilingni burningga qarab tepaga, keyin iyagingga qarab pastga tushir',
      jam: 'Ustki labingni tiling bilan yala, go‘yo u yerda murabbo bor', horse: 'Tiling bilan otning tuyog‘idek taq-taq qil'
    }
  }
};

const pick = (items) => items[Math.floor(Math.random() * items.length)];
const shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// Level 1 is all lip and cheek exercises; later levels warm up with an easier one first.
export const buildArticSession = (level) => {
  const current = EXERCISES.filter((item) => item.level === level);
  if (level === 1) return shuffle(current).slice(0, SESSION_SIZE);
  const warmUp = pick(EXERCISES.filter((item) => item.level < level));
  return [warmUp, ...shuffle(current).slice(0, SESSION_SIZE - 1)];
};

export const exercisePhrase = (lang, exercise) => {
  const t = TEXT[lang] || TEXT.RU;
  return `${t.names[exercise.id]}! ${t.how[exercise.id]}`;
};

const canUseCamera = () => typeof window !== 'undefined'
  && window.isSecureContext !== false
  && Boolean(navigator.mediaDevices?.getUserMedia);

export function ArticGame({ lang, userKey, speakText, prefetchSpeech, onSessionComplete, onExit }) {
  const t = TEXT[lang] || TEXT.RU;
  const [level] = useState(() => readActivityLevel(userKey, ACTIVITY_ID));
  const [session, setSession] = useState(() => buildArticSession(level));
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('show');
  const [pose, setPose] = useState('rest');
  const [counted, setCounted] = useState(0);
  const [wins, setWins] = useState(0);
  const [showSession, setShowSession] = useState(false);
  const [bubble, setBubble] = useState('');
  const [mirrorOn, setMirrorOn] = useState(false);
  const [mirrorBroken, setMirrorBroken] = useState(false);
  const timersRef = useRef([]);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const exercise = session[index];

  const later = useCallback((fn, ms) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const say = useCallback((phrase) => {
    if (!phrase) return;
    setBubble(phrase);
    speakText?.(phrase, { interrupt: true });
  }, [speakText]);

  const stopMirror = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setMirrorOn(false);
  }, []);

  useEffect(() => () => {
    clearTimers();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, [clearTimers]);

  // the stream is attached once the video element is on screen
  useEffect(() => {
    if (!mirrorOn || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play?.().catch(() => {});
  }, [mirrorOn]);

  const toggleMirror = async () => {
    if (mirrorOn) {
      stopMirror();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      streamRef.current = stream;
      setMirrorOn(true);
      speakText?.(t.mirrorOn, { interrupt: true });
    } catch {
      setMirrorBroken(true);
    }
  };

  // Irbi shows the movement while naming it, then they do it together and count to five.
  const runExercise = useCallback((item) => {
    clearTimers();
    setPhase('show');
    setCounted(0);
    setPose('rest');
    const phrase = exercisePhrase(lang, item);
    say(phrase);
    const showMs = Math.max(3600, 700 + phrase.length * 62);
    const demoStep = item.kind === 'hold' ? 0 : 850;
    if (demoStep) {
      for (let at = 500, step = 0; at < showMs - 300; at += demoStep, step += 1) {
        const next = item.poses[step % item.poses.length];
        later(() => {
          setPose(next);
          if (item.kind === 'click' && next === 'clickDown') sfxClick();
        }, at);
      }
    } else {
      later(() => setPose(item.poses[0]), 500);
    }

    later(() => {
      setPhase('together');
      setPose(item.kind === 'hold' ? item.poses[0] : 'rest');
      say(t.together);
    }, showMs);
    const countStart = showMs + 1300;
    t.count.forEach((word, step) => {
      later(() => {
        setCounted(step + 1);
        sfxNote(step * 2);
        speakText?.(word, { interrupt: true });
        if (item.kind === 'alternate') setPose(item.poses[step % 2]);
        if (item.kind === 'click') {
          setPose('clickUp');
          later(() => {
            setPose('clickDown');
            sfxClick();
          }, 380);
        }
      }, countStart + step * COUNT_MS);
    });
    later(() => {
      setPhase('done');
      setPose('rest');
      recordTask(userKey, ACTIVITY_ID, true);
      sfxPlace(item.id, true);
      later(() => sfxTada(), 250);
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.45 }, disableForReducedMotion: true });
      say(pick(t.praise));
      setWins((value) => value + 1);
    }, countStart + t.count.length * COUNT_MS + 500);
  }, [clearTimers, lang, later, say, speakText, t, userKey]);

  useEffect(() => {
    if (!exercise) return undefined;
    const startAt = index === 0 ? 1600 : 200;
    if (index === 0) say(t.start);
    later(() => runExercise(exercise), startAt);
    const following = session[index + 1];
    if (following) prefetchSpeech?.(exercisePhrase(lang, following));
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, session]);

  const goNext = () => {
    if (index + 1 >= session.length) {
      setShowSession(true);
      recordSession(userKey, ACTIVITY_ID);
      // a new set of exercises every two finished sessions, unless the teacher fixed the level
      const sessions = readStats(userKey).activities[ACTIVITY_ID]?.sessions || 0;
      if (!isLevelLocked(userKey) && level < 3 && sessions % 2 === 0) writeActivityLevel(userKey, ACTIVITY_ID, level + 1);
      sfxTada();
      confetti({ particleCount: 160, spread: 100, origin: { y: 0.55 }, disableForReducedMotion: true });
      say(t.sessionDone);
      onSessionComplete?.({ activity: 'GYM' });
      return;
    }
    setIndex((value) => value + 1);
  };

  const startNewSession = () => {
    setShowSession(false);
    setWins(0);
    setIndex(0);
    setSession(buildArticSession(readActivityLevel(userKey, ACTIVITY_ID)));
  };

  const showAgain = () => {
    if (exercise && phase !== 'together') runExercise(exercise);
  };

  const exit = () => {
    stopMirror();
    onExit?.();
  };

  const shellProps = {
    className: 'ag',
    stars: wins,
    totalStars: session.length,
    labels: { home: t.home, listen: t.listen },
    onExit: exit,
    onListen: showAgain,
    bubble,
    irbiMood: phase === 'done' ? 'cheer' : 'idle',
    onIrbiTap: showAgain,
    session: {
      open: showSession,
      title: t.sessionDone,
      pictures: session.map((item) => pictureUrl(item.icon)),
      moreLabel: t.more,
      menuLabel: t.menu,
      onMore: startNewSession,
      onMenu: exit
    }
  };

  if (!exercise) return <GameShell {...shellProps} />;

  return (
    <GameShell {...shellProps}>
      <GameBoard icon="tongue" className="ag-board" data-exercise={exercise.id} data-phase={phase}>
        <div className={`ag-stage ${mirrorOn ? 'has-mirror' : ''}`}>
          <button type="button" className="ag-face" onClick={showAgain} aria-label={t.listen}>
            <IrbiFace pose={pose} happy={phase === 'done'} />
          </button>
          {mirrorOn ? (
            <div className="ag-mirror">
              <video ref={videoRef} autoPlay muted playsInline />
            </div>
          ) : null}
        </div>

        <div className="ag-label">
          <img src={pictureUrl(exercise.icon)} alt="" draggable="false" />
          <div>
            <div className="ag-name">{t.names[exercise.id]}</div>
            <div className="ag-how">{t.how[exercise.id]}</div>
          </div>
        </div>

        <div className="ag-count" aria-hidden="true">
          {t.count.map((word, step) => (
            <span key={word} className={step < counted ? 'is-on' : ''}>{step + 1}</span>
          ))}
        </div>

        {canUseCamera() && !mirrorBroken ? (
          <button type="button" className={`ag-mirror-btn ${mirrorOn ? 'is-on' : ''}`} onClick={toggleMirror} aria-pressed={mirrorOn}>
            <img src={pictureUrl('mirror')} alt="" />
            <span>{t.mirror}</span>
          </button>
        ) : null}
      </GameBoard>

      {phase === 'done' && !showSession ? <NextButton onClick={goNext}>{t.next}</NextButton> : null}
    </GameShell>
  );
}

// Everything the exercises say in `lang`, for the offline voice pack.
export const voicePhrases = (lang) => {
  const t = TEXT[lang] || TEXT.RU;
  return [
    ...textPhrases(t, [...LABEL_KEYS, 'mirror', 'count']),
    ...EXERCISES.map((item) => sayPhrase(exercisePhrase(lang, item))),
    ...t.count.map((word) => wordPhrase(word))
  ];
};
