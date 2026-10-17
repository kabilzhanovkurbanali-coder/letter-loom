import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DndContext, MouseSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import confetti from 'canvas-confetti';
import { Irbi } from './Irbi';

const MATH_MODE_ORDER = ['COUNT_FRUITS', 'FEED_MONSTER', 'BIGGER_NUMBER', 'MATCH_PAIR', 'MISSING_NUMBER'];
const VISUAL_SET = ['🍎', '🍐', '🍌', '🍊', '🍒', '🍇', '🥕', '⭐', '⚽', '🧸'];
const NUM_GRADIENTS = [
  ['#ff6b6b','#feca57'],['#ff9f43','#ffd166'],['#48dbfb','#74b9ff'],['#1dd1a1','#00b894'],
  ['#a29bfe','#6c5ce7'],['#fd79a8','#e84393'],['#00d2d3','#01abc7'],['#e17055','#fdcb6e'],
  ['#55efc4','#00cec9'],['#f9ca24','#f0932b'],['#6c5ce7','#a29bfe'],['#00b894','#55efc4'],
  ['#e84393','#fd79a8'],['#0984e3','#74b9ff'],['#fdcb6e','#e17055'],['#81ecec','#00cec9'],
  ['#a29bfe','#6c5ce7'],['#55efc4','#00b894'],['#fab1a0','#e17055'],['#74b9ff','#0984e3'],['#ffd166','#ff9f43']
];
const NUM_DOTS = ['🍎','🍊','🍋','🍇','🍓','🍒','🌸','⭐','🎈','🦋'];

const mathText = {
  EN: {
    title: 'Monster Math Adventure',
    subtitle: 'Help friends, open chests, and collect rewards.',
    home: 'Back',
    progress: 'Adventure',
    chest: 'Chest in',
    solved: 'Solved',
    collection: 'Collection',
    streak: 'Streak',
    rewardUnlocked: 'Unlocked',
    mission: 'Mission',
    coach: 'Cat Helper',
    innovation: 'Innovation',
    focus: 'Focus',
    mastered: 'Mastered',
    support: 'Support',
    confidence: 'Confidence',
    hint: 'Hint',
    showHint: 'Ask Cat',
    hideHint: 'Hide hint',
    tapHint: 'You can drag or tap a number.',
    numberLine: 'Number line',
    adaptiveTitle: 'Adaptive path',
    adaptiveBody: 'The game quietly changes difficulty and hints based on the child.',
    numberSenseTitle: 'Number sense',
    numberSenseBody: 'Each round mixes objects, symbols, and movement so kids feel the math.',
    missionTitle: 'Purposeful play',
    missionBody: 'Every task feels like a mini quest instead of a cold worksheet.',
    startHint: 'The first rounds are extra easy so kids feel success immediately.',
    correct: 'Awesome!',
    wrong: 'Almost. Try once more!',
    continue: 'Continue',
    finish: 'Finish adventure',
    countTitle: 'Count the fruit baskets',
    countPrompt: 'How many items are there together?',
    feedTitle: 'Feed the little monster',
    feedPrompt: 'Choose the snack count the monster wants.',
    biggerTitle: 'Find the bigger number',
    biggerPrompt: 'Tap the bigger group.',
    matchTitle: 'Match the pair',
    matchPrompt: 'Find the card with the same number.',
    speedTitle: 'Quick answer',
    speedPrompt: 'Pick the answer before the rocket cools down.',
    chestReady: 'Chest is ready!',
    helperCount: 'Count every fruit and say the numbers out loud.',
    dragHint: 'Drag the correct number into the answer box.',
    helperFeed: 'The monster is hungry for exactly this many treats.',
    helperBigger: 'The shiny group hides the bigger number.',
    helperMatch: 'One card shows the answer. Tap its twin.',
    helperSpeed: 'Fast rounds give quick wins and bright reactions.',
    rewardSticker: 'Sticker',
    rewardBuddy: 'Buddy',
    rewardTheme: 'Theme',
    rewardMedal: 'Medal',
    collectionTitle: 'Adventure Collection',
    collectionEmpty: 'Play a little to unlock your first reward.',
    countMission: 'Build the answer bridge.',
    feedMission: 'Feed the monster exactly the right amount.',
    biggerMission: 'Spot the stronger team.',
    matchMission: 'Find the hidden twin.',
    speedMission: 'Launch the rocket with the fastest answer.',
    coachCalm: 'Let us start softly. Look at the first part.',
    coachHot: 'Nice work. Just one more step.',
    coachRecover: 'That is okay. Cat will show where to begin.',
    coachPerfect: 'Wow. You are counting with confidence now.',
    coachTryAgain: 'We can try again slowly together.',
    hintCount: 'Count the groups, then choose the total.',
    hintFeed: 'The monster wants exactly this number of treats.',
    hintBigger: 'Compare both sides and choose the bigger one.',
    hintMatch: 'Look for the same number again.',
    hintSpeed: 'Add both numbers quickly, then tap or drag the answer.',
    missingTitle: 'Find the hiding number',
    missingPrompt: 'What number is hiding in the box?',
    helperMissing: 'Count the total, then take away the known part.',
    hintMissing: 'Missing = total − first group.',
    missingMission: 'Rescue the hidden number.',
    rewardTypes: {
      sticker: 'Sticker',
      buddy: 'Buddy',
      background: 'Background',
      medal: 'Medal'
    }
  },
  RU: {
    title: 'Математическое приключение',
    subtitle: 'Помогай героям, открывай сундуки и собирай награды.',
    home: 'Назад',
    progress: 'Приключение',
    chest: 'Сундук через',
    solved: 'Решено',
    collection: 'Коллекция',
    streak: 'Серия',
    rewardUnlocked: 'Открыто',
    mission: 'Миссия',
    coach: 'Котик-помощник',
    innovation: 'Инновация',
    focus: 'Фокус',
    mastered: 'Освоено',
    support: 'Поддержка',
    confidence: 'Уверенность',
    hint: 'Подсказка',
    showHint: 'Попросить котика',
    hideHint: 'Спрятать подсказку',
    tapHint: 'Можно перетянуть цифру или просто нажать на неё.',
    numberLine: 'Числовая дорожка',
    adaptiveTitle: 'Адаптивный путь',
    adaptiveBody: 'Игра сама меняет сложность и подсказки под ребёнка.',
    numberSenseTitle: 'Живое понимание числа',
    numberSenseBody: 'В каждом раунде соединяются предметы, цифры и движение.',
    missionTitle: 'Игра с целью',
    missionBody: 'Каждое задание ощущается как маленькая миссия, а не сухой пример.',
    startHint: 'Первые задания очень лёгкие, чтобы ребёнок сразу почувствовал успех.',
    correct: 'Отлично!',
    wrong: 'Почти получилось. Попробуй ещё!',
    continue: 'Дальше',
    finish: 'Завершить приключение',
    countTitle: 'Посчитай корзинки с фруктами',
    countPrompt: 'Сколько предметов получилось вместе?',
    feedTitle: 'Накорми монстрика',
    feedPrompt: 'Выбери количество вкусняшек, которое он хочет.',
    biggerTitle: 'Найди число побольше',
    biggerPrompt: 'Нажми на большую группу.',
    matchTitle: 'Собери пару',
    matchPrompt: 'Найди карточку с таким же числом.',
    speedTitle: 'Быстрый ответ',
    speedPrompt: 'Успей выбрать ответ, пока летит ракета.',
    chestReady: 'Сундук готов!',
    helperCount: 'Считай фрукты по одному и проговаривай числа.',
    dragHint: 'Перетащи правильную цифру в окошко ответа.',
    helperFeed: 'Монстрик хочет ровно столько угощений.',
    helperBigger: 'В яркой группе спрятано больше предметов.',
    helperMatch: 'Одна карточка показывает ответ. Найди её пару.',
    helperSpeed: 'Быстрые раунды дают мгновенные победы и яркие реакции.',
    rewardSticker: 'Стикер',
    rewardBuddy: 'Друг',
    rewardTheme: 'Фон',
    rewardMedal: 'Медаль',
    collectionTitle: 'Коллекция приключения',
    collectionEmpty: 'Сыграй немного, чтобы открыть первую награду.',
    countMission: 'Построй мост ответа.',
    feedMission: 'Накорми монстрика ровно столько, сколько он просит.',
    biggerMission: 'Найди более сильную команду.',
    matchMission: 'Найди спрятанную пару.',
    speedMission: 'Запусти ракету самым быстрым ответом.',
    coachCalm: 'Давай спокойно начнём. Смотри на первый шаг.',
    coachHot: 'Здорово идём. Остался ещё один шаг.',
    coachRecover: 'Ничего страшного. Котик покажет, с чего начать.',
    coachPerfect: 'Ух ты. Ты уже очень уверенно считаешь.',
    coachTryAgain: 'Давай ещё раз, медленно и спокойно.',
    hintCount: 'Сначала посчитай обе группы, потом выбери общий ответ.',
    hintFeed: 'Монстрик хочет ровно столько угощений.',
    hintBigger: 'Сравни обе стороны и выбери, где число больше.',
    hintMatch: 'Найди точно такое же число ещё раз.',
    hintSpeed: 'Сложи оба числа и выбери ответ перетаскиванием или нажатием.',
    missingTitle: 'Найди пропавшее число',
    missingPrompt: 'Какое число спряталось в коробочке?',
    helperMissing: 'Посчитай всё вместе и убери первую часть.',
    hintMissing: 'Пропавшее = всего − первая группа.',
    missingMission: 'Спаси пропавшее число.',
    rewardTypes: {
      sticker: 'Стикер',
      buddy: 'Герой',
      background: 'Фон',
      medal: 'Медаль'
    }
  },
  KG: {
    title: 'Математика укмуштуу оюну',
    subtitle: 'Досторго жардам бер, сандык ач жана белек чогулт.',
    home: 'Артка',
    progress: 'Укмуштуу жол',
    chest: 'Сандыкка чейин',
    solved: 'Чечилди',
    collection: 'Жыйнак',
    streak: 'Серия',
    rewardUnlocked: 'Ачылды',
    mission: 'Миссия',
    coach: 'Мышык жардамчы',
    innovation: 'Инновация',
    focus: 'Фокус',
    mastered: 'Өздүрүлдү',
    support: 'Колдоо',
    confidence: 'Ишеним',
    hint: 'Жардам',
    showHint: 'Мышыкты чакыр',
    hideHint: 'Жардамды жашыр',
    tapHint: 'Санды сүйрөсөң да, жөн эле бассаң да болот.',
    numberLine: 'Сан сызыгы',
    adaptiveTitle: 'Ыңгайлашкан жол',
    adaptiveBody: 'Оюн баланын жообуна жараша татаалдыгын өзү өзгөртөт.',
    numberSenseTitle: 'Санды сезүү',
    numberSenseBody: 'Раунддарда нерсе, сан жана кыймыл биригет.',
    missionTitle: 'Максаттуу оюн',
    missionBody: 'Ар тапшырма кадимки мисал эмес, кичинекей миссиядай сезилет.',
    startHint: 'Алгачкы тапшырмалар жеңил болуп, бала дароо ийгилик сезет.',
    correct: 'Сонун!',
    wrong: 'Дагы бир жолу аракет кыл!',
    continue: 'Улантуу',
    finish: 'Укмуштууну аяктоо',
    countTitle: 'Жемиштерди сана',
    countPrompt: 'Баары болуп канча болду?',
    feedTitle: 'Желмогузду тойгуз',
    feedPrompt: 'Ал каалаган даамдын санын танда.',
    biggerTitle: 'Чоңураак санды тап',
    biggerPrompt: 'Чоң топту бас.',
    matchTitle: 'Жупту тап',
    matchPrompt: 'Ушул эле сан жазылган карточканы тап.',
    speedTitle: 'Тез жооп',
    speedPrompt: 'Ракета токтой электе жоопту танда.',
    chestReady: 'Сандык даяр!',
    helperCount: 'Ар бир жемишти санап көр.',
    dragHint: 'Туура санды жооп кутучасына сүйрө.',
    helperFeed: 'Желмогуз дал ушунча таттуу каалайт.',
    helperBigger: 'Жаркыраган топто көбүрөөк нерсе бар.',
    helperMatch: 'Бир карточка жоопту көрсөтөт. Анын түгөйүн тап.',
    helperSpeed: 'Тез тапшырмалар бат жеңиш тартуулайт.',
    rewardSticker: 'Стикер',
    rewardBuddy: 'Дос',
    rewardTheme: 'Фон',
    rewardMedal: 'Медаль',
    collectionTitle: 'Укмуштуу жыйнагы',
    collectionEmpty: 'Биринчи белекти ачуу үчүн ойной башта.',
    countMission: 'Жооп көпүрөсүн кур.',
    feedMission: 'Желмогузга дал керектүү санды бер.',
    biggerMission: 'Күчтүүрөөк топту тап.',
    matchMission: 'Жашырылган түгөйдү тап.',
    speedMission: 'Эң тез жооп менен ракетаны учур.',
    coachCalm: 'Жай баштайлы. Адегенде биринчи кадамды кара.',
    coachHot: 'Сонун баратабыз. Дагы бир кадам калды.',
    coachRecover: 'Эч нерсе эмес. Мышык башынан көрсөтөт.',
    coachPerfect: 'Сонун. Сен эми ишенимдүү санап жатасың.',
    coachTryAgain: 'Дагы бир жолу жай кылып көрөлү.',
    hintCount: 'Адегенде эки топту сана, анан жалпы жоопту танда.',
    hintFeed: 'Желмогуз дал ушунча даам каалайт.',
    hintBigger: 'Эки жакты салыштырып, чоңун танда.',
    hintMatch: 'Дал ушундай эле санды кайра тап.',
    hintSpeed: 'Эки санды кош да, жоопту сүйрөп же басып танда.',
    missingTitle: 'Жоголгон санды тап',
    missingPrompt: 'Кутучага кайсы сан жашынып калды?',
    helperMissing: 'Баарын санап, биринчи бөлүктү алып кет.',
    hintMissing: 'Жоголгон = баары − биринчи топ.',
    missingMission: 'Жоголгон санды куткар.',
    rewardTypes: {
      sticker: 'Стикер',
      buddy: 'Дос',
      background: 'Фон',
      medal: 'Медаль'
    }
  },
  UZ: {
    title: 'Matematik sarguzasht',
    subtitle: 'Qahramonlarga yordam ber, sandiq och va sovg`a yig`.',
    home: 'Orqaga',
    progress: 'Sarguzasht',
    chest: 'Sandiqqacha',
    solved: 'Yechildi',
    collection: 'Kolleksiya',
    streak: 'Seriya',
    rewardUnlocked: 'Ochildi',
    mission: 'Missiya',
    coach: 'Mushuk yordamchi',
    innovation: 'Innovatsiya',
    focus: 'Fokus',
    mastered: 'O`zlashtirildi',
    support: 'Yordam',
    confidence: 'Ishonch',
    hint: 'Yordam',
    showHint: 'Mushukni chaqir',
    hideHint: 'Yordamni yashir',
    tapHint: 'Raqamni sudrasa ham, oddiy bossa ham bo`ladi.',
    numberLine: 'Son yo`li',
    adaptiveTitle: 'Moslashuvchan yo`l',
    adaptiveBody: 'O`yin qiyinlik va ishoralarni bolaning javobiga qarab o`zgartiradi.',
    numberSenseTitle: 'Sonni his qilish',
    numberSenseBody: 'Har raundda predmet, raqam va harakat birlashadi.',
    missionTitle: 'Maqsadli o`yin',
    missionBody: 'Har topshiriq oddiy misol emas, kichik missiyadek tuyuladi.',
    startHint: 'Bola darrov o`ziga ishonsin deb birinchi topshiriqlar juda oson.',
    correct: 'Zo`r!',
    wrong: 'Sal qoldi. Yana urinib ko`r!',
    continue: 'Davom etish',
    finish: 'Sarguzashtni tugatish',
    countTitle: 'Mevalarni sana',
    countPrompt: 'Hammasi bo`lib nechta bo`ldi?',
    feedTitle: 'Maxluqni ovqatlantir',
    feedPrompt: 'U xohlagan taom sonini tanla.',
    biggerTitle: 'Katta sonni top',
    biggerPrompt: 'Kattaroq guruhni bos.',
    matchTitle: 'Juftini top',
    matchPrompt: 'Shu songa teng kartani top.',
    speedTitle: 'Tez javob',
    speedPrompt: 'Raketa sovimasidan javobni tanla.',
    chestReady: 'Sandiq tayyor!',
    helperCount: 'Har bir mevani birma-bir sanab chiq.',
    dragHint: 'To`g`ri sonni javob katagiga sudra.',
    helperFeed: 'Maxluq aynan shuncha yegulik xohlaydi.',
    helperBigger: 'Yorqin guruh ichida ko`proq narsa bor.',
    helperMatch: 'Bir karta javobni ko`rsatadi. Uning juftini top.',
    helperSpeed: 'Tez bosqichlar bolaga tez g`alaba beradi.',
    rewardSticker: 'Stiker',
    rewardBuddy: 'Do`st',
    rewardTheme: 'Fon',
    rewardMedal: 'Medal',
    collectionTitle: 'Sarguzasht kolleksiyasi',
    collectionEmpty: 'Birinchi sovg`ani ochish uchun biroz o`yna.',
    countMission: 'Javob ko`prigini qur.',
    feedMission: 'Maxluqqa aynan kerakli miqdorni ber.',
    biggerMission: 'Kuchliroq guruhni top.',
    matchMission: 'Yashirin juftni top.',
    speedMission: 'Eng tez javob bilan raketani uchir.',
    coachCalm: 'Sekin boshlaymiz. Avval birinchi qadamga qarang.',
    coachHot: 'Zo`r ketyapmiz. Yana bitta qadam qoldi.',
    coachRecover: 'Hechqisi yo`q. Mushuk nimadan boshlashni ko`rsatadi.',
    coachPerfect: 'Voy. Siz endi juda ishonch bilan sanayapsiz.',
    coachTryAgain: 'Yana bir marta sekin qilib ko`ramiz.',
    hintCount: 'Avval ikkala guruhni sana, keyin umumiy javobni tanla.',
    hintFeed: 'Maxluq aynan shu miqdorni xohlaydi.',
    hintBigger: 'Ikki tomonni solishtirib, kattasini tanla.',
    hintMatch: 'Xuddi shu sonni yana top.',
    hintSpeed: 'Ikkala sonni qo`shib, javobni sudra yoki bos.',
    missingTitle: 'Yo`qolgan sonni top',
    missingPrompt: 'Qaysi son katagida yashirinib oldi?',
    helperMissing: 'Hammasini sanab, birinchi qismni olib tashla.',
    hintMissing: 'Yo`qolgan = jami − birinchi guruh.',
    missingMission: 'Yo`qolgan sonni qutqar.',
    rewardTypes: {
      sticker: 'Stiker',
      buddy: 'Do`st',
      background: 'Fon',
      medal: 'Medal'
    }
  }
};

const rewardCatalog = {
  sticker: ['🍓', '🍇', '🍉', '🍋', '🍍', '🥝'],
  buddy: ['🐻', '🐸', '🦊', '🐼', '🐵', '🐯'],
  background: ['🌈', '🌊', '🌋', '🌙', '🌼', '🌟'],
  medal: ['🥉', '🥈', '🥇', '🏅', '🏆', '👑']
};

const MATH_NUMBER_WORDS = {
  EN: {
    0: 'zero',
    1: 'one',
    2: 'two',
    3: 'three',
    4: 'four',
    5: 'five',
    6: 'six',
    7: 'seven',
    8: 'eight',
    9: 'nine',
    10: 'ten',
    11: 'eleven',
    12: 'twelve',
    13: 'thirteen',
    14: 'fourteen',
    15: 'fifteen',
    16: 'sixteen',
    17: 'seventeen',
    18: 'eighteen',
    19: 'nineteen',
    20: 'twenty'
  },
  RU: {
    0: 'ноль',
    1: 'один',
    2: 'два',
    3: 'три',
    4: 'четыре',
    5: 'пять',
    6: 'шесть',
    7: 'семь',
    8: 'восемь',
    9: 'девять',
    10: 'десять',
    11: 'одиннадцать',
    12: 'двенадцать',
    13: 'тринадцать',
    14: 'четырнадцать',
    15: 'пятнадцать',
    16: 'шестнадцать',
    17: 'семнадцать',
    18: 'восемнадцать',
    19: 'девятнадцать',
    20: 'двадцать'
  },
  KG: {
    0: 'нөл',
    1: 'бир',
    2: 'эки',
    3: 'үч',
    4: 'төрт',
    5: 'беш',
    6: 'алты',
    7: 'жети',
    8: 'сегиз',
    9: 'тогуз',
    10: 'он',
    11: 'он бир',
    12: 'он эки',
    13: 'он үч',
    14: 'он төрт',
    15: 'он беш',
    16: 'он алты',
    17: 'он жети',
    18: 'он сегиз',
    19: 'он тогуз',
    20: 'жыйырма'
  },
  UZ: {
    0: 'nol',
    1: 'bir',
    2: 'ikki',
    3: 'uch',
    4: 'to`rt',
    5: 'besh',
    6: 'olti',
    7: 'yetti',
    8: 'sakkiz',
    9: 'to`qqiz',
    10: 'o`n',
    11: 'o`n bir',
    12: 'o`n ikki',
    13: 'o`n uch',
    14: 'o`n to`rt',
    15: 'o`n besh',
    16: 'o`n olti',
    17: 'o`n yetti',
    18: 'o`n sakkiz',
    19: 'o`n to`qqiz',
    20: 'yigirma'
  }
};

const MATH_SPEECH_TEXT = {
  EN: { plus: 'plus', equals: 'equals', or: 'or', find: 'find', blank: 'blank' },
  RU: { plus: 'плюс', equals: 'равно', or: 'или', find: 'найди', blank: 'пусто' },
  KG: { plus: 'кошуу', equals: 'барабар', or: 'же', find: 'тап', blank: 'бош орун' },
  UZ: { plus: 'plus', equals: 'teng', or: 'yoki', find: 'top', blank: 'bo`sh joy' }
};


const LISTEN_MODE_TEXT = {
  EN: {
    title: 'Listen to Numbers',
    prompt: 'Flip the cards, tap a number, and hear it clearly.',
    replay: 'Listen Again',
    prev: 'Previous',
    next: 'Next',
    heard: 'Heard',
    reward: 'Voice reward',
    rewardHint: 'Listen to 10 different numbers to unlock a special prize.',
    rewardReady: 'Voice prize unlocked!'
  },
  RU: {
    title: 'Слушай цифры',
    prompt: 'Листай карточки, нажимай на цифру и слушай чистое произношение.',
    replay: 'Послушать ещё раз',
    prev: 'Назад',
    next: 'Дальше',
    heard: 'Прослушано',
    reward: 'Голосовая награда',
    rewardHint: 'Прослушай 10 разных чисел, чтобы открыть специальный приз.',
    rewardReady: 'Голосовой приз открыт!'
  },
  KG: {
    title: 'Сандарды ук',
    prompt: 'Карточкаларды барактап, санды басып, үнүн так ук.',
    replay: 'Дагы ук',
    prev: 'Артка',
    next: 'Кийинки',
    heard: 'Угулганы',
    reward: 'Үн белеги',
    rewardHint: '10 башка санды угуп, атайын белекти ач.',
    rewardReady: 'Үн белеги ачылды!'
  },
  UZ: {
    title: 'Raqamlarni tingla',
    prompt: 'Kartalarni varaqlang, raqamni bosing va aniq talaffuzni tinglang.',
    replay: 'Yana tinglash',
    prev: 'Orqaga',
    next: 'Keyingi',
    heard: 'Tinglangan',
    reward: 'Ovoz sovg`asi',
    rewardHint: '10 ta turli raqamni tinglab maxsus sovg`ani oching.',
    rewardReady: 'Ovoz sovg`asi ochildi!'
  }
};

const LISTEN_MODE_NUMBERS = Array.from({ length: 21 }, (_, index) => index);

const getMathNumberSpeech = (lang, value) => {
  const dict = MATH_NUMBER_WORDS[lang] || MATH_NUMBER_WORDS.RU;
  return dict[value] || String(value);
};

const buildDigitRoundSpeech = (lang, round) => {
  const words = MATH_SPEECH_TEXT[lang] || MATH_SPEECH_TEXT.RU;
  if (!round) return '';

  if (round.mode === 'COUNT_FRUITS' || round.mode === 'SPEED_ROUND') {
    return `${getMathNumberSpeech(lang, round.left)} ${words.plus} ${getMathNumberSpeech(lang, round.right)}`;
  }
  if (round.mode === 'FEED_MONSTER') {
    return getMathNumberSpeech(lang, round.target);
  }
  if (round.mode === 'BIGGER_NUMBER') {
    return `${getMathNumberSpeech(lang, round.left)} ${words.or} ${getMathNumberSpeech(lang, round.right)}`;
  }
  if (round.mode === 'MATCH_PAIR') {
    return `${words.find} ${getMathNumberSpeech(lang, round.target)}`;
  }
  if (round.mode === 'MISSING_NUMBER') {
    return `${getMathNumberSpeech(lang, round.left)} ${words.plus} ${words.blank} ${words.equals} ${getMathNumberSpeech(lang, round.total)}`;
  }
  return '';
};

const buildMathReward = ({ lang, type, icon, index }) => {
  const rewardTypeLabels = (mathText[lang] || mathText.RU).rewardTypes || (mathText.RU.rewardTypes);
  const rewardLabel = rewardTypeLabels[type] || type;
  const rewardTitle = `${rewardLabel} ${index + 1}`;
  const rewardDesc = lang === 'EN'
    ? 'Reward from the math adventure.'
    : lang === 'KG'
      ? 'Математика укмуштуусунан ачылган белек.'
      : lang === 'UZ'
        ? 'Matematika sarguzashtidan olingan sovg`a.'
        : 'Награда из математического приключения.';

  return {
    id: `${type}-${index + 1}`,
    type,
    icon,
    title: rewardTitle,
    desc: rewardDesc
  };
};

const buildListenReward = (lang) => ({
  id: 'math-listen-badge',
  type: 'medal',
  icon: '🔊',
  title: lang === 'EN'
    ? 'Number Echo'
    : lang === 'KG'
      ? 'Сандын үнү'
      : lang === 'UZ'
        ? 'Raqam sadosi'
        : 'Голос цифр',
  desc: lang === 'EN'
    ? 'Special reward for the Listen to Numbers mode.'
    : lang === 'KG'
      ? 'Сандарды угуу режими үчүн атайын белек.'
      : lang === 'UZ'
        ? 'Raqamlarni tinglash rejimi uchun maxsus sovg`a.'
        : 'Специальная награда за режим «Слушай цифры».'
});

const safeRandom = (max) => Math.floor(Math.random() * max);
const toRgba = (hex, alpha) => {
  const clean = hex.replace('#', '');
  const normalized = clean.length === 3
    ? clean.split('').map((char) => char + char).join('')
    : clean;
  const value = parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

const buildOptions = (answer, max = 10) => {
  const optionSet = new Set([answer]);
  while (optionSet.size < 3) {
    const candidate = Math.max(1, Math.min(max, answer + safeRandom(5) - 2));
    optionSet.add(candidate);
  }
  return shuffle([...optionSet]);
};

const buildRound = (index, mathMode, masteryLevel = 0, supportLevel = 0) => {
  const stage = Math.min(7, Math.floor(index / 2) + masteryLevel);
  const mode = MATH_MODE_ORDER[index % MATH_MODE_ORDER.length];
  const accent = ['#ff7b72', '#7bc96f', '#ffd166', '#6ecbff', '#b388ff'][index % 5];
  const item = mathMode === 'DIGITS' ? '🔢' : VISUAL_SET[index % VISUAL_SET.length];
  const supportClamp = Math.min(2, supportLevel);

  if (mode === 'COUNT_FRUITS') {
    const left = 1 + Math.min(stage, 4);
    const right = 1 + ((index + masteryLevel) % 3);
    return {
      mode,
      accent,
      item,
      left,
      right,
      missionKey: 'countMission',
      answer: left + right,
      options: buildOptions(left + right, 16 - supportClamp)
    };
  }

  if (mode === 'FEED_MONSTER') {
    const target = 2 + Math.min(stage + (index % 2), 6);
    return {
      mode,
      accent,
      item: '🍪',
      target,
      missionKey: 'feedMission',
      answer: target,
      options: buildOptions(target, 10)
    };
  }

  if (mode === 'BIGGER_NUMBER') {
    const left = 2 + stage;
    const right = Math.max(1, left - 1 - (index % 2));
    return {
      mode,
      accent,
      item,
      left,
      right,
      missionKey: 'biggerMission',
      answer: left,
      options: [
        { id: 'left', value: left, count: left },
        { id: 'right', value: right, count: right }
      ]
    };
  }

  if (mode === 'MATCH_PAIR') {
    const target = 2 + stage + (index % 3);
    const distractor = target + 1;
    return {
      mode,
      accent,
      item: '🧩',
      target,
      missionKey: 'matchMission',
      answer: target,
      options: shuffle([target, target, distractor, Math.max(1, target - 1)])
    };
  }

  if (mode === 'MISSING_NUMBER') {
    const total = 3 + Math.min(stage + 1, 8);
    const left = 1 + ((index + masteryLevel) % Math.max(1, total - 1));
    const missing = total - left;
    return {
      mode,
      accent,
      item,
      left,
      total,
      missionKey: 'missingMission',
      answer: missing,
      options: buildOptions(missing, 12 - supportClamp)
    };
  }

  const left = 1 + stage;
  const right = 1 + ((index + 1) % 3);
  return {
    mode,
    accent,
    item: '🚀',
    left,
    right,
    missionKey: 'speedMission',
    answer: left + right,
    options: buildOptions(left + right, 16 - supportClamp)
  };
};

const renderItems = (count, item, accent) =>
  Array.from({ length: count }, (_, index) => (
    <div
      key={`${item}-${count}-${index}`}
      className="math-item-chip"
      style={{
        background: `linear-gradient(180deg, ${accent}33, rgba(255,255,255,0.12))`,
        borderColor: `${accent}88`
      }}
    >
      {item}
    </div>
  ));

function MathDragChoice({ option, accent, disabled, onPick, isHinted, onPreview, label }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `math-option-${option}`,
    data: { option }
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`math-drag-choice ${isDragging ? 'is-dragging' : ''} ${isHinted ? 'is-hinted' : ''}`}
      style={{
        ...style,
        '--math-accent': accent,
        '--math-accent-soft': toRgba(accent, 0.16),
        '--math-accent-strong': toRgba(accent, 0.52),
        '--math-accent-shadow': toRgba(accent, 0.55)
      }}
      disabled={disabled}
      onClick={() => onPick(option)}
      onMouseDown={() => onPreview?.(option)}
      onTouchStart={() => onPreview?.(option)}
      onFocus={() => onPreview?.(option)}
      {...listeners}
      {...attributes}
    >
      <span className="math-drag-choice-value">{option}</span>
    </button>
  );
}

function MathAnswerDrop({ status, value, accent }) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'math-answer-drop'
  });

  return (
    <div
      ref={setNodeRef}
      className={`math-answer-box math-answer-drop ${isOver ? 'is-over' : ''} ${value !== null ? 'is-filled' : ''} ${status === 'wrong' ? 'is-wrong' : ''} ${status === 'correct' ? 'is-correct' : ''}`}
      style={{
        '--math-accent': accent,
        '--math-accent-soft': toRgba(accent, 0.12),
        '--math-accent-glow': toRgba(accent, 0.18),
        '--math-accent-border': toRgba(accent, 0.7)
      }}
    >
      <span style={{ color: status === 'correct' ? '#2fb55a' : '#263045' }}>{value ?? '?'}</span>
    </div>
  );
}

const buildNumberLine = (round) => {
  const maxValue = Math.max(
    round.answer || 0,
    round.left || 0,
    round.right || 0,
    round.target || 0,
    ...(Array.isArray(round.options)
      ? round.options.map((option) => (typeof option === 'number' ? option : option?.value || option?.count || 0))
      : [0]),
    8
  );

  return Array.from({ length: maxValue }, (_, index) => index + 1);
};

export function MiniMathScreen({
  lang,
  mathMode = 'FRUITS',
  currentTheme,
  collection = [],
  onCollectionChange,
  speakText,
  onClose
}) {
  const text = mathText[lang] || mathText.RU;
  const listenText = LISTEN_MODE_TEXT[lang] || LISTEN_MODE_TEXT.RU;
  const [roundIndex, setRoundIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('idle');
  const [solvedCount, setSolvedCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [rewardFlash, setRewardFlash] = useState(null);
  const [dragAnswer, setDragAnswer] = useState(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [listenIndex, setListenIndex] = useState(0);
  const [heardNumbers, setHeardNumbers] = useState([]);
  const rewardTimerRef = useRef(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } })
  );

  useEffect(() => () => {
    if (rewardTimerRef.current) window.clearTimeout(rewardTimerRef.current);
  }, []);

  const masteryLevel = Math.min(3, Math.floor(streak / 2));
  const supportLevel = Math.min(2, Math.floor(mistakes / 2));
  const round = useMemo(() => buildRound(roundIndex, mathMode, masteryLevel, supportLevel), [roundIndex, mathMode, masteryLevel, supportLevel]);
  const numberLine = useMemo(() => buildNumberLine(round), [round]);
  const isSmartAssistMode = hintVisible || supportLevel > 0 || status === 'wrong';
  const isLastRound = roundIndex >= 9;
  const chestCountdown = streak > 0 ? Math.max(0, 3 - (streak % 3 || 3)) : 3;
  const listenEntries = useMemo(
    () => LISTEN_MODE_NUMBERS.map((value) => ({ value, word: getMathNumberSpeech(lang, value) })),
    [lang]
  );
  const currentListenEntry = listenEntries[listenIndex] || listenEntries[0];
  const listenRewardUnlocked = collection.some((reward) => reward?.id === 'math-listen-badge');

  const modeMeta = useMemo(() => ({
    COUNT_FRUITS: { title: text.countTitle, prompt: text.countPrompt, helper: text.helperCount, mascot: '🧺' },
    FEED_MONSTER: { title: text.feedTitle, prompt: text.feedPrompt, helper: text.helperFeed, mascot: '👾' },
    BIGGER_NUMBER: { title: text.biggerTitle, prompt: text.biggerPrompt, helper: text.helperBigger, mascot: '✨' },
    MATCH_PAIR: { title: text.matchTitle, prompt: text.matchPrompt, helper: text.helperMatch, mascot: '🧠' },
    SPEED_ROUND: { title: text.speedTitle, prompt: text.speedPrompt, helper: text.helperSpeed, mascot: '🚀' },
    MISSING_NUMBER: { title: text.missingTitle, prompt: text.missingPrompt, helper: text.helperMissing, mascot: '🔍' }
  }), [text]);
  const hintByMode = useMemo(() => ({
    COUNT_FRUITS: text.hintCount,
    FEED_MONSTER: text.hintFeed,
    BIGGER_NUMBER: text.hintBigger,
    MATCH_PAIR: text.hintMatch,
    SPEED_ROUND: text.hintSpeed,
    MISSING_NUMBER: text.hintMissing
  }), [text]);
  const coachMood = status === 'wrong'
    ? 'gentle'
    : status === 'correct'
      ? 'cheer'
      : hintVisible
        ? 'thinking'
        : streak >= 4
          ? 'cheer'
          : 'happy';
  const coachHeadline = status === 'wrong'
    ? text.coachRecover
    : status === 'correct'
      ? text.coachPerfect
      : streak >= 2
        ? text.coachHot
        : text.coachCalm;
  const coachSupportCopy = isSmartAssistMode ? hintByMode[round.mode] : modeMeta[round.mode].helper;
  const speakShownDigits = useCallback((line, interrupt = true) => {
    if (typeof speakText !== 'function' || !line) return;
    speakText(line, { pitch: 0.94, rate: 0.92, volume: 1, interrupt });
  }, [speakText]);
  const previewNumber = (value) => {
    if (typeof value !== 'number') return;
    speakShownDigits(getMathNumberSpeech(lang, value), false);
  };

  const unlockReward = () => {
    const rewardTypes = ['sticker', 'buddy', 'background', 'medal'];
    const type = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];
    const iconSet = rewardCatalog[type];
    const icon = iconSet[Math.floor(Math.random() * iconSet.length)];
    const reward = buildMathReward({ lang, type, icon, index: collection.length });
    onCollectionChange?.((prev) => [...prev, reward]);
    setRewardFlash(reward);
    rewardTimerRef.current = window.setTimeout(() => setRewardFlash(null), 2600);
  };

  const playListenEntry = (entry = currentListenEntry, interrupt = true) => {
    if (!entry) return;
    speakShownDigits(entry.word, interrupt);
    setHeardNumbers((prev) => (prev.includes(entry.value) ? prev : [...prev, entry.value]));
  };

  const celebrateCorrect = () => {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
    if (typeof speakText === 'function') {
      speakText(text.correct, {
        pitch: 0.86,
        rate: 0.94,
        volume: 1
      });
    }
  };

  const markCorrect = () => {
    if (status === 'correct') return;
    setStatus('correct');
    setSolvedCount((prev) => prev + 1);
    setStreak((prev) => {
      const next = prev + 1;
      if (next % 3 === 0) unlockReward();
      return next;
    });
    celebrateCorrect();
  };

  const visibleNumericOptions = useMemo(() => {
    if (!Array.isArray(round.options) || typeof round.options[0] !== 'number') {
      return round.options;
    }

    if (!isSmartAssistMode) {
      return round.options;
    }

    const sorted = [...round.options].sort((a, b) => Math.abs(a - round.answer) - Math.abs(b - round.answer));
    const trimmed = Array.from(new Set([round.answer, ...sorted.slice(0, 1 + supportLevel)]));
    return trimmed.sort((a, b) => a - b);
  }, [isSmartAssistMode, round.answer, round.options, supportLevel]);
  const digitRoundSpeech = useMemo(() => (
    mathMode === 'DIGITS' ? buildDigitRoundSpeech(lang, round) : ''
  ), [lang, mathMode, round]);

  useEffect(() => {
    if (mathMode !== 'DIGITS' || typeof speakText !== 'function' || !digitRoundSpeech) return undefined;
    const timer = window.setTimeout(() => {
      speakText(digitRoundSpeech, {
        pitch: 0.94,
        rate: 0.92,
        volume: 1,
        interrupt: true
      });
    }, 260);
    return () => window.clearTimeout(timer);
  }, [digitRoundSpeech, mathMode, speakText]);

  useEffect(() => {
    if (mathMode !== 'LISTEN' || !currentListenEntry) return undefined;
    const timer = window.setTimeout(() => {
      speakShownDigits(currentListenEntry.word, true);
      setHeardNumbers((prev) => (
        prev.includes(currentListenEntry.value)
          ? prev
          : [...prev, currentListenEntry.value]
      ));
    }, 220);
    return () => window.clearTimeout(timer);
  }, [currentListenEntry, mathMode, speakShownDigits, speakText]);

  useEffect(() => {
    setListenIndex(0);
    setHeardNumbers([]);
  }, [lang, mathMode]);

  useEffect(() => {
    if (mathMode !== 'LISTEN' || listenRewardUnlocked || heardNumbers.length < 10) return;
    const reward = buildListenReward(lang);
    onCollectionChange?.((prev) => (
      prev.some((item) => item?.id === reward.id) ? prev : [...prev, reward]
    ));
    setRewardFlash(reward);
    rewardTimerRef.current = window.setTimeout(() => setRewardFlash(null), 2600);
  }, [heardNumbers.length, lang, listenRewardUnlocked, mathMode, onCollectionChange]);

  const pickOption = (value) => {
    if (status === 'correct') return;
    setSelected(value);
    setDragAnswer(value);

    if (round.mode === 'BIGGER_NUMBER') {
      const picked = round.options.find((option) => option.id === value);
      if (picked?.value === round.answer) {
        markCorrect();
        return;
      }
      setMistakes((prev) => prev + 1);
      setHintVisible(true);
      setStatus('wrong');
      return;
    }

    if (value === round.answer) {
      markCorrect();
      return;
    }

    setMistakes((prev) => prev + 1);
    setHintVisible(true);
    setStatus('wrong');
  };

  const handleMathDragEnd = (event) => {
    if (status === 'correct') return;

    const droppedValue = event.active.data.current?.option;
    if (event.over?.id !== 'math-answer-drop' || typeof droppedValue !== 'number') {
      return;
    }

    setDragAnswer(droppedValue);
    pickOption(droppedValue);
  };

  const nextRound = () => {
    if (isLastRound) {
      onClose();
      return;
    }
    setRoundIndex((prev) => prev + 1);
    setSelected(null);
    setStatus('idle');
    setDragAnswer(null);
    setHintVisible(false);
  };

  if (mathMode === 'LISTEN') {
    return (
      <div style={{ width: '100%', maxWidth: '980px', margin: '10px auto 0', textAlign: 'center', padding: '18px 14px 36px', boxSizing: 'border-box' }}>
        <button type="button" onClick={onClose} style={backButtonStyle}>
          {text.home}
        </button>

        <div className="math-kid-shell" style={{ background: currentTheme.cardBg }}>
          <div className="math-kid-topbar">
            <div className="math-kid-titlebox">
              <div className="math-kid-mascot">🔊</div>
              <div>
                <h2 className="math-kid-title">{listenText.title}</h2>
                <div className="math-kid-subtitle">{listenText.prompt}</div>
              </div>
            </div>

            <div className="math-kid-stats">
              <div className="math-kid-pill">👂 {Math.min(heardNumbers.length, 10)}/10</div>
              <div className="math-kid-pill">🎁 {listenRewardUnlocked ? '✓' : '…'}</div>
              <div className="math-kid-pill">🔢 {listenIndex + 1}/{listenEntries.length}</div>
            </div>
          </div>

          <div className="math-kid-board">
            <div className="math-listen-hero">
              {(() => {
                const val = currentListenEntry?.value ?? 0;
                const grad = NUM_GRADIENTS[val % NUM_GRADIENTS.length];
                const dotCount = Math.min(val, 10);
                return (
                  <div className="math-listen-stage" style={{ background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})` }}>
                    <div className="math-listen-number">{val}</div>
                    <div className="math-listen-word math-handwritten-word">{currentListenEntry?.word || ''}</div>
                    {dotCount > 0 ? (
                      <div className="math-listen-dots">
                        {Array.from({ length: dotCount }, (_, i) => (
                          <span key={i} className="math-listen-dot">{NUM_DOTS[i % NUM_DOTS.length]}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })()}

              <div className="math-listen-actions">
                <button
                  type="button"
                  className="math-listen-button is-secondary"
                  onClick={() => setListenIndex((prev) => (prev - 1 + listenEntries.length) % listenEntries.length)}
                >
                  {listenText.prev}
                </button>
                <button
                  type="button"
                  className="math-listen-button is-primary"
                  onClick={() => playListenEntry(currentListenEntry, true)}
                >
                  🔊 {listenText.replay}
                </button>
                <button
                  type="button"
                  className="math-listen-button is-secondary"
                  onClick={() => setListenIndex((prev) => (prev + 1) % listenEntries.length)}
                >
                  {listenText.next}
                </button>
              </div>
            </div>

            <div className="math-digit-guide-card">
              <div className="math-digit-guide-header">
                <div className="math-digit-guide-title">{listenText.heard}</div>
                <div className="math-listen-reward-copy">
                  {listenRewardUnlocked ? listenText.rewardReady : listenText.rewardHint}
                </div>
              </div>
              <div className="math-digit-guide-row">
                {listenEntries.map((entry, index) => {
                  const grad = NUM_GRADIENTS[entry.value % NUM_GRADIENTS.length];
                  return (
                    <button
                      key={`listen-entry-${entry.value}`}
                      type="button"
                      className={`math-digit-guide-chip ${heardNumbers.includes(entry.value) ? 'is-heard' : ''} ${index === listenIndex ? 'is-current' : ''}`}
                      style={heardNumbers.includes(entry.value) || index === listenIndex ? { background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`, color: '#fff', border: 'none' } : {}}
                      onClick={() => {
                        setListenIndex(index);
                        playListenEntry(entry, true);
                      }}
                    >
                      <span className="math-digit-guide-number">{entry.value}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="math-coach-card cat-coach-card">
            <div className="math-coach-head">
              <div className="math-coach-avatar cat-coach-avatar">
                <Irbi mood="happy" size={92} />
              </div>
              <div>
                <div className="math-coach-title">{text.coach}</div>
                <div className="math-coach-copy">{listenText.reward}</div>
              </div>
            </div>
            <div className="math-coach-foot">{listenRewardUnlocked ? listenText.rewardReady : listenText.rewardHint}</div>
          </div>

          <div className="math-rewards-strip">
            <div className="math-rewards-title">🏆</div>
            <div className="math-rewards-row">
              {(collection.length ? collection.slice(-6).map((reward) => reward.icon) : ['🔊', '⭐', '🎈']).map((icon, index) => (
                <div key={`${icon}-${index}`} className={`math-reward-bubble ${collection.length ? '' : 'is-empty'}`}>{icon}</div>
              ))}
            </div>
            {rewardFlash ? <div className="math-reward-pop">{rewardFlash.icon}</div> : null}
          </div>
        </div>
      </div>
    );
  }

  const renderMainChallenge = () => {
    if (round.mode === 'COUNT_FRUITS' || round.mode === 'SPEED_ROUND') {
      return (
        <DndContext sensors={sensors} onDragEnd={handleMathDragEnd}>
          <div className="math-stage-board math-stage-board-drag" style={{ background: 'linear-gradient(180deg, rgba(255, 234, 214, 0.95), rgba(255, 217, 189, 0.88))' }}>
            <div className="math-item-grid">
              {mathMode === 'DIGITS' ? <div className="math-digit-box">{round.left}</div> : renderItems(round.left, round.item, round.accent)}
            </div>
            <div className="math-operator">+</div>
            <div className="math-item-grid">
              {mathMode === 'DIGITS' ? <div className="math-digit-box">{round.right}</div> : renderItems(round.right, round.item, round.accent)}
            </div>
            <div className="math-operator">=</div>
            <MathAnswerDrop
              accent={round.accent}
              status={status}
              value={status === 'correct' ? round.answer : dragAnswer}
            />
          </div>
          <div className="math-gesture-row">
            <span>👆</span>
            <span>↔</span>
            <span>🎯</span>
          </div>
          <div className="math-drag-bank">
            {visibleNumericOptions.map((option) => (
              <MathDragChoice
                key={option}
                option={option}
                accent={round.accent}
                disabled={status === 'correct'}
                onPick={pickOption}
                isHinted={isSmartAssistMode && option === round.answer}
                onPreview={previewNumber}
              />
            ))}
          </div>
        </DndContext>
      );
    }

    if (round.mode === 'FEED_MONSTER') {
      return (
        <div className="math-stage-board" style={{ background: 'linear-gradient(180deg, rgba(228, 234, 255, 0.95), rgba(214, 223, 255, 0.88))' }}>
          <div className="math-monster-card">
            <div className="math-monster-face">🦖</div>
            <div className="math-monster-bubble">🍪 {round.target}</div>
            <div className="math-monster-copy">{text.feedPrompt}</div>
          </div>
        </div>
      );
    }

    if (round.mode === 'BIGGER_NUMBER') {
      return (
        <div className="math-duel-grid">
          {round.options.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`math-choice-card ${selected === option.id ? 'is-picked' : ''}`}
              onClick={() => {
                previewNumber(option.value);
                pickOption(option.id);
              }}
            >
              <div className="math-choice-count">{option.value}</div>
              {mathMode === 'DIGITS' ? (
                <div className="math-choice-word math-handwritten-word">{getMathNumberSpeech(lang, option.value)}</div>
              ) : null}
              <div className="math-item-grid compact">
                {mathMode === 'DIGITS' ? <div className="math-digit-box compact">{option.count}</div> : renderItems(option.count, round.item, round.accent)}
              </div>
            </button>
          ))}
        </div>
      );
    }

    if (round.mode === 'MISSING_NUMBER') {
      return (
        <DndContext sensors={sensors} onDragEnd={handleMathDragEnd}>
          <div className="math-stage-board math-stage-board-drag" style={{ background: 'linear-gradient(180deg, rgba(214, 234, 255, 0.95), rgba(189, 217, 255, 0.88))' }}>
            <div className="math-item-grid">
              {mathMode === 'DIGITS' ? <div className="math-digit-box">{round.left}</div> : renderItems(round.left, round.item, round.accent)}
            </div>
            <div className="math-operator">+</div>
            <MathAnswerDrop
              accent={round.accent}
              status={status}
              value={status === 'correct' ? round.answer : dragAnswer}
            />
            <div className="math-operator">=</div>
            <div className="math-item-grid">
              {mathMode === 'DIGITS' ? <div className="math-digit-box">{round.total}</div> : renderItems(round.total, round.item, round.accent)}
            </div>
          </div>
          <div className="math-gesture-row">
            <span>🔍</span>
            <span>❓</span>
            <span>🎯</span>
          </div>
          <div className="math-drag-bank">
            {visibleNumericOptions.map((option) => (
              <MathDragChoice
                key={option}
                option={option}
                accent={round.accent}
                disabled={status === 'correct'}
                onPick={pickOption}
                isHinted={isSmartAssistMode && option === round.answer}
                onPreview={previewNumber}
              />
            ))}
          </div>
        </DndContext>
      );
    }

    return (
      <div className="math-match-grid">
        <div className="math-target-card">{round.target}</div>
        {round.options.map((option, index) => (
          <button
            key={`${option}-${index}`}
            type="button"
            className={`math-match-card ${selected === option ? 'is-picked' : ''}`}
            onClick={() => {
              previewNumber(option);
              pickOption(option);
            }}
          >
            <span className="math-match-value">{option}</span>
            {mathMode === 'DIGITS' ? (
              <span className="math-match-word math-handwritten-word">{getMathNumberSpeech(lang, option)}</span>
            ) : null}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div style={{ width: '100%', maxWidth: '980px', margin: '10px auto 0', textAlign: 'center', padding: '18px 14px 36px', boxSizing: 'border-box' }}>
      <button type="button" onClick={onClose} style={backButtonStyle}>
        {text.home}
      </button>

      <div className="math-kid-shell" style={{ background: currentTheme.cardBg }}>
        <div className="math-kid-topbar">
          <div className="math-kid-titlebox">
            <div className="math-kid-mascot">{modeMeta[round.mode].mascot}</div>
            <div>
              <h2 className="math-kid-title">{modeMeta[round.mode].title}</h2>
              <div className="math-kid-subtitle">{modeMeta[round.mode].prompt}</div>
            </div>
          </div>

          <div className="math-kid-stats">
            <div className="math-kid-pill">⭐ {solvedCount}</div>
            <div className="math-kid-pill">🔥 {streak}</div>
            <div className="math-kid-pill">🎁 {streak > 0 && streak % 3 === 0 ? '!' : chestCountdown}</div>
            <div className="math-kid-pill">🎯 {roundIndex + 1}/10</div>
          </div>
        </div>

        <div className="math-kid-board">
          {renderMainChallenge()}

          {round.mode === 'BIGGER_NUMBER' || round.mode === 'MATCH_PAIR' || round.mode === 'COUNT_FRUITS' || round.mode === 'SPEED_ROUND' || round.mode === 'MISSING_NUMBER'
            ? null
            : (
              <div className="math-options-row">
                {visibleNumericOptions.map((option) => {
                  const isRight = status === 'correct' && option === round.answer;
                  const isWrong = selected === option && option !== round.answer;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        previewNumber(option);
                        pickOption(option);
                      }}
                      className={`math-answer-button ${isRight ? 'is-right' : ''} ${isWrong ? 'is-wrong' : ''}`}
                    >
                      <span className="math-answer-value">{option}</span>
                    </button>
                  );
                })}
              </div>
            )}

          {(round.mode === 'COUNT_FRUITS' || round.mode === 'SPEED_ROUND' || round.mode === 'BIGGER_NUMBER' || round.mode === 'MISSING_NUMBER' || round.mode === 'FEED_MONSTER' || round.mode === 'MATCH_PAIR') ? (
            <div className="math-numberline-card math-numberline-card-simple">
              <div className="math-numberline-track">
                {numberLine.map((value) => {
                  const isActive = value === round.answer || value === dragAnswer || value === round.target;
                  return (
                    <div key={value} className={`math-numberline-step ${isActive ? 'is-active' : ''}`}>
                      <span>{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}


          <div className={`math-feedback-badge ${status === 'correct' ? 'is-success' : status === 'wrong' ? 'is-error' : ''}`}>
            {status === 'correct' ? '✅' : status === 'wrong' ? '💛' : ''}
          </div>

          {status === 'correct' ? (
            <button type="button" onClick={nextRound} className="math-continue-button">
              {isLastRound ? text.finish : text.continue}
            </button>
          ) : null}
        </div>

        <div className="math-coach-card cat-coach-card">
          <div className="math-coach-head">
            <div className="math-coach-avatar cat-coach-avatar">
              <Irbi
                mood={status === 'correct' ? 'cheer' : hintVisible ? 'talking' : coachMood === 'thinking' ? 'thinking' : 'idle'}
                size={92}
              />
            </div>
            <div>
              <div className="math-coach-title">{text.coach}</div>
              <div className="math-coach-copy">{coachHeadline}</div>
            </div>
          </div>
          <div className="math-confidence-row">
            <span>{text.hint}</span>
            <span>{text.confidence}: {Math.max(1, 5 - supportLevel)}/5</span>
          </div>
          <div className="math-confidence-bar">
            <div className="math-confidence-fill" style={{ width: `${Math.max(24, ((5 - supportLevel) / 5) * 100)}%` }} />
          </div>
          <div className="math-coach-foot">{coachSupportCopy}</div>
          <div className="math-coach-actions">
            <button type="button" className="math-hint-button" onClick={() => setHintVisible((prev) => !prev)}>
              {hintVisible ? text.hideHint : text.showHint}
            </button>
          </div>
        </div>

        <div className="math-rewards-strip">
          <div className="math-rewards-title">🏆</div>
          <div className="math-rewards-row">
            {(collection.length ? collection.slice(-6).map((reward) => reward.icon) : ['⭐', '🎈', '🍓']).map((icon, index) => (
              <div key={`${icon}-${index}`} className={`math-reward-bubble ${collection.length ? '' : 'is-empty'}`}>{icon}</div>
            ))}
          </div>
          {rewardFlash ? <div className="math-reward-pop">{rewardFlash.icon}</div> : null}
        </div>
      </div>
    </div>
  );
}

const backButtonStyle = {
  background: 'rgba(255,255,255,0.24)',
  color: 'white',
  border: 'none',
  padding: '12px 22px',
  borderRadius: '18px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '1rem',
  marginBottom: '14px'
};
