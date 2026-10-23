import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsScreen } from './SettingsScreen';

test('grown-ups choose whether Irbi says letters as sounds or by their names', () => {
  window.localStorage.clear();
  const speakText = jest.fn();
  render(
    <SettingsScreen
      lang="RU"
      onClose={jest.fn()}
      speechRate="NORMAL"
      setSpeechRate={jest.fn()}
      speakText={speakText}
      toggleMusic={jest.fn()}
      isMusicOn={false}
      musicVolume={50}
      onMusicVolumeChange={jest.fn()}
      currentUser={null}
    />
  );
  // sounds are the default: they are what children need for reading
  expect(screen.getByRole('radio', { name: /Звук/ })).toHaveAttribute('aria-checked', 'true');
  expect(screen.getByText('Для обучения чтению лучше звук')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('radio', { name: /Название/ }));
  expect(window.localStorage.getItem('ll_letter_mode')).toBe('name');
  expect(speakText).toHaveBeenCalledWith('М', expect.objectContaining({ kind: 'token' }));

  fireEvent.click(screen.getByRole('radio', { name: /Звук/ }));
  expect(window.localStorage.getItem('ll_letter_mode')).toBe('sound');
  expect(speakText).toHaveBeenLastCalledWith('ммм', expect.objectContaining({ kind: 'sound' }));
});
