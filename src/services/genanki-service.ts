export function isGenankiLoaded(): boolean {
  return (
    typeof Model !== 'undefined' && typeof Deck !== 'undefined' && typeof Package !== 'undefined'
  );
}

export function createModel(config: GenankiConfig): GenankiModel {
  if (!isGenankiLoaded()) {
    throw new Error('Genanki globals are not loaded yet.');
  }
  return new Model(config);
}

export function createDeck(id: number, name: string): GenankiDeck {
  if (!isGenankiLoaded()) {
    throw new Error('Genanki globals are not loaded yet.');
  }
  return new Deck(id, name);
}

export function createPackage(): GenankiPackage {
  if (!isGenankiLoaded()) {
    throw new Error('Genanki globals are not loaded yet.');
  }
  return new Package();
}

export function createNote(model: GenankiModel, fields: string[]): GenankiNote {
  return model.note(fields);
}
