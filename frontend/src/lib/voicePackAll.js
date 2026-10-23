import { menuVoicePhrases } from '../components/MainMenu';
import { voicePhrases as wordVoicePhrases } from '../components/WordGame';
import { voicePhrases as mathVoicePhrases } from '../components/MathGame';
import { voicePhrases as memoryVoicePhrases } from '../components/MemoryGame';
import { voicePhrases as logicVoicePhrases } from '../components/LogicGame';
import { voicePhrases as speakVoicePhrases } from '../components/SpeakGame';
import { voicePhrases as articVoicePhrases } from '../components/ArticGame';
import { voicePhrases as listenVoicePhrases } from '../components/ListenGame';
import { voicePhrases as alphabetVoicePhrases } from '../components/AlphabetBook';
import { voicePhrases as coloringVoicePhrases } from '../components/ColoringGame';
import { albumVoicePhrases } from '../components/AlbumScreen';
import { giftVoicePhrases } from '../components/GiftModal';
import { uniquePhrases } from './voicePack';

// Every phrase the game can say in `lang` (children's names aside): the offline voice pack, and the
// recordings copied to the website version.
export const allVoicePhrases = (lang, { words = [], syllables = [] } = {}) => uniquePhrases([
  ...menuVoicePhrases(lang),
  ...wordVoicePhrases(lang, { words, syllables }),
  ...mathVoicePhrases(lang),
  ...memoryVoicePhrases(lang, { words }),
  ...logicVoicePhrases(lang, { words }),
  ...speakVoicePhrases(lang),
  ...articVoicePhrases(lang),
  ...listenVoicePhrases(lang, { words }),
  ...alphabetVoicePhrases(lang, { words }),
  ...coloringVoicePhrases(lang),
  ...albumVoicePhrases(lang),
  ...giftVoicePhrases(lang)
]);
