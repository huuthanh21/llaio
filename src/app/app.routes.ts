import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'lookup',
        pathMatch: 'full',
      },
      {
        path: 'lookup',
        loadComponent: () =>
          import('./features/word-definition/word-definition.component').then(
            (m) => m.WordDefinitionComponent,
          ),
      },
      {
        path: 'flashcard-generator',
        loadComponent: () =>
          import('./features/flashcard-generator/flashcard-generator.component').then(
            (m) => m.FlashcardGeneratorComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/lookup',
  },
];
