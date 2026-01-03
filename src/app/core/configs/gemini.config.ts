import { ThinkingLevel } from '@google/genai';
import { GeminiConfig } from '../models/gemini.model';

export const getSystemInstruction = (
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
