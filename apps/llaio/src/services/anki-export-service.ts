import type { Flashcard, NoteType } from '@/models/flashcard';
import { createDeck, createModel, createNote, createPackage } from '@/services/genanki-service';

const DEFAULT_PROXY_API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:3000'
  : 'https://llaio-api.vercel.app';

const proxyApiBaseUrl =
  import.meta.env.VITE_PROXY_API_BASE_URL?.replace(/\/$/, '') ?? DEFAULT_PROXY_API_BASE_URL;

const PROXY_BASE_URL = `${proxyApiBaseUrl}/api/proxy-image?url=`;

function generateDeckId(deckName: string): number {
  let hash = 0;
  for (let i = 0; i < deckName.length; i++) {
    const char = deckName.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
}

function buildRequirements(noteType: NoteType): [number, 'all' | 'any', number[]][] {
  const requiredFieldIndex = noteType.fields.findIndex((f) => f.required);
  const fieldIndex = requiredFieldIndex >= 0 ? requiredFieldIndex : 0;
  return noteType.cardTemplates.map((_, i) => [i, 'all', [fieldIndex]]);
}

export interface FlashcardExportFailure {
  flashcardId: string;
  word: string;
  reason: string;
}

export interface FlashcardExportSuccessResult {
  ok: true;
  exportedCount: number;
}

export interface FlashcardExportErrorResult {
  ok: false;
  message: string;
  failedCount: number;
  failedWords: string[];
  failures: FlashcardExportFailure[];
}

export type FlashcardExportResult = FlashcardExportSuccessResult | FlashcardExportErrorResult;

function getPrimaryWord(flashcard: Flashcard, noteType: NoteType): string {
  const titleField = noteType.fields.find((field) => field.isTitle) ?? noteType.fields[0];
  if (!titleField) {
    return 'Untitled';
  }

  const value = flashcard.fieldValues[titleField.name];
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  return 'Untitled';
}

function buildFailure(
  flashcard: Flashcard,
  noteType: NoteType,
  reason: string,
): FlashcardExportFailure {
  return {
    flashcardId: flashcard.id,
    word: getPrimaryWord(flashcard, noteType),
    reason,
  };
}

function buildErrorResult(
  message: string,
  failures: FlashcardExportFailure[],
): FlashcardExportErrorResult {
  const failedWords = [...new Set(failures.map((failure) => failure.word))];
  return {
    ok: false,
    message,
    failedCount: failures.length,
    failedWords,
    failures,
  };
}

function preValidateFlashcards(
  flashcards: Flashcard[],
  noteType: NoteType,
): FlashcardExportFailure[] {
  const failures: FlashcardExportFailure[] = [];

  for (const flashcard of flashcards) {
    for (const field of noteType.fields) {
      if (!field.required) {
        continue;
      }

      const value = flashcard.fieldValues[field.name] ?? '';
      if (value.trim().length === 0) {
        failures.push(
          buildFailure(flashcard, noteType, `Required field "${field.name}" is missing.`),
        );
      }
    }
  }

  return failures;
}

async function fetchImageBuffer(imageUrl: string): Promise<ArrayBuffer | null> {
  const proxyUrl = PROXY_BASE_URL + encodeURIComponent(imageUrl);
  try {
    const response = await fetch(proxyUrl);
    if (response.ok) {
      return response.arrayBuffer();
    }
  } catch (_proxyError) {
    void _proxyError;
  }
  try {
    const response = await fetch(imageUrl);
    if (response.ok) {
      return response.arrayBuffer();
    }
  } catch (_directError) {
    void _directError;
  }
  return null;
}

export async function exportFlashcards(
  flashcards: Flashcard[],
  noteType: NoteType,
  deckName: string,
): Promise<FlashcardExportResult> {
  if (flashcards.length === 0) {
    return buildErrorResult('No flashcards available for export.', []);
  }

  const validationFailures = preValidateFlashcards(flashcards, noteType);
  if (validationFailures.length > 0) {
    return buildErrorResult(
      'Export failed. Fix required fields and try again.',
      validationFailures,
    );
  }

  const model = createModel({
    name: noteType.name,
    id: noteType.id,
    flds: noteType.fields.map((f) => ({ name: f.name })),
    req: buildRequirements(noteType),
    tmpls: noteType.cardTemplates.map((t) => ({
      name: t.name,
      qfmt: t.frontTemplate,
      afmt: t.backTemplate,
    })),
    css: noteType.styling,
  });

  const deckId = generateDeckId(deckName);
  const deck = createDeck(deckId, deckName);
  const pkg = createPackage();

  const imageField = noteType.fields.find((f) => f.fieldType === 'image');

  try {
    for (const flashcard of flashcards) {
      const fieldValues: string[] = [];
      const imageFilenames: string[] = [];

      for (const field of noteType.fields) {
        if (imageField && field.name === imageField.name && flashcard.selectedImages.length > 0) {
          const imgTags = flashcard.selectedImages.map((image, idx) => {
            const filename = `${flashcard.id}_${idx}_${sanitizeFilename(image.title)}.jpg`;
            imageFilenames.push(filename);
            return `<img src="${filename}">`;
          });
          fieldValues.push(imgTags.join(' '));
        } else {
          fieldValues.push(flashcard.fieldValues[field.name] ?? '');
        }
      }

      deck.addNote(createNote(model, fieldValues));

      for (let i = 0; i < flashcard.selectedImages.length; i++) {
        const image = flashcard.selectedImages[i];
        const filename = imageFilenames[i];
        if (filename) {
          const buffer = await fetchImageBuffer(image.url);
          if (buffer) {
            pkg.addMedia(buffer, filename);
          }
        }
      }
    }

    pkg.addDeck(deck);
    pkg.writeToFile(`${deckName}.apkg`);
    return {
      ok: true,
      exportedCount: flashcards.length,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unexpected export error.';
    const failures = flashcards.map((flashcard) => buildFailure(flashcard, noteType, reason));
    return buildErrorResult('Export failed. No flashcards were exported.', failures);
  }
}
