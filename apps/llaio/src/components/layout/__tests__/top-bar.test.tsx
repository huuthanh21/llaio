import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TopBar } from '../top-bar';

const setLanguageMock = vi.fn();

vi.mock('@/stores', () => ({
  useSettingsStore: () => ({
    isModalOpen: false,
    openModal: vi.fn(),
    closeModal: vi.fn(),
    apiKey: '',
    googleCseApiKey: '',
    setApiKey: vi.fn(),
    setGoogleCseApiKey: vi.fn(),
  }),
  useLanguageStore: () => ({
    targetLanguage: 'English',
    nativeLanguage: 'Vietnamese',
    setLanguage: setLanguageMock,
    setNativeLanguage: vi.fn(),
  }),
  useThemeStore: () => ({ theme: 'System', setTheme: vi.fn() }),
  THEMES: ['System', 'Light', 'Dark'],
  LANGUAGES: [
    'English',
    'Spanish',
    'French',
    'German',
    'Japanese',
    'Italian',
    'Chinese',
    'Vietnamese',
  ],
  GOOGLE_CSE_ID: 'test-cse-id',
}));

describe('TopBar', () => {
  const onMenuToggle = vi.fn();

  beforeEach(() => {
    onMenuToggle.mockClear();
    setLanguageMock.mockClear();
  });

  it('renders the language select', () => {
    render(<TopBar onMenuToggle={onMenuToggle} />);
    expect(screen.getByRole('combobox')).toBeTruthy();
  });

  it('renders the language select trigger', () => {
    render(<TopBar onMenuToggle={onMenuToggle} />);
    expect(screen.getByRole('combobox')).toBeTruthy();
  });

  it('displays the current target language in the select', () => {
    render(<TopBar onMenuToggle={onMenuToggle} />);
    expect(screen.getByText('English')).toBeTruthy();
  });

  it('renders the menu toggle button with aria-label', () => {
    render(<TopBar onMenuToggle={onMenuToggle} />);
    expect(screen.getByLabelText('Toggle sidebar')).toBeTruthy();
  });

  it('calls onMenuToggle when hamburger button is clicked', () => {
    render(<TopBar onMenuToggle={onMenuToggle} />);
    fireEvent.click(screen.getByLabelText('Toggle sidebar'));
    expect(onMenuToggle).toHaveBeenCalledTimes(1);
  });

  it('renders a header element', () => {
    const { container } = render(<TopBar onMenuToggle={onMenuToggle} />);
    expect(container.querySelector('header')).toBeTruthy();
  });

  it('renders the select in the header', () => {
    render(<TopBar onMenuToggle={onMenuToggle} />);
    const combobox = screen.getByRole('combobox');
    expect(combobox).toBeTruthy();
  });
});
