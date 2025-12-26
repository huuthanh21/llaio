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
1. **Simple Definition**: Clear, intermediate ${targetLanguage}.
2. **${nativeLanguage} Equivalent**: Translation (${nativeLanguage}) + brief nuance note in ${targetLanguage}.
3. **Synonyms**: 2-4 synonyms with tone/usage distinctions.
4. **Examples**: 3-5 natural sentences w/ ${nativeLanguage} translations.
5. **Etymology**: Origin, root breakdown (prefix/root/suffix), 2-3 related words.
6. **Word Family**: Derived words (POS + definition).
7. **Collocations**: Common pairings.
8. **Cultural Context**: Native frequency/tone vs. ${nativeLanguage} usage.
9. **Common Mistakes**: Typical ${nativeLanguage} learner errors w/ corrections.`,
      },
    ],
  },
});
