import { beforeEach, describe, expect, it } from 'vitest';

import {
  consumeSavedWordsGenerationIntent,
  setSavedWordsGenerationIntent,
} from '../flashcard-generator-intent-service';

describe('flashcard-generator-intent-service', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('consumes intent from memory once', () => {
    setSavedWordsGenerationIntent({
      source: 'saved-words',
      words: ['apple'],
      savedWordIds: ['saved-1'],
      language: 'English',
    });

    const first = consumeSavedWordsGenerationIntent();
    const second = consumeSavedWordsGenerationIntent();

    expect(first?.words).toEqual(['apple']);
    expect(second).toBeNull();
  });

  it('reads and clears serialized intent from sessionStorage', () => {
    sessionStorage.setItem(
      'flashcard_generator_intent_v1',
      JSON.stringify({
        source: 'saved-words',
        words: ['apple', 'banana'],
        savedWordIds: ['1', '2'],
        language: 'English',
      }),
    );

    const intent = consumeSavedWordsGenerationIntent();

    expect(intent?.savedWordIds).toEqual(['1', '2']);
    expect(sessionStorage.getItem('flashcard_generator_intent_v1')).toBeNull();
  });
});
