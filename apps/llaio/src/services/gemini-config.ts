import { ThinkingLevel, Type as SchemaType } from '@google/genai';
import type { GenerateContentConfig } from '@google/genai';
import type { NoteType } from '@/models/flashcard';
import type { Language } from '@/stores/language-store';

export interface GeminiConfig {
  model: string;
  config: GenerateContentConfig;
}

export const getWordDefinitionInstruction = (
  targetLanguage: Language,
  nativeLanguage: Language,
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

export const getWordPronunciationInstruction = (targetLanguage: Language): GeminiConfig => ({
  model: 'gemini-3-flash-preview',
  config: {
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.LOW,
    },
    responseMimeType: 'application/json',
    responseSchema: {
      type: SchemaType.OBJECT,
      required: ['ipa'],
      properties: {
        ipa: {
          type: SchemaType.STRING,
          description: `Standard IPA pronunciation for the input ${targetLanguage} word, enclosed in slashes (e.g., /.../). Leave empty if unavailable.`,
        },
      },
    },
    systemInstruction: [
      {
        text: `Role: ${targetLanguage} pronunciation assistant.
Task: Provide standard IPA transcription for the input word.`,
      },
    ],
  },
});

export const getFlashcardInstruction = (noteType: NoteType): GeminiConfig => {
  const responseFields = noteType.fields.filter((f) => f.isTitle || f.aiGenerated);

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
