export interface FlashcardImage {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
}

export interface Flashcard {
  id: string;
  word: string;
  definition: string;
  example: string;
  selectedImages: FlashcardImage[];
  customSearchPhrase?: string;
}

export interface FlashcardTemplate {
  word: string;
  definition: string;
  example: string;
  imagePrompt: string;
}
