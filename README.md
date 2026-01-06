# Llaio

<div align="center">

![Angular](https://img.shields.io/badge/angular-%23DD0031.svg?style=for-the-badge&logo=angular&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)

</div>

Llaio (/ˈlaɪ.oʊ/) leverages the power of advanced AI to streamline the language learning workflow. It transforms how users acquire vocabulary by providing contextually rich definitions and easing flashcard creation.

## Features

### 1. Superior AI-Driven Definition

Move beyond static dictionaries. Llaio uses Gemini AI to provide deep, context-aware breakdowns of vocabulary.

- **Universal Lookup:** Get definitions for words in **any** target language, explained in your native tongue.

### 2. "Fluent Forever" Flashcard Generator

Automate the creation of effective study materials based on the Fluent Forever methodology.

- **Seamless Anki Integration:** Export decks directly to `.apkg` format.
- **Language Support:** currently optimized for **English** vocabulary (Multi-language support coming soon).

### 3. Modern, High-Performance UI

- **Bleeding Edge Tech:** Built with Angular 21 (Signals-first architecture) and Bun.
- **Developer-Grade Aesthetics:** A minimalist interface featuring Tailwind v4 and the Geist design system.

## Tech Stack

### Frontend

- **Framework**: Angular 21 (Standalone Components, Signals)
- **State Management**: @ngrx/signals (Global Signal Stores)
- **Styling**: Tailwind CSS v4, Geist Design System
- **Build**: Vite/Esbuild
- **Icons**: Lucide Angular

### Backend [`llaio-api`](https://github.com/huuthanh21/llaio-api)

- **Runtime**: Bun
- **Framework**: Express
- **Key Features**: CORS Proxy for image fetching

For installation and usage instructions, please refer to the [llaio-api README](https://github.com/huuthanh21/llaio-api).

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (latest version)
- Node.js (for Angular CLI compatibility)

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/huuthanh21/llaio.git
    cd llaio
    ```

2.  **Install Frontend Dependencies**

    ```bash
    bun install
    ```

### Configuration

To use the full features of Llaio (AI definitions and Image Search), you need to configure your API keys in the application settings.

#### 1. Gemini API Key

Required for word definitions and flashcard generation.

1.  Go to [Google AI Studio](https://aistudio.google.com/app/api-keys) (you can create one for free but it will be limited to 20 requests per day).
2.  Click **Create API key**.
3.  Copy the key and enter it in the **Gemini API Key** field in the Settings modal.

#### 2. Google Custom Search (CSE) API Key

Required for finding images for flashcards.

1.  Go to the [Google Programmable Search Engine](https://programmablesearchengine.google.com/about/) page.
2.  Create a search engine (or use an existing one) and enable "Image search" in the configuration.
3.  Go to the [Custom Search JSON API](https://developers.google.com/custom-search/v1/introduction) page.
4.  Click **Get a Key**.
5.  Copy the API key and enter it in the **Google CSE API Key** field in the Settings modal.

### Development

To run the frontend:

1.  **Start the Frontend**
    ```bash
    bun start
    ```
    Navigate to `http://localhost:4200`.

> **Note**: For full functionality (image proxying for Anki export), ensure the [backend API](https://github.com/huuthanh21/llaio-api) is also running.

## Project Structure

```
llaio/
├── src/
│   ├── app/
│   │   ├── core/       # Singleton services, global stores
│   │   ├── features/   # Lazy-loaded features (word-definition, etc.)
│   │   └── shared/     # Reusable UI components
│   └── styles/         # Global styles and Tailwind config
└── ...
```

## Scripts

- `bun start`: Serve the Angular application.
- `bun build`: Build the application for production.
- `bun test`: Run unit tests with Vitest.
- `bun lint`: Lint the codebase.
- `bun format`: Format code with Prettier.

## License

Distributed under the MIT License. See `LICENSE` for more information.
