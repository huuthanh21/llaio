import { describe, it, expect, beforeEach } from 'vitest';
import type { Language } from '@/stores/language-store';
import { addEntry, getHistory, getCachedResponse, clearHistory } from '../word-history-service';

const EN: Language = 'English';
const VI: Language = 'Vietnamese';
const FR: Language = 'French';

describe('word-history-service', () => {
  beforeEach(() => {
    clearHistory();
  });

  describe('addEntry + getHistory', () => {
    it('adds a single entry and getHistory returns it for the matching language pair', () => {
      addEntry('hello', 'a greeting', EN, VI);

      const history = getHistory(EN, VI);

      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        word: 'hello',
        response: 'a greeting',
        targetLanguage: EN,
        nativeLanguage: VI,
      });
    });

    it('getHistory returns empty array for unrelated language pair', () => {
      addEntry('hello', 'a greeting', EN, VI);

      expect(getHistory(FR, VI)).toHaveLength(0);
    });

    it('filters by language pair correctly when multiple pairs exist', () => {
      addEntry('hello', 'definition EN', EN, VI);
      addEntry('bonjour', 'definition FR', FR, VI);

      expect(getHistory(EN, VI)).toHaveLength(1);
      expect(getHistory(EN, VI)[0].word).toBe('hello');
      expect(getHistory(FR, VI)).toHaveLength(1);
      expect(getHistory(FR, VI)[0].word).toBe('bonjour');
    });

    it('prepends new entries so most recent is first', () => {
      addEntry('apple', 'fruit', EN, VI);
      addEntry('banana', 'another fruit', EN, VI);

      const history = getHistory(EN, VI);
      expect(history[0].word).toBe('banana');
      expect(history[1].word).toBe('apple');
    });

    it('moves duplicate word to top instead of duplicating', () => {
      addEntry('apple', 'fruit', EN, VI);
      addEntry('banana', 'another fruit', EN, VI);
      addEntry('apple', 'updated definition', EN, VI);

      const history = getHistory(EN, VI);
      expect(history).toHaveLength(2);
      expect(history[0].word).toBe('apple');
      expect(history[0].response).toBe('updated definition');
    });

    it('deduplication is case-insensitive', () => {
      addEntry('Apple', 'fruit', EN, VI);
      addEntry('apple', 'updated', EN, VI);

      expect(getHistory(EN, VI)).toHaveLength(1);
    });

    it('does not add entry when word is empty string', () => {
      addEntry('', 'some response', EN, VI);

      expect(getHistory(EN, VI)).toHaveLength(0);
    });

    it('does not add entry when response is empty string', () => {
      addEntry('hello', '', EN, VI);

      expect(getHistory(EN, VI)).toHaveLength(0);
    });
  });

  describe('20-entry cap', () => {
    it('retains at most 20 entries after adding 21', () => {
      for (let i = 1; i <= 21; i++) {
        addEntry(`word${i}`, `definition${i}`, EN, VI);
      }

      const history = getHistory(EN, VI);
      expect(history).toHaveLength(20);
    });

    it('keeps the 20 most recent entries when cap is exceeded', () => {
      for (let i = 1; i <= 21; i++) {
        addEntry(`word${i}`, `definition${i}`, EN, VI);
      }

      const history = getHistory(EN, VI);
      expect(history[0].word).toBe('word21');
      expect(history[19].word).toBe('word2');
    });
  });

  describe('getCachedResponse', () => {
    it('returns the cached response for a matching word and language pair', () => {
      addEntry('serendipity', 'the occurrence of pleasant surprises', EN, VI);

      expect(getCachedResponse('serendipity', EN, VI)).toBe('the occurrence of pleasant surprises');
    });

    it('returns null when word is not in history', () => {
      expect(getCachedResponse('unknown', EN, VI)).toBeNull();
    });

    it('returns null when language pair does not match', () => {
      addEntry('hello', 'a greeting', EN, VI);

      expect(getCachedResponse('hello', FR, VI)).toBeNull();
    });

    it('lookup is case-insensitive', () => {
      addEntry('Hello', 'a greeting', EN, VI);

      expect(getCachedResponse('hello', EN, VI)).toBe('a greeting');
      expect(getCachedResponse('HELLO', EN, VI)).toBe('a greeting');
    });
  });

  describe('clearHistory', () => {
    it('removes all entries from history', () => {
      addEntry('hello', 'a greeting', EN, VI);
      addEntry('bonjour', 'definition', FR, VI);

      clearHistory();

      expect(getHistory(EN, VI)).toHaveLength(0);
      expect(getHistory(FR, VI)).toHaveLength(0);
    });

    it('calling clearHistory on empty history does not throw', () => {
      expect(() => clearHistory()).not.toThrow();
    });
  });
});
