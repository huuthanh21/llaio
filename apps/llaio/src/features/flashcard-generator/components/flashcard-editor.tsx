import { useEffect, useMemo, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Flashcard, FlashcardImage, NoteType } from '@/models/flashcard';

interface FlashcardEditorProps {
  flashcard: Flashcard;
  noteType: NoteType;
  open: boolean;
  onSave: (updated: Flashcard) => void;
  onClose: () => void;
}

export function FlashcardEditor({
  flashcard,
  noteType,
  open,
  onSave,
  onClose,
}: FlashcardEditorProps) {
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [localImages, setLocalImages] = useState<FlashcardImage[]>([]);

  const editableFields = useMemo(
    () => noteType.fields.filter((field) => field.fieldType !== 'image'),
    [noteType.fields],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setLocalValues({ ...flashcard.fieldValues });
    setLocalImages([...flashcard.selectedImages]);
  }, [open, flashcard]);

  const handleFieldChange = (fieldName: string, value: string) => {
    setLocalValues((current) => ({ ...current, [fieldName]: value }));
  };

  const handleRemoveImage = (imageId: string) => {
    setLocalImages((current) => current.filter((image) => image.id !== imageId));
  };

  const handleSave = () => {
    onSave({
      ...flashcard,
      fieldValues: localValues,
      selectedImages: localImages,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Flashcard</DialogTitle>
          <DialogDescription>Update fields and remove images before export.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {localImages.length > 0 ? (
            <div className="space-y-3">
              <p className="text-[14px] font-medium">Selected Images</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {localImages.map((image) => (
                  <div
                    key={image.id}
                    className="group relative overflow-hidden rounded-lg border border-border"
                  >
                    <img
                      src={image.thumbnail || image.url || '/placeholder.svg'}
                      alt={image.title}
                      className="h-24 w-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute right-2 top-2 h-7 px-2 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => handleRemoveImage(image.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-4">
            {editableFields.map((field) => (
              <div key={field.name} className="space-y-2">
                <label htmlFor={field.name} className="text-[14px] font-medium">
                  {field.name}
                </label>
                {field.fieldType === 'textarea' ? (
                  <Textarea
                    id={field.name}
                    value={localValues[field.name] || ''}
                    onChange={(event) => handleFieldChange(field.name, event.target.value)}
                  />
                ) : (
                  <Input
                    id={field.name}
                    value={localValues[field.name] || ''}
                    onChange={(event) => handleFieldChange(field.name, event.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
