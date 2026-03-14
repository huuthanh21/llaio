import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { WordInput } from '../components/word-input';

vi.mock('@/stores', () => ({
  useSettingsStore: () => ({
    apiKey: 'test-key',
    googleCseApiKey: 'test-gkey',
    isModalOpen: false,
    openModal: vi.fn(),
    closeModal: vi.fn(),
    setApiKey: vi.fn(),
    setGoogleCseApiKey: vi.fn(),
  }),
  useLanguageStore: () => ({
    targetLanguage: 'English',
    nativeLanguage: 'Vietnamese',
    setLanguage: vi.fn(),
    setNativeLanguage: vi.fn(),
  }),
  GOOGLE_CSE_ID: 'test-cse-id',
}));

vi.mock('@/services/gemini-service', () => ({
  generateFlashcards: vi.fn().mockResolvedValue([{ Word: 'apple' }]),
}));

describe('WordInput', () => {
  const onGenerate = vi.fn();

  beforeEach(() => {
    onGenerate.mockClear();
  });

  it('renders the textarea', () => {
    render(<WordInput onGenerate={onGenerate} />);
    const textarea = screen.getByPlaceholderText(/apple, banana/i);
    expect(textarea).toBeInTheDocument();
  });

  it('renders the Parse Words button', () => {
    render(<WordInput onGenerate={onGenerate} />);
    expect(screen.getByRole('button', { name: /parse words/i })).toBeInTheDocument();
  });

  it('parses "apple, banana" into 2 badge elements after clicking Parse Words', () => {
    render(<WordInput onGenerate={onGenerate} />);
    const textarea = screen.getByPlaceholderText(/apple, banana/i);

    fireEvent.change(textarea, { target: { value: 'apple, banana' } });
    fireEvent.click(screen.getByRole('button', { name: /parse words/i }));

    expect(screen.getByLabelText(/remove apple/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/remove banana/i)).toBeInTheDocument();
  });

  it('deduplicates words when the same word appears multiple times', () => {
    render(<WordInput onGenerate={onGenerate} />);
    const textarea = screen.getByPlaceholderText(/apple, banana/i);

    fireEvent.change(textarea, { target: { value: 'apple, apple, banana' } });
    fireEvent.click(screen.getByRole('button', { name: /parse words/i }));

    const removeBtns = screen.getAllByLabelText(/remove/i);
    expect(removeBtns).toHaveLength(2);
  });

  it('parses words separated by whitespace characters', () => {
    render(<WordInput onGenerate={onGenerate} />);
    const textarea = screen.getByPlaceholderText(/apple, banana/i);

    fireEvent.change(textarea, { target: { value: 'apple banana\tcherry' } });
    fireEvent.click(screen.getByRole('button', { name: /parse words/i }));

    expect(screen.getByLabelText(/remove apple/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/remove banana/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/remove cherry/i)).toBeInTheDocument();
  });

  it('removing a badge decreases badge count', () => {
    render(<WordInput onGenerate={onGenerate} />);
    const textarea = screen.getByPlaceholderText(/apple, banana/i);

    fireEvent.change(textarea, { target: { value: 'apple, banana, cherry' } });
    fireEvent.click(screen.getByRole('button', { name: /parse words/i }));

    expect(screen.getAllByLabelText(/remove/i)).toHaveLength(3);

    fireEvent.click(screen.getByLabelText(/remove apple/i));

    expect(screen.getAllByLabelText(/remove/i)).toHaveLength(2);
    expect(screen.queryByLabelText(/remove apple/i)).not.toBeInTheDocument();
  });

  it('shows the Create Flashcards button after parsing words', () => {
    render(<WordInput onGenerate={onGenerate} />);
    const textarea = screen.getByPlaceholderText(/apple, banana/i);

    fireEvent.change(textarea, { target: { value: 'apple' } });
    fireEvent.click(screen.getByRole('button', { name: /parse words/i }));

    expect(screen.getByRole('button', { name: /create flashcards/i })).toBeInTheDocument();
  });
});
