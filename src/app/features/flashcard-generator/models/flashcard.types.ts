export interface FlashcardImage {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
}

/**
 * Dynamic flashcard model that works with any NoteType.
 * Field values are stored in a map keyed by field name.
 */
export interface Flashcard {
  id: string;
  noteTypeId: string;
  fieldValues: Record<string, string>;
  selectedImages: FlashcardImage[];
}
