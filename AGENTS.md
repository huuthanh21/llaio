# Agent Guidelines for llaio

This document provides instructions for AI agents operating in the `llaio` repository.

## 1. Environment & Commands

- **Package Manager:** `bun` (v1.3.6 specified).
- **Environment & Shell:** The development environment relies on `~/.zshrc` for `PATH`, `nvm` (Node), and `bun`.
  > **CRITICAL:** The default agent shell is non-interactive and lacks these paths. For **ALL** development commands (`bun`, `npm`, `ng`, `node`, `vitest`), you **MUST** execute them via `zsh` sourcing the user config:
  >
  > Command pattern: `zsh -c 'source ~/.zshrc && <command>'`
  >
  > _Example:_ `zsh -c 'source ~/.zshrc && bun run build'`
- **Framework:** Angular 21 (Standalone Components).
- **Language:** TypeScript 5.9.

### Core Commands

| Action          | Command (must wrap with zsh!)           | Description                                                                |
| :-------------- | :-------------------------------------- | :------------------------------------------------------------------------- |
| **Build**       | `bun run build`                         | Compiles the application to `dist/`.                                       |
| **Dev Server**  | `bun start`                             | Runs the dev server (`ng serve`).                                          |
| **Lint**        | `bun run lint`                          | Runs `eslint` on `.ts` and `.html` files.                                  |
| **Format**      | `bun run format`                        | Runs `prettier` to fix formatting.                                         |
| **Test**        | `bun run test`                          | Runs unit tests via `ng test`.                                             |
| **Single Test** | `bun x vitest src/path/to/file.spec.ts` | **Preferred**: `vitest` is installed. Use it for fast single-file testing. |

> **Note on Testing:** `vitest` is listed in `devDependencies`. If `ng test` is slow or cumbersome for single files, attempt `bun x vitest path/to/spec.ts`.

## 2. Project Structure

- **Root Component:** `src/app/app.ts` (Class `App`), _not_ `app.component.ts`.
- **Config:** `src/app/app.config.ts` (Application config, providers).
- **Aliases:**
  - `@/*` → `src/*`
  - `@core/*` → `src/app/core/*` (Services, Guards, Interceptors)
  - `@shared/*` → `src/app/shared/*` (UI Components, Pipes)
- **Features:** Place feature-specific code in `src/app/features/<feature-name>`.

## 3. Code Style & Conventions

### TypeScript & Angular

- **Strictness:** Strict mode is enabled. No implicit `any`.
- **Standalone:** All components, directives, and pipes must be `standalone: true`.
- **State Management:** Use **@ngrx/signals** for state management. Avoid complex RxJS streams where Signals suffice.
- **Dependency Injection:** Use `inject()` function instead of constructor injection.
- **Signals:** Prefer Angular Signals (`signal()`, `computed()`, `effect()`) over `Zone.js` change detection where possible.

### Naming Conventions

- **Files:** `kebab-case.ts` (e.g., `user-profile.component.ts`).
- **Classes:** `PascalCase` (e.g., `UserProfileComponent`).
- **Selectors:**
  - Components: `kebab-case`, prefix `app` (e.g., `app-user-profile`).
  - Directives: `camelCase`, prefix `app` (e.g., `appHighlight`).
- **Members:** Explicit accessibility required (`public`, `private`, `protected`).

### Formatting (Prettier & ESLint)

- **Quotes:** Single quotes `'`.
- **Semicolons:** Always use semicolons `;`.
- **Width:** 100 characters.
- **Imports:** Organized automatically via `prettier-plugin-organize-imports`.
- **Tailwind:** Use utility classes. Sorted via `prettier-plugin-tailwindcss`.

### Example Component Style

```typescript
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-example',
  imports: [CommonModule],
  template: `
    <div class="rounded-lg bg-gray-100 p-4">
      <h1 class="text-xl font-bold">{{ title() }}</h1>
    </div>
  `,
  styles: [],
})
export class ExampleComponent {
  public title = signal('Hello World');
  private readonly service = inject(SomeService);
}
```

## 4. Error Handling

- Use global error handlers in `@core` where appropriate.
- Catch errors in Observables using `catchError`.
- For Signals, handle error states within the store or computed values.

## 5. File Operations

- **Absolute Paths:** Always use absolute paths for file operations (reading/writing).
- **Verification:** Run `bun run lint` and `bun run build` after significant changes to ensure integrity.
