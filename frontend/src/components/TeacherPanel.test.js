import { render, fireEvent, screen } from '@testing-library/react';
import { TeacherPanel } from './TeacherPanel';
import {
  clearChildData, isLevelLocked, needsPractice, readActivityLevel, readProfiles, readStats, recordSession, recordTask,
  rememberProfile, setLevelLocked, writeActivityLevel
} from '../lib/progress';

describe('progress storage', () => {
  beforeEach(() => window.localStorage.clear());

  test('word levels are kept per language, other games once', () => {
    writeActivityLevel('Ali', 'word:WORDS', 3);
    ['RU', 'KG', 'UZ', 'EN'].forEach((lang) => expect(localStorage.getItem(`ll_word_level_Ali_${lang}_WORDS`)).toBe('3'));
    writeActivityLevel('Ali', 'math:ADD', 2);
    expect(localStorage.getItem('ll_math_level_Ali_ADD')).toBe('2');
    expect(readActivityLevel('Ali', 'math:ADD')).toBe(2);
    expect(readActivityLevel('Ali', 'logic:ODD')).toBe(1);
  });

  test('counts tasks, clean tasks, sessions and active days', () => {
    recordTask('Ali', 'memory:PAIRS', true);
    recordTask('Ali', 'memory:PAIRS', false);
    recordSession('Ali', 'memory:PAIRS');
    const stats = readStats('Ali');
    expect(stats.activities['memory:PAIRS']).toMatchObject({ tasks: 2, clean: 1, sessions: 1 });
    expect(Object.values(stats.days)).toEqual([2]);
    expect(needsPractice({ tasks: 6, clean: 2 })).toBe(true);
    expect(needsPractice({ tasks: 3, clean: 0 })).toBe(false);
  });

  test('clearing one child leaves the others alone', () => {
    recordTask('Ali', 'logic:ODD', true);
    recordTask('Alina', 'logic:ODD', true);
    writeActivityLevel('Ali', 'word:WORDS', 2);
    setLevelLocked('Ali', true);
    clearChildData('Ali');
    expect(readStats('Ali').activities).toEqual({});
    expect(isLevelLocked('Ali')).toBe(false);
    expect(localStorage.getItem('ll_word_level_Ali_RU_WORDS')).toBeNull();
    expect(readStats('Alina').activities['logic:ODD'].tasks).toBe(1);
  });

  test('profiles stay unique regardless of letter case', () => {
    rememberProfile('Ali');
    rememberProfile('Malika');
    rememberProfile('ali');
    expect(readProfiles()).toEqual(['ali', 'Malika']);
  });
});

describe('TeacherPanel', () => {
  beforeEach(() => window.localStorage.clear());

  test('shows a child’s progress and lets the teacher set a level', () => {
    rememberProfile('Malika');
    for (let i = 0; i < 6; i += 1) recordTask('Malika', 'math:COUNT', i === 0);
    render(<TeacherPanel lang="RU" onClose={jest.fn()} onPlayAs={jest.fn()} />);

    const count = document.querySelector('[data-activity="math:COUNT"]');
    expect(count.textContent).toContain('6 заданий');
    expect(count.textContent).toContain('Стоит потренировать вместе');

    fireEvent.click(document.querySelector('[data-activity="logic:SORT"] .tp-level:nth-child(3)'));
    expect(localStorage.getItem('ll_logic_level_Malika_SORT')).toBe('3');

    fireEvent.click(screen.getByText('Зафиксировать уровни'));
    expect(isLevelLocked('Malika')).toBe(true);
  });

  test('adds a child, plays as them and removes them after confirming', () => {
    const onPlayAs = jest.fn();
    render(<TeacherPanel lang="EN" onClose={jest.fn()} onPlayAs={onPlayAs} />);
    fireEvent.change(screen.getByPlaceholderText('Child’s name'), { target: { value: 'Timur' } });
    fireEvent.click(screen.getByText('Add'));
    expect(readProfiles()).toEqual(['Timur']);

    fireEvent.click(screen.getByText('Play'));
    expect(onPlayAs).toHaveBeenCalledWith('Timur');

    fireEvent.click(screen.getByText('Remove from list'));
    fireEvent.click(screen.getByText('Yes'));
    expect(readProfiles()).toEqual([]);
  });
});
