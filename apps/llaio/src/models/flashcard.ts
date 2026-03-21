import type { Language } from '@/stores/language-store';

export interface FlashcardImage {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  source?: 'search' | 'pasted';
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

/**
 * Field type determines how a field is rendered in the UI.
 */
export type FieldType = 'text' | 'textarea' | 'image';

/**
 * Describes a single field in a note type.
 */
export interface NoteTypeField {
  name: string;
  fieldType: FieldType;
  required: boolean;
  aiGenerated: boolean;
  /** If true, this field is used as the primary title/word of the flashcard */
  isTitle?: boolean;
  /** AI prompt description for generating this field */
  description?: string;
}

/**
 * Describes an Anki card template with front/back HTML.
 */
export interface CardTemplate {
  name: string;
  frontTemplate: string;
  backTemplate: string;
}

/**
 * Generic NoteType model for scalability across languages.
 * Each note type defines its fields and card templates.
 */
export interface NoteType {
  id: string;
  name: string;
  deckName?: string;
  language: Language;
  fields: NoteTypeField[];
  cardTemplates: CardTemplate[];
  styling: string;
}

/**
 * English - Picture Words note type.
 * Fields: Word, Picture, Pronunciation, Personal Connection/Extra Info
 * Card Types: Comprehension Card, Production Card
 */
export const ENGLISH_PICTURE_WORDS: NoteType = {
  id: '1735860000000',
  name: 'English - Picture Words',
  deckName: 'English',
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
      name: 'Picture',
      fieldType: 'image',
      required: false,
      aiGenerated: false,
    },
    {
      name: 'Pronunciation',
      fieldType: 'text',
      required: true,
      aiGenerated: true,
      description: 'IPA format pronunciation',
    },
    {
      name: 'Personal Connection, Extra Info',
      fieldType: 'textarea',
      required: false,
      aiGenerated: false,
    },
  ],
  cardTemplates: [
    {
      name: 'Comprehension Card',
      frontTemplate: '{{Word}}<br><br>',
      backTemplate: `<div>{{Word}}</div>

<hr id=answer>
{{Picture}}<br>

<br>{{tts en_US voices=AwesomeTTS:Word}}<font color=blue>{{Pronunciation}}</font>

<div style='color:grey;'>{{Personal Connection, Extra Info}}</div>`,
    },
    {
      name: 'Production Card',
      frontTemplate: '{{Picture}}<br><br>',
      backTemplate: `{{Picture}}

<hr id=answer>

<div style="font-size:1.5em;">{{Word}}</div>

<br>{{tts en_US voices=AwesomeTTS:Word}}<font color=blue>{{Pronunciation}}</font>`,
    },
  ],
  styling: `@import url('_editor_button_styles.css');

.card {
  font-family: arial;
  font-size: 20px;
  text-align: center;
  color: black;
  background-color: white;
}

.card1 {
  background-color: #ffffff;
}
.card2 {
  background-color: #ffffff;
}`,
};
