import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Language } from '@/stores/language-store';
import {
  isWordSaved,
  listSavedWordsByLanguage,
  removeSavedWordsByIds,
  removeWord,
  saveWord,
} from '../saved-words-service';

const EN: Language = 'English';
const FR: Language = 'French';

describe('saved-words-service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('saves and lists words for a language', () => {
    const saveResult = saveWord('Apple', EN);

    expect(saveResult.ok).toBe(true);
    expect(listSavedWordsByLanguage(EN)).toHaveLength(1);
    expect(listSavedWordsByLanguage(EN)[0]?.word).toBe('Apple');
  });

  it('scopes saved words by language', () => {
    saveWord('Apple', EN);
    saveWord('Pomme', FR);

    expect(listSavedWordsByLanguage(EN).map((entry) => entry.word)).toEqual(['Apple']);
    expect(listSavedWordsByLanguage(FR).map((entry) => entry.word)).toEqual(['Pomme']);
  });

  it('deduplicates by normalized word and language', () => {
    const first = saveWord('Apple', EN);
    const second = saveWord('apple', EN);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(second.created).toBe(false);
    expect(listSavedWordsByLanguage(EN)).toHaveLength(1);
  });

  it('allows same word in different languages', () => {
    saveWord('Apple', EN);
    saveWord('Apple', FR);

    expect(listSavedWordsByLanguage(EN)).toHaveLength(1);
    expect(listSavedWordsByLanguage(FR)).toHaveLength(1);
  });

  it('removes saved word by word and language', () => {
    saveWord('Apple', EN);
    const result = removeWord('apple', EN);

    expect(result.ok).toBe(true);
    expect(result.removed).toBe(true);
    expect(listSavedWordsByLanguage(EN)).toHaveLength(0);
  });

  it('checks saved state by word and language', () => {
    saveWord('Apple', EN);

    expect(isWordSaved('apple', EN)).toBe(true);
    expect(isWordSaved('apple', FR)).toBe(false);
  });

  it('removes saved words by ids for a specific language', () => {
    const first = saveWord('Apple', EN);
    const second = saveWord('Banana', EN);
    const french = saveWord('Pomme', FR);

    const ids = [first.entry?.id, second.entry?.id, french.entry?.id].filter(
      (value): value is string => Boolean(value),
    );
    const result = removeSavedWordsByIds(ids, EN);

    expect(result.ok).toBe(true);
    expect(result.removedCount).toBe(2);
    expect(listSavedWordsByLanguage(EN)).toHaveLength(0);
    expect(listSavedWordsByLanguage(FR)).toHaveLength(1);
  });

  it('fails gracefully when localStorage write throws', () => {
    vi.spyOn(globalThis.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    const result = saveWord('Apple', EN);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Unable to save words/i);
  });

  it('handles invalid stored data without crashing', () => {
    localStorage.setItem('saved_words_v1', '{invalid-json');

    expect(() => listSavedWordsByLanguage(EN)).not.toThrow();
    expect(listSavedWordsByLanguage(EN)).toEqual([]);
  });
});
