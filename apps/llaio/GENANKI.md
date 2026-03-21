# Genanki-JS Integration Documentation

This document outlines the integration of `genanki-js` into the LLAIO Angular application. This setup allows the application to generate and export Anki decks (`.apkg` files) client-side.

## Overview

The `genanki-js` library was designed for direct browser usage with global variables. To integrate it into a modern Angular/TypeScript environment, we implemented a strategy using:

1.  **Static Asset Loading**: Loading the raw library files via `index.html`.
2.  **Type Declarations**: A custom `.d.ts` file to describe the global variables to TypeScript.
3.  **Wrapper Service**: An Angular Service (`GenankiService`) to provide a type-safe, injectable API.

## File Structure

### 1. Library Assets

Located in `public/libs/genanki/`. These are the raw JavaScript dependencies.

- `genanki.js`: The core library for generating decks.
- `sql.js`: SQLite implementation in JS (required by genanki).
- `jszip.min.js`: Utility for creating zip files (required for .apkg structure).
- `FileSaver.min.js`: Utility for saving files to the client's disk.

### 2. Configuration

**File**: `src/index.html`
Scripts are loaded in the `<body>` ensuring they are available globally.

```html
<script src="libs/genanki/sql.js"></script>
<script src="libs/genanki/FileSaver.min.js"></script>
<script src="libs/genanki/jszip.min.js"></script>
<script src="libs/genanki/genanki.js"></script>
<script>
  // Helper to tell sql.js where to find its assets if needed
  var config = {
    locateFile: (filename) => `libs/genanki/${filename}`,
  };
  var SQL;
  initSqlJs(config).then(function (sql) {
    SQL = sql;
  });
</script>
```

### 3. Type Definitions

**File**: `src/types/genanki.d.ts`
This file allows TypeScript to understand the global variables exposed by the scripts (`Genanki`, `SQL`, etc.) without throwing compilation errors. It defines interfaces like `GenankiDeck`, `GenankiModel`, and `GenankiPackage`.

### 4. Angular Service

**File**: `src/app/core/services/genanki.service.ts`
This service is the main entry point for your application code.

- **Dependency Injection**: Can be injected into any component using `inject(GenankiService)`.
- **Safety**: It checks if the libraries are loaded before attempting to use them.
- **API**:
  - `createDeck(id, name)`: Returns a new Deck instance.
  - `createModel(config)`: Returns a new Model instance.
  - `createNote(model, fields)`: Creates a note for a deck.
  - `createPackage(deck)`: Exports the deck as an `.apkg` file.

## Usage Example

```typescript
import { Component, inject } from '@angular/core';
import { GenankiService } from './core/services/genanki.service';

@Component({ ... })
export class MyComponent {
  private genankiService = inject(GenankiService);

  exportDeck() {
    // 1. Create a Model (Schema)
    const model = this.genankiService.createModel({
      id: '1',
      name: 'Basic Model',
      flds: [{ name: 'Front' }, { name: 'Back' }],
      req: [[0, 'all', [0]]],
      tmpls: [{ name: 'Card 1', qfmt: '{{Front}}', afmt: '{{Back}}' }],
    });

    if (!model) return;

    // 2. Create a Deck
    const deck = this.genankiService.createDeck(1234567, 'My Vocabulary Deck');
    if (!deck) return;

    // 3. Add Notes
    const note = this.genankiService.createNote(model, ['Hello', 'Hola']);
    deck.addNote(note);

    // 4. Export
    this.genankiService.createPackage(deck); // Triggers download
  }
}
```
