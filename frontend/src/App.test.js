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
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockWords
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

    await waitFor(() => {
      expect(screen.getByText(/выберите, как начать/i)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /выбор языка/i }));
    await userEvent.click(screen.getByRole('button', { name: /english/i }));

    expect(screen.getByText(/choose how to start/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('switches menu language to Uzbek', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/выберите, как начать/i)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /выбор языка/i }));
    await userEvent.click(screen.getByRole('button', { name: /o'zbekcha/i }));

    expect(screen.getByText(/qanday boshlashni tanlang/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /kirish/i })).toBeInTheDocument();
  });
});
