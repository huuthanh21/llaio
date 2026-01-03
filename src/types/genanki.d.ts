type GenankiNote = Record<string, unknown>;

interface GenankiModel {
  note: (fields: string[]) => GenankiNote;
}

interface GenankiDeck {
  addNote: (note: GenankiNote) => void;
}

interface GenankiPackage {
  addDeck: (deck: GenankiDeck) => void;
  addMedia: (data: Blob | string, filename: string) => void;
  writeToFile: (filename: string) => void;
}

type GenankiConfig = Record<string, unknown>;

interface Genanki {
  Model: new (config: GenankiConfig) => GenankiModel;
  Deck: new (id: number, name: string) => GenankiDeck;
  Package: new () => GenankiPackage;
}

declare let Model: new (config: GenankiConfig) => GenankiModel;
declare let Deck: new (id: number, name: string) => GenankiDeck;
declare let Package: new () => GenankiPackage;

declare let SQL: unknown;
declare let saveAs: (data: Blob | string, filename?: string) => void;
declare let JSZip: unknown;

interface SqlJsConfig {
  locateFile: (filename: string) => string;
}

declare function initSqlJs(config: SqlJsConfig): Promise<unknown>;
