import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const mockWords = {
  EN: [{ id: 1, text: 'CAT', img: '/images/cat.png' }],
  RU: [{ id: 1, text: 'КОТ', img: '/images/cat.png' }],
  KG: [{ id: 1, text: 'МЫШЫК', img: '/images/cat.png' }],
  UZ: [{ id: 1, text: 'MUSHUK', img: '/images/cat.png' }]
};

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
    global.fetch = jest.fn().mockImplementation(async (url) => {
      if (String(url).includes('/api/kid-login')) {
        return { ok: true, json: async () => ({ success: true, username: 'Айбек', score: 7 }) };
      }
      return { ok: true, json: async () => mockWords };
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('renders the main title after loading words', async () => {
    render(<App />);

    expect(screen.getByText(/загрузка/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText(/letter loom/i).length).toBeGreaterThan(0);
    });

    expect(global.fetch).toHaveBeenCalled();
  });

  test('switches menu language to English', async () => {
    render(<App />);

    expect(await screen.findByText(/привет! я ирби/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Eng' }));

    expect(screen.getByText(/i'm irbi/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  test('switches menu language to Uzbek', async () => {
    render(<App />);

    expect(await screen.findByText(/привет! я ирби/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'O‘zb' }));

    expect(screen.getByText(/men irbiman/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /o‘ynash/i })).toBeInTheDocument();
  });

  test('a child signs in with just a name and sees the games', async () => {
    render(<App />);

    await userEvent.type(await screen.findByPlaceholderText(/твоё имя/i), 'Айбек');
    await userEvent.click(screen.getByRole('button', { name: /играть/i }));

    expect(await screen.findByText(/собери слово/i)).toBeInTheDocument();
    expect(screen.getByText('Айбек')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/kid-login'),
      expect.objectContaining({ body: JSON.stringify({ name: 'Айбек' }) })
    );
    expect(JSON.parse(window.localStorage.getItem('ll_profiles'))).toEqual(['Айбек']);
  });
});
