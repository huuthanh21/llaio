import { Language } from '@core/stores';

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
