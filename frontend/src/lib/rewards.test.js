import { render, fireEvent, screen } from '@testing-library/react';
import { FRIENDS, computeAwards, nextFriendId } from './rewards';
import { AlbumScreen } from '../components/AlbumScreen';
import { GiftModal } from '../components/GiftModal';

jest.mock('canvas-confetti', () => jest.fn());
jest.mock('./sfx', () => ({ sfxTada: jest.fn(), sfxWhoosh: jest.fn() }));

describe('rewards', () => {
  test('friends always come in the same order, never twice', () => {
    expect(nextFriendId([])).toBe(FRIENDS[0].id);
    expect(nextFriendId([FRIENDS[0].id, FRIENDS[2].id])).toBe(FRIENDS[1].id);
    expect(nextFriendId(FRIENDS.map((friend) => friend.id))).toBeNull();
  });

  test('awards reflect real progress from every module', () => {
    const stats = {
      activities: { 'math:COUNT': { sessions: 2 }, 'math:ADD': { sessions: 1 }, 'artic:GYM': { sessions: 1 } },
      days: { '2026-10-01': 3, '2026-10-02': 0 }
    };
    const awards = Object.fromEntries(computeAwards({ words: 12, syllables: 0, friends: 2, stats }).map((award) => [award.id, award]));
    expect(awards.firstWord.done).toBe(true);
    expect(awards.words10.done).toBe(true);
    expect(awards.words30).toMatchObject({ done: false, value: 12, goal: 30 });
    expect(awards.counting.done).toBe(true);
    expect(awards.artic).toMatchObject({ done: false, value: 1 });
    expect(awards.days.value).toBe(1);
  });
});

describe('album and gifts', () => {
  test('collected words show their picture and name, the rest stay soft shadows', () => {
    const speakText = jest.fn();
    const words = [{ id: 1, text: 'КОТ', img: '/images/cat.webp' }, { id: 2, text: 'СОБАКА', img: '/images/dog.webp' }];
    render(<AlbumScreen lang="RU" words={words} wordIds={[1]} speakText={speakText} onExit={jest.fn()} />);
    expect(screen.getByText('1 из 2')).toBeTruthy();
    expect(document.querySelectorAll('.al-card.is-open')).toHaveLength(1);
    fireEvent.click(document.querySelector('.al-card.is-open'));
    expect(speakText).toHaveBeenCalledWith('кот', expect.objectContaining({ kind: 'word' }));

    fireEvent.click(screen.getByText('Друзья'));
    expect(screen.getByText('До подарка: ещё 3 игры')).toBeTruthy();
  });

  test('opening a gift welcomes the new friend', () => {
    const onOpen = jest.fn();
    const speakText = jest.fn();
    const { rerender } = render(<GiftModal lang="UZ" friendId="camel" speakText={speakText} onOpen={onOpen} onDone={jest.fn()} />);
    fireEvent.click(document.querySelector('.gf-box'));
    expect(onOpen).toHaveBeenCalledWith('camel');
    // the parent re-renders with a fresh speak function: the box must stay open
    rerender(<GiftModal lang="UZ" friendId="camel" speakText={jest.fn()} onOpen={onOpen} onDone={jest.fn()} />);
    expect(document.querySelector('.gf-box')).toBeNull();
    expect(screen.getByText('Yangi do‘st: tuya!')).toBeTruthy();
    expect(speakText).toHaveBeenLastCalledWith('Yangi do‘st: tuya!', expect.anything());
  });
});
