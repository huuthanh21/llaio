import type { Flashcard, NoteType } from '@/models/flashcard';
import { createDeck, createModel, createNote, createPackage } from '@/services/genanki-service';

const PROXY_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:3000/api/proxy-image?url='
  : 'https://llaio-api.vercel.app/api/proxy-image?url=';

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
): Promise<void> {
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
}
