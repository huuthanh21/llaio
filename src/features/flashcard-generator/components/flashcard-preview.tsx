import type { Flashcard, NoteType, NoteTypeField } from '@/models/flashcard';

interface FlashcardPreviewProps {
  flashcard: Flashcard;
  noteType: NoteType;
  onClick: () => void;
}

function getWordFieldValue(flashcard: Flashcard, noteType: NoteType): string {
  const firstField = noteType.fields[0];

  if (!firstField) {
    return 'Untitled';
  }

  return flashcard.fieldValues[firstField.name] || 'Untitled';
}

function getPreviewFields(noteType: NoteType): NoteTypeField[] {
  return noteType.fields.filter((field, index) => index > 0 && field.fieldType !== 'image');
}

export function FlashcardPreview({ flashcard, noteType, onClick }: FlashcardPreviewProps) {
  const word = getWordFieldValue(flashcard, noteType);
  const previewFields = getPreviewFields(noteType)
    .map((field) => ({ field, value: flashcard.fieldValues[field.name] || '' }))
    .filter(({ value }) => value.trim().length > 0)
    .slice(0, 2);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-lg border border-border bg-card p-4 text-left transition-all duration-150 hover:border-border-hover hover:bg-accent-hover hover:shadow-sm"
      aria-label={`Edit flashcard for ${word}`}
    >
      <div className="space-y-3">
        <h3 className="text-heading-16 line-clamp-1 group-hover:text-foreground">{word}</h3>

        {flashcard.selectedImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {flashcard.selectedImages.slice(0, 2).map((image) => (
              <div key={image.id} className="overflow-hidden rounded-md border border-border">
                <img
                  src={image.thumbnail || image.url || '/placeholder.svg'}
                  alt={image.title}
                  className="h-20 w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        ) : null}

        {previewFields.map(({ field, value }) => (
          <div key={field.name} className="space-y-0.5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {field.name}
            </p>
            <p className="text-foreground/80 line-clamp-2 text-[14px]">{value}</p>
          </div>
        ))}
      </div>
    </button>
  );
}
