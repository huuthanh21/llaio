import { Type as SchemaType, ThinkingLevel } from '@google/genai';
import { NoteType, NoteTypeField } from '../../features/flashcard-generator/models/note-type.model';
import { GeminiConfig } from '../models/gemini.model';

export const getWordDefinitionInstruction = (
  targetLanguage: string,
  nativeLanguage: string,
): GeminiConfig => ({
  model: 'gemini-3-flash-preview',
  config: {
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.LOW,
    },
    systemInstruction: [
      {
        text: `Role: ${targetLanguage} tutor for ${nativeLanguage} learners.
Task: Analyze the input word following the structure below.
Constraints:
- Output ONLY the formatted response. No conversational intro/outro.
- Use Markdown.
- Language: ${targetLanguage} ONLY, unless said otherwise.

Structure:
## Simple Definition: Clear, intermediate ${targetLanguage}.
## ${nativeLanguage} Equivalent: Translation (${nativeLanguage}) + brief nuance note in ${targetLanguage}.
## Synonyms: 2-4 synonyms with tone/usage distinctions.
## Examples: 3-5 natural sentences w/ ${nativeLanguage} translations.
## Etymology: Origin, root breakdown (prefix/root/suffix), 2-3 related words.
## Word Family: Derived words (POS + definition).
## Collocations: Common pairings.
## Cultural Context: Native frequency/tone vs. ${nativeLanguage} usage.
## Common Mistakes: Typical ${nativeLanguage} learner errors w/ corrections.`,
      },
    ],
  },
});

/**
 * Build a dynamic flashcard instruction config based on NoteType.
 * The schema is generated from fields marked with isTitle or aiGenerated.
 */
export const getFlashcardInstruction = (noteType: NoteType): GeminiConfig => {
  // Get fields that should be in the API response (title + AI-generated)
  const responseFields: NoteTypeField[] = noteType.fields.filter((f) => f.isTitle || f.aiGenerated);

  // Build dynamic properties for the JSON schema
  const properties: Record<string, { type: typeof SchemaType.STRING; description?: string }> = {};
  const required: string[] = [];

  for (const field of responseFields) {
    properties[field.name] = {
      type: SchemaType.STRING,
      description: field.description,
    };
    if (field.required || field.isTitle) {
      required.push(field.name);
    }
  }

  // Build field descriptions for the system prompt
  const fieldDescriptions = responseFields
    .map((f) => `- ${f.name}${f.description ? `: ${f.description}` : ''}`)
    .join('\n');

  return {
    model: 'gemini-3-flash-preview',
    config: {
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.MEDIUM,
      },
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        required: ['flashcards'],
        properties: {
          flashcards: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              required,
              properties,
            },
          },
        },
      },
      systemInstruction: [
        {
          text: `You are a vocabulary assistant. Convert the user's list of words into a JSON object.
For each word, provide the following fields:
${fieldDescriptions}

Return a JSON object with a "flashcards" array containing objects with these fields.`,
        },
      ],
    },
  };
};
