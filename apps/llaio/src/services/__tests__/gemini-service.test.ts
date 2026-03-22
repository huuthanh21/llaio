import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Language } from '@/stores/language-store';
import type { NoteType } from '@/models/flashcard';

const mockGenerateContentStream = vi.fn();
const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContentStream: mockGenerateContentStream,
        generateContent: mockGenerateContent,
      },
    })),
    ThinkingLevel: {
      LOW: 'LOW',
      MEDIUM: 'MEDIUM',
    },
    Type: {
      STRING: 'STRING',
      OBJECT: 'OBJECT',
      ARRAY: 'ARRAY',
    },
  };
});

import {
  generateDefinition,
  generateFlashcards,
  generatePronunciationIpa,
} from '../gemini-service';

const targetLang: Language = 'English';
const nativeLang: Language = 'Vietnamese';

const mockNoteType: NoteType = {
  id: 'test-note-type',
  name: 'Test Note Type',
  language: 'English',
  fields: [
    {
      name: 'Word',
      fieldType: 'text',
      required: true,
      aiGenerated: false,
      isTitle: true,
    },
    {
      name: 'Definition',
      fieldType: 'textarea',
      required: true,
      aiGenerated: true,
      description: 'A definition of the word',
    },
  ],
  cardTemplates: [],
  styling: '',
};

describe('generateDefinition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls onChunk with accumulated text as chunks arrive', async () => {
    async function* fakeStream() {
      yield { text: 'Hello ' };
      yield { text: 'World' };
    }
    mockGenerateContentStream.mockResolvedValue(fakeStream());

    const chunks: string[] = [];
    await generateDefinition('hello', 'test-api-key', targetLang, nativeLang, (text) => {
      chunks.push(text);
    });

    expect(chunks).toEqual(['Hello ', 'Hello World']);
  });

  it('passes the word and apiKey to GoogleGenAI', async () => {
    async function* fakeStream() {
      yield { text: 'result' };
    }
    mockGenerateContentStream.mockResolvedValue(fakeStream());

    await generateDefinition('serendipity', 'my-api-key', targetLang, nativeLang, () => undefined);

    expect(mockGenerateContentStream).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'serendipity' }],
          },
        ],
      }),
    );
  });

  it('handles chunks with undefined text', async () => {
    async function* fakeStream() {
      yield { text: undefined };
      yield { text: 'text' };
    }
    mockGenerateContentStream.mockResolvedValue(fakeStream());

    const chunks: string[] = [];
    await generateDefinition('word', 'key', targetLang, nativeLang, (t) => {
      chunks.push(t);
    });

    expect(chunks).toEqual(['', 'text']);
  });

  it('stops streaming when AbortSignal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    async function* fakeStream() {
      yield { text: 'chunk1' };
      yield { text: 'chunk2' };
    }
    mockGenerateContentStream.mockResolvedValue(fakeStream());

    const chunks: string[] = [];
    await generateDefinition(
      'word',
      'key',
      targetLang,
      nativeLang,
      (t) => {
        chunks.push(t);
      },
      controller.signal,
    );

    expect(chunks).toHaveLength(0);
  });

  it('stops streaming mid-stream when AbortSignal fires', async () => {
    const controller = new AbortController();

    async function* fakeStream() {
      yield { text: 'first' };
      controller.abort();
      yield { text: 'second' };
    }
    mockGenerateContentStream.mockResolvedValue(fakeStream());

    const chunks: string[] = [];
    await generateDefinition(
      'word',
      'key',
      targetLang,
      nativeLang,
      (t) => {
        chunks.push(t);
      },
      controller.signal,
    );

    expect(chunks).toEqual(['first']);
  });

  it('throws when the API rejects', async () => {
    mockGenerateContentStream.mockRejectedValue(new Error('API Error'));

    await expect(
      generateDefinition('word', 'bad-key', targetLang, nativeLang, () => undefined),
    ).rejects.toThrow('API Error');
  });
});

describe('generateFlashcards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns parsed flashcards array from JSON response', async () => {
    const flashcards = [{ Word: 'hello', Definition: 'a greeting' }];
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({ flashcards }),
    });

    const result = await generateFlashcards(
      ['hello'],
      'test-api-key',
      mockNoteType,
      targetLang,
      nativeLang,
    );

    expect(result).toEqual(flashcards);
  });

  it('joins multiple words with semicolons in the request', async () => {
    const flashcards = [
      { Word: 'cat', Definition: 'an animal' },
      { Word: 'dog', Definition: 'another animal' },
    ];
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({ flashcards }),
    });

    await generateFlashcards(['cat', 'dog'], 'test-api-key', mockNoteType, targetLang, nativeLang);

    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'cat; dog' }],
          },
        ],
      }),
    );
  });

  it('returns empty array when flashcards is empty', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({ flashcards: [] }),
    });

    const result = await generateFlashcards(
      ['unknownword'],
      'key',
      mockNoteType,
      targetLang,
      nativeLang,
    );

    expect(result).toEqual([]);
  });

  it('throws SyntaxError when response text is not valid JSON', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'not json' });

    await expect(
      generateFlashcards(['word'], 'key', mockNoteType, targetLang, nativeLang),
    ).rejects.toThrow(SyntaxError);
  });

  it('throws when the API rejects', async () => {
    mockGenerateContent.mockRejectedValue(new Error('Quota exceeded'));

    await expect(
      generateFlashcards(['word'], 'bad-key', mockNoteType, targetLang, nativeLang),
    ).rejects.toThrow('Quota exceeded');
  });

  it('handles response.text being empty string', async () => {
    mockGenerateContent.mockResolvedValue({ text: '' });

    await expect(
      generateFlashcards(['word'], 'key', mockNoteType, targetLang, nativeLang),
    ).rejects.toThrow(SyntaxError);
  });
});

describe('generatePronunciationIpa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns parsed ipa value from JSON response', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({ ipa: '/həˈloʊ/' }),
    });

    const result = await generatePronunciationIpa('hello', 'test-api-key', targetLang);

    expect(result).toBe('/həˈloʊ/');
  });

  it('returns empty string when ipa field is missing', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({ foo: 'bar' }),
    });

    const result = await generatePronunciationIpa('hello', 'test-api-key', targetLang);

    expect(result).toBe('');
  });

  it('returns empty string when aborted after response', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({ ipa: '/həˈloʊ/' }),
    });

    const controller = new AbortController();
    controller.abort();

    const result = await generatePronunciationIpa(
      'hello',
      'test-api-key',
      targetLang,
      controller.signal,
    );

    expect(result).toBe('');
  });

  it('throws SyntaxError when response text is not valid JSON', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'not json' });

    await expect(generatePronunciationIpa('hello', 'test-api-key', targetLang)).rejects.toThrow(
      SyntaxError,
    );
  });
});
