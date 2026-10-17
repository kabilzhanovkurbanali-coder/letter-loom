// Every concept has its own picture in /images/<image>.webp (Fluent Emoji 3D, MIT license).
const buildImageUrl = (image) => `/images/${image}.webp`;

// Uzbek Latin treats Oʻ, Gʻ, Sh, Ch as single letters, so they become single tiles.
const UZ_UNIT_PATTERN = /O'|G'|SH|CH|[A-Z]/g;
const CYRILLIC_OR_LATIN_LETTER = /[A-ZА-ЯЁӨҮҢ]/g;

const splitUnits = (text, lang) => {
  const upper = String(text || '').toUpperCase();
  if (lang === 'UZ') return upper.match(UZ_UNIT_PATTERN) || [];
  return upper.match(CYRILLIC_OR_LATIN_LETTER) || [];
};

const createWord = (id, lang, text, image) => ({
  id,
  text,
  units: splitUnits(text, lang),
  img: buildImageUrl(image),
  image
});

const WORD_CONCEPTS = [
  { image: 'cat', EN: 'CAT', RU: 'КОТ', KG: 'МЫШЫК', UZ: 'MUSHUK' },
  { image: 'dog', EN: 'DOG', RU: 'СОБАКА', KG: 'ИТ', UZ: 'IT' },
  { image: 'fish', EN: 'FISH', RU: 'РЫБА', KG: 'БАЛЫК', UZ: 'BALIQ' },
  { image: 'car', EN: 'CAR', RU: 'МАШИНА', KG: 'УНАА', UZ: 'MASHINA' },
  { image: 'sun', EN: 'SUN', RU: 'СОЛНЦЕ', KG: 'КҮН', UZ: 'QUYOSH' },
  { image: 'tree', EN: 'TREE', RU: 'ДЕРЕВО', KG: 'ДАРАК', UZ: 'DARAXT' },
  { image: 'moon', EN: 'MOON', RU: 'ЛУНА', KG: 'АЙ', UZ: 'OY' },
  { image: 'star', EN: 'STAR', RU: 'ЗВЕЗДА', KG: 'ЖЫЛДЫЗ', UZ: 'YULDUZ' },
  { image: 'ball', EN: 'BALL', RU: 'МЯЧ', KG: 'ТОП', UZ: "TO'P" },
  { image: 'book', EN: 'BOOK', RU: 'КНИГА', KG: 'КИТЕП', UZ: 'KITOB' },
  { image: 'house', EN: 'HOUSE', RU: 'ДОМ', KG: 'ҮЙ', UZ: 'UY' },
  { image: 'apple', EN: 'APPLE', RU: 'ЯБЛОКО', KG: 'АЛМА', UZ: 'OLMA' },
  { image: 'flower', EN: 'FLOWER', RU: 'ЦВЕТОК', KG: 'ГҮЛ', UZ: 'GUL' },
  { image: 'duck', EN: 'DUCK', RU: 'УТКА', KG: 'ӨРДӨК', UZ: "O'RDAK" },
  { image: 'mouse', EN: 'MOUSE', RU: 'МЫШЬ', KG: 'ЧЫЧКАН', UZ: 'SICHQON' },
  { image: 'cow', EN: 'COW', RU: 'КОРОВА', KG: 'УЙ', UZ: 'SIGIR' },
  { image: 'horse', EN: 'HORSE', RU: 'ЛОШАДЬ', KG: 'АТ', UZ: 'OT' },
  { image: 'milk', EN: 'MILK', RU: 'МОЛОКО', KG: 'СҮТ', UZ: 'SUT' },
  { image: 'cake', EN: 'CAKE', RU: 'ТОРТ', KG: 'ТОРТ', UZ: 'TORT' },
  { image: 'hat', EN: 'HAT', RU: 'ШЛЯПА', KG: 'КАЛПАК', UZ: 'QALPOQ' },
  { image: 'boot', EN: 'BOOT', RU: 'САПОГ', KG: 'ӨТҮК', UZ: 'ETIK' },
  { image: 'baby', EN: 'BABY', RU: 'МАЛЫШ', KG: 'БӨБӨК', UZ: 'CHAQALOQ' },
  { image: 'bed', EN: 'BED', RU: 'КРОВАТЬ', KG: 'КЕРЕБЕТ', UZ: 'KARAVOT' },
  { image: 'door', EN: 'DOOR', RU: 'ДВЕРЬ', KG: 'ЭШИК', UZ: 'ESHIK' },
  { image: 'key', EN: 'KEY', RU: 'КЛЮЧ', KG: 'АЧКЫЧ', UZ: 'KALIT' },
  { image: 'egg', EN: 'EGG', RU: 'ЯЙЦО', KG: 'ЖУМУРТКА', UZ: 'TUXUM' },
  { image: 'boat', EN: 'BOAT', RU: 'ЛОДКА', KG: 'КАЙЫК', UZ: 'QAYIQ' },
  { image: 'bird', EN: 'BIRD', RU: 'ПТИЦА', KG: 'ЧЫМЧЫК', UZ: 'QUSH' },
  { image: 'water', EN: 'WATER', RU: 'ВОДА', KG: 'СУУ', UZ: 'SUV' },
  { image: 'bread', EN: 'BREAD', RU: 'ХЛЕБ', KG: 'НАН', UZ: 'NON' },
  { image: 'tea', EN: 'TEA', RU: 'ЧАЙ', KG: 'ЧАЙ', UZ: 'CHOY' },
  { image: 'fire', EN: 'FIRE', RU: 'ОГОНЬ', KG: 'ОТ', UZ: 'OLOV' },
  { image: 'cloud', EN: 'CLOUD', RU: 'ОБЛАКО', KG: 'БУЛУТ', UZ: 'BULUT' },
  { image: 'rain', EN: 'RAIN', RU: 'ДОЖДЬ', KG: 'ЖАМГЫР', UZ: "YOMG'IR" },
  { image: 'snow', EN: 'SNOW', RU: 'СНЕГ', KG: 'КАР', UZ: 'QOR' },
  { image: 'wind', EN: 'WIND', RU: 'ВЕТЕР', KG: 'ШАМАЛ', UZ: 'SHAMOL' },
  { image: 'leaf', EN: 'LEAF', RU: 'ЛИСТ', KG: 'ЖАЛБЫРАК', UZ: 'BARG' },
  { image: 'grass', EN: 'GRASS', RU: 'ТРАВА', KG: 'ЧӨП', UZ: 'MAYSA' },
  { image: 'river', EN: 'RIVER', RU: 'РЕКА', KG: 'ДАРЫЯ', UZ: 'DARYO' },
  { image: 'mountain', EN: 'MOUNTAIN', RU: 'ГОРА', KG: 'ТОО', UZ: "TOG'" },
  { image: 'sea', EN: 'SEA', RU: 'МОРЕ', KG: 'ДЕҢИЗ', UZ: 'DENGIZ' },
  { image: 'forest', EN: 'FOREST', RU: 'ЛЕС', KG: 'ТОКОЙ', UZ: "O'RMON" },
  { image: 'chair', EN: 'CHAIR', RU: 'СТУЛ', KG: 'ОРУНДУК', UZ: 'STUL' },
  { image: 'bear', EN: 'BEAR', RU: 'МЕДВЕДЬ', KG: 'АЮУ', UZ: 'AYIQ' },
  { image: 'window', EN: 'WINDOW', RU: 'ОКНО', KG: 'ТЕРЕЗЕ', UZ: 'DERAZA' },
  { image: 'phone', EN: 'PHONE', RU: 'ТЕЛЕФОН', KG: 'ТЕЛЕФОН', UZ: 'TELEFON' },
  { image: 'clock', EN: 'CLOCK', RU: 'ЧАСЫ', KG: 'СААТ', UZ: 'SOAT' },
  { image: 'bag', EN: 'BAG', RU: 'СУМКА', KG: 'СУМКА', UZ: 'SUMKA' },
  { image: 'shirt', EN: 'SHIRT', RU: 'РУБАШКА', KG: 'КӨЙНӨК', UZ: "KO'YLAK" },
  { image: 'pants', EN: 'PANTS', RU: 'БРЮКИ', KG: 'ШЫМ', UZ: 'SHIM' },
  { image: 'sock', EN: 'SOCK', RU: 'НОСОК', KG: 'БАЙПАК', UZ: 'PAYPOQ' },
  { image: 'hand', EN: 'HAND', RU: 'РУКА', KG: 'КОЛ', UZ: "QO'L" },
  { image: 'eye', EN: 'EYE', RU: 'ГЛАЗ', KG: 'КӨЗ', UZ: "KO'Z" },
  { image: 'nose', EN: 'NOSE', RU: 'НОС', KG: 'МУРУН', UZ: 'BURUN' },
  { image: 'ear', EN: 'EAR', RU: 'УХО', KG: 'КУЛАК', UZ: 'QULOQ' },
  { image: 'tooth', EN: 'TOOTH', RU: 'ЗУБ', KG: 'ТИШ', UZ: 'TISH' },
  { image: 'rabbit', EN: 'RABBIT', RU: 'ЗАЯЦ', KG: 'КОЁН', UZ: 'QUYON' },
  { image: 'school', EN: 'SCHOOL', RU: 'ШКОЛА', KG: 'МЕКТЕП', UZ: 'MAKTAB' },
  { image: 'teacher', EN: 'TEACHER', RU: 'УЧИТЕЛЬ', KG: 'МУГАЛИМ', UZ: "O'QITUVCHI" },
  { image: 'student', EN: 'STUDENT', RU: 'УЧЕНИК', KG: 'ОКУУЧУ', UZ: "O'QUVCHI" },
  { image: 'friend', EN: 'FRIEND', RU: 'ДРУГ', KG: 'ДОС', UZ: "DO'ST" },
  { image: 'family', EN: 'FAMILY', RU: 'СЕМЬЯ', KG: 'ҮЙ-БҮЛӨ', UZ: 'OILA' },
  { image: 'watermelon', EN: 'WATERMELON', RU: 'АРБУЗ', KG: 'ДАРБЫЗ', UZ: 'TARVUZ' },
  { image: 'road', EN: 'ROAD', RU: 'ДОРОГА', KG: 'ЖОЛ', UZ: "YO'L" },
  { image: 'bridge', EN: 'BRIDGE', RU: 'МОСТ', KG: 'КӨПҮРӨ', UZ: "KO'PRIK" },
  { image: 'train', EN: 'TRAIN', RU: 'ПОЕЗД', KG: 'ПОЕЗД', UZ: 'POYEZD' },
  { image: 'bus', EN: 'BUS', RU: 'АВТОБУС', KG: 'АВТОБУС', UZ: 'AVTOBUS' },
  { image: 'plane', EN: 'PLANE', RU: 'САМОЛЁТ', KG: 'УЧАК', UZ: 'SAMOLYOT' },
  { image: 'bicycle', EN: 'BICYCLE', RU: 'ВЕЛОСИПЕД', KG: 'ВЕЛОСИПЕД', UZ: 'VELOSIPED' },
  { image: 'market', EN: 'MARKET', RU: 'РЫНОК', KG: 'БАЗАР', UZ: 'BOZOR' },
  { image: 'shop', EN: 'SHOP', RU: 'МАГАЗИН', KG: 'ДҮКӨН', UZ: "DO'KON" },
  { image: 'cheese', EN: 'CHEESE', RU: 'СЫР', KG: 'СЫР', UZ: 'PISHLOQ' },
  { image: 'juice', EN: 'JUICE', RU: 'СОК', KG: 'ШИРЕ', UZ: 'SHARBAT' },
  { image: 'banana', EN: 'BANANA', RU: 'БАНАН', KG: 'БАНАН', UZ: 'BANAN' },
  { image: 'grape', EN: 'GRAPE', RU: 'ВИНОГРАД', KG: 'ЖҮЗҮМ', UZ: 'UZUM' },
  { image: 'orange', EN: 'ORANGE', RU: 'АПЕЛЬСИН', KG: 'АПЕЛЬСИН', UZ: 'APELSIN' },
  { image: 'peach', EN: 'PEACH', RU: 'ПЕРСИК', KG: 'ШАБДАЛЫ', UZ: 'SHAFTOLI' },
  { image: 'pear', EN: 'PEAR', RU: 'ГРУША', KG: 'АЛМУРУТ', UZ: 'NOK' },
  { image: 'carrot', EN: 'CARROT', RU: 'МОРКОВЬ', KG: 'САБИЗ', UZ: 'SABZI' },
  { image: 'potato', EN: 'POTATO', RU: 'КАРТОФЕЛЬ', KG: 'КАРТОШКА', UZ: 'KARTOSHKA' },
  { image: 'tomato', EN: 'TOMATO', RU: 'ПОМИДОР', KG: 'ПОМИДОР', UZ: 'POMIDOR' },
  { image: 'cucumber', EN: 'CUCUMBER', RU: 'ОГУРЕЦ', KG: 'БАДЫРАҢ', UZ: 'BODRING' },
  { image: 'onion', EN: 'ONION', RU: 'ЛУК', KG: 'ПИЯЗ', UZ: 'PIYOZ' },
  { image: 'pepper', EN: 'PEPPER', RU: 'ПЕРЕЦ', KG: 'КАЛЕМПИР', UZ: 'QALAMPIR' },
  { image: 'soup', EN: 'SOUP', RU: 'СУП', KG: 'ШОРПО', UZ: "SHO'RVA" },
  { image: 'plate', EN: 'PLATE', RU: 'ТАРЕЛКА', KG: 'ТАБАК', UZ: 'TARELKA' },
  { image: 'spoon', EN: 'SPOON', RU: 'ЛОЖКА', KG: 'КАШЫК', UZ: 'QOSHIQ' },
  { image: 'fork', EN: 'FORK', RU: 'ВИЛКА', KG: 'АЙРЫ', UZ: 'SANCHQI' },
  { image: 'cup', EN: 'CUP', RU: 'ЧАШКА', KG: 'ЧӨЙЧӨК', UZ: 'PIYOLA' },
  { image: 'computer', EN: 'COMPUTER', RU: 'КОМПЬЮТЕР', KG: 'КОМПЬЮТЕР', UZ: 'KOMPYUTER' },
  { image: 'pencil', EN: 'PENCIL', RU: 'КАРАНДАШ', KG: 'КАРАНДАШ', UZ: 'QALAM' },
  { image: 'notebook', EN: 'NOTEBOOK', RU: 'ТЕТРАДЬ', KG: 'ДЕПТЕР', UZ: 'DAFTAR' },
  { image: 'letter', EN: 'LETTER', RU: 'ПИСЬМО', KG: 'КАТ', UZ: 'XAT' },
  { image: 'paper', EN: 'PAPER', RU: 'БУМАГА', KG: 'КАГАЗ', UZ: "QOG'OZ" },
  { image: 'backpack', EN: 'BACKPACK', RU: 'РЮКЗАК', KG: 'РЮКЗАК', UZ: 'RYUKZAK' },
  { image: 'soap', EN: 'SOAP', RU: 'МЫЛО', KG: 'САБЫН', UZ: 'SOVUN' },
  { image: 'lion', EN: 'LION', RU: 'ЛЕВ', KG: 'АРСТАН', UZ: 'SHER' },
  { image: 'mirror', EN: 'MIRROR', RU: 'ЗЕРКАЛО', KG: 'КҮЗГҮ', UZ: "KO'ZGU" },
  { image: 'frog', EN: 'FROG', RU: 'ЛЯГУШКА', KG: 'БАКА', UZ: 'QURBAQA' },
  { image: 'lamp', EN: 'LAMP', RU: 'ЛАМПА', KG: 'ЧЫРАК', UZ: 'CHIROQ' }
];

const buildTranslations = () =>
  ['EN', 'RU', 'KG', 'UZ'].reduce((acc, lang) => {
    acc[lang] = WORD_CONCEPTS.map((item, index) => createWord(index + 1, lang, item[lang], item.image));
    return acc;
  }, {});

module.exports = {
  translations: buildTranslations(),
  splitUnits
};
