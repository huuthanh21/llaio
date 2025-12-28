import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GenankiService {
  public get genanki(): Genanki | null {
    if (
      typeof Model === 'undefined' ||
      typeof Deck === 'undefined' ||
      typeof Package === 'undefined'
    ) {
      console.warn('Genanki globals are not loaded yet.');
      return null;
    }
    return { Model, Deck, Package };
  }

  public get sql(): unknown | null {
    if (typeof SQL === 'undefined') {
      console.warn('SQL is not loaded yet.');
      return null;
    }
    return SQL;
  }

  public createPackage(deck: GenankiDeck): void {
    const lib = this.genanki;
    if (!lib) return;
    const Package = lib.Package;
    const p = new Package();
    p.addDeck(deck);
    p.writeToFile('deck.apkg');
  }

  public createDeck(id: number, name: string): GenankiDeck | null {
    const lib = this.genanki;
    if (!lib) return null;
    const Deck = lib.Deck;
    return new Deck(id, name);
  }

  public createModel(config: GenankiConfig): GenankiModel | null {
    const lib = this.genanki;
    if (!lib) return null;
    const Model = lib.Model;
    return new Model(config);
  }

  public createNote(model: GenankiModel, fields: string[]): GenankiNote {
    return model.note(fields);
  }
}
