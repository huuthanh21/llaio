import { createRouter, createRoute, createRootRoute, redirect } from '@tanstack/react-router';
import { RootComponent } from './routes/__root';
import { LookupComponent } from './routes/lookup';
import { FlashcardGeneratorComponent } from './routes/flashcard-generator';
import { SavedWordsComponent } from './routes/saved-words';

const rootRoute = createRootRoute({ component: RootComponent });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/lookup' });
  },
});

const lookupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/lookup',
  component: LookupComponent,
});

const flashcardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/flashcard-generator',
  component: FlashcardGeneratorComponent,
});

const savedWordsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/saved-words',
  component: SavedWordsComponent,
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  beforeLoad: () => {
    throw redirect({ to: '/lookup' });
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  lookupRoute,
  flashcardRoute,
  savedWordsRoute,
  notFoundRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
