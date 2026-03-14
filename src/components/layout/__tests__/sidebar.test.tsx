import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Sidebar } from '../sidebar';

const openModalMock = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    onClick,
    activeProps: _activeProps,
    inactiveProps: _inactiveProps,
    activeOptions: _activeOptions,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
    onClick?: (event?: { preventDefault: () => void }) => void;
    activeProps?: unknown;
    inactiveProps?: unknown;
    activeOptions?: unknown;
    [key: string]: unknown;
  }) => (
    <a
      href={to}
      onClick={(event) => {
        event.preventDefault();
        onClick?.({ preventDefault: () => undefined });
      }}
      {...props}
    >
      {children}
    </a>
  ),
  useRouterState: () => ({ location: { pathname: '/lookup' } }),
}));

vi.mock('@/stores', () => ({
  useSettingsStore: () => ({
    isModalOpen: false,
    openModal: openModalMock,
    closeModal: vi.fn(),
    apiKey: '',
    googleCseApiKey: '',
    setApiKey: vi.fn(),
    setGoogleCseApiKey: vi.fn(),
  }),
  useLanguageStore: () => ({
    targetLanguage: 'English',
    nativeLanguage: 'Vietnamese',
    setLanguage: vi.fn(),
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

describe('Sidebar', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
    openModalMock.mockClear();
  });

  it('renders the Word Definition nav item', () => {
    render(<Sidebar onClose={onClose} />);
    expect(screen.getByText('Word Definition')).toBeTruthy();
  });

  it('renders the Flashcard Generator nav item', () => {
    render(<Sidebar onClose={onClose} />);
    expect(screen.getByText('Flashcard Generator')).toBeTruthy();
  });

  it('renders the Settings button', () => {
    render(<Sidebar onClose={onClose} />);
    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('Word Definition link points to /lookup', () => {
    render(<Sidebar onClose={onClose} />);
    const link = screen.getByText('Word Definition').closest('a');
    expect(link?.getAttribute('href')).toBe('/lookup');
  });

  it('Flashcard Generator link points to /flashcard-generator', () => {
    render(<Sidebar onClose={onClose} />);
    const link = screen.getByText('Flashcard Generator').closest('a');
    expect(link?.getAttribute('href')).toBe('/flashcard-generator');
  });

  it('calls openModal when Settings button is clicked', () => {
    render(<Sidebar onClose={onClose} />);
    fireEvent.click(screen.getByText('Settings'));
    expect(openModalMock).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when a nav link is clicked', () => {
    render(<Sidebar onClose={onClose} />);
    const link = screen.getByText('Word Definition').closest('a');
    if (link) fireEvent.click(link);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders two nav items', () => {
    render(<Sidebar onClose={onClose} />);
    const listItems = screen.getAllByRole('listitem');
    expect(listItems.length).toBe(2);
  });

  it('renders a nav element as container', () => {
    const { container } = render(<Sidebar onClose={onClose} />);
    expect(container.querySelector('nav')).toBeTruthy();
  });
});
